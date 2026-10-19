import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const where = { userId: req.user.id }
  if (req.query.unread === '1') where.read = false
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(req.query.limit) || 60, 120),
  })
  const actorIds = [...new Set(notifications.map((n) => n.actorId).filter(Boolean))]
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, avatarColor: true },
  })
  const issueIds = [...new Set(notifications.map((n) => n.issueId).filter(Boolean))]
  const issues = await prisma.issue.findMany({
    where: { id: { in: issueIds } },
    select: { id: true, number: true, title: true, status: true, project: { select: { key: true, name: true, id: true } } },
  })
  const unread = await prisma.notification.count({ where: { userId: req.user.id, read: false } })

  res.json({
    notifications: notifications.map((n) => ({
      ...n,
      actor: actors.find((a) => a.id === n.actorId) || null,
      issue: issues.find((i) => i.id === n.issueId) || null,
    })),
    unread,
  })
})

router.post('/read-all', async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } })
  res.json({ ok: true })
})

router.post('/clear', async (req, res) => {
  await prisma.notification.deleteMany({ where: { userId: req.user.id, read: true } })
  res.json({ ok: true })
})

router.post('/:id/read', async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { read: true } })
  res.json({ ok: true })
})

router.post('/:id/unread', async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { read: false } })
  res.json({ ok: true })
})

export default router
