import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
router.use(requireAuth)

router.patch('/me', async (req, res) => {
  const { name, title, bio, avatarColor, timezone } = req.body
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(avatarColor ? { avatarColor } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
    },
    select: { id: true, name: true, email: true, avatarColor: true, title: true, bio: true, timezone: true },
  })
  res.json(user)
})

router.get('/me/starred', async (req, res) => {
  const rows = await prisma.starredProject.findMany({ where: { userId: req.user.id } })
  res.json(rows.map((r) => r.projectId))
})

router.post('/me/starred/:projectId', async (req, res) => {
  const existing = await prisma.starredProject.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId: req.params.projectId } },
  })
  if (existing) {
    await prisma.starredProject.delete({ where: { id: existing.id } })
    return res.json({ starred: false })
  }
  await prisma.starredProject.create({ data: { userId: req.user.id, projectId: req.params.projectId } })
  res.json({ starred: true })
})

router.get('/me/views', async (req, res) => {
  const { teamId } = req.query
  const views = await prisma.savedView.findMany({
    where: { userId: req.user.id, ...(teamId ? { teamId } : {}) },
    orderBy: { createdAt: 'asc' },
  })
  res.json(views.map((v) => ({ ...v, config: safeParse(v.config) })))
})

router.post('/me/views', async (req, res) => {
  const { name, icon, config, teamId } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  const view = await prisma.savedView.create({
    data: { userId: req.user.id, teamId: teamId || null, name, icon: icon || 'list', config: JSON.stringify(config || {}) },
  })
  res.status(201).json({ ...view, config: safeParse(view.config) })
})

router.patch('/me/views/:id', async (req, res) => {
  const existing = await prisma.savedView.findUnique({ where: { id: req.params.id } })
  if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: 'View not found' })
  const { name, icon, config } = req.body
  const view = await prisma.savedView.update({
    where: { id: existing.id },
    data: {
      ...(name ? { name } : {}),
      ...(icon ? { icon } : {}),
      ...(config ? { config: JSON.stringify(config) } : {}),
    },
  })
  res.json({ ...view, config: safeParse(view.config) })
})

router.delete('/me/views/:id', async (req, res) => {
  await prisma.savedView.deleteMany({ where: { id: req.params.id, userId: req.user.id } })
  res.json({ ok: true })
})

router.get('/me/dashboard', async (req, res) => {
  const memberships = await prisma.teamMember.findMany({ where: { userId: req.user.id } })
  const teamIds = memberships.map((m) => m.teamId)

  const issues = await prisma.issue.findMany({
    where: { project: { teamId: { in: teamIds } } },
    include: {
      assignee: { select: { id: true, name: true, avatarColor: true } },
      labels: { include: { label: true } },
      project: { select: { id: true, key: true, name: true, color: true } },
      cycle: { select: { id: true, name: true, endsAt: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const byStatus = {}
  const byPriority = {}
  for (const i of issues) {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1
    byPriority[i.priority] = (byPriority[i.priority] || 0) + 1
  }

  const mine = issues.filter((i) => i.assigneeId === req.user.id)
  const done = issues.filter((i) => i.status === 'DONE').length
  const overdue = issues.filter((i) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'DONE')

  const activity = await prisma.activity.findMany({
    where: { teamId: { in: teamIds } },
    include: {
      actor: { select: { id: true, name: true, avatarColor: true } },
      issue: { select: { id: true, number: true, title: true, project: { select: { key: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  const unread = await prisma.notification.count({ where: { userId: req.user.id, read: false } })

  res.json({
    totals: {
      issues: issues.length,
      mine: mine.length,
      done,
      overdue: overdue.length,
      projects: (await prisma.project.count({ where: { teamId: { in: teamIds } } })),
      members: (await prisma.teamMember.count({ where: { teamId: { in: teamIds } } })),
      unread,
      completion: issues.length ? Math.round((done / issues.length) * 100) : 0,
    },
    byStatus,
    byPriority,
    myIssues: mine.slice(0, 8),
    recent: issues.slice(0, 6),
    activity,
  })
})

router.get('/me/analytics', async (req, res) => {
  const { teamId } = req.query
  const memberships = await prisma.teamMember.findMany({ where: { userId: req.user.id } })
  const teamIds = teamId ? [teamId] : memberships.map((m) => m.teamId)

  const issues = await prisma.issue.findMany({
    where: { project: { teamId: { in: teamIds } } },
    select: {
      id: true, status: true, priority: true, estimate: true, createdAt: true, updatedAt: true,
      assigneeId: true, assignee: { select: { id: true, name: true, avatarColor: true } },
      labels: { include: { label: { select: { id: true, name: true, color: true } } } },
    },
  })

  const WEEK = 7 * 864e5
  const now = Date.now()
  const weeks = []
  for (let w = 7; w >= 0; w--) {
    const start = now - w * WEEK
    const end = start + WEEK
    const created = issues.filter((i) => +new Date(i.createdAt) >= start && +new Date(i.createdAt) < end).length
    const completed = issues.filter(
      (i) => i.status === 'DONE' && +new Date(i.updatedAt) >= start && +new Date(i.updatedAt) < end,
    ).length
    weeks.push({ label: w === 0 ? 'This wk' : `-${w}w`, created, completed, net: created - completed })
  }

  const loadMap = {}
  for (const i of issues) {
    const key = i.assigneeId || 'none'
    if (!loadMap[key]) {
      loadMap[key] = {
        id: key,
        name: i.assignee?.name || 'Unassigned',
        color: i.assignee?.avatarColor || '#94a3b8',
        open: 0,
        done: 0,
        total: 0,
        points: 0,
      }
    }
    loadMap[key].total++
    if (i.status === 'DONE') loadMap[key].done++
    else if (i.status !== 'CANCELED') loadMap[key].open++
    loadMap[key].points += i.estimate || 0
  }
  const assigneeLoad = Object.values(loadMap).sort((a, b) => b.total - a.total)

  const priorityMix = {}
  for (const i of issues) priorityMix[i.priority] = (priorityMix[i.priority] || 0) + 1

  const labelMap = {}
  for (const i of issues) {
    for (const l of i.labels) {
      if (!labelMap[l.label.id]) labelMap[l.label.id] = { ...l.label, count: 0 }
      labelMap[l.label.id].count++
    }
  }
  const labelUsage = Object.values(labelMap).sort((a, b) => b.count - a.count).slice(0, 8)

  const doneIssues = issues.filter((i) => i.status === 'DONE')
  const avgDays =
    doneIssues.length === 0
      ? 0
      : Math.round(
          doneIssues.reduce((acc, i) => acc + (+new Date(i.updatedAt) - +new Date(i.createdAt)) / 864e5, 0) /
            doneIssues.length,
        )

  const completedThisWeek = weeks[weeks.length - 1].completed
  const completedLastWeek = weeks[weeks.length - 2]?.completed || 0
  const trend = completedLastWeek === 0 ? (completedThisWeek > 0 ? 100 : 0) : Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100)

  res.json({
    weeks,
    assigneeLoad,
    priorityMix,
    labelUsage,
    avgDays,
    trend,
    totals: {
      open: issues.filter((i) => i.status !== 'DONE' && i.status !== 'CANCELED').length,
      done: doneIssues.length,
      points: issues.reduce((a, i) => a + (i.estimate || 0), 0),
      unestimated: issues.filter((i) => !i.estimate).length,
    },
  })
})

function safeParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return {}
  }
}

export default router
