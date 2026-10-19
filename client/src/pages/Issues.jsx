import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Plus, Check, Trash2, X, ChevronDown, ChevronRight, MessageSquare, CircleDot,
  CornerDownRight, ArrowUpDown, Keyboard,
} from 'lucide-react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useUI } from '../store/ui'
import { useAuth } from '../store/auth'
import { useIssueFilters, applyClientFilters } from '../lib/useIssueFilters'
import { STATUSES, PRIORITIES, statusMeta, priorityMeta, dueMeta } from '../lib/constants'
import { issueKey, sum } from '../lib/utils'
import FilterBar from '../components/FilterBar'
import Avatar from '../components/Avatar'
import ViewTabs from '../components/ViewTabs'

export default function Issues() {
  const { team, newIssue, openIssue } = useOutletContext()
  const { user } = useAuth()
  const { toast, activeProjectId } = useUI()
  const [filters, setFilters] = useIssueFilters(activeProjectId ? { project: [activeProjectId], group: 'status' } : { group: 'status' })
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [collapsed, setCollapsed] = useState({})
  const [focusIndex, setFocusIndex] = useState(-1)
  const listRef = useRef(null)

  const load = useCallback(async () => {
    if (!team) return
    try {
      const data = await api(`/issues?teamId=${team.id}&limit=500`)
      setIssues(data.issues)
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }, [team, toast])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const refresh = () => load()
    socket.on('issue:created', refresh)
    socket.on('issue:updated', refresh)
    socket.on('issue:deleted', refresh)
    socket.on('issues:changed', refresh)
    return () => {
      socket.off('issue:created', refresh)
      socket.off('issue:updated', refresh)
      socket.off('issue:deleted', refresh)
      socket.off('issues:changed', refresh)
    }
  }, [load])

  const filtered = useMemo(() => applyClientFilters(issues, filters, user.id), [issues, filters, user.id])
  const groups = useMemo(() => buildGroups(filters.group, team, filtered), [filters.group, team, filtered])
  const flat = useMemo(() => groups.flatMap((g) => g.issues), [groups])

  useEffect(() => {
    const list = filters.project || []
    if (!list.length || !team?.projects) return
    const ids = team.projects.map((p) => p.id)
    const live = list.filter((id) => ids.includes(id))
    if (live.length !== list.length) setFilters({ ...filters, project: live })
  }, [team, filters, setFilters])

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault()
        setFocusIndex((i) => {
          const next = e.key === 'j' ? Math.min(i + 1, flat.length - 1) : Math.max(i - 1, 0)
          listRef.current?.querySelector(`[data-row="${flat[next]?.id}"]`)?.scrollIntoView({ block: 'nearest' })
          return next
        })
      }
      if (e.key === 'Enter' && flat[focusIndex]) openIssue(flat[focusIndex].id)
      if (e.key === 'x' && flat[focusIndex]) toggleSelect(flat[focusIndex].id, {})
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)

  }, [flat, focusIndex, openIssue])

  function toggleSelect(id, e) {
    if (e?.shiftKey && selected.length) {
      const ids = flat.map((i) => i.id)
      const last = ids.indexOf(selected[selected.length - 1])
      const current = ids.indexOf(id)
      const [from, to] = last < current ? [last, current] : [current, last]
      setSelected(ids.slice(from, to + 1))
      return
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function patchIssue(id, patch) {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
    try {
      await api(`/issues/${id}`, { method: 'PATCH', body: patch })
    } catch (err) {
      toast(err.message, { tone: 'error' })
      load()
    }
  }

  async function bulk(patch) {
    try {
      await api('/issues/bulk', { method: 'PATCH', body: { ids: selected, patch } })
      setSelected([])
      load()
      toast('Updated')
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.length} issue(s)?`)) return
    try {
      await api('/issues/bulk', { method: 'DELETE', body: { ids: selected } })
      setSelected([])
      load()
      toast('Deleted')
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function saveView() {
    const name = prompt('Name this view', 'My issues')
    if (!name) return
    try {
      await api('/users/me/views', { method: 'POST', body: { name, icon: 'list', teamId: team.id, config: filters } })
      toast('View saved to sidebar', { tone: 'success' })
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  if (!team) return <div className="p-6"><div className="h-10 w-64 rounded-xl skeleton" /></div>

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line bg-surface/80 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <ViewTabs />
          <span className="hidden items-center gap-1.5 text-[12px] text-faint md:flex">
            <Keyboard className="h-3.5 w-3.5" /> j / k to move, Enter to open, x to select
          </span>
          <button onClick={() => newIssue({ projectId: filters.project?.[0] || activeProjectId })} className="ml-auto app-btn app-btn-primary h-9 gap-1.5 px-3.5 text-[12.5px] press">
            <Plus className="h-3.5 w-3.5" /> New issue
          </button>
        </div>
        <div className="mt-3">
          <FilterBar filters={filters} onChange={setFilters} team={team} onSaveView={saveView} onExport={() => exportCsv(filtered, team)} />
        </div>
      </div>

      {selected.length > 0 && (
        <div className="a-down flex flex-wrap items-center gap-2 border-b border-line bg-accent/5 px-4 py-2 md:px-6">
          <span className="chip bg-accent/10 text-accent">{selected.length} selected</span>
          <select onChange={(e) => e.target.value && bulk({ status: e.target.value })} defaultValue="" className="app-input h-8 w-auto text-[12.5px]">
            <option value="">Status…</option>
            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select onChange={(e) => e.target.value && bulk({ priority: e.target.value })} defaultValue="" className="app-input h-8 w-auto text-[12.5px]">
            <option value="">Priority…</option>
            {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <select onChange={(e) => e.target.value && bulk({ assigneeId: e.target.value === 'none' ? null : e.target.value })} defaultValue="" className="app-input h-8 w-auto text-[12.5px]">
            <option value="">Assignee…</option>
            <option value="none">Unassigned</option>
            {team.members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
          </select>
          <button onClick={bulkDelete} className="app-btn h-8 gap-1.5 px-3 text-[12.5px] text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <button onClick={() => setSelected([])} className="ml-auto app-btn app-btn-ghost h-8 px-3 text-[12.5px]">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      <div ref={listRef} className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-11 rounded-xl skeleton" style={{ animationDelay: `${i * 60}ms` }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <Empty onNew={() => newIssue({ projectId: filters.project?.[0] || activeProjectId })} />
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map((group, gi) => (
              <section key={group.id} className="a-up" style={{ animationDelay: `${gi * 60}ms` }}>
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [group.id]: !c[group.id] }))}
                  className="sticky top-0 z-10 flex w-full items-center gap-2 rounded-lg bg-bg/90 px-1 py-2 backdrop-blur"
                >
                  {collapsed[group.id] ? <ChevronRight className="h-3.5 w-3.5 text-faint" /> : <ChevronDown className="h-3.5 w-3.5 text-faint" />}
                  {group.dot && <span className="h-2.5 w-2.5 rounded-full" style={{ background: group.dot }} />}
                  {group.avatar && <Avatar user={group.avatar} size={18} />}
                  <span className="text-[13px] font-semibold">{group.label}</span>
                  <span className="rounded-full bg-raised px-1.5 py-0.5 text-[11px] text-faint">{group.issues.length}</span>
                  {group.points > 0 && <span className="text-[11px] text-faint">{group.points} pts</span>}
                  <span className="ml-auto text-[11px] text-faint">
                    <ArrowUpDown className="inline h-3 w-3" /> {group.issues.length ? 'by ' + filters.sort : ''}
                  </span>
                </button>

                {!collapsed[group.id] && (
                  <div className="mt-1 overflow-hidden rounded-xl border border-line bg-surface">
                    {group.issues.map((issue, ii) => {
                      const p = priorityMeta(issue.priority)
                      const s = statusMeta(issue.status)
                      const due = dueMeta(issue.dueDate, issue.status)
                      const focused = flat[focusIndex]?.id === issue.id
                      return (
                        <div
                          key={issue.id}
                          data-row={issue.id}
                          onClick={() => openIssue(issue.id)}
                          className={`group flex cursor-pointer items-center gap-3 border-b border-line/70 px-3 py-2.5 text-[13.5px] transition-colors last:border-0 hover:bg-raised/60 ${
                            selected.includes(issue.id) ? 'bg-accent/5' : ''
                          } ${focused ? 'ring-1 ring-inset ring-accent/40' : ''}`}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSelect(issue.id, e) }}
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                              selected.includes(issue.id) ? 'border-accent bg-accent text-white' : 'border-line opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {selected.includes(issue.id) && <Check className="h-3 w-3" />}
                          </button>

                          <span className="w-[64px] shrink-0 font-mono text-[11px] text-faint">{issueKey(issue)}</span>
                          <span className="shrink-0" title={p.label}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <rect x="1" y="1" width="10" height="10" rx="3" stroke={p.color} strokeWidth="1.4" fill={`${p.color}22`} />
                              {issue.priority !== 'NONE' && <rect x="3.2" y="5.2" width="5.6" height="1.6" rx="0.8" fill={p.color} />}
                            </svg>
                          </span>

                          <span className="min-w-0 flex-1 truncate font-medium">{issue.title}</span>

                          {issue.labels.slice(0, 2).map((l) => (
                            <span key={l.labelId} className="chip hidden text-[10.5px] lg:inline-flex" style={{ background: `${l.label.color}16`, color: l.label.color }}>
                              {l.label.name}
                            </span>
                          ))}

                          {issue._count?.children > 0 && (
                            <span className="hidden items-center gap-0.5 text-[11px] text-faint sm:flex">
                              <CornerDownRight className="h-3 w-3" /> {issue._count.children}
                            </span>
                          )}
                          {issue._count?.comments > 0 && (
                            <span className="hidden items-center gap-0.5 text-[11px] text-faint sm:flex">
                              <MessageSquare className="h-3 w-3" /> {issue._count.comments}
                            </span>
                          )}
                          {issue.estimate != null && <span className="hidden rounded bg-raised px-1 py-0.5 text-[11px] text-faint md:inline">{issue.estimate}</span>}
                          {due && (
                            <span className={`hidden w-[74px] shrink-0 text-right text-[11.5px] md:inline ${due.tone === 'overdue' ? 'font-medium text-red-500' : due.tone === 'soon' || due.tone === 'today' ? 'text-amber-600' : 'text-faint'}`}>
                              {due.label}
                            </span>
                          )}

                          <select
                            onClick={(e) => e.stopPropagation()}
                            value={issue.status}
                            onChange={(e) => patchIssue(issue.id, { status: e.target.value })}
                            className="hidden h-7 w-auto shrink-0 rounded-lg border border-line bg-surface px-1.5 text-[11.5px] md:block"
                            style={{ color: s.color }}
                          >
                            {STATUSES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
                          </select>

                          <Avatar user={issue.assignee} size={22} className="shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function buildGroups(group, team, issues) {
  const make = (id, label, extra) => {
    const list = issues.filter((i) => matches(i, group, id))
    return { id, label, issues: list, points: sum(list, (i) => i.estimate), ...extra }
  }
  if (group === 'priority') return PRIORITIES.map((p) => make(p.id, p.label, { dot: p.color }))
  if (group === 'assignee') {
    const cols = [make('__unassigned', 'Unassigned')]
    for (const m of team?.members || []) cols.push(make(m.user.id, m.user.name, { avatar: m.user }))
    return cols.filter((c) => c.issues.length || c.id === '__unassigned')
  }
  if (group === 'project') return (team?.projects || []).map((p) => make(p.id, p.name, { dot: p.color }))
  if (group === 'label') {
    const cols = (team?.labels || []).map((l) => make(l.id, l.name, { dot: l.color }))
    cols.push(make('__none', 'No label'))
    return cols
  }
  if (group === 'none') return [{ id: 'all', label: 'All issues', issues, points: sum(issues, (i) => i.estimate) }]
  return STATUSES.map((s) => make(s.id, s.label, { dot: s.color }))
}

function matches(issue, group, id) {
  if (group === 'priority') return issue.priority === id
  if (group === 'assignee') return (issue.assigneeId || '__unassigned') === id
  if (group === 'project') return issue.projectId === id
  if (group === 'label') return id === '__none' ? issue.labels.length === 0 : issue.labels.some((l) => l.labelId === id)
  return issue.status === id
}

function Empty({ onNew }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="anim-float flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <CircleDot className="h-5 w-5" />
      </span>
      <p className="text-[14px] font-medium">No issues match these filters</p>
      <p className="max-w-xs text-[13px] text-muted">Clear a filter, or start something new — press <span className="kbd">c</span> anywhere.</p>
      <button onClick={onNew} className="app-btn app-btn-primary mt-1 h-9 gap-1.5 px-4 text-[12.5px]">
        <Plus className="h-3.5 w-3.5" /> New issue
      </button>
    </div>
  )
}

function exportCsv(issues, team) {
  const rows = [
    ['Key', 'Title', 'Status', 'Priority', 'Assignee', 'Estimate', 'Due', 'Labels'],
    ...issues.map((i) => [
      issueKey(i), i.title, i.status, i.priority, i.assignee?.name || '',
      i.estimate ?? '', i.dueDate ? new Date(i.dueDate).toISOString().slice(0, 10) : '',
      i.labels.map((l) => l.label.name).join(' '),
    ]),
  ]
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${team.slug}-issues.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
