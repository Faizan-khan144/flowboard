const API = 'http://localhost:4000'
const results = []

async function call(method, path, { token, body, raw } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  let data = null
  try {
    data = raw ? await res.text() : await res.json()
  } catch {
    data = null
  }
  results.push({ method, path, status: res.status, ok: res.ok, error: !res.ok ? data?.error || data : undefined })
  return data
}

const expect = (name, cond, detail = '') => {
  results.push({ method: 'ASSERT', path: name, status: cond ? 200 : 0, ok: cond, error: cond ? undefined : detail })
}

async function main() {
  const createdEmails = []
  // --- auth ---------------------------------------------------------------
  const email = `check-${Date.now()}@example.com`
  createdEmails.push(email)
  const signup = await call('POST', '/api/auth/signup', { body: { name: 'Check User', email, password: 'secret123' } })
  expect('signup returns token', Boolean(signup?.token), JSON.stringify(signup))
  const token = signup?.token

  const login = await call('POST', '/api/auth/login', { body: { email, password: 'secret123' } })
  expect('login works', Boolean(login?.token))
  const bad = await call('POST', '/api/auth/login', { body: { email, password: 'wrong' } })
  expect('bad password rejected', bad === null || !bad?.token)

  const me = await call('GET', '/api/auth/me', { token })
  expect('me returns user', me?.user?.email === email, JSON.stringify(me)?.slice(0, 80))

  // --- workspace bootstrap ------------------------------------------------
  const teams = await call('GET', '/api/teams', { token })
  expect('signup gives a workspace', Array.isArray(teams) && teams.length >= 1, JSON.stringify(teams)?.slice(0, 80))

  const demo = await call('POST', '/api/demo/session', { body: {} })
  expect('demo session works', Boolean(demo?.token))
  const dt = demo.token

  const team = await call('GET', `/api/teams/${demo.teamId}`, { token: dt })
  expect('team has real members', (team?.members?.length || 0) >= 1, `members=${team?.members?.length}`)
  expect('team has projects', (team?.projects?.length || 0) >= 1)
  expect('team has labels', (team?.labels?.length || 0) >= 1)
  expect('no invented emails', !JSON.stringify(team).includes('@flowboard.dev'), 'found @flowboard.dev')
  expect('invite code present', Boolean(team?.inviteCode))

  const project = team.projects[0]

  // --- issues -------------------------------------------------------------
  const list = await call('GET', `/api/issues?teamId=${team.id}&limit=500`, { token: dt })
  expect('issues listed', Array.isArray(list?.issues) && list.issues.length > 0, `count=${list?.issues?.length}`)

  const created = await call('POST', '/api/issues', { token: dt, body: { projectId: project.id, title: 'Smoke test issue', priority: 'HIGH', estimate: 3 } })
  expect('issue created', Boolean(created?.id) && created?.number > 0, JSON.stringify(created))
  const issueId = created?.id

  const stale = await call('POST', '/api/issues', { token: dt, body: { projectId: 'gone-project', title: 'stale' } })
  expect('stale project rejected', Boolean(stale?.error), JSON.stringify(stale))

  const patched = await call('PATCH', `/api/issues/${issueId}`, { token: dt, body: { status: 'IN_PROGRESS', priority: 'LOW' } })
  expect('issue patched', patched?.status === 'IN_PROGRESS', JSON.stringify(patched))

  const full = await call('GET', `/api/issues/${issueId}`, { token: dt })
  expect('issue detail has children/comments/watchers', full && 'children' in full && 'comments' in full && 'watchers' in full, Object.keys(full || {}).join(','))

  const dup = await call('POST', `/api/issues/${issueId}/duplicate`, { token: dt })
  expect('issue duplicated', Boolean(dup?.id) && dup.id !== issueId)
  await call('DELETE', `/api/issues/${dup.id}`, { token: dt })

  const bulk = await call('PATCH', '/api/issues/bulk', { token: dt, body: { ids: [issueId], data: { priority: 'URGENT' } } })
  expect('bulk patch works', bulk?.count === 1, JSON.stringify(bulk))

  // sub-issue
  const child = await call('POST', '/api/issues', { token: dt, body: { projectId: project.id, title: 'Child issue', parentId: issueId } })
  expect('sub-issue created', Boolean(child?.id))
  const parent = await call('GET', `/api/issues/${issueId}`, { token: dt })
  expect('parent lists child', parent?.children?.some((c) => c.id === child.id), JSON.stringify(parent?.children?.map((c) => c.title)))

  // labels / comments / reactions / watch
  const lbl = await call('POST', '/api/labels', { token: dt, body: { teamId: team.id, name: 'Smoke', color: '#123456' } })
  expect('label created', Boolean(lbl?.id))
  const withLabels = await call('PUT', `/api/issues/${issueId}/labels`, { token: dt, body: { labelIds: [lbl.id] } })
  expect('issue labels set', withLabels?.labels?.length === 1, JSON.stringify(withLabels?.labels))
  const comment = await call('POST', `/api/issues/${issueId}/comments`, { token: dt, body: { body: 'Smoke comment @Check' } })
  expect('comment created', Boolean(comment?.id))
  const reaction = await call('POST', `/api/issues/${issueId}/reactions`, { token: dt, body: { emoji: '👍' } })
  expect('reaction toggled', reaction?.added === true, JSON.stringify(reaction))
  const watch = await call('POST', `/api/issues/${issueId}/watch`, { token: dt })
  expect('watch works', typeof watch?.watching === 'boolean', JSON.stringify(watch))
  await call('DELETE', `/api/labels/${lbl.id}`, { token: dt })

  // --- cycles -------------------------------------------------------------
  const cycles = await call('GET', `/api/cycles/project/${project.id}`, { token: dt })
  expect('cycles listed', Array.isArray(cycles) && cycles.length > 0, `count=${cycles?.length}`)
  const madeCycle = await call('POST', '/api/cycles', { token: dt, body: { projectId: project.id, name: 'Smoke cycle', startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 7 * 864e5).toISOString() } })
  expect('cycle created', Boolean(madeCycle?.id))
  await call('PATCH', `/api/cycles/${madeCycle.id}`, { token: dt, body: { name: 'Smoke cycle 2' } })
  const roll = await call('POST', `/api/cycles/${madeCycle.id}/rollover`, { token: dt })
  expect('cycle rollover ok', roll !== null)
  await call('DELETE', `/api/cycles/${madeCycle.id}`, { token: dt })

  // --- projects -----------------------------------------------------------
  const newProject = await call('POST', '/api/projects', { token: dt, body: { teamId: team.id, name: 'Smoke project', key: 'SMK', color: '#22c55e' } })
  expect('project created', Boolean(newProject?.id))
  await call('PATCH', `/api/projects/${newProject.id}`, { token: dt, body: { description: 'updated' } })
  await call('DELETE', `/api/projects/${newProject.id}`, { token: dt })

  // --- users / analytics --------------------------------------------------
  const dash = await call('GET', '/api/users/me/dashboard', { token: dt })
  expect('dashboard totals real', dash?.totals?.issues >= list.issues.length, `dash=${dash?.totals?.issues} list=${list.issues.length}`)
  expect('dashboard activity real', Array.isArray(dash?.activity))
  const analytics = await call('GET', `/api/users/me/analytics?teamId=${team.id}`, { token: dt })
  expect('analytics returns velocity', Array.isArray(analytics?.velocity) || Array.isArray(analytics?.weeks), Object.keys(analytics || {}).join(','))
  await call('GET', '/api/users/me/starred', { token: dt })
  await call('POST', `/api/users/me/starred/${project.id}`, { token: dt })
  const views = await call('POST', '/api/users/me/views', { token: dt, body: { teamId: team.id, name: 'Smoke view', config: JSON.stringify({ group: 'status' }) } })
  expect('saved view created', Boolean(views?.id))
  await call('DELETE', `/api/users/me/views/${views.id}`, { token: dt })

  // --- search / notifications --------------------------------------------
  const search = await call('GET', `/api/search?q=Smoke&teamId=${team.id}`, { token: dt })
  expect('search returns results', Array.isArray(search?.issues), JSON.stringify(search)?.slice(0, 120))
  const notifs = await call('GET', '/api/notifications', { token: dt })
  expect('notifications list', Array.isArray(notifs?.notifications) && typeof notifs?.unread === 'number', JSON.stringify(notifs)?.slice(0, 120))

  // --- invites + join request flow ---------------------------------------
  const invite = await call('POST', `/api/teams/${team.id}/invites`, { token: dt, body: { role: 'MEMBER', expiresInDays: 7 } })
  const inviteToken = invite?.token || invite?.invite?.token
  expect('invite created', Boolean(inviteToken), JSON.stringify(invite))
  const preview = await call('GET', `/api/join/${inviteToken}`)
  expect('invite preview public', Boolean(preview?.team?.name), JSON.stringify(preview)?.slice(0, 140))
  expect('preview counts real members', (preview?.team?.memberCount || 0) >= 1, `memberCount=${preview?.team?.memberCount}`)

  const secondEmail = `second-${Date.now()}@example.com`
  createdEmails.push(secondEmail)
  const requester = await call('POST', '/api/auth/signup', { body: { name: 'Second User', email: secondEmail, password: 'secret123' } })
  const rt = requester.token
  const requested = await call('POST', `/api/join/${inviteToken}/request`, { token: rt, body: { note: 'Let me in' } })
  expect('join request created', requested?.status === 'PENDING', JSON.stringify(requested)?.slice(0, 140))

  const ownerTeam = await call('GET', `/api/teams/${team.id}`, { token: dt })
  const req = ownerTeam?.joinRequests?.[0]
  expect('owner sees pending request', Boolean(req), JSON.stringify(ownerTeam?.joinRequests))
  if (req) {
    const approved = await call('POST', `/api/teams/${team.id}/requests/${req.id}`, { token: dt, body: { action: 'approve' } })
    expect('owner can approve', approved !== null)
    const after = await call('GET', `/api/teams/${team.id}`, { token: dt })
    expect('member added after approve', after?.members?.length === ownerTeam.members.length + 1, `members=${after?.members?.length}`)
    const secondTeam = await call('GET', `/api/teams/${team.id}`, { token: rt })
    expect('approved user can read team', Boolean(secondTeam?.id))
  }

  // --- authz --------------------------------------------------------------
  const strangerEmail = `stranger-${Date.now()}@example.com`
  createdEmails.push(strangerEmail)
  const stranger = await call('POST', '/api/auth/signup', { body: { name: 'Stranger', email: strangerEmail, password: 'secret123' } })
  const blocked = await call('GET', `/api/teams/${team.id}`, { token: stranger.token })
  expect('non-member blocked from team', blocked === null || blocked?.error, JSON.stringify(blocked)?.slice(0, 100))
  const noAuth = await call('GET', '/api/issues?teamId=' + team.id)
  expect('unauthenticated blocked', noAuth === null || noAuth?.issues === undefined)

  // cleanup smoke issue and the throwaway accounts this run created
  await call('DELETE', '/api/issues/bulk', { token: dt, body: { ids: [issueId, child.id] } })
  const { prisma } = await import('./src/db.js')
  for (const createdEmail of createdEmails) {
    const user = await prisma.user.findUnique({ where: { email: createdEmail } })
    if (user) await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
  }
  const empties = await prisma.team.findMany({ include: { _count: { select: { members: true } } } })
  for (const empty of empties) {
    if (!empty._count.members) await prisma.team.delete({ where: { id: empty.id } }).catch(() => {})
  }
  await prisma.$disconnect()

  // --- report -------------------------------------------------------------
  const checks = results.filter((r) => r.method === 'ASSERT')
  const calls = results.filter((r) => r.method !== 'ASSERT')
  const failed = checks.filter((r) => !r.ok)
  for (const r of failed) console.log(`FAIL  ${r.path}  <- ${r.error}`)
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed (${calls.length} API calls, ${calls.filter((c) => !c.ok).length} expected 4xx)`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => {
  console.error('SMOKE CRASH', e)
  process.exit(2)
})
