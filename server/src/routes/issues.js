import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../auth.js'
import { emitToProjectTeam, emitToUser } from '../events.js'
import { issueAccess, projectAccess, teamIdsForUser, logActivity, csv } from '../access.js'

const router = Router()
router.use(requireAuth)

const userSelect = { id: true, name: true, avatarColor: true }

export const issueInclude = {
  assignee: { select: userSelect },
  creator: { select: { id: true, name: true, avatarColor: true } },
  labels: { include: { label: true } },
  project: { select: { id: true, key: true, name: true, color: true, teamId: true } },
  _count: { select: { comments: true, reactions: true, watchers: true } },
}

const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 }
const STATUS_ORDER = { IN_PROGRESS: 0, TODO: 1, BACKLOG: 2, DONE: 3, CANCELED: 4 }

function sortIssues(issues, sort, order) {
  const dir = order === 'asc' ? 1 : -1
  const list = [...issues]
  if (sort === 'priority') list.sort((a, b) => dir * ((PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)))
  else if (sort === 'status') list.sort((a, b) => dir * ((STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)))
  else if (sort === 'number') list.sort((a, b) => dir * (a.number - b.number))
  else if (sort === 'title') list.sort((a, b) => dir * a.title.localeCompare(b.title))
  else if (sort === 'manual') list.sort((a, b) => a.updatedAt - b.updatedAt)
  else list.sort((a, b) => dir * (new Date(b[sort === 'updated' ? 'updatedAt' : 'createdAt']) - new Date(a[sort === 'updated' ? 'updatedAt' : 'createdAt'])))
  return list
}

function applyFilters(issues, { q, assignee, label, cycle, project, due, hasEstimate }) {
  let list = issues
  if (q) {
    const needle = q.toLowerCase()
    list = list.filter((i) => `${i.project?.key}-${i.number} ${i.title} ${i.description || ''}`.toLowerCase().includes(needle))
  }
  if (assignee?.length) {
    list = list.filter((i) => {
      if (assignee.includes('none') && !i.assigneeId) return true
      if (assignee.includes('me') && i.assigneeId === assignee.userId) return true
      return i.assigneeId && assignee.includes(i.assigneeId)
    })
  }
  if (label?.length) list = list.filter((i) => i.labels.some((l) => label.includes(l.labelId)))
  if (cycle?.length) list = list.filter((i) => (cycle.includes('none') && !i.cycleId) || (i.cycleId && cycle.includes(i.cycleId)))
  if (project?.length) list = list.filter((i) => project.includes(i.projectId))
  if (due === 'overdue') list = list.filter((i) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'DONE')
  if (due === 'soon') {
    const week = Date.now() + 7 * 864e5
    list = list.filter((i) => i.dueDate && new Date(i.dueDate) <= week && new Date(i.dueDate) >= new Date())
  }
  if (due === 'none') list = list.filter((i) => !i.dueDate)
  if (hasEstimate === 'yes') list = list.filter((i) => i.estimate != null)
  if (hasEstimate === 'no') list = list.filter((i) => i.estimate == null)
  return list
}

router.get('/', async (req, res) => {
  const { teamId, sort = 'updated', order = 'desc', limit = '300' } = req.query
  if (!teamId) return res.status(400).json({ error: 'teamId required' })
  const memberships = await teamIdsForUser(req.user.id)
  if (!memberships.some((m) => m.teamId === teamId)) return res.status(403).json({ error: 'Not a member of this team' })

  const rows = await prisma.issue.findMany({
    where: { project: { teamId } },
    include: issueInclude,
    orderBy: { updatedAt: 'desc' },
    take: Math.min(Number(limit) || 300, 800),
  })

  const status = csv(req.query.status)
  const priority = csv(req.query.priority)
  let list = rows
  if (status.length) list = list.filter((i) => status.includes(i.status))
  if (priority.length) list = list.filter((i) => priority.includes(i.priority))
  list = applyFilters(list, {
    q: req.query.q,
    assignee: (() => {
      const a = csv(req.query.assignee)
      a.userId = req.user.id
      return a
    })(),
    label: csv(req.query.label),
    cycle: csv(req.query.cycle),
    project: csv(req.query.project),
    due: req.query.due,
    hasEstimate: req.query.hasEstimate,
  })
  const sorted = sortIssues(list, sort, order)

  const counts = {}
  for (const i of rows) counts[i.status] = (counts[i.status] || 0) + 1

  res.json({ issues: sorted, total: sorted.length, counts, all: rows.length })
})

router.get('/my', async (req, res) => {
  const memberships = await teamIdsForUser(req.user.id)
  const teamIds = memberships.map((m) => m.teamId)
  const issues = await prisma.issue.findMany({
    where: { assigneeId: req.user.id, project: { teamId: { in: teamIds } } },
    include: issueInclude,
    orderBy: { updatedAt: 'desc' },
    take: 120,
  })
  res.json({ issues, total: issues.length })
})

