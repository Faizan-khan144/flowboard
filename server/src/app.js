import express from 'express'
import cors from 'cors'

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
import liveRoutes from './routes/live.js'

const app = express()

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
app.use('/api/live', liveRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
