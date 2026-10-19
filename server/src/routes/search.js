import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../auth.js'
import { teamIdsForUser } from '../access.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim()
  const teamId = req.query.teamId
  if (!q) return res.json({ issues: [], projects: [], people: [], labels: [] })

  const memberships = await teamIdsForUser(req.user.id)
  const allowed = teamId ? memberships.filter((m) => m.teamId === teamId).map((m) => m.teamId) : memberships.map((m) => m.teamId)
  if (!allowed.length) return res.json({ issues: [], projects: [], people: [], labels: [] })

  const [issues, projects, labels] = await Promise.all([
    prisma.issue.findMany({
      where: {
        project: { teamId: { in: allowed } },
        OR: [{ title: { contains: q } }, { description: { contains: q } }],
      },
      include: { project: { select: { id: true, key: true, name: true, color: true } }, assignee: { select: { id: true, name: true, avatarColor: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 12,
    }),
    prisma.project.findMany({
      where: { teamId: { in: allowed }, OR: [{ name: { contains: q } }, { key: { contains: q } }] },
      take: 6,
    }),
    prisma.label.findMany({ where: { teamId: { in: allowed }, name: { contains: q } }, take: 8 }),
  ])

  const members = await prisma.teamMember.findMany({
    where: { teamId: { in: allowed } },
    include: { user: { select: { id: true, name: true, email: true, avatarColor: true, title: true } } },
    take: 60,
  })
  const needle = q.toLowerCase()
  const people = members
    .map((m) => m.user)
    .filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i)
    .filter((u) => u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle))
    .slice(0, 6)

  res.json({ issues, projects, people, labels })
})

router.get('/activity', async (req, res) => {
  const { teamId, projectId, issueId } = req.query
  const where = {}
  if (issueId) where.issueId = issueId
  if (projectId) where.projectId = projectId
  if (teamId) {
    const memberships = await teamIdsForUser(req.user.id)
    if (!memberships.some((m) => m.teamId === teamId)) return res.status(403).json({ error: 'Not allowed' })
    where.teamId = teamId
  }
  const activity = await prisma.activity.findMany({
    where,
    include: {
      actor: { select: { id: true, name: true, avatarColor: true } },
      issue: { select: { id: true, number: true, title: true, project: { select: { key: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(req.query.limit) || 40, 120),
  })
  res.json(activity)
})

export default router
