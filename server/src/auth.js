import jwt from 'jsonwebtoken'
import { prisma } from './db.js'

const SECRET = process.env.JWT_SECRET || 'flowboard-dev-secret-change-in-prod'

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET)
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user) return res.status(401).json({ error: 'User not found' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export async function requireTeamMember(req, res, next) {
  const teamId = req.params.teamId || req.body.teamId
  if (!teamId) return res.status(400).json({ error: 'teamId required' })
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: req.user.id },
  })
  if (!member) return res.status(403).json({ error: 'Not a member of this team' })
  req.teamRole = member.role
  next()
}