router.get('/:issueId', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  const issue = await prisma.issue.findUnique({
    where: { id: req.params.issueId },
    include: {
      ...issueInclude,
      parent: { select: { id: true, number: true, title: true, project: { select: { key: true } } } },
      children: {
        include: issueInclude,
        orderBy: { number: 'asc' },
      },
      watchers: { include: { user: { select: userSelect } } },
      comments: {
        include: {
          author: { select: userSelect },
          reactions: { include: { user: { select: userSelect } } },
        },
        orderBy: { createdAt: 'asc' },
      },
      reactions: { include: { user: { select: userSelect } } },
      cycle: true,
    },
  })
  const activity = await prisma.activity.findMany({
    where: { issueId: req.params.issueId },
    include: { actor: { select: userSelect } },
    orderBy: { createdAt: 'desc' },
    take: 60,
  })
  res.json({ ...issue, activity })
})

router.post('/', async (req, res) => {
  const { projectId, title, description, priority, assigneeId, cycleId, estimate, dueDate, labelIds, parentId } = req.body
  const access = await projectAccess(projectId, req.user.id)
  if (!access) {
    const exists = projectId ? await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }) : null
    if (!exists) return res.status(404).json({ error: 'That project no longer exists — pick another one.' })
    return res.status(403).json({ error: 'You are not a member of this project.' })
  }
  if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' })

  const count = await prisma.issue.count({ where: { projectId } })
  const issue = await prisma.issue.create({
    data: {
      projectId,
      number: count + 1,
      title: title.trim(),
      description: description || null,
      priority: priority || 'NONE',
      assigneeId: assigneeId || null,
      cycleId: cycleId || null,
      estimate: estimate === undefined || estimate === '' ? null : Number(estimate),
      dueDate: dueDate ? new Date(dueDate) : null,
      parentId: parentId || null,
      creatorId: req.user.id,
      watchers: { create: { userId: req.user.id } },
      labels: Array.isArray(labelIds)
        ? { create: labelIds.filter(Boolean).map((labelId) => ({ labelId })) }
        : undefined,
    },
    include: issueInclude,
  })

  await logActivity({
    teamId: access.project.teamId,
    projectId,
    issueId: issue.id,
    actorId: req.user.id,
    action: 'created',
    toValue: issue.title,
  })

  if (assigneeId && assigneeId !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        actorId: req.user.id,
        type: 'assigned',
        issueId: issue.id,
        teamId: access.project.teamId,
        body: `${req.user.name} assigned you ${access.project.key}-${issue.number}: ${issue.title}`,
      },
    })
    emitToUser(assigneeId, 'notification', { type: 'assigned', issueId: issue.id })
  }

  emitToProjectTeam(projectId, 'issue:created', issue)
  res.status(201).json(issue)
})

async function diffAndLog(existing, data, project, userId) {
  const labels = {
    status: (v) => (v ? v.replace('_', ' ').toLowerCase() : ''),
    priority: (v) => (v ? v.toLowerCase() : ''),
    title: (v) => v,
    assigneeId: (v) => v || 'unassigned',
    cycleId: (v) => v || 'no cycle',
    estimate: (v) => (v == null ? 'none' : v),
    dueDate: (v) => (v ? new Date(v).toDateString() : 'none'),
    description: () => 'description',
  }
  for (const [field, value] of Object.entries(data)) {
    if (existing[field] === value) continue
    if (!labels[field]) continue
    await logActivity({
      teamId: project.teamId,
      projectId: project.id,
      issueId: existing.id,
      actorId: userId,
      action: field,
      fromValue: labels[field](existing[field]),
      toValue: labels[field](value),
    })
  }
}

router.patch('/bulk', async (req, res) => {
  const { ids, data } = req.body
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' })
  const updated = []
  for (const id of ids) {
    const access = await issueAccess(id, req.user.id)
    if (!access) continue
    const patch = {}
    for (const field of ['status', 'priority', 'assigneeId', 'cycleId', 'dueDate', 'estimate']) {
      if (field in (data || {})) patch[field] = data[field] === '' ? null : data[field]
    }
    if (!Object.keys(patch).length) continue
    const issue = await prisma.issue.update({ where: { id }, data: patch, include: issueInclude })
    await diffAndLog(access.issue, patch, access.project, req.user.id)
    emitToProjectTeam(issue.projectId, 'issue:updated', issue)
    updated.push(issue)
  }
  res.json({ updated, count: updated.length })
})

