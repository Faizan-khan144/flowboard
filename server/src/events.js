import { prisma } from './db.js'

let io = null

export function setIO(instance) {
  io = instance
}

export function emitToProject(projectId, event, payload) {
  if (!io) return
  io.to(`project:${projectId}`).emit(event, payload)
}

export async function emitToProjectTeam(projectId, event, payload) {
  if (!io) return
  io.to(`project:${projectId}`).emit(event, payload)
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { teamId: true } })
    if (project?.teamId) io.to(`team:${project.teamId}`).emit(event, payload)
  } catch {

  }
}

export function emitToTeam(teamId, event, payload) {
  if (!io) return
  io.to(`team:${teamId}`).emit(event, payload)
}

export function emitToUser(userId, event, payload) {
  if (!io) return
  io.to(`user:${userId}`).emit(event, payload)
}
