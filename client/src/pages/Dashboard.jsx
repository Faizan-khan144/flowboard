import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Check, Clock, Flame, ListChecks, Plus, Sparkles, TrendingUp, Users, Zap,
  CircleDot, Timer, Activity as ActivityIcon, LayoutGrid, Inbox as InboxIcon,
} from 'lucide-react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import { useCountUp } from '../lib/hooks'
import { STATUSES, PRIORITIES, statusMeta, priorityMeta, relativeTime } from '../lib/constants'
import { greeting, issueKey, pct, pluralize, sum } from '../lib/utils'
import Avatar from '../components/Avatar'
import ProgressRing from '../components/ProgressRing'

export default function Dashboard() {
  const { user } = useAuth()
  const { openIssue, toast } = useUI()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      setData(await api('/users/me/dashboard'))
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const socket = getSocket()
    const refresh = () => load()
    socket?.on('issue:created', refresh)
    socket?.on('issue:updated', refresh)
    socket?.on('issue:deleted', refresh)
    socket?.on('issues:changed', refresh)
    socket?.on('comment:created', refresh)
    socket?.on('comment:deleted', refresh)
    socket?.on('reaction:updated', refresh)
    socket?.on('cycle:changed', refresh)
    socket?.on('notification', refresh)
    window.addEventListener('fb:issues-changed', refresh)
    window.addEventListener('fb:issue-created', refresh)
    return () => {
      socket?.off('issue:created', refresh)
      socket?.off('issue:updated', refresh)
      socket?.off('issue:deleted', refresh)
      socket?.off('issues:changed', refresh)
      socket?.off('comment:created', refresh)
      socket?.off('comment:deleted', refresh)
      socket?.off('reaction:updated', refresh)
      socket?.off('cycle:changed', refresh)
      socket?.off('notification', refresh)
      window.removeEventListener('fb:issues-changed', refresh)
      window.removeEventListener('fb:issue-created', refresh)
    }
  }, [])

  const totals = data?.totals || {}
  const issues = useCountUp(totals.issues || 0)
  const mine = useCountUp(totals.mine || 0)
  const done = useCountUp(totals.done || 0)
  const overdue = useCountUp(totals.overdue || 0)

  const statusBars = useMemo(
    () => STATUSES.map((s) => ({ ...s, count: data?.byStatus?.[s.id] || 0, percent: pct(data?.byStatus?.[s.id] || 0, totals.issues || 1) })),
    [data, totals.issues],
  )

  const priorityBars = useMemo(
    () => PRIORITIES.filter((p) => p.id !== 'NONE').map((p) => ({ ...p, count: data?.byPriority?.[p.id] || 0 })),
    [data],
  )
  const maxPriority = Math.max(1, ...priorityBars.map((p) => p.count))

  const estimateTotal = sum(data?.recent || [], (i) => i.estimate)

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-6 h-9 w-72 rounded-xl skeleton" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[116px] rounded-2xl skeleton" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="h-72 rounded-2xl skeleton lg:col-span-2" />
          <div className="h-72 rounded-2xl skeleton" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">

      <div className="a-up mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-[13px] text-muted">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            {greeting()}, {user?.name?.split(' ')[0]}
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-[34px]">
            Here is where the work stands
          </h1>
          <p className="mt-1.5 text-[14.5px] text-muted">
            {totals.issues
              ? `${pluralize(totals.issues, 'issue')} across ${pluralize(totals.projects, 'project')} · ${pluralize(totals.members, 'person', 'people')}`
              : 'Create your first issue to get moving.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/app/board')} className="app-btn app-btn-ghost h-10 px-4">
            <LayoutGrid className="h-4 w-4" /> Board
          </button>
          <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }))} className="app-btn app-btn-primary h-10 px-4 press">
            <Plus className="h-4 w-4" /> New issue
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Total issues" value={issues} hint={`${data?.totals?.unread || 0} unread updates`} tone="accent" delay={0} />
        <StatCard icon={Users} label="Assigned to you" value={mine} hint="across every project" tone="sky" delay={1} />
        <StatCard icon={Check} label="Completed" value={done} hint={`${totals.completion || 0}% of all work`} tone="emerald" delay={2} />
        <StatCard icon={Flame} label="Overdue" value={overdue} hint={overdue ? 'needs attention today' : 'nothing overdue'} tone={overdue ? 'red' : 'slate'} delay={3} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">

        <section className="app-card a-up lg:col-span-2" style={{ animationDelay: '80ms' }}>
          <div className="flex flex-wrap items-center gap-6 border-b border-line p-5">
            <ProgressRing percent={totals.completion || 0} size={104} sub="complete" />
            <div className="min-w-[190px] flex-1">
              <h2 className="text-[15px] font-semibold">Delivery progress</h2>
              <p className="mt-1 text-[13.5px] text-muted">
                {totals.done} of {totals.issues} issues closed. {totals.completion >= 70 ? 'Strong pace — keep it steady.' : 'Plenty of runway left in this cycle.'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[12.5px] text-faint">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-accent" /> {estimateTotal} pts visible in recent work
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> updated live over sockets
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-faint">By status</div>
              <div className="flex flex-col gap-2.5">
                {statusBars.map((s, i) => (
                  <div key={s.id} className="a-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="mb-1 flex items-center justify-between text-[12.5px]">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label}
                      </span>
                      <span className="text-muted">{s.count}</span>
                    </div>
                    <div className="meter">
                      <i style={{ width: `${Math.max(2, s.percent)}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}bb)`, animationDelay: `${i * 60}ms` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-faint">By priority</div>
              <div className="flex h-[172px] items-end gap-3">
                {priorityBars.map((p, i) => (
                  <div key={p.id} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[12px] font-semibold">{p.count}</span>
                    <div
                      className="w-full rounded-t-lg bar-anim"
                      style={{
                        height: `${Math.max(6, (p.count / maxPriority) * 120)}px`,
                        background: `linear-gradient(180deg, ${p.color}, ${p.color}55)`,
                        animationDelay: `${i * 80}ms`,
                      }}
                    />
                    <span className="text-[11px] text-faint">{p.short}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="app-card a-up flex flex-col" style={{ animationDelay: '140ms' }}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <ActivityIcon className="h-4 w-4 text-accent" /> Recent activity
            </h2>
            <Link to="/app/inbox" className="text-[12.5px] text-muted hover:text-accent">
              Inbox
            </Link>
          </div>
          <div className="thin-scroll max-h-[320px] overflow-y-auto p-3">
            {(data?.activity || []).map((a, i) => (
              <button
                key={a.id}
                onClick={() => a.issue && openIssue(a.issue.id)}
                className="a-up flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-raised/70"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <Avatar user={a.actor} size={26} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-snug">
                    <span className="font-medium">{a.actor.name.split(' ')[0]}</span> {describe(a)}
                  </span>
                  <span className="text-[11.5px] text-faint">{relativeTime(a.createdAt)}</span>
                </span>
              </button>
            ))}
            {(!data?.activity || data.activity.length === 0) && <p className="px-3 py-6 text-center text-[13px] text-faint">No activity yet.</p>}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="app-card a-up lg:col-span-2" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[15px] font-semibold">Your plate</h2>
            <Link to="/app/issues?assignee=me" className="flex items-center gap-1 text-[12.5px] text-muted hover:text-accent">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-soft">
            {(data?.myIssues || []).map((i, idx) => {
              const s = statusMeta(i.status)
              const due = i.dueDate ? new Date(i.dueDate) : null
              const late = due && due < new Date() && i.status !== 'DONE'
              return (
                <button
                  key={i.id}
                  onClick={() => openIssue(i.id)}
                  className="h-slide-x flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-raised/60"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <span className="h-2 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="w-16 shrink-0 font-mono text-[11.5px] text-faint">{issueKey(i)}</span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px]">{i.title}</span>
                  {i.labels?.slice(0, 2).map((l) => (
                    <span key={l.labelId} className="chip hidden sm:inline-flex" style={{ background: `${l.label.color}18`, color: l.label.color }}>
                      {l.label.name}
                    </span>
                  ))}
                  <span className={`shrink-0 text-[11.5px] ${late ? 'font-medium text-red-500' : 'text-faint'}`}>
                    {due ? due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                  </span>
                </button>
              )
            })}
            {(!data?.myIssues || data.myIssues.length === 0) && (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                <span className="anim-float flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Check className="h-5 w-5" />
                </span>
                <p className="text-[13.5px] text-muted">Nothing assigned to you right now.</p>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="app-card grad-border a-up p-5" style={{ animationDelay: '120ms' }}>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <TrendingUp className="h-4 w-4 text-accent" /> Quick actions
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {[
                { label: 'Open the board', icon: LayoutGrid, to: '/app/board' },
                { label: 'Review cycles', icon: Timer, to: '/app/cycles' },
                { label: 'Clear your inbox', icon: InboxIcon, to: '/app/inbox' },
                { label: 'Invite a teammate', icon: Users, to: '/app/team' },
              ].map(({ label, icon: Icon, to }, i) => (
                <Link
                  key={label}
                  to={to}
                  className="h-slide-x flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-[13.5px] transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent/5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <Icon className="h-4 w-4 text-accent" /> {label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-faint" />
                </Link>
              ))}
            </div>
          </div>

          <div className="app-card a-up p-5" style={{ animationDelay: '180ms' }}>
            <h2 className="text-[15px] font-semibold">Recently touched</h2>
            <div className="mt-3 flex flex-col gap-2">
              {(data?.recent || []).slice(0, 4).map((i) => (
                <button key={i.id} onClick={() => openIssue(i.id)} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-raised/60">
                  <CircleDot className="h-3.5 w-3.5 shrink-0" style={{ color: statusMeta(i.status).color }} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{i.title}</span>
                  <span className="shrink-0 text-[11px] text-faint">{relativeTime(i.updatedAt)}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function describe(a) {
  const map = {
    created: 'created an issue',
    status: 'moved an issue',
    priority: 'changed priority',
    assigneeId: 'reassigned an issue',
    comment: 'commented',
    member_joined: 'joined the workspace',
    workspace_created: 'created this workspace',
    project_created: 'created a project',
  }
  return map[a.action] || a.action
}

const TONES = {
  accent: 'from-accent/12 to-accent/0 text-accent',
  sky: 'from-sky-500/12 to-sky-500/0 text-sky-600',
  emerald: 'from-emerald-500/12 to-emerald-500/0 text-emerald-600',
  red: 'from-red-500/12 to-red-500/0 text-red-600',
  slate: 'from-slate-500/12 to-slate-500/0 text-slate-600',
}

function StatCard({ icon: Icon, label, value, hint, tone = 'accent', delay = 0 }) {
  return (
    <div className="app-card hoverable a-up relative overflow-hidden p-5" style={{ animationDelay: `${delay * 70}ms` }}>
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${TONES[tone]}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[12.5px] font-medium text-muted">{label}</div>
          <div className="mt-2 text-[30px] font-bold leading-none tracking-tight">{value}</div>
          <div className="mt-2 text-[12px] text-faint">{hint}</div>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${TONES[tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
    </div>
  )
}