router.patch('/:issueId', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })

  const data = {}
  for (const field of ['title', 'description', 'status', 'priority', 'assigneeId', 'cycleId', 'estimate', 'dueDate', 'parentId']) {
    if (field in req.body) {
      let value = req.body[field]
      if (value === '') value = null
      if (field === 'dueDate' && value) value = new Date(value)
      if (field === 'estimate' && value != null) value = Number(value)
      data[field] = value
    }
  }

  const issue = await prisma.issue.update({ where: { id: access.issue.id }, data, include: issueInclude })
  await diffAndLog(access.issue, data, access.project, req.user.id)

  if (data.assigneeId && data.assigneeId !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: data.assigneeId,
        actorId: req.user.id,
        type: 'assigned',
        issueId: issue.id,
        teamId: access.project.teamId,
        body: `${req.user.name} assigned you ${access.project.key}-${issue.number}: ${issue.title}`,
      },
    })
    emitToUser(data.assigneeId, 'notification', { type: 'assigned', issueId: issue.id })
  }

  emitToProjectTeam(issue.projectId, 'issue:updated', issue)
  res.json(issue)
})

router.delete('/bulk', async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids required' })
  let count = 0
  for (const id of ids) {
    const access = await issueAccess(id, req.user.id)
    if (!access) continue
    await prisma.issue.delete({ where: { id } })
    emitToProjectTeam(access.issue.projectId, 'issue:deleted', { id })
    count += 1
  }
  res.json({ ok: true, count })
})

router.delete('/:issueId', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  await prisma.issue.delete({ where: { id: access.issue.id } })
  emitToProjectTeam(access.issue.projectId, 'issue:deleted', { id: access.issue.id })
  res.json({ ok: true })
})

router.put('/:issueId/labels', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  const labelIds = [...new Set(Array.isArray(req.body.labelIds) ? req.body.labelIds.filter(Boolean) : [])]
  await prisma.issueLabel.deleteMany({ where: { issueId: access.issue.id } })
  if (labelIds.length) {
    await prisma.issueLabel.createMany({
      data: labelIds.map((labelId) => ({ issueId: access.issue.id, labelId })),
    })
  }
  const issue = await prisma.issue.findUnique({ where: { id: access.issue.id }, include: issueInclude })
  emitToProjectTeam(issue.projectId, 'issue:updated', issue)
  res.json(issue)
})

router.post('/:issueId/labels', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  await prisma.issueLabel.upsert({
    where: { issueId_labelId: { issueId: access.issue.id, labelId: req.body.labelId } },
    create: { issueId: access.issue.id, labelId: req.body.labelId },
    update: {},
  })
  const issue = await prisma.issue.findUnique({ where: { id: access.issue.id }, include: issueInclude })
  emitToProjectTeam(issue.projectId, 'issue:updated', issue)
  res.json(issue)
})

router.delete('/:issueId/labels/:labelId', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  await prisma.issueLabel.deleteMany({ where: { issueId: access.issue.id, labelId: req.params.labelId } })
  const issue = await prisma.issue.findUnique({ where: { id: access.issue.id }, include: issueInclude })
  emitToProjectTeam(issue.projectId, 'issue:updated', issue)
  res.json(issue)
})

router.post('/:issueId/duplicate', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  const source = await prisma.issue.findUnique({
    where: { id: access.issue.id },
    include: { labels: true },
  })
  const count = await prisma.issue.count({ where: { projectId: source.projectId } })
  const issue = await prisma.issue.create({
    data: {
      projectId: source.projectId,
      number: count + 1,
      title: `${source.title} (copy)`,
      description: source.description,
      status: source.status,
      priority: source.priority,
      assigneeId: source.assigneeId,
      cycleId: source.cycleId,
      estimate: source.estimate,
      dueDate: source.dueDate,
      parentId: source.parentId,
      creatorId: req.user.id,
      watchers: { create: { userId: req.user.id } },
      labels: source.labels.length ? { create: source.labels.map((l) => ({ labelId: l.labelId })) } : undefined,
    },
    include: issueInclude,
  })
  await logActivity({
    teamId: access.project.teamId,
    projectId: source.projectId,
    issueId: issue.id,
    actorId: req.user.id,
    action: 'created',
    toValue: issue.title,
  })
  emitToProjectTeam(source.projectId, 'issue:created', issue)
  res.status(201).json(issue)
})

