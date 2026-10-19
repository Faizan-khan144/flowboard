import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../db.js'
import { signToken, verifyToken } from '../auth.js'

const router = Router()

const GUEST_EMAIL = 'guest@localhost'

const ISSUES = [
  ['Set up auth flow with refresh tokens', 'DONE', 'HIGH', 'Bug', 3, 'Token rotation works end to end, refresh path still needs a test.', true],
  ['Build the drag & drop issue board', 'IN_PROGRESS', 'URGENT', 'Feature', 5, 'Columns move cards optimistically and roll back when the API rejects.', true],
  ['Design empty states for every view', 'TODO', 'MEDIUM', 'Design', 2, 'Board, list, inbox and cycles all need a first-run story.', false],
  ['Realtime updates over websockets', 'IN_PROGRESS', 'HIGH', 'Feature', 8, 'Presence, live card moves and comment fan-out.', true],
  ['Add a command menu (Cmd+K)', 'TODO', 'LOW', 'Feature', 3, 'Search issues, jump between views, create without the mouse.', false],
  ['Fix mobile overflow on the board', 'IN_PROGRESS', 'HIGH', 'Bug', 1, 'Columns squash below 380px wide screens.', true],
  ['Write the seed data script', 'DONE', 'LOW', 'Chore', 1, 'One command gives a believable workspace.', false],
  ['Cycle burndown chart', 'BACKLOG', 'MEDIUM', 'Feature', 5, 'Show scope added after the cycle started.', false],
  ['Keyboard shortcuts everywhere', 'BACKLOG', 'LOW', 'Feature', 3, 'g+b board, g+i issues, c to create.', false],
  ['Dark mode for late night triage', 'BACKLOG', 'NONE', 'Design', 2, 'Not urgent, but people keep asking.', false],
  ['Split the API into typed contracts', 'TODO', 'MEDIUM', 'Chore', 5, 'Shared types between client and server.', true],
  ['Reduce bundle size below 200kb', 'BACKLOG', 'LOW', 'Chore', 3, 'Lazy load the marketing three.js scene.', false],
  ['Reaction picker on comments', 'TODO', 'MEDIUM', 'Feature', 2, 'Emoji reactions so threads stay short.', true],
  ['Invite links with owner approval', 'IN_PROGRESS', 'URGENT', 'Feature', 8, 'Share a link, approve who actually joins.', true],
]

async function resolveOwner(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try {
      const payload = verifyToken(token)
      const user = await prisma.user.findUnique({ where: { id: payload.id } })
      if (user) return user
    } catch {

    }
  }
  const name = (req.body?.name || '').trim().slice(0, 60) || 'You'
  let guest = await prisma.user.findUnique({ where: { email: GUEST_EMAIL } })
  if (!guest) {
    guest = await prisma.user.create({
      data: {
        name,
        email: GUEST_EMAIL,
        password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
        avatarColor: '#5b5bd6',
      },
    })
  } else if (name !== 'You' && guest.name !== name) {
    guest = await prisma.user.update({ where: { id: guest.id }, data: { name } })
  }
  return guest
}

