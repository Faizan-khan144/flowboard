import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('password123', 10)

  const users = []
  for (const [name, email, color] of [
    ['Muhammad Faizan', 'faizan@example.com', '#6366f1'],
    ['Ayesha Khan', 'ayesha@example.com', '#ec4899'],
    ['Bilal Ahmed', 'bilal@example.com', '#10b981'],
  ]) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, password: hash, avatarColor: color },
    })
    users.push(user)
  }

  let team = await prisma.team.findFirst({ where: { slug: 'acme-team' } })
  if (!team) {
    team = await prisma.team.create({
      data: {
        name: 'Acme',
        slug: 'acme-team',
        members: {
          create: [
            { userId: users[0].id, role: 'OWNER' },
            { userId: users[1].id, role: 'MEMBER' },
            { userId: users[2].id, role: 'MEMBER' },
          ],
        },
        projects: { create: { name: 'Main', key: 'MAIN', description: 'Core product work' } },
        labels: {
          create: [
            { name: 'bug', color: '#ef4444' },
            { name: 'feature', color: '#10b981' },
            { name: 'design', color: '#8b5cf6' },
            { name: 'chore', color: '#6b7280' },
          ],
        },
      },
      include: { projects: true, labels: true },
    })
  }

  const project = await prisma.project.findFirst({ where: { teamId: team.id, key: 'MAIN' } })

  const existing = await prisma.issue.count({ where: { projectId: project.id } })
  if (existing === 0) {
    const now = Date.now()
    const cycle = await prisma.cycle.create({
      data: {
        projectId: project.id,
        number: 1,
        name: 'Cycle 1',
        startsAt: new Date(now),
        endsAt: new Date(now + 14 * 24 * 3600 * 1000),
      },
    })

    const seeds = [
      ['Set up auth flow', 'Implement JWT based sign up and sign in', 'DONE', 'HIGH', users[0].id],
      ['Build issue board', 'Kanban board with drag and drop columns', 'IN_PROGRESS', 'URGENT', users[0].id],
      ['Design empty states', 'Empty state illustrations for board and inbox', 'TODO', 'MEDIUM', users[1].id],
      ['Realtime updates over websockets', 'Emit issue changes to all connected clients', 'TODO', 'HIGH', users[2].id],
      ['Add keyboard shortcuts', 'Cmd+K command palette and quick nav', 'BACKLOG', 'LOW', null],
      ['Fix mobile overflow on board', 'Columns overflow horizontally on small screens', 'IN_PROGRESS', 'HIGH', users[1].id],
      ['Write seed data script', 'Generate realistic demo data', 'DONE', 'LOW', users[0].id],
      ['Cycle burndown chart', 'Show remaining issues per day', 'BACKLOG', 'MEDIUM', null],
    ]

    for (let i = 0; i < seeds.length; i++) {
      const [title, description, status, priority, assigneeId] = seeds[i]
      const issue = await prisma.issue.create({
        data: {
          projectId: project.id,
          number: i + 1,
          title,
          description,
          status,
          priority,
          assigneeId,
          creatorId: users[0].id,
          cycleId: cycle.id,
        },
      })
      await prisma.issueLabel.create({
        data: { issueId: issue.id, labelId: project.labels?.[i % 4]?.id || team.labels[i % 4].id },
      }).catch(() => {})
    }
  }

  console.log('Seeded users: faizan@example.com / ayesha@example.com / bilal@example.com  (password123)')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
