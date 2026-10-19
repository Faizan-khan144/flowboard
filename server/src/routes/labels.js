import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth, requireTeamMember } from '../auth.js'

const router = Router()
router.use(requireAuth)

const PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#5b5bd6', '#8b5cf6', '#ec4899', '#6b7280',
]

router.get('/palette', (req, res) => res.json(PALETTE))

router.get('/team/:teamId', requireTeamMember, async (req, res) => {
  const labels = await prisma.label.findMany({
    where: { teamId: req.params.teamId },
    include: { _count: { select: { issues: true } } },
    orderBy: { name: 'asc' },
  })
  res.json(labels)
})

router.post('/', requireTeamMember, async (req, res) => {
  const { name, color, teamId } = req.body
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' })
  if (req.teamRole === 'VIEWER') return res.status(403).json({ error: 'Viewers cannot edit labels' })
  const label = await prisma.label.create({
    data: { name: name.trim(), color: color || '#6b7280', teamId },
  })
  res.status(201).json(label)
})

router.patch('/:labelId', async (req, res) => {
  const label = await prisma.label.findUnique({ where: { id: req.params.labelId } })
  if (!label || !label.teamId) return res.status(404).json({ error: 'Label not found' })
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: req.user.id, teamId: label.teamId } },
  })
  if (!member || member.role === 'VIEWER') return res.status(403).json({ error: 'Not allowed' })
  const { name, color } = req.body
  const updated = await prisma.label.update({
    where: { id: label.id },
    data: { ...(name ? { name: name.trim() } : {}), ...(color ? { color } : {}) },
  })
  res.json(updated)
})

router.delete('/:labelId', async (req, res) => {
  const label = await prisma.label.findUnique({ where: { id: req.params.labelId } })
  if (!label || !label.teamId) return res.status(404).json({ error: 'Label not found' })
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: req.user.id, teamId: label.teamId } },
  })
  if (!member || member.role === 'VIEWER') return res.status(403).json({ error: 'Not allowed' })
  await prisma.label.delete({ where: { id: label.id } })
  res.json({ ok: true })
})

export default router
