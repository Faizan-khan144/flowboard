import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  Plus, MoreHorizontal, CircleDot, MessageSquare, Layers, LayoutGrid, List, Timer, TrendingUp,
  Check, Trash2, X, SlidersHorizontal, GripVertical, Sparkles, CornerDownRight, Ban, Repeat,
} from 'lucide-react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useUI } from '../store/ui'
import { useAuth } from '../store/auth'
import { useIssueFilters, applyClientFilters } from '../lib/useIssueFilters'
import { STATUSES, PRIORITIES, statusMeta, priorityMeta, dueMeta } from '../lib/constants'
import { issueKey, sum, modKey } from '../lib/utils'
import FilterBar from '../components/FilterBar'
import Avatar from '../components/Avatar'
import ViewTabs from '../components/ViewTabs'

export default function Board() {
  const { team, reloadTeam, newIssue, openIssue } = useOutletContext()
  const { user } = useAuth()
  const { toast, activeProjectId, setActiveProject } = useUI()
  const navigate = useNavigate()
  const [filters, setFilters] = useIssueFilters(activeProjectId ? { project: [activeProjectId] } : {})
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [adding, setAdding] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [display, setDisplay] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fb_board_display')) || {}
    } catch {
      return {}
    }
  })
  const [displayOpen, setDisplayOpen] = useState(false)
  const dragCounter = useRef({})

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

  useEffect(() => {
    localStorage.setItem('fb_board_display', JSON.stringify(display))
  }, [display])

  useEffect(() => {
    const list = filters.project || []
    if (!list.length || !team?.projects) return
    const ids = team.projects.map((p) => p.id)
    const live = list.filter((id) => ids.includes(id))
    if (live.length !== list.length) setFilters({ ...filters, project: live })
  }, [team, filters, setFilters])

  const filtered = useMemo(() => applyClientFilters(issues, filters, user.id), [issues, filters, user.id])

  const group = filters.group && filters.group !== 'none' ? filters.group : 'status'
  const columns = useMemo(() => buildColumns(group, team, filtered), [group, team, filtered])

  const isDropValid = group === 'status' || group === 'priority' || group === 'assignee'

  async function moveIssue(issueId, columnId) {
    const patch =
      group === 'status' ? { status: columnId }
        : group === 'priority' ? { priority: columnId }
          : { assigneeId: columnId === 'none' ? null : columnId }
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, ...patch } : i)))
    try {
      await api(`/issues/${issueId}`, { method: 'PATCH', body: patch })
    } catch (err) {
      toast(err.message, { tone: 'error' })
      load()
    }
  }

  async function quickAdd(columnId, title) {
    const projectId = filters.project?.[0] || activeProjectId || team.projects[0]?.id
    if (!projectId) return toast('Create a project first', { tone: 'error' })
    try {
      const created = await api('/issues', {
        method: 'POST',
        body: {
          projectId,
          title,
          ...(group === 'status' ? { status: columnId } : {}),
          ...(group === 'priority' ? { priority: columnId } : {}),
          ...(group === 'assignee' && columnId !== 'none' ? { assigneeId: columnId } : {}),
        },
      })
      setIssues((prev) => [created, ...prev])
      toast('Issue created', { tone: 'success' })
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  function toggleSelect(id, e) {
    if (e.shiftKey && selected.length) {
      const ids = filtered.map((i) => i.id)
      const last = ids.indexOf(selected[selected.length - 1])
      const current = ids.indexOf(id)
      const [from, to] = last < current ? [last, current] : [current, last]
      setSelected(ids.slice(from, to + 1))
      return
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
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
    const name = prompt('Name this view', `${filters.project?.[0] ? team.projects.find((p) => p.id === filters.project[0])?.name : 'All issues'} board`)
    if (!name) return
    try {
      await api('/users/me/views', { method: 'POST', body: { name, icon: 'board', teamId: team.id, config: filters } })
      toast('View saved to sidebar', { tone: 'success' })
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  if (!team) return <BoardSkeleton />

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line bg-surface/80 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <ViewTabs />
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setDisplayOpen((v) => !v)} className="app-btn app-btn-ghost h-9 gap-1.5 px-3 text-[12.5px]">
                <SlidersHorizontal className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Display</span>
              </button>
              {displayOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setDisplayOpen(false)} />
                  <div className="dropdown-in absolute right-0 top-11 z-40 w-[220px] rounded-xl border border-line bg-white p-1.5 shadow-2xl">
                    {[
                      ['labels', 'Labels'],
                      ['due', 'Due date'],
                      ['estimate', 'Estimate'],
                      ['assignee', 'Assignee'],
                      ['comments', 'Comment count'],
                      ['project', 'Project badge'],
                    ].map(([key, label]) => {
                      const on = display[key] !== false
                      return (
                        <button
                          key={key}
                          onClick={() => setDisplay((d) => ({ ...d, [key]: !on }))}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-muted hover:bg-raised hover:text-fg"
                        >
                          <span className={`flex h-4 w-4 items-center justify-center rounded border ${on ? 'border-accent bg-accent text-white' : 'border-line'}`}>
                            {on && <Check className="h-3 w-3" />}
                          </span>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
            <button onClick={() => newIssue({ projectId: filters.project?.[0] || activeProjectId })} className="app-btn app-btn-primary h-9 gap-1.5 px-3.5 text-[12.5px] press">
              <Plus className="h-3.5 w-3.5" /> New issue
            </button>
          </div>
        </div>
        <div className="mt-3">
          <FilterBar filters={filters} onChange={setFilters} team={team} onSaveView={saveView} compact
            onExport={() => exportCsv(filtered, team)} />
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

      <div className="thin-scroll min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-4 py-4 md:px-6">
        {loading ? (
          <BoardSkeleton inline />
        ) : (
          <div className="flex h-full gap-3.5">
            {columns.map((col, ci) => (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.id) }}
                onDragLeave={() => { dragCounter.current[col.id] = (dragCounter.current[col.id] || 0) - 1; if (dragCounter.current[col.id] <= 0) setDragOver((c) => (c === col.id ? null : c)) }}
                onDragEnter={() => { dragCounter.current[col.id] = (dragCounter.current[col.id] || 0) + 1 }}
                onDrop={(e) => {
                  e.preventDefault()
                  dragCounter.current[col.id] = 0
                  setDragOver(null)
                  const id = dragId || e.dataTransfer.getData('text/plain')
                  if (id && isDropValid) moveIssue(id, col.id)
                }}
                className={`a-up flex h-full w-[300px] shrink-0 flex-col rounded-2xl border bg-raised/40 transition-colors ${
                  dragOver === col.id && isDropValid ? 'border-accent/60 bg-accent/5' : 'border-line'
                }`}
                style={{ animationDelay: `${ci * 55}ms` }}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                    {col.dot && <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.dot }} />}
                    {col.icon && <col.icon className="h-3.5 w-3.5 text-muted" />}
                    {col.avatar && <Avatar user={col.avatar} size={18} />}
                    {col.label}
                  </span>
                  <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] text-faint">{col.issues.length}</span>
                  {col.points > 0 && <span className="text-[11px] text-faint">{col.points} pts</span>}
                  <div className="ml-auto flex items-center gap-0.5">
                    <button onClick={() => setAdding(adding === col.id ? null : col.id)} className="rounded-md p-1 text-faint hover:bg-surface hover:text-fg" title="Quick add">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    {col.id === 'DONE' && col.issues.length > 0 && (
                      <button
                        onClick={async () => {
                          const ids = col.issues.map((i) => i.id)
                          setSelected(ids)
                          toast(`${ids.length} done issues selected`)
                        }}
                        className="rounded-md p-1 text-faint hover:bg-surface hover:text-fg"
                        title="Select all done"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                  {adding === col.id && (
                    <QuickAdd
                      onCancel={() => setAdding(null)}
                      onSubmit={(title) => { quickAdd(col.id, title); setAdding(null) }}
                    />
                  )}
                  {col.issues.map((issue) => (
                    <Card
                      key={issue.id}
                      issue={issue}
                      display={display}
                      group={group}
                      selectable={isDropValid}
                      selected={selected.includes(issue.id)}
                      onSelect={(e) => toggleSelect(issue.id, e)}
                      onOpen={() => openIssue(issue.id)}
                      onDragStart={(e) => { setDragId(issue.id); e.dataTransfer.setData('text/plain', issue.id); e.dataTransfer.effectAllowed = 'move' }}
                      onDragEnd={() => { setDragId(null); setDragOver(null) }}
                      onStatus={(status) => moveIssue(issue.id, status)}
                    />
                  ))}
                  {col.issues.length === 0 && adding !== col.id && (
                    <button onClick={() => setAdding(col.id)} className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-line/80 px-3 py-6 text-[12.5px] text-faint transition-colors hover:border-accent/40 hover:text-accent">
                      <Plus className="h-4 w-4" /> Add issue
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function buildColumns(group, team, issues) {
  const make = (id, label, extra) => {
    const list = issues.filter((i) => matchesGroup(i, group, id))
    return { id, label, issues: list, points: sum(list, (i) => i.estimate), ...extra }
  }
  if (group === 'priority') {
    return PRIORITIES.map((p) => make(p.id, p.label, { dot: p.color }))
  }
  if (group === 'assignee') {
    const cols = [make('none', 'Unassigned')]
    for (const m of team?.members || []) cols.push(make(m.user.id, m.user.name, { avatar: m.user }))
    return cols.filter((c) => c.issues.length || c.id === 'none')
  }
  if (group === 'project') {
    return (team?.projects || []).map((p) => make(p.id, p.name, { dot: p.color }))
  }
  if (group === 'label') {
    const cols = (team?.labels || []).map((l) => make(l.id, l.name, { dot: l.color }))
    cols.push(make('__none', 'No label'))
    return cols
  }
  return STATUSES.map((s) => make(s.id, s.label, { dot: s.color }))
}

function matchesGroup(issue, group, id) {
  if (group === 'priority') return issue.priority === id
  if (group === 'assignee') return (issue.assigneeId || 'none') === id
  if (group === 'project') return issue.projectId === id
  if (group === 'label') return id === '__none' ? issue.labels.length === 0 : issue.labels.some((l) => l.labelId === id)
  return issue.status === id
}

function Card({ issue, display, group, selected, onSelect, onOpen, onDragStart, onDragEnd, onStatus, selectable }) {
  const p = priorityMeta(issue.priority)
  const s = statusMeta(issue.status)
  const due = dueMeta(issue.dueDate, issue.status)
  const isDragging = false

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => { if (e.target.closest('[data-noselect]')) return; onOpen() }}
      className={`group card-hover relative cursor-pointer rounded-xl border bg-surface p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md ${
        selected ? 'border-accent/60 ring-2 ring-accent/20' : 'border-line'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        {selectable && (
          <button
            data-noselect
            onClick={onSelect}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
              selected ? 'border-accent bg-accent text-white' : 'border-line opacity-0 group-hover:opacity-100'
            }`}
          >
            {selected && <Check className="h-3 w-3" />}
          </button>
        )}
        <span className="font-mono text-[10.5px] text-faint">{issueKey(issue)}</span>
        {display.project !== false && (
          <span className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px]" style={{ background: `${issue.project.color}14`, color: issue.project.color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: issue.project.color }} />
            {issue.project.name}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1" data-noselect>
          <GripVertical className="h-3.5 w-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </div>

      <p className="line-clamp-2 text-[13.5px] font-medium leading-snug">{issue.title}</p>

      {display.labels !== false && issue.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {issue.labels.slice(0, 3).map((l) => (
            <span key={l.labelId} className="chip text-[10.5px]" style={{ background: `${l.label.color}16`, color: l.label.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.label.color }} />
              {l.label.name}
            </span>
          ))}
          {issue.labels.length > 3 && <span className="chip text-[10.5px] text-faint">+{issue.labels.length - 3}</span>}
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-2.5 text-[11px] text-faint">
        <span className="flex items-center gap-1 font-semibold" style={{ color: p.color }} title={p.label}>
          <PriorityGlyph priority={issue.priority} color={p.color} />
        </span>
        {group !== 'status' && (
          <span className="flex items-center gap-1" title={s.label} style={{ color: s.color }}>
            <CircleDot className="h-3 w-3" />
          </span>
        )}
        {display.due !== false && due && (
          <span className={due.tone === 'overdue' ? 'font-medium text-red-500' : due.tone === 'soon' || due.tone === 'today' ? 'text-amber-600' : ''}>
            {due.label}
          </span>
        )}
        {display.estimate !== false && issue.estimate != null && <span className="rounded bg-raised px-1 py-0.5">{issue.estimate}</span>}
        {display.comments !== false && issue._count?.comments > 0 && (
          <span className="flex items-center gap-0.5">
            <MessageSquare className="h-3 w-3" /> {issue._count.comments}
          </span>
        )}
        {issue._count?.children > 0 && (
          <span className="flex items-center gap-0.5">
            <CornerDownRight className="h-3 w-3" /> {issue._count.children}
          </span>
        )}
        {display.assignee !== false && issue.assignee && <Avatar user={issue.assignee} size={18} className="ml-auto" />}
      </div>
    </div>
  )
}

function PriorityGlyph({ priority, color }) {
  if (priority === 'NONE') return <span className="text-[13px] leading-none text-faint">—</span>
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="1" width="10" height="10" rx="3" stroke={color} strokeWidth="1.4" fill={`${color}22`} />
      <rect x="3.2" y="5.2" width="5.6" height="1.6" rx="0.8" fill={color} />
    </svg>
  )
}

function QuickAdd({ onSubmit, onCancel }) {
  const [value, setValue] = useState('')
  return (
    <div className="dropdown-in rounded-xl border border-accent/40 bg-surface p-2 shadow-lg">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) { onSubmit(value.trim()); setValue('') }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Issue title…"
        className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint"
      />
      <div className="mt-2 flex items-center gap-1.5">
        <button onClick={() => value.trim() && onSubmit(value.trim())} className="app-btn app-btn-primary h-7 px-2.5 text-[12px]">Create</button>
        <button onClick={onCancel} className="app-btn app-btn-ghost h-7 px-2.5 text-[12px]">Cancel</button>
        <span className="ml-auto text-[10.5px] text-faint">{modKey()}↵</span>
      </div>
    </div>
  )
}

function BoardSkeleton({ inline }) {
  const cols = [0, 1, 2, 3]
  return (
    <div className={inline ? 'flex gap-3.5' : 'flex gap-3.5 p-6'}>
      {cols.map((c) => (
        <div key={c} className="w-[300px] shrink-0 rounded-2xl border border-line bg-raised/40 p-3">
          <div className="mb-3 h-4 w-24 rounded skeleton" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="mb-2 h-20 rounded-xl skeleton" style={{ animationDelay: `${i * 90}ms` }} />
          ))}
        </div>
      ))}
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
