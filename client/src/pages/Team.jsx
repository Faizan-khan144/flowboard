import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Users, UserPlus, Mail, Link2, Tag, Boxes, Check, X, Trash2, Copy, Shield, Crown,
  Eye, Plus, Search, MoreHorizontal, Archive, ArchiveRestore, Pencil, Clock,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import { ROLES, roleMeta, relativeTime } from '../lib/constants'
import { copyText } from '../lib/share'
import Avatar from '../components/Avatar'

const TABS = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'requests', label: 'Requests', icon: UserPlus },
  { id: 'invites', label: 'Invites', icon: Link2 },
  { id: 'labels', label: 'Labels', icon: Tag },
  { id: 'projects', label: 'Projects', icon: Boxes },
]

const PALETTE = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#5b5bd6', '#8b5cf6', '#ec4899', '#6b7280']

export default function Team() {
  const { team, reloadTeam } = useOutletContext()
  const { user } = useAuth()
  const { toast, setActiveProject } = useUI()
  const [tab, setTab] = useState('members')
  const [pendingCount, setPendingCount] = useState(0)

  const isOwner = team?.role === 'OWNER'
  const canEdit = team?.role === 'OWNER' || team?.role === 'MEMBER'

  useEffect(() => {
    if (team) setPendingCount(team.joinRequests?.length || 0)
  }, [team])

  if (!team) return <div className="p-6"><div className="h-10 w-64 rounded-xl skeleton" /></div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-tight">
          <Users className="h-5 w-5 text-accent" /> {team.name}
        </h1>
        <p className="mt-1 text-[14px] text-muted">
          {team.description || 'Manage who can see and change the work, and how this workspace is organised.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px]">
          <span className="chip bg-raised text-muted">{team.members.length === 1 ? '1 member' : `${team.members.length} members`}</span>
          <span className="chip bg-raised text-muted">{team.projects.length} projects</span>
          <span className="chip bg-raised text-muted">{team.labels.length} labels</span>
          <span className={`chip ${isOwner ? 'bg-accent/10 text-accent' : 'bg-raised text-muted'}`}>
            {roleMeta(team.role).label} access
          </span>
          {pendingCount > 0 && <span className="chip bg-amber-50 text-amber-600 dot-live">{pendingCount} waiting for approval</span>}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-1 rounded-xl border border-line bg-raised/60 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-all ${
              tab === id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${tab === id ? 'text-accent' : ''}`} /> {label}
            {id === 'requests' && pendingCount > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-[11px] text-amber-700">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {tab === 'members' && <Members team={team} me={user} isOwner={isOwner} reload={reloadTeam} toast={toast} />}
      {tab === 'requests' && <Requests team={team} isOwner={isOwner} reload={reloadTeam} toast={toast} onChange={setPendingCount} />}
      {tab === 'invites' && <Invites team={team} isOwner={isOwner} reload={reloadTeam} toast={toast} />}
      {tab === 'labels' && <Labels team={team} canEdit={canEdit} reload={reloadTeam} toast={toast} />}
      {tab === 'projects' && <Projects team={team} canEdit={canEdit} me={user} reload={reloadTeam} toast={toast} setActiveProject={setActiveProject} />}
    </div>
  )
}

function Members({ team, me, isOwner, reload, toast }) {
  const [q, setQ] = useState('')
  const [openMenu, setOpenMenu] = useState(null)

  const list = team.members.filter((m) => `${m.user.name} ${m.user.email}`.toLowerCase().includes(q.toLowerCase()))

  async function changeRole(userId, role) {
    try {
      await api(`/teams/${team.id}/members/${userId}`, { method: 'PATCH', body: { role } })
      toast('Role updated', { tone: 'success' })
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function remove(userId, name) {
    if (!confirm(`Remove ${name} from ${team.name}?`)) return
    try {
      await api(`/teams/${team.id}/members/${userId}`, { method: 'DELETE' })
      toast('Member removed')
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  return (
    <div>
      <div className="relative mb-3 max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" className="app-input h-9 pl-8 text-[13px]" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {list.map((m, i) => {
          const role = roleMeta(m.role)
          return (
            <div key={m.user.id} className="a-up group flex flex-wrap items-center gap-3 border-b border-line/70 px-4 py-3 last:border-0" style={{ animationDelay: `${i * 40}ms` }}>
              <Avatar user={m.user} size={36} presence={m.user.id !== me.id ? 'online' : undefined} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium">{m.user.name}</span>
                  {m.user.id === me.id && <span className="chip bg-accent/10 text-accent">you</span>}
                  {m.role === 'OWNER' && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-faint">
                  <Mail className="h-3 w-3" /> {m.user.email}
                  {m.user.title && <><span>·</span> {m.user.title}</>}
                </div>
              </div>

              {isOwner && m.user.id !== me.id ? (
                <select value={m.role} onChange={(e) => changeRole(m.user.id, e.target.value)} className="app-input h-8 w-auto text-[12.5px]" title={role.hint}>
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              ) : (
                <span className="chip bg-raised text-muted">{role.label}</span>
              )}

              {(isOwner && m.user.id !== me.id) || m.user.id === me.id ? (
                <button
                  onClick={() => remove(m.user.id, m.user.name)}
                  className="rounded-md p-1.5 text-faint opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title={m.user.id === me.id ? 'Leave workspace' : 'Remove member'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-faint">
        <Shield className="h-3.5 w-3.5" /> Owners approve join requests and manage roles. Members edit work. Viewers read only.
      </p>
    </div>
  )
}

function Requests({ team, isOwner, reload, toast, onChange }) {
  const [list, setList] = useState(team.joinRequests || [])
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    onChange?.(list.filter((r) => r.status === 'PENDING').length)
  }, [list, onChange])

  async function decide(request, action) {
    setBusy(request.id)
    try {
      await api(`/teams/${team.id}/requests/${request.id}`, { method: 'POST', body: { action } })
      setList((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: action === 'approve' ? 'APPROVED' : 'DENIED' } : r)))
      toast(action === 'approve' ? `${request.user.name} can now contribute` : 'Request declined', { tone: action === 'approve' ? 'success' : 'default' })
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface py-16 text-center">
        <span className="anim-float flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent"><UserPlus className="h-5 w-5" /></span>
        <p className="text-[14px] font-medium">No join requests</p>
        <p className="max-w-sm text-[13px] text-muted">Share an invite link and requests land here for approval before anyone gets access.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {list.map((r, i) => (
        <div key={r.id} className="a-up flex flex-wrap items-center gap-3 border-b border-line/70 px-4 py-3.5 last:border-0" style={{ animationDelay: `${i * 45}ms` }}>
          <Avatar user={r.user} size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-medium">{r.user.name}</div>
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <Mail className="h-3 w-3" /> {r.user.email}
              <span>·</span> requested {relativeTime(r.createdAt)}
            </div>
          </div>

          {r.status && r.status !== 'PENDING' ? (
            <span className={`chip ${r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-raised text-faint'}`}>
              {r.status === 'APPROVED' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {r.status.toLowerCase()}
            </span>
          ) : isOwner ? (
            <div className="flex items-center gap-2">
              <button
                disabled={busy === r.id}
                onClick={() => decide(r, 'approve')}
                className="app-btn app-btn-primary h-8 gap-1.5 px-3 text-[12.5px] disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                disabled={busy === r.id}
                onClick={() => decide(r, 'deny')}
                className="app-btn app-btn-ghost h-8 gap-1.5 px-3 text-[12.5px] text-red-500 hover:bg-red-50 disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" /> Decline
              </button>
            </div>
          ) : (
            <span className="chip bg-amber-50 text-amber-600">Waiting for the owner</span>
          )}
        </div>
      ))}
    </div>
  )
}

