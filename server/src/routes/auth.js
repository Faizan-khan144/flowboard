import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../db.js'
import { signToken, requireAuth } from '../auth.js'

const router = Router()

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' })

  const hash = await bcrypt.hash(password, 10)
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hash,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    },
  })

  const team = await prisma.team.create({
    data: {
      name: `${name.split(' ')[0]}'s Team`,
      slug: `t-${Math.random().toString(36).slice(2, 8)}`,
      inviteCode: crypto.randomBytes(16).toString('base64url').slice(0, 10),
      members: { create: { userId: user.id, role: 'OWNER' } },
      projects: {
        create: { name: 'Main', key: 'MAIN', description: 'First project', leadId: user.id },
      },
      labels: {
        create: [
          { name: 'Bug', color: '#ef4444' },
          { name: 'Feature', color: '#10b981' },
          { name: 'Design', color: '#8b5cf6' },
          { name: 'Chore', color: '#6b7280' },
        ],
      },
    },
  })

  await prisma.activity.create({
    data: { teamId: team.id, actorId: user.id, action: 'workspace_created', toValue: team.name },
  })

  const token = signToken(user)
  const { password: _, ...safe } = user
  res.json({ token, user: safe, teamId: team.id, isNew: true })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return res.status(401).json({ error: 'Invalid email or password' })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' })

  const token = signToken(user)
  const { password: _, ...safe } = user
  res.json({ token, user: safe })
})

router.get('/me', requireAuth, async (req, res) => {
  const teams = await prisma.teamMember.findMany({
    where: { userId: req.user.id },
    include: { team: { include: { projects: true } } },
  })
  const { password: _, ...safe } = req.user
  res.json({ user: safe, teams: teams.map((t) => ({ ...t.team, role: t.role })) })
})

export default router
