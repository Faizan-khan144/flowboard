import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../auth.js'
import { emitToUser } from '../events.js'

const router = Router()
const SECRET = process.env.JWT_SECRET || 'flowboard-dev-secret-change-in-prod'

async function optionalUser(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    const jwt = (await import('jsonwebtoken')).default
    const payload = jwt.verify(token, SECRET)
    return prisma.user.findUnique({ where: { id: payload.id } })
  } catch {
    return null
  }
}

router.get('/:token', async (req, res) => {
  const invite = await prisma.invite.findUnique({
    where: { token: req.params.token },
    include: {
      team: {
        include: {
          _count: { select: { members: true, projects: true } },
          members: { take: 6, include: { user: { select: { id: true, name: true, avatarColor: true } } } },
          projects: { where: { archived: false }, take: 4, orderBy: { createdAt: 'asc' } },
        },
      },
      createdBy: { select: { name: true } },
    },
  })
  if (!invite) return res.status(404).json({ error: 'This invite link is not valid any more' })

  const expired = invite.expiresAt && new Date(invite.expiresAt) < new Date()
  const used = invite.maxUses != null && invite.uses >= invite.maxUses
  const user = await optionalUser(req)
  let membership = null
  let request = null
  if (user) {
    membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: user.id, teamId: invite.teamId } },
    })
    request = await prisma.joinRequest.findUnique({
      where: { teamId_userId: { teamId: invite.teamId, userId: user.id } },
    })
  }

  res.json({
    team: {
      id: invite.team.id,
      name: invite.team.name,
      slug: invite.team.slug,
      description: invite.team.description,
      memberCount: invite.team._count.members,
      projectCount: invite.team._count.projects,
      members: invite.team.members.map((m) => m.user),
      projects: invite.team.projects.map((p) => ({ id: p.id, name: p.name, key: p.key, color: p.color })),
    },
    role: invite.role,
    invitedBy: invite.createdBy?.name,
    expired: Boolean(expired),
    used: Boolean(used),
    signedIn: Boolean(user),
    membership: membership ? { role: membership.role } : null,
    request: request ? { status: request.status } : null,
  })
})

router.post('/:token/request', requireAuth, async (req, res) => {
  const invite = await prisma.invite.findUnique({ where: { token: req.params.token } })
  if (!invite) return res.status(404).json({ error: 'Invalid invite' })
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return res.status(400).json({ error: 'This invite has expired' })

  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: req.user.id, teamId: invite.teamId } },
  })
  if (existing) return res.status(409).json({ error: 'You are already a member', teamId: invite.teamId })

  const request = await prisma.joinRequest.upsert({
    where: { teamId_userId: { teamId: invite.teamId, userId: req.user.id } },
    create: { teamId: invite.teamId, userId: req.user.id, note: req.body?.note || null },
    update: { status: 'PENDING', note: req.body?.note || null, decidedAt: null },
  })

  const owners = await prisma.teamMember.findMany({ where: { teamId: invite.teamId, role: 'OWNER' } })
  const team = await prisma.team.findUnique({ where: { id: invite.teamId } })
  for (const owner of owners) {
    await prisma.notification.create({
      data: {
        userId: owner.userId,
        actorId: req.user.id,
        type: 'request',
        teamId: invite.teamId,
        requestId: request.id,
        body: `${req.user.name} asked to join ${team?.name}`,
      },
    })
    emitToUser(owner.userId, 'notification', { type: 'request', requestId: request.id })
  }

  res.status(201).json({ ok: true, status: request.status })
})

router.get('/me/requests', requireAuth, async (req, res) => {
  const requests = await prisma.joinRequest.findMany({
    where: { userId: req.user.id },
    include: { team: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(requests)
})

router.delete('/me/requests/:id', requireAuth, async (req, res) => {
  await prisma.joinRequest.deleteMany({ where: { id: req.params.id, userId: req.user.id } })
  res.json({ ok: true })
})

export default router
