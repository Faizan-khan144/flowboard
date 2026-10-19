import { Router } from 'express'
import crypto from 'crypto'
import { prisma } from '../db.js'
import { requireAuth, requireTeamMember } from '../auth.js'
import { emitToUser } from '../events.js'
import { logActivity } from '../access.js'

const router = Router()
router.use(requireAuth)

const memberInclude = {
  include: { user: { select: { id: true, name: true, email: true, avatarColor: true, title: true } } },
}

function newCode(len = 10) {
  return crypto.randomBytes(16).toString('base64url').slice(0, len)
}

router.get('/', async (req, res) => {
  const memberships = await prisma.teamMember.findMany({
    where: { userId: req.user.id },
    include: { team: { include: { members: memberInclude, projects: { where: { archived: false }, orderBy: { createdAt: 'asc' } } } } },
    orderBy: { addedAt: 'asc' },
  })
  res.json(memberships.map((m) => ({ ...m.team, role: m.role })))
})

router.post('/', async (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}-${Math.random().toString(36).slice(2, 6)}`
  const team = await prisma.team.create({
    data: {
      name,
      slug,
      description: description || null,
      inviteCode: newCode(),
      members: { create: { userId: req.user.id, role: 'OWNER' } },
      projects: { create: { name: 'Main', key: 'MAIN', description: 'First project' } },
      labels: {
        create: [
          { name: 'Bug', color: '#ef4444' },
          { name: 'Feature', color: '#10b981' },
          { name: 'Design', color: '#8b5cf6' },
          { name: 'Chore', color: '#6b7280' },
        ],
      },
    },
    include: { projects: true, labels: true },
  })
  res.status(201).json({ ...team, role: 'OWNER' })
})

router.get('/:teamId', requireTeamMember, async (req, res) => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.teamId },
    include: {
      members: memberInclude,
      projects: { orderBy: { createdAt: 'asc' } },
      labels: true,
      invites: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      joinRequests: {
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  res.json({ ...team, role: req.teamRole })
})

router.patch('/:teamId', requireTeamMember, async (req, res) => {
  if (req.teamRole !== 'OWNER') return res.status(403).json({ error: 'Only the owner can update the team' })
  const { name, description } = req.body
  const team = await prisma.team.update({
    where: { id: req.params.teamId },
    data: { ...(name ? { name } : {}), ...(description !== undefined ? { description } : {}) },
  })
  res.json(team)
})

router.post('/:teamId/members', requireTeamMember, async (req, res) => {
  const { email, role } = req.body
  if (req.teamRole !== 'OWNER') return res.status(403).json({ error: 'Only the owner can add members' })
  const user = await prisma.user.findUnique({ where: { email: String(email || '').toLowerCase() } })
  if (!user) return res.status(404).json({ error: 'No user with that email — send them an invite link instead' })
  const existing = await prisma.teamMember.findUnique({ where: { userId_teamId: { userId: user.id, teamId: req.params.teamId } } })
  if (existing) return res.status(409).json({ error: 'Already a member' })
  const member = await prisma.teamMember.create({
    data: { userId: user.id, teamId: req.params.teamId, role: role === 'VIEWER' ? 'VIEWER' : role === 'OWNER' ? 'OWNER' : 'MEMBER' },
    include: { user: { select: { id: true, name: true, email: true, avatarColor: true, title: true } } },
  })
  await prisma.notification.create({
    data: {
      userId: user.id,
      actorId: req.user.id,
      type: 'invite',
      teamId: req.params.teamId,
      body: `${req.user.name} added you to a workspace`,
    },
  })
  emitToUser(user.id, 'notification', { type: 'invite' })
  res.status(201).json(member)
})

router.patch('/:teamId/members/:userId', requireTeamMember, async (req, res) => {
  if (req.teamRole !== 'OWNER') return res.status(403).json({ error: 'Only the owner can change roles' })
  const { role } = req.body
  if (!['OWNER', 'MEMBER', 'VIEWER'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
  const member = await prisma.teamMember.update({
    where: { userId_teamId: { userId: req.params.userId, teamId: req.params.teamId } },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true, avatarColor: true, title: true } } },
  })
  res.json(member)
})

router.delete('/:teamId/members/:userId', requireTeamMember, async (req, res) => {
  if (req.teamRole !== 'OWNER' && req.params.userId !== req.user.id) return res.status(403).json({ error: 'Not allowed' })
  const owners = await prisma.teamMember.count({ where: { teamId: req.params.teamId, role: 'OWNER' } })
  const target = await prisma.teamMember.findUnique({ where: { userId_teamId: { userId: req.params.userId, teamId: req.params.teamId } } })
  if (target?.role === 'OWNER' && owners <= 1) return res.status(400).json({ error: 'A workspace needs at least one owner' })
  await prisma.teamMember.delete({ where: { userId_teamId: { userId: req.params.userId, teamId: req.params.teamId } } })
  res.json({ ok: true })
})

router.post('/:teamId/invites', requireTeamMember, async (req, res) => {
  const { role = 'MEMBER', maxUses, expiresInDays } = req.body
  const invite = await prisma.invite.create({
    data: {
      teamId: req.params.teamId,
      token: newCode(12),
      role: ['VIEWER', 'MEMBER', 'OWNER'].includes(role) ? role : 'MEMBER',
      createdById: req.user.id,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 864e5) : null,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  })
  res.status(201).json(invite)
})

router.delete('/:teamId/invites/:inviteId', requireTeamMember, async (req, res) => {
  if (req.teamRole !== 'OWNER') return res.status(403).json({ error: 'Only the owner can revoke invites' })
  await prisma.invite.delete({ where: { id: req.params.inviteId } })
  res.json({ ok: true })
})

router.get('/:teamId/requests', requireTeamMember, async (req, res) => {
  const requests = await prisma.joinRequest.findMany({
    where: { teamId: req.params.teamId },
    include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(requests)
})

router.post('/:teamId/requests/:requestId', requireTeamMember, async (req, res) => {
  if (req.teamRole !== 'OWNER') return res.status(403).json({ error: 'Only the owner can review requests' })
  const { action } = req.body
  const request = await prisma.joinRequest.findUnique({ where: { id: req.params.requestId } })
  if (!request || request.teamId !== req.params.teamId) return res.status(404).json({ error: 'Request not found' })

  if (action === 'approve') {
    await prisma.joinRequest.update({ where: { id: request.id }, data: { status: 'APPROVED', decidedAt: new Date() } })
    const existing = await prisma.teamMember.findUnique({ where: { userId_teamId: { userId: request.userId, teamId: request.teamId } } })
    if (!existing) {
      await prisma.teamMember.create({ data: { userId: request.userId, teamId: request.teamId, role: 'MEMBER' } })
    }
    const team = await prisma.team.findUnique({ where: { id: request.teamId } })
    await logActivity({ teamId: request.teamId, actorId: req.user.id, action: 'member_joined', toValue: team?.name })
    await prisma.notification.create({
      data: {
        userId: request.userId,
        actorId: req.user.id,
        type: 'request',
        teamId: request.teamId,
        body: `Your request to join ${team?.name} was approved`,
      },
    })
    emitToUser(request.userId, 'notification', { type: 'request' })
    emitToUser(request.userId, 'membership:changed', { teamId: request.teamId })
  } else {
    await prisma.joinRequest.update({ where: { id: request.id }, data: { status: 'DENIED', decidedAt: new Date() } })
    await prisma.notification.create({
      data: {
        userId: request.userId,
        actorId: req.user.id,
        type: 'request',
        teamId: request.teamId,
        body: 'Your workspace request was declined',
      },
    })
    emitToUser(request.userId, 'notification', { type: 'request' })
  }
  res.json({ ok: true })
})

export default router
