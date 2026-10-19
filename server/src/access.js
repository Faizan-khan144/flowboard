import { prisma } from './db.js'

export async function teamIdsForUser(userId) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true, role: true },
  })
  return memberships
}

export async function projectAccess(projectId, userId) {
  if (!projectId) return null
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return null
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: project.teamId } },
  })
  return member ? { project, role: member.role } : null
}

export async function issueAccess(issueId, userId) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } })
  if (!issue) return null
  const access = await projectAccess(issue.projectId, userId)
  if (!access) return null
  return { issue, project: access.project, role: access.role }
}

export async function logActivity({ teamId, projectId, issueId, actorId, action, fromValue, toValue }) {
  try {
    await prisma.activity.create({
      data: {
        teamId: teamId || null,
        projectId: projectId || null,
        issueId: issueId || null,
        actorId,
        action,
        fromValue: fromValue === undefined ? null : String(fromValue),
        toValue: toValue === undefined ? null : String(toValue),
      },
    })
  } catch {

  }
}

export function csv(value) {
  if (value === undefined || value === null || value === '') return []
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}
