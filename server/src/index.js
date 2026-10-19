import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

import authRoutes from './routes/auth.js'
import teamRoutes from './routes/teams.js'
import projectRoutes from './routes/projects.js'
import issueRoutes from './routes/issues.js'
import notificationRoutes from './routes/notifications.js'
import cycleRoutes from './routes/cycles.js'
import labelRoutes from './routes/labels.js'
import searchRoutes from './routes/search.js'
import userRoutes from './routes/users.js'
import joinRoutes from './routes/join.js'
import demoRoutes from './routes/demo.js'
import { setIO, emitToTeam } from './events.js'
import { prisma } from './db.js'

const app = express()
const server = http.createServer(app)

const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const allowOrigin = (origin) => !origin || CLIENT_ORIGIN.includes('*') || CLIENT_ORIGIN.includes(origin)

app.use(cors({ origin: (origin, callback) => callback(null, allowOrigin(origin)), credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, now: Date.now() }))

app.use('/api/auth', authRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/issues', issueRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/cycles', cycleRoutes)
app.use('/api/labels', labelRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/users', userRoutes)
app.use('/api/join', joinRoutes)
app.use('/api/demo', demoRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const JWT_SECRET = process.env.JWT_SECRET || 'flowboard-dev-secret-change-in-prod'

const io = new Server(server, {
  cors: { origin: (origin, callback) => callback(null, allowOrigin(origin)), credentials: true },
})
setIO(io)

io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('No token'))
  try {
    socket.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})

const presence = new Map()
const teamRooms = new Map()

async function broadcastPresence(teamId) {
  const ids = [...presence.keys()]
  const members = await prisma.teamMember.findMany({ where: { teamId }, select: { userId: true } })
  const memberIds = new Set(members.map((m) => m.userId))
  const online = ids.filter((id) => memberIds.has(id))
  const users = await prisma.user.findMany({
    where: { id: { in: online } },
    select: { id: true, name: true, avatarColor: true },
  })
  emitToTeam(teamId, 'presence:update', { teamId, users })
}

io.on('connection', async (socket) => {
  const userId = socket.user?.id
  if (userId) {
    socket.join(`user:${userId}`)
    if (!presence.has(userId)) presence.set(userId, new Set())
    presence.get(userId).add(socket.id)

    const memberships = await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } })
    const ids = memberships.map((m) => m.teamId)
    teamRooms.set(socket.id, ids)
    for (const teamId of ids) {
      socket.join(`team:${teamId}`)
      broadcastPresence(teamId)
    }
  }

  socket.on('project:join', (projectId) => {
    if (projectId) socket.join(`project:${projectId}`)
  })
  socket.on('project:leave', (projectId) => {
    if (projectId) socket.leave(`project:${projectId}`)
  })
  socket.on('team:join', (teamId) => {
    if (teamId) {
      socket.join(`team:${teamId}`)
      broadcastPresence(teamId)
    }
  })
  socket.on('presence:ping', async (teamId) => {
    if (teamId) await broadcastPresence(teamId)
  })

  socket.on('disconnect', async () => {
    if (!userId) return
    const set = presence.get(userId)
    if (set) {
      set.delete(socket.id)
      if (!set.size) presence.delete(userId)
    }
    const ids = teamRooms.get(socket.id) || []
    teamRooms.delete(socket.id)
    for (const teamId of ids) await broadcastPresence(teamId)
  })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`flowboard server on http://localhost:${PORT}`)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
})
