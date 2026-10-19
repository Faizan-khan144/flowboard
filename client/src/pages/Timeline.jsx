import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { CalendarRange, ZoomIn, ZoomOut, Users, Layers, ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useUI } from '../store/ui'
import { statusMeta, priorityMeta, shortDate } from '../lib/constants'
import { issueKey, sum } from '../lib/utils'
import Avatar from '../components/Avatar'
import ViewTabs from '../components/ViewTabs'

const ZOOMS = {
  weeks: { days: 6, label: 'Weeks' },
  months: { days: 2.4, label: 'Months' },
  quarters: { days: 1, label: 'Quarters' },
}

export default function Timeline() {
  const { team, openIssue } = useOutletContext()
  const { toast } = useUI()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState('project')
  const [zoom, setZoom] = useState('weeks')
  const [showDone, setShowDone] = useState(true)
  const [offset, setOffset] = useState(0)
  const scroller = useRef(null)

  async function load() {
    if (!team) return
    try {
      const data = await api(`/issues?teamId=${team.id}&limit=500`)
      setIssues(data.issues)
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    load()
  }, [team])

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
  }, [team])

  const pxPerDay = ZOOMS[zoom].days

  const dated = useMemo(() => {
    const list = issues.filter((i) => showDone || (i.status !== 'DONE' && i.status !== 'CANCELED'))
    return list.map((i) => {
      const start = new Date(i.createdAt)
      const end = i.dueDate ? new Date(i.dueDate) : new Date(start.getTime() + 5 * 864e5)
      return { issue: i, start, end: end < start ? start : end }
    })
  }, [issues, showDone])

  const range = useMemo(() => {
    const now = Date.now()
    const min = Math.min(now, ...dated.map((d) => +d.start)) - 2 * 864e5
    const max = Math.max(now + 14 * 864e5, ...dated.map((d) => +d.end)) + 2 * 864e5
    return { min, max, total: max - min }
  }, [dated])

  const days = Math.round(range.total / 864e5)
  const width = Math.max(760, days * pxPerDay)
  const x = (date) => ((+new Date(date) - range.min) / range.total) * 100

  const rows = useMemo(() => {
    const map = new Map()
    for (const d of dated) {
      const key = group === 'assignee' ? d.issue.assignee?.id || '__un' : d.issue.project.id
      const label = group === 'assignee' ? d.issue.assignee?.name || 'Unassigned' : d.issue.project.name
      const color = group === 'assignee' ? d.issue.assignee?.avatarColor || '#94a3b8' : d.issue.project.color
      const avatar = group === 'assignee' ? d.issue.assignee : null
      if (!map.has(key)) map.set(key, { id: key, label, color, avatar, items: [] })
      map.get(key).items.push(d)
    }
    return [...map.values()]
      .map((g) => ({ ...g, items: g.items.sort((a, b) => +a.start - +b.start), points: sum(g.items, (d) => d.issue.estimate) }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [dated, group])

  const months = useMemo(() => {
    const out = []
    const cursor = new Date(range.min)
    cursor.setDate(1)
    while (+cursor < range.max) {
      out.push(new Date(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return out
  }, [range])

  const nowPct = ((Date.now() - range.min) / range.total) * 100

  if (!team) return <div className="p-6"><div className="h-10 w-64 rounded-xl skeleton" /></div>

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line bg-surface/80 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <ViewTabs />
          <div className="relative ml-auto flex items-center gap-1">
            <button onClick={() => setOffset((o) => o - 1)} className="app-btn app-btn-ghost h-8 w-8 justify-center p-0" title="Shift back">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setOffset(0)} className="app-btn app-btn-ghost h-8 px-2.5 text-[12px]" title="Back to today">
              Today
            </button>
            <button onClick={() => setOffset((o) => o + 1)} className="app-btn app-btn-ghost h-8 w-8 justify-center p-0" title="Shift forward">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-line bg-raised/60 p-1">
            {Object.entries(ZOOMS).map(([key, z]) => (
              <button
                key={key}
                onClick={() => setZoom(key)}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all ${zoom === key ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
              >
                {z.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-line bg-raised/60 p-1">
            {[
              ['project', 'Project', Layers],
              ['assignee', 'Assignee', Users],
            ].map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setGroup(key)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all ${group === key ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDone((v) => !v)}
            className={`app-btn h-8 px-3 text-[12px] ${showDone ? 'app-btn-ghost' : 'border border-accent/40 bg-accent/10 text-accent'}`}
          >
            {showDone ? 'Hide done' : 'Done hidden'}
          </button>
        </div>
      </div>

      <div ref={scroller} className="thin-scroll min-h-0 flex-1 overflow-auto px-4 py-4 md:px-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 rounded-xl skeleton" style={{ animationDelay: `${i * 70}ms` }} />)}
          </div>
        ) : dated.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <span className="anim-float flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <CalendarRange className="h-5 w-5" />
            </span>
            <p className="text-[14px] font-medium">Nothing to plot yet</p>
            <p className="max-w-xs text-[13px] text-muted">Issues appear here by their created and due dates. Add a due date in the drawer to shape this view.</p>
          </div>
        ) : (
          <div style={{ minWidth: width + 200 }}>

            <div className="sticky top-0 z-20 mb-3 flex">
              <div className="w-[200px] shrink-0" />
              <div className="relative h-7 flex-1 rounded-lg bg-raised/50">
                {months.map((m) => (
                  <span
                    key={+m}
                    className="absolute top-1/2 -translate-y-1/2 border-l border-line pl-2 text-[11px] font-medium uppercase tracking-wide text-faint"
                    style={{ left: `${x(Math.max(+m, range.min))}%` }}
                  >
                    {m.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">

              <div
                className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-accent/50"
                style={{ left: `calc(200px + ${nowPct}% * (100% - 200px) / 100%)`, marginLeft: 0 }}
              >
                <span className="absolute -left-[26px] top-0 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">today</span>
              </div>

              {rows.map((row, ri) => (
                <div key={row.id} className="a-up mb-4" style={{ animationDelay: `${ri * 60}ms` }}>
                  <div className="mb-2 flex items-center gap-2">
                    {row.avatar ? <Avatar user={row.avatar} size={18} /> : <span className="h-2.5 w-2.5 rounded-sm" style={{ background: row.color }} />}
                    <span className="text-[13px] font-semibold">{row.label}</span>
                    <span className="rounded-full bg-raised px-1.5 py-0.5 text-[11px] text-faint">{row.items.length}</span>
                    {row.points > 0 && <span className="text-[11px] text-faint">{row.points} pts</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {row.items.map(({ issue, start, end }) => {
                      const s = statusMeta(issue.status)
                      const p = priorityMeta(issue.priority)
                      const left = Math.max(0, x(start))
                      const right = Math.min(100, x(end))
                      const barWidth = Math.max(1.6, right - left)
                      const late = issue.dueDate && +new Date(issue.dueDate) < Date.now() && issue.status !== 'DONE'
                      return (
                        <div key={issue.id} className="group flex items-center">
                          <button
                            onClick={() => openIssue(issue.id)}
                            className="w-[200px] shrink-0 truncate pr-3 text-left text-[12.5px] text-muted transition-colors hover:text-fg"
                            title={issue.title}
                          >
                            <span className="font-mono text-[10.5px] text-faint">{issueKey(issue)}</span> {issue.title}
                          </button>
                          <div className="relative h-7 flex-1 rounded-lg bg-raised/40">
                            <button
                              onClick={() => openIssue(issue.id)}
                              className="bar-anim group/bar absolute top-1 h-5 overflow-hidden rounded-md border text-left transition-all hover:z-10 hover:h-6 hover:-translate-y-0.5 hover:shadow-lg"
                              style={{
                                left: `${left}%`,
                                width: `${barWidth}%`,
                                background: `linear-gradient(90deg, ${s.color}cc, ${s.color}88)`,
                                borderColor: `${s.color}`,
                                animationDelay: `${ri * 60}ms`,
                              }}
                              title={`${issueKey(issue)} · ${issue.title}`}
                            >
                              <span className="flex h-full items-center gap-1.5 px-2 text-[11px] font-medium text-white/95">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#fff' }} />
                                <span className="truncate">{issue.assignee ? issue.assignee.name.split(' ')[0] : 'Unassigned'}</span>
                                {late && <Flag className="h-3 w-3 shrink-0 text-red-100" />}
                              </span>
                            </button>
                            <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10.5px] text-faint">
                              {issue.dueDate ? shortDate(issue.dueDate) : 'no due date'}
                            </span>
                          </div>
                          <span className="ml-2 w-10 shrink-0 text-[10.5px] font-semibold" style={{ color: p.color }}>{p.short}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