async function seedWorkspace(me) {
  const existing = await prisma.teamMember.findFirst({
    where: { userId: me.id },
    include: { team: { include: { projects: true } } },
    orderBy: { addedAt: 'asc' },
  })
  if (existing) return existing

  const ownerLabel = me.name
  const team = await prisma.team.create({
    data: {
      name: ownerLabel === 'You' ? 'Your workspace' : `${ownerLabel}'s workspace`,
      slug: `ws-${crypto.randomBytes(6).toString('hex')}`,
      description: 'Your own workspace — every issue, comment and label here is yours to change.',
      inviteCode: crypto.randomBytes(16).toString('base64url').slice(0, 10),
      members: { create: [{ userId: me.id, role: 'OWNER' }] },
      projects: {
        create: [
          { name: 'Main', key: 'MAIN', description: 'Core product work', color: '#5b5bd6', icon: 'box', leadId: me.id },
          { name: 'Mobile', key: 'MOB', description: 'React Native shell', color: '#ec4899', icon: 'phone', leadId: me.id },
        ],
      },
      labels: {
        create: [
          { name: 'Bug', color: '#ef4444' },
          { name: 'Feature', color: '#10b981' },
          { name: 'Design', color: '#8b5cf6' },
          { name: 'Chore', color: '#6b7280' },
          { name: 'Performance', color: '#06b6d4' },
        ],
      },
    },
    include: { projects: true, labels: true },
  })

  const main = team.projects.find((p) => p.key === 'MAIN')
  const cycle1 = await prisma.cycle.create({
    data: { projectId: main.id, number: 1, name: 'Cycle 1 — Foundations', startsAt: new Date(Date.now() - 8 * 864e5), endsAt: new Date(Date.now() + 6 * 864e5) },
  })
  const cycle2 = await prisma.cycle.create({
    data: { projectId: main.id, number: 2, name: 'Cycle 2 — Momentum', startsAt: new Date(Date.now() + 6 * 864e5), endsAt: new Date(Date.now() + 20 * 864e5) },
  })

  let number = 1
  for (const [title, status, priority, labelName, estimate, description, assigned] of ISSUES) {
    const label = team.labels.find((l) => l.name === labelName)
    const issue = await prisma.issue.create({
      data: {
        projectId: main.id,
        number: number++,
        title,
        description,
        status,
        priority,
        estimate,
        assigneeId: assigned ? me.id : null,
        creatorId: me.id,
        cycleId: status === 'BACKLOG' ? (number % 2 ? cycle2.id : null) : cycle1.id,
        dueDate: status === 'DONE' ? null : new Date(Date.now() + (number % 9) * 864e5),
        labels: label ? { create: [{ labelId: label.id }] } : undefined,
        watchers: { create: [{ userId: me.id }] },
      },
    })
    await prisma.activity.create({
      data: { teamId: team.id, projectId: main.id, issueId: issue.id, actorId: me.id, action: 'created', toValue: title },
    })
    if (status !== 'BACKLOG') {
      await prisma.activity.create({
        data: { teamId: team.id, projectId: main.id, issueId: issue.id, actorId: me.id, action: 'status', fromValue: 'backlog', toValue: status.replace('_', ' ').toLowerCase() },
      })
    }
    if (number % 3 === 0) {
      await prisma.comment.create({
        data: { issueId: issue.id, authorId: me.id, body: 'Note to self — finish this before the cycle ends.' },
      })
    }
  }

  return prisma.teamMember.findFirst({
    where: { userId: me.id, teamId: team.id },
    include: { team: { include: { projects: true } } },
  })
}

router.post('/session', async (req, res) => {
  const me = await resolveOwner(req)
  const membership = await seedWorkspace(me)

  const teams = await prisma.teamMember.findMany({
    where: { userId: me.id },
    include: { team: { include: { projects: true } } },
    orderBy: { addedAt: 'asc' },
  })

  const { password: _, ...safe } = me
  res.json({
    token: signToken(me),
    user: safe,
    teamId: membership.team.id,
    teams: teams.map((t) => ({ ...t.team, role: t.role })),
  })
})

const projectInclude = {
  team: { include: { members: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } } } },
  labels: true,
  cycles: { orderBy: { number: 'desc' }, take: 3 },
  issues: {
    include: {
      assignee: { select: { id: true, name: true, avatarColor: true } },
      labels: { include: { label: true } },
      _count: { select: { comments: true, reactions: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
}

router.get('/project', async (req, res) => {
  const project = await prisma.project.findFirst({
    orderBy: { createdAt: 'asc' },
    include: projectInclude,
  })
  if (!project) return res.status(404).json({ error: 'No demo project yet' })
  res.json({ ...project, demo: true })
})

export default router
