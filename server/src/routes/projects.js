import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth, requireTeamMember } from '../auth.js'
import { emitToProject } from '../events.js'
import { logActivity } from '../access.js'

const router = Router()
router.use(requireAuth)

router.get('/team/:teamId', requireTeamMember, async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { teamId: req.params.teamId },
    include: { _count: { select: { issues: true } } },
    orderBy: { createdAt: 'asc' },
  })
  res.json(projects)
})

router.post('/', requireTeamMember, async (req, res) => {
  const { teamId, name, key, description, color, icon, leadId } = req.body
  if (!name || !key) return res.status(400).json({ error: 'name and key are required' })
  if (req.teamRole === 'VIEWER') return res.status(403).json({ error: 'Viewers cannot create projects' })
  const cleanKey = String(key).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  if (!cleanKey) return res.status(400).json({ error: 'key must contain letters or numbers' })
  const clash = await prisma.project.findUnique({ where: { teamId_key: { teamId, key: cleanKey } } })
  if (clash) return res.status(409).json({ error: `Project key "${cleanKey}" already exists in this team` })
  const project = await prisma.project.create({
    data: { teamId, name, key: cleanKey, description: description || null, color: color || '#5b5bd6', icon: icon || 'box', leadId: leadId || null },
  })
  await logActivity({ teamId, projectId: project.id, actorId: req.user.id, action: 'project_created', toValue: project.name })
  res.status(201).json(project)
})

router.get('/:projectId', async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.projectId },
    include: {
      team: { include: { members: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true, title: true } } } } } },
      labels: true,
      cycles: { orderBy: { number: 'desc' } },
      issues: {
        include: {
          assignee: { select: { id: true, name: true, avatarColor: true } },
          labels: { include: { label: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: req.user.id, teamId: project.teamId } },
  })
  if (!member) return res.status(403).json({ error: 'Not a member of this team' })
  res.json({ ...project, role: member.role })
})

router.patch('/:projectId', async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: req.user.id, teamId: project.teamId } },
  })
  if (!member || member.role === 'VIEWER') return res.status(403).json({ error: 'Not allowed' })
  const { name, description, color, icon, leadId, archived } = req.body
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(color ? { color } : {}),
      ...(icon ? { icon } : {}),
      ...(leadId !== undefined ? { leadId } : {}),
      ...(archived !== undefined ? { archived: Boolean(archived) } : {}),
    },
  })
  emitToProject(project.id, 'project:changed', { projectId: project.id })
  res.json(updated)
})

router.delete('/:projectId', async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: req.user.id, teamId: project.teamId } },
  })
  if (!member || member.role !== 'OWNER') return res.status(403).json({ error: 'Only the owner can delete a project' })
  await prisma.project.delete({ where: { id: project.id } })
  res.json({ ok: true })
})

export default router