function Invites({ team, isOwner, reload, toast }) {
  const [form, setForm] = useState({ role: 'MEMBER', expiresInDays: 7, maxUses: '' })
  const [creating, setCreating] = useState(false)

  const invites = team.invites || []
  const baseCode = team.inviteCode

  function url(token) {
    return `${window.location.origin}/join/${token}`
  }

  async function copy(text, label) {
    const ok = await copyText(text)
    toast(ok ? `${label} copied` : 'Copy failed', { tone: ok ? 'success' : 'error' })
  }

  async function create(e) {
    e.preventDefault()
    setCreating(true)
    try {
      await api(`/teams/${team.id}/invites`, {
        method: 'POST',
        body: {
          role: form.role,
          expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : undefined,
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        },
      })
      toast('Invite link created', { tone: 'success' })
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setCreating(false)
    }
  }

  async function revoke(invite) {
    if (!confirm('Revoke this invite link?')) return
    try {
      await api(`/teams/${team.id}/invites/${invite.id}`, { method: 'DELETE' })
      toast('Invite revoked')
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="app-card grad-border p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Link2 className="h-4.5 w-4.5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold">Your workspace link</h2>
            <p className="mt-1 text-[13px] text-muted">
              Anyone with this link can ask to join. They see the workspace only after an owner approves the request.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-raised/60 px-3 py-2 font-mono text-[12px]">
                {url(baseCode)}
              </code>
              <button onClick={() => copy(url(baseCode), 'Invite link')} className="app-btn app-btn-primary h-9 gap-1.5 px-3.5 text-[12.5px]">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {isOwner && (
        <form onSubmit={create} className="app-card p-5">
          <h2 className="mb-4 text-[15px] font-semibold">Create a scoped invite</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Role on join</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="app-input h-10 text-[13.5px]">
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Expires in (days)</span>
              <input type="number" min="1" value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })} className="app-input h-10 text-[13.5px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Max uses</span>
              <input type="number" min="1" placeholder="Unlimited" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="app-input h-10 text-[13.5px]" />
            </label>
          </div>
          <button type="submit" disabled={creating} className="app-btn app-btn-primary mt-4 h-9 gap-1.5 px-4 text-[13px] disabled:opacity-60">
            <Plus className="h-3.5 w-3.5" /> Generate invite
          </button>
        </form>
      )}

      <div>
        <h2 className="mb-3 text-[15px] font-semibold">Invite links</h2>
        {invites.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface px-4 py-8 text-center text-[13px] text-faint">No scoped invites yet — the workspace link above always works.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {invites.map((inv, i) => {
              const expired = inv.expiresAt && new Date(inv.expiresAt) < new Date()
              const usedUp = inv.maxUses && inv.uses >= inv.maxUses
              return (
                <div key={inv.id} className="a-up flex flex-wrap items-center gap-3 border-b border-line/70 px-4 py-3 last:border-0" style={{ animationDelay: `${i * 40}ms` }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-raised text-muted"><Link2 className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[12px] text-muted">…/join/{inv.token}</div>
                    <div className="flex items-center gap-2 text-[11.5px] text-faint">
                      <span>role: {inv.role.toLowerCase()}</span>
                      <span>·</span>
                      <span>{inv.uses}{inv.maxUses ? `/${inv.maxUses}` : ''} uses</span>
                      {inv.expiresAt && <><span>·</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {expired ? 'expired' : `expires ${relativeTime(inv.expiresAt)}`}</span></>}
                      {inv.createdBy && <><span>·</span><span>by {inv.createdBy.name}</span></>}
                    </div>
                  </div>
                  {(expired || usedUp) && <span className="chip bg-raised text-faint">{expired ? 'expired' : 'used up'}</span>}
                  <button onClick={() => copy(url(inv.token), 'Invite link')} className="app-btn app-btn-ghost h-8 w-8 justify-center p-0" title="Copy link">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {isOwner && (
                    <button onClick={() => revoke(inv)} className="app-btn app-btn-ghost h-8 w-8 justify-center p-0 text-red-500 hover:bg-red-50" title="Revoke">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Labels({ team, canEdit, reload, toast }) {
  const [draft, setDraft] = useState({ name: '', color: PALETTE[6] })
  const [editing, setEditing] = useState(null)

  async function create(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    try {
      await api('/labels', { method: 'POST', body: { name: draft.name, color: draft.color, teamId: team.id } })
      setDraft({ name: '', color: PALETTE[6] })
      toast('Label created', { tone: 'success' })
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function update(label, patch) {
    try {
      await api(`/labels/${label.id}`, { method: 'PATCH', body: patch })
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function remove(label) {
    if (!confirm(`Delete the "${label.name}" label? It is removed from every issue.`)) return
    try {
      await api(`/labels/${label.id}`, { method: 'DELETE' })
      toast('Label deleted')
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {canEdit && (
        <form onSubmit={create} className="app-card p-5">
          <h2 className="mb-4 text-[15px] font-semibold">New label</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Name</span>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Performance" className="app-input h-10 text-[13.5px]" />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Colour</span>
              <div className="flex items-center gap-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDraft({ ...draft, color: c })}
                    className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${draft.color === c ? 'ring-2 ring-offset-2 ring-accent' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="app-btn app-btn-primary h-10 gap-1.5 px-4 text-[13px]"><Plus className="h-4 w-4" /> Add</button>
          </div>
        </form>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2">
        {team.labels.map((l, i) => (
          <div key={l.id} className="a-up flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3" style={{ animationDelay: `${i * 40}ms` }}>
            <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: l.color }} />
            {editing === l.id ? (
              <input
                autoFocus
                defaultValue={l.name}
                onBlur={(e) => { update(l, { name: e.target.value }); setEditing(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { update(l, { name: e.target.value }); setEditing(null) } }}
                className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none"
              />
            ) : (
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{l.name}</span>
            )}
            <span className="text-[11.5px] text-faint">{l._count?.issues ?? 0} issues</span>
            {canEdit && (
              <>
                <div className="hidden items-center gap-1 sm:flex">
                  {PALETTE.slice(0, 6).map((c) => (
                    <button key={c} onClick={() => update(l, { color: c })} className="h-4 w-4 rounded-full transition-transform hover:scale-125" style={{ background: c }} />
                  ))}
                </div>
                <button onClick={() => setEditing(l.id)} className="rounded p-1 text-faint hover:text-fg" title="Rename"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(l)} className="rounded p-1 text-faint hover:text-red-500" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Projects({ team, canEdit, me, reload, toast, setActiveProject }) {
  const [draft, setDraft] = useState({ name: '', key: '', color: PALETTE[6] })
  const [creating, setCreating] = useState(false)

  async function create(e) {
    e.preventDefault()
    if (!draft.name.trim() || !draft.key.trim()) return
    setCreating(true)
    try {
      const project = await api('/projects', { method: 'POST', body: { teamId: team.id, name: draft.name, key: draft.key, color: draft.color } })
      setDraft({ name: '', key: '', color: PALETTE[6] })
      toast(`${project.name} created`, { tone: 'success' })
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setCreating(false)
    }
  }

  async function update(project, patch) {
    try {
      await api(`/projects/${project.id}`, { method: 'PATCH', body: patch })
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function remove(project) {
    if (!confirm(`Delete ${project.name} and all of its issues? This cannot be undone.`)) return
    try {
      await api(`/projects/${project.id}`, { method: 'DELETE' })
      toast('Project deleted')
      reload()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {canEdit && (
        <form onSubmit={create} className="app-card p-5">
          <h2 className="mb-4 text-[15px] font-semibold">New project</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[160px] flex-1 flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Name</span>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Mobile app" className="app-input h-10 text-[13.5px]" />
            </label>
            <label className="flex w-[110px] flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Key</span>
              <input value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value.toUpperCase().slice(0, 6) })} placeholder="MOB" className="app-input h-10 font-mono text-[13.5px] uppercase" />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Colour</span>
              <div className="flex items-center gap-1.5">
                {PALETTE.map((c) => (
                  <button key={c} type="button" onClick={() => setDraft({ ...draft, color: c })} className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${draft.color === c ? 'ring-2 ring-offset-2 ring-accent' : ''}`} style={{ background: c }} />
                ))}
              </div>
            </div>
            <button type="submit" disabled={creating} className="app-btn app-btn-primary h-10 gap-1.5 px-4 text-[13px] disabled:opacity-60"><Plus className="h-4 w-4" /> Create</button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {team.projects.map((p, i) => (
          <div key={p.id} className={`a-up app-card p-4 ${p.archived ? 'opacity-60' : ''}`} style={{ animationDelay: `${i * 45}ms` }}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white" style={{ background: p.color }}>
                {p.key.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-semibold">{p.name}</span>
                  {p.archived && <span className="chip bg-raised text-faint">archived</span>}
                </div>
                <div className="font-mono text-[11.5px] text-faint">{p.key}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setActiveProject(p.id); toast(`Board switched to ${p.name}`) }} className="app-btn app-btn-ghost h-8 px-2.5 text-[11.5px]">Open</button>
                {canEdit && (
                  <>
                    <button onClick={() => update(p, { archived: !p.archived })} className="rounded p-1.5 text-faint hover:text-fg" title={p.archived ? 'Restore' : 'Archive'}>
                      {p.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => remove(p)} className="rounded p-1.5 text-faint hover:text-red-500" title="Delete project"><Trash2 className="h-3.5 w-3.5" /></button>
                  </>
                )}
              </div>
            </div>
            {canEdit && (
              <div className="mt-3 flex items-center gap-1.5">
                {PALETTE.map((c) => (
                  <button key={c} onClick={() => update(p, { color: c })} className={`h-4 w-4 rounded-full transition-transform hover:scale-125 ${p.color === c ? 'ring-2 ring-offset-1 ring-accent' : ''}`} style={{ background: c }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
