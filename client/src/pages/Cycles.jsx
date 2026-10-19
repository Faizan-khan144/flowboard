import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Plus, Timer, RefreshCw, Trash2, ChevronDown, ChevronRight, Check, Search, Play, Pause,
  CalendarDays, CircleDot, Repeat, X, Sparkles,
} from 'lucide-react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useUI } from '../store/ui'
import { STATUSES, statusMeta, priorityMeta, shortDate } from '../lib/constants'
import { issueKey, daysBetween } from '../lib/utils'
import ProgressRing from '../components/ProgressRing'

export default function Cycles() {
  const { team, openIssue } = useOutletContext()
  const { toast, activeProjectId, setActiveProject } = useUI()
  const [projectId, setProjectId] = useState(activeProjectId || team?.projects?.find((p) => !p.archived)?.id || '')
  const [cycles, setCycles] = useState([])
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [creating, setCreating] = useState(false)
  const [picker, setPicker] = useState(null)
  const [draft, setDraft] = useState(() => defaultDraft())

  function defaultDraft() {
    const start = new Date()
    const end = new Date(Date.now() + 14 * 864e5)
    return { name: '', startsAt: start.toISOString().slice(0, 10), endsAt: end.toISOString().slice(0, 10) }
  }

  const activeProjects = useMemo(() => (team?.projects || []).filter((p) => !p.archived), [team])

  async function load() {
    if (!team || !projectId) return
    try {
      const [c, i] = await Promise.all([
        api(`/cycles/project/${projectId}`),
        api(`/issues?teamId=${team.id}&limit=500`),
      ])
      setCycles(c)
      setIssues(i.issues)
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setExpanded(null)
    load()

  }, [projectId, team])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const refresh = () => load()
    socket.on('cycle:changed', refresh)
    socket.on('issues:changed', refresh)
    socket.on('issue:updated', refresh)
    socket.on('issue:created', refresh)
    return () => {
      socket.off('cycle:changed', refresh)
      socket.off('issues:changed', refresh)
      socket.off('issue:updated', refresh)
      socket.off('issue:created', refresh)
    }
  }, [team, projectId])

  useEffect(() => {
    if (projectId) setActiveProject(projectId)
  }, [projectId, setActiveProject])

  const projectIssues = useMemo(() => issues.filter((i) => i.projectId === projectId), [issues, projectId])
  const detail = useMemo(() => new Map(projectIssues.map((i) => [i.id, i])), [projectIssues])
  const uncycled = useMemo(() => projectIssues.filter((i) => !i.cycleId && i.status !== 'CANCELED'), [projectIssues])

  const current = cycles.find((c) => new Date(c.startsAt) <= new Date() && new Date(c.endsAt) >= new Date())

  async function createCycle(e) {
    e.preventDefault()
    try {
      await api('/cycles', { method: 'POST', body: { projectId, name: draft.name, startsAt: draft.startsAt, endsAt: draft.endsAt } })
      setCreating(false)
      setDraft(defaultDraft())
      toast('Cycle created', { tone: 'success' })
      load()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function addIssues(cycleId, ids) {
    try {
      await api(`/cycles/${cycleId}/issues`, { method: 'POST', body: { issueIds: ids } })
      setPicker(null)
      load()
      toast(`${ids.length} issue${ids.length === 1 ? '' : 's'} added`)
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function removeIssue(cycleId, issueId) {
    try {
      await api(`/cycles/${cycleId}/issues/${issueId}`, { method: 'DELETE' })
      load()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function rollover(cycle) {
    if (!confirm(`Move unfinished work out of ${cycle.name} into the next cycle?`)) return
    try {
      const res = await api(`/cycles/${cycle.id}/rollover`, { method: 'POST' })
      toast(`Rolled ${res.moved} issue${res.moved === 1 ? '' : 's'} forward`, { tone: 'success' })
      load()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function removeCycle(cycle) {
    if (!confirm(`Delete ${cycle.name}? Its issues stay, they just leave the cycle.`)) return
    try {
      await api(`/cycles/${cycle.id}`, { method: 'DELETE' })
      toast('Cycle deleted')
      load()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function shiftDates(cycle, days) {
    const startsAt = new Date(new Date(cycle.startsAt).getTime() + days * 864e5).toISOString()
    const endsAt = new Date(new Date(cycle.endsAt).getTime() + days * 864e5).toISOString()
    setCycles((prev) => prev.map((c) => (c.id === cycle.id ? { ...c, startsAt, endsAt } : c)))
    try {
      await api(`/cycles/${cycle.id}`, { method: 'PATCH', body: { startsAt, endsAt } })
    } catch {
      load()
    }
  }

  if (!team) return <div className="p-6"><div className="h-10 w-64 rounded-xl skeleton" /></div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-tight">
            <Timer className="h-5 w-5 text-accent" /> Cycles
          </h1>
          <p className="mt-1 text-[14px] text-muted">Time-boxed sprints. Unfinished work rolls forward instead of piling up.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="app-input h-10 w-auto text-[13px]">
            {activeProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setCreating((v) => !v)} className="app-btn app-btn-primary h-10 gap-1.5 px-4 text-[13px] press">
            <Plus className="h-4 w-4" /> New cycle
          </button>
        </div>
      </div>

      {current && (
        <div className="app-card grad-border a-up mb-5 overflow-hidden p-5">
          <div className="flex flex-wrap items-center gap-5">
            <ProgressRing percent={current.progress.percent} size={88} sub={`${current.progress.done}/${current.progress.total}`} />
            <div className="min-w-[220px] flex-1">
              <div className="flex items-center gap-2">
                <span className="dot-live" />
                <span className="text-[12px] font-semibold uppercase tracking-wide text-accent">Active now</span>
              </div>
              <h2 className="mt-1 text-[19px] font-semibold">{current.name}</h2>
              <p className="mt-1 text-[13px] text-muted">
                {shortDate(current.startsAt)} → {shortDate(current.endsAt)} ·{' '}
                {daysBetween(new Date(), current.endsAt)} days left · {current.progress.estimate} pts in scope
              </p>
            </div>
            <button onClick={() => rollover(current)} className="app-btn app-btn-ghost h-10 gap-1.5 px-4 text-[13px]">
              <Repeat className="h-4 w-4" /> Rollover
            </button>
          </div>
        </div>
      )}

      {creating && (
        <form onSubmit={createCycle} className="app-card dropdown-in mb-5 p-5">
          <h3 className="mb-4 text-[15px] font-semibold">New cycle in {activeProjects.find((p) => p.id === projectId)?.name}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Name</span>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={`Cycle ${cycles.length + 1}`} className="app-input h-10 text-[13.5px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Starts</span>
              <input type="date" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} className="app-input h-10 text-[13.5px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Ends</span>
              <input type="date" value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} className="app-input h-10 text-[13.5px]" />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button type="submit" className="app-btn app-btn-primary h-9 px-4 text-[13px]">Create cycle</button>
            <button type="button" onClick={() => setCreating(false)} className="app-btn app-btn-ghost h-9 px-4 text-[13px]">Cancel</button>
            <span className="ml-auto text-[12px] text-faint">14 days is the usual rhythm</span>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" style={{ animationDelay: `${i * 80}ms` }} />)}
        </div>
      ) : cycles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="anim-float flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Timer className="h-5 w-5" /></span>
          <p className="text-[14px] font-medium">No cycles in this project yet</p>
          <p className="max-w-xs text-[13px] text-muted">Start with a two-week cycle, load a few issues, and watch the bar fill.</p>
          <button onClick={() => setCreating(true)} className="app-btn app-btn-primary mt-1 h-9 gap-1.5 px-4 text-[12.5px]"><Plus className="h-3.5 w-3.5" /> New cycle</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {cycles.map((cycle, ci) => {
            const isOpen = expanded === cycle.id
            const started = new Date(cycle.startsAt) <= new Date()
            const ended = new Date(cycle.endsAt) < new Date()
            const late = cycle.issues.filter((i) => i.status !== 'DONE').length
            return (
              <section key={cycle.id} className="app-card a-up overflow-hidden" style={{ animationDelay: `${ci * 60}ms` }}>
                <div className="flex flex-wrap items-center gap-4 p-4">
                  <ProgressRing percent={cycle.progress.percent} size={64} sub={`${cycle.progress.done}/${cycle.progress.total}`} />
                  <button onClick={() => setExpanded(isOpen ? null : cycle.id)} className="min-w-[200px] flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold">{cycle.name}</span>
                      {!started && <span className="chip bg-sky-50 text-sky-600">Upcoming</span>}
                      {started && !ended && <span className="chip bg-emerald-50 text-emerald-600">Active</span>}
                      {ended && <span className="chip bg-raised text-faint">Completed</span>}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {shortDate(cycle.startsAt)} → {shortDate(cycle.endsAt)}
                      <span>·</span> {cycle.progress.total} issues
                      {cycle.progress.estimate > 0 && <><span>·</span> {cycle.progress.estimate} pts</>}
                      {late > 0 && ended && <><span>·</span> <span className="text-amber-600">{late} unfinished</span></>}
                    </p>
                    <div className="mt-2.5 meter max-w-md">
                      <i style={{ width: `${Math.max(2, cycle.progress.percent)}%`, background: 'linear-gradient(90deg,#5b5bd6,#8b5cf6)', animationDelay: `${ci * 60}ms` }} />
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button onClick={() => shiftDates(cycle, -7)} className="app-btn app-btn-ghost h-8 px-2 text-[11.5px]" title="Shift a week earlier">−7d</button>
                    <button onClick={() => shiftDates(cycle, 7)} className="app-btn app-btn-ghost h-8 px-2 text-[11.5px]" title="Shift a week later">+7d</button>
                    <button onClick={() => setPicker(cycle.id)} className="app-btn app-btn-ghost h-8 gap-1 px-3 text-[12px]"><Plus className="h-3.5 w-3.5" /> Issues</button>
                    <button onClick={() => rollover(cycle)} className="app-btn app-btn-ghost h-8 w-8 justify-center p-0" title="Roll over unfinished work"><Repeat className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeCycle(cycle)} className="app-btn app-btn-ghost h-8 w-8 justify-center p-0 text-red-500" title="Delete cycle"><Trash2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setExpanded(isOpen ? null : cycle.id)} className="app-btn app-btn-ghost h-8 w-8 justify-center p-0">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-line">
                    {cycle.issues.length === 0 ? (
                      <p className="px-4 py-6 text-center text-[13px] text-faint">Nothing in this cycle yet — add issues from the project backlog.</p>
                    ) : (
                      cycle.issues.map((ci2) => {
                        const info = detail.get(ci2.id)
                        const s = statusMeta(ci2.status)
                        const p = priorityMeta(ci2.priority)
                        return (
                          <div key={ci2.id} className="group flex items-center gap-3 border-b border-line/70 px-4 py-2.5 text-[13px] last:border-0 hover:bg-raised/50">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                            <span className="w-[58px] shrink-0 font-mono text-[11px] text-faint">{info ? issueKey(info) : `#${ci2.number}`}</span>
                            <button onClick={() => openIssue(ci2.id)} className="min-w-0 flex-1 truncate text-left hover:text-accent">{ci2.title}</button>
                            <span className="text-[10.5px] font-semibold" style={{ color: p.color }}>{p.short}</span>
                            {ci2.estimate != null && <span className="rounded bg-raised px-1 py-0.5 text-[11px] text-faint">{ci2.estimate}</span>}
                            {info?.assignee && (
                              <span className="hidden items-center gap-1.5 text-[11.5px] text-muted sm:flex">
                                <span className="h-4 w-4 rounded-full text-[8px] font-bold text-white" style={{ background: info.assignee.avatarColor, display: 'grid', placeItems: 'center' }}>
                                  {info.assignee.name.slice(0, 1)}
                                </span>
                                {info.assignee.name.split(' ')[0]}
                              </span>
                            )}
                            <button onClick={() => removeIssue(cycle.id, ci2.id)} className="rounded p-1 text-faint opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100" title="Remove from cycle">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {picker && (
        <IssuePicker
          issues={uncycled}
          onClose={() => setPicker(null)}
          onPick={(ids) => addIssues(picker, ids)}
        />
      )}
    </div>
  )
}

function IssuePicker({ issues, onClose, onPick }) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState([])

  const filtered = issues.filter((i) => `${i.title} ${i.project.key}-${i.number}`.toLowerCase().includes(q.toLowerCase()))
  const points = issues.filter((i) => picked.includes(i.id)).reduce((a, i) => a + (i.estimate || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/30 p-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div className="dropdown-in w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Search className="h-4 w-4 text-faint" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find issues to add…" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint" />
          <button onClick={onClose} className="rounded p-1 text-faint hover:text-fg"><X className="h-4 w-4" /></button>
        </div>
        <div className="thin-scroll max-h-[46vh] overflow-y-auto p-2">
          {filtered.map((i) => {
            const s = statusMeta(i.status)
            const on = picked.includes(i.id)
            return (
              <button
                key={i.id}
                onClick={() => setPicked((p) => (on ? p.filter((x) => x !== i.id) : [...p, i.id]))}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-raised"
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-accent bg-accent text-white' : 'border-line'}`}>
                  {on && <Check className="h-3 w-3" />}
                </span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="font-mono text-[11px] text-faint">{i.project.key}-{i.number}</span>
                <span className="min-w-0 flex-1 truncate">{i.title}</span>
                {i.estimate != null && <span className="text-[11px] text-faint">{i.estimate}</span>}
              </button>
            )
          })}
          {filtered.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-faint">Every issue in this project is already in a cycle.</p>}
        </div>
        <div className="flex items-center gap-2 border-t border-line px-4 py-3">
          <span className="text-[12.5px] text-muted">{picked.length} selected{points > 0 ? ` · ${points} pts` : ''}</span>
          <button
            disabled={picked.length === 0}
            onClick={() => onPick(picked)}
            className="app-btn app-btn-primary ml-auto h-9 px-4 text-[13px] disabled:opacity-50"
          >
            Add to cycle
          </button>
        </div>
      </div>
    </div>
  )
}
