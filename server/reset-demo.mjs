import { prisma } from './src/db.js'

// Removes the old seeded identities (@flowboard.dev) and any workspace that
// has no real members left. Safe to run any time: it only touches data that
// was invented by the previous demo seeder.
const fakeUsers = await prisma.user.findMany({
  where: { email: { endsWith: '@flowboard.dev' } },
  select: { id: true, email: true },
})

for (const u of fakeUsers) {
  const memberships = await prisma.teamMember.findMany({ where: { userId: u.id }, select: { teamId: true } })
  for (const m of memberships) {
    await prisma.teamMember.deleteMany({ where: { teamId: m.teamId, userId: u.id } })
    const left = await prisma.teamMember.count({ where: { teamId: m.teamId } })
    if (left === 0) {
      await prisma.team.delete({ where: { id: m.teamId } }).catch((e) => console.log('skip team', e.message))
    }
  }
  await prisma.user.delete({ where: { id: u.id } }).catch((e) => console.log('skip user', e.message))
  console.log('removed', u.email)
}

const guest = await prisma.user.findUnique({ where: { email: 'guest@localhost' } })
if (guest) {
  const membership = await prisma.teamMember.findFirst({ where: { userId: guest.id } })
  if (membership) {
    await prisma.team.delete({ where: { id: membership.teamId } }).catch((e) => console.log('skip guest team', e.message))
    console.log('reset guest workspace (it will be re-seeded on next open)')
  }
}

console.log(`done — removed ${fakeUsers.length} invented accounts`)
await prisma.$disconnect()