router.post('/:issueId/comments', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  const body = String(req.body.body || '').trim()
  if (!body) return res.status(400).json({ error: 'body is required' })

  const comment = await prisma.comment.create({
    data: { issueId: access.issue.id, authorId: req.user.id, body },
    include: { author: { select: userSelect }, reactions: true },
  })
  await logActivity({
    teamId: access.project.teamId,
    projectId: access.project.id,
    issueId: access.issue.id,
    actorId: req.user.id,
    action: 'comment',
    toValue: body.slice(0, 140),
  })
  await prisma.issue.update({ where: { id: access.issue.id }, data: { updatedAt: new Date() } })

  const watchers = await prisma.issueWatcher.findMany({ where: { issueId: access.issue.id } })
  const notify = new Set(watchers.map((w) => w.userId))
  if (access.issue.assigneeId) notify.add(access.issue.assigneeId)
  notify.delete(req.user.id)

  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: access.project.teamId },
    include: { user: { select: { id: true, name: true } } },
  })
  const mentioned = new Set()
  for (const member of teamMembers) {
    const first = member.user.name.split(' ')[0].toLowerCase()
    if (first.length > 1 && body.toLowerCase().includes(`@${first}`)) {
      mentioned.add(member.user.id)
      notify.delete(member.user.id)
    }
  }

  for (const userId of notify) {
    await prisma.notification.create({
      data: {
        userId,
        actorId: req.user.id,
        type: 'comment',
        issueId: access.issue.id,
        teamId: access.project.teamId,
        body: `${req.user.name} commented on ${access.project.key}-${access.issue.number}`,
      },
    })
    emitToUser(userId, 'notification', { type: 'comment', issueId: access.issue.id })
  }

  for (const userId of mentioned) {
    if (userId === req.user.id) continue
    await prisma.notification.create({
      data: {
        userId,
        actorId: req.user.id,
        type: 'mention',
        issueId: access.issue.id,
        teamId: access.project.teamId,
        body: `${req.user.name} mentioned you on ${access.project.key}-${access.issue.number}`,
      },
    })
    emitToUser(userId, 'notification', { type: 'mention', issueId: access.issue.id })
  }

  emitToProjectTeam(access.issue.projectId, 'comment:created', { issueId: access.issue.id, comment })
  res.status(201).json(comment)
})

router.patch('/:issueId/comments/:commentId', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } })
  if (!comment || comment.authorId !== req.user.id) return res.status(403).json({ error: 'Not allowed' })
  const updated = await prisma.comment.update({
    where: { id: comment.id },
    data: { body: String(req.body.body || '').trim() },
    include: { author: { select: userSelect }, reactions: true },
  })
  emitToProjectTeam(access.issue.projectId, 'comment:updated', { issueId: access.issue.id, comment: updated })
  res.json(updated)
})

router.delete('/:issueId/comments/:commentId', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } })
  if (!comment) return res.json({ ok: true })
  const isOwner = access.role === 'OWNER'
  if (comment.authorId !== req.user.id && !isOwner) return res.status(403).json({ error: 'Not allowed' })
  await prisma.comment.delete({ where: { id: comment.id } })
  emitToProjectTeam(access.issue.projectId, 'comment:deleted', { issueId: access.issue.id, id: comment.id })
  res.json({ ok: true })
})

async function toggleReaction({ issueId, commentId, userId, emoji }) {
  const existing = await prisma.reaction.findFirst({ where: { issueId: issueId || null, commentId: commentId || null, userId, emoji } })
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
    return false
  }
  await prisma.reaction.create({ data: { issueId: issueId || null, commentId: commentId || null, userId, emoji } })
  return true
}

router.post('/:issueId/reactions', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  const emoji = String(req.body.emoji || '👍')
  const added = await toggleReaction({ issueId: access.issue.id, userId: req.user.id, emoji })
  const reactions = await prisma.reaction.findMany({
    where: { issueId: access.issue.id },
    include: { user: { select: userSelect } },
  })
  emitToProjectTeam(access.issue.projectId, 'reaction:updated', { issueId: access.issue.id, reactions })
  res.json({ added, reactions })
})

router.post('/:issueId/comments/:commentId/reactions', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  const emoji = String(req.body.emoji || '👍')
  const added = await toggleReaction({ commentId: req.params.commentId, userId: req.user.id, emoji })
  const reactions = await prisma.reaction.findMany({
    where: { commentId: req.params.commentId },
    include: { user: { select: userSelect } },
  })
  emitToProjectTeam(access.issue.projectId, 'reaction:updated', { issueId: access.issue.id, commentId: req.params.commentId, reactions })
  res.json({ added, reactions })
})

router.post('/:issueId/watch', async (req, res) => {
  const access = await issueAccess(req.params.issueId, req.user.id)
  if (!access) return res.status(404).json({ error: 'Issue not found' })
  const existing = await prisma.issueWatcher.findUnique({
    where: { issueId_userId: { issueId: access.issue.id, userId: req.user.id } },
  })
  if (existing) {
    await prisma.issueWatcher.delete({ where: { id: existing.id } })
    return res.json({ watching: false })
  }
  await prisma.issueWatcher.create({ data: { issueId: access.issue.id, userId: req.user.id } })
  res.json({ watching: true })
})

export default router
