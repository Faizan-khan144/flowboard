import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../auth.js'
import { emitToProjectTeam } from '../events.js'
import { projectAccess } from '../access.js'

const router = Router()
router.use(requireAuth)

function progress(cycle) {
  const total = cycle.issues?.length || 0
  const done = (cycle.issues || []).filter((i) => i.status === 'DONE').length
  const estimate = (cycle.issues || []).reduce((sum, i) => sum + (i.estimate || 0), 0)
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0, estimate }
}

router.get('/project/:projectId', async (req, res) => {
  const access = await projectAccess(req.params.projectId, req.user.id)
  if (!access) return res.status(403).json({ error: 'Not allowed' })
  const cycles = await prisma.cycle.findMany({
    where: { projectId: req.params.projectId },
    include: { issues: { select: { id: true, status: true, estimate: true, priority: true, title: true, number: true } } },
    orderBy: { number: 'desc' },
  })
  res.json(cycles.map((c) => ({ ...c, progress: progress(c) })))
})

router.post('/', async (req, res) => {
  const { projectId, name, startsAt, endsAt } = req.body
  const access = await projectAccess(projectId, req.user.id)
  if (!access) return res.status(403).json({ error: 'Not allowed' })
  if (access.role === 'VIEWER') return res.status(403).json({ error: 'Viewers cannot create cycles' })
  const count = await prisma.cycle.count({ where: { projectId } })
  const cycle = await prisma.cycle.create({
    data: {
      projectId,
      number: count + 1,
      name: name || `Cycle ${count + 1}`,
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      endsAt: endsAt ? new Date(endsAt) : new Date(Date.now() + 14 * 864e5),
    },
    include: { issues: { select: { id: true, status: true, estimate: true } } },
  })
  emitToProjectTeam(projectId, 'cycle:changed', { projectId })
  res.status(201).json({ ...cycle, progress: progress(cycle) })
})

router.patch('/:cycleId', async (req, res) => {
  const existing = await prisma.cycle.findUnique({ where: { id: req.params.cycleId } })
  if (!existing) return res.status(404).json({ error: 'Cycle not found' })
  const access = await projectAccess(existing.projectId, req.user.id)
  if (!access || access.role === 'VIEWER') return res.status(403).json({ error: 'Not allowed' })
  const { name, startsAt, endsAt } = req.body
  const cycle = await prisma.cycle.update({
    where: { id: existing.id },
    data: {
      ...(name ? { name } : {}),
      ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
      ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
    },
    include: { issues: { select: { id: true, status: true, estimate: true } } },
  })
  emitToProjectTeam(existing.projectId, 'cycle:changed', { projectId: existing.projectId })
  res.json({ ...cycle, progress: progress(cycle) })
})

router.delete('/:cycleId', async (req, res) => {
  const existing = await prisma.cycle.findUnique({ where: { id: req.params.cycleId } })
  if (!existing) return res.status(404).json({ error: 'Cycle not found' })
  const access = await projectAccess(existing.projectId, req.user.id)
  if (!access || access.role !== 'OWNER') return res.status(403).json({ error: 'Only the owner can delete cycles' })
  await prisma.issue.updateMany({ where: { cycleId: existing.id }, data: { cycleId: null } })
  await prisma.cycle.delete({ where: { id: existing.id } })
  emitToProjectTeam(existing.projectId, 'cycle:changed', { projectId: existing.projectId })
  res.json({ ok: true })
})

router.post('/:cycleId/issues', async (req, res) => {
  const existing = await prisma.cycle.findUnique({ where: { id: req.params.cycleId } })
  if (!existing) return res.status(404).json({ error: 'Cycle not found' })
  const access = await projectAccess(existing.projectId, req.user.id)
  if (!access || access.role === 'VIEWER') return res.status(403).json({ error: 'Not allowed' })
  const ids = Array.isArray(req.body.issueIds) ? req.body.issueIds : []
  await prisma.issue.updateMany({ where: { id: { in: ids }, projectId: existing.projectId }, data: { cycleId: existing.id } })
  emitToProjectTeam(existing.projectId, 'cycle:changed', { projectId: existing.projectId })
  emitToProjectTeam(existing.projectId, 'issues:changed', { projectId: existing.projectId })
  res.json({ ok: true, added: ids.length })
})

router.delete('/:cycleId/issues/:issueId', async (req, res) => {
  const existing = await prisma.cycle.findUnique({ where: { id: req.params.cycleId } })
  if (!existing) return res.status(404).json({ error: 'Cycle not found' })
  const access = await projectAccess(existing.projectId, req.user.id)
  if (!access || access.role === 'VIEWER') return res.status(403).json({ error: 'Not allowed' })
  await prisma.issue.update({ where: { id: req.params.issueId }, data: { cycleId: null } })
  emitToProjectTeam(existing.projectId, 'cycle:changed', { projectId: existing.projectId })
  res.json({ ok: true })
})

router.post('/:cycleId/rollover', async (req, res) => {
  const existing = await prisma.cycle.findUnique({ where: { id: req.params.cycleId } })
  if (!existing) return res.status(404).json({ error: 'Cycle not found' })
  const access = await projectAccess(existing.projectId, req.user.id)
  if (!access || access.role === 'VIEWER') return res.status(403).json({ error: 'Not allowed' })

  let next = await prisma.cycle.findFirst({
    where: { projectId: existing.projectId, number: { gt: existing.number } },
    orderBy: { number: 'asc' },
  })
  if (!next) {
    const days = Math.max(1, Math.round((new Date(existing.endsAt) - new Date(existing.startsAt)) / 864e5))
    next = await prisma.cycle.create({
      data: {
        projectId: existing.projectId,
        number: existing.number + 1,
        name: `Cycle ${existing.number + 1}`,
        startsAt: new Date(existing.endsAt),
        endsAt: new Date(new Date(existing.endsAt).getTime() + days * 864e5),
      },
    })
  }

  const unfinished = await prisma.issue.findMany({
    where: { cycleId: existing.id, status: { notIn: ['DONE', 'CANCELED'] } },
    select: { id: true },
  })
  await prisma.issue.updateMany({
    where: { id: { in: unfinished.map((i) => i.id) } },
    data: { cycleId: next.id },
  })
  await prisma.cycle.update({ where: { id: existing.id }, data: { endsAt: new Date() } })
  emitToProjectTeam(existing.projectId, 'cycle:changed', { projectId: existing.projectId })
  emitToProjectTeam(existing.projectId, 'issues:changed', { projectId: existing.projectId })
  res.json({ ok: true, moved: unfinished.length, nextCycleId: next.id })
})

export default router
