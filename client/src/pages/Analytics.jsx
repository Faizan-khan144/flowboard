import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { TrendingUp, TrendingDown, Target, Check, Zap, Timer, Users, Tag, Flame, Minus } from 'lucide-react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useUI } from '../store/ui'
import { PRIORITIES } from '../lib/constants'
import ViewTabs from '../components/ViewTabs'
import ProgressRing from '../components/ProgressRing'
import Avatar from '../components/Avatar'

export default function Analytics() {
  const { team } = useOutletContext()
  const { toast } = useUI()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!team) return
    try {
      setData(await api(`/users/me/analytics?teamId=${team.id}`))
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
    socket.on('issues:changed', refresh)
    socket.on('issue:updated', refresh)
    socket.on('issue:created', refresh)
    return () => {
      socket.off('issues:changed', refresh)
      socket.off('issue:updated', refresh)
      socket.off('issue:created', refresh)
    }
  }, [team])

  const maxWeek = useMemo(() => Math.max(1, ...(data?.weeks || []).flatMap((w) => [w.created, w.completed])), [data])
  const totalMix = useMemo(() => Object.values(data?.priorityMix || {}).reduce((a, b) => a + b, 0), [data])

  const donut = useMemo(() => {
    let acc = 0
    const r = 54
    const c = 2 * Math.PI * r
    return PRIORITIES.map((p) => {
      const value = data?.priorityMix?.[p.id] || 0
      const frac = totalMix ? value / totalMix : 0
      const seg = { ...p, value, frac, dash: `${frac * c} ${c}`, offset: -acc * c }
      acc += frac
      return seg
    }).filter((s) => s.value > 0)
  }, [data, totalMix])

  if (!team) return <Skeleton />

  const totals = data?.totals || {}
  const completion = totals.open + totals.done ? Math.round((totals.done / (totals.open + totals.done)) * 100) : 0
  const busiest = data?.assigneeLoad?.find((a) => a.id !== 'none')

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <ViewTabs />
        <div className="ml-auto flex items-center gap-2 text-[12.5px] text-faint">
          <span className="dot-live" /> live from every project in {team.name}
        </div>
      </div>

      {loading && !data ? (
        <Skeleton body />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile icon={Target} label="Open work" value={totals.open} hint={`${totals.done} closed all time`} tone="accent" />
            <Tile icon={Zap} label="Story points" value={totals.points} hint={`${totals.unestimated} issues unestimated`} tone="sky" />
            <Tile
              icon={data?.trend >= 0 ? TrendingUp : TrendingDown}
              label="Completed this week"
              value={data?.weeks?.[data.weeks.length - 1]?.completed ?? 0}
              hint={`${data?.trend >= 0 ? '+' : ''}${data?.trend ?? 0}% vs last week`}
              tone={data?.trend >= 0 ? 'emerald' : 'red'}
            />
            <Tile icon={Timer} label="Avg time to close" value={`${data?.avgDays ?? 0}d`} hint="from creation to done" tone="violet" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <section className="app-card a-up p-5 lg:col-span-2">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-[15px] font-semibold">Velocity</h2>
                  <p className="text-[13px] text-muted">Created vs completed, last 8 weeks</p>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-muted">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent/40" /> created</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> completed</span>
                </div>
              </div>
              <div className="flex h-[210px] items-end gap-2.5">
                {(data?.weeks || []).map((w, i) => (
                  <div key={w.label} className="group flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-[170px] w-full items-end justify-center gap-1">
                      <span
                        className="bar-anim w-1/2 max-w-[22px] rounded-t-md bg-accent/40 transition-all group-hover:bg-accent/60"
                        style={{ height: `${Math.max(3, (w.created / maxWeek) * 160)}px`, animationDelay: `${i * 70}ms` }}
                        title={`${w.created} created`}
                      />
                      <span
                        className="bar-anim w-1/2 max-w-[22px] rounded-t-md bg-emerald-500 transition-all group-hover:bg-emerald-600"
                        style={{ height: `${Math.max(3, (w.completed / maxWeek) * 160)}px`, animationDelay: `${i * 70 + 40}ms` }}
                        title={`${w.completed} completed`}
                      />
                    </div>
                    <span className="text-[11px] text-faint">{w.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="app-card a-up flex flex-col p-5" style={{ animationDelay: '80ms' }}>
              <h2 className="mb-1 text-[15px] font-semibold">Priority mix</h2>
              <p className="mb-4 text-[13px] text-muted">Where attention is going</p>
              <div className="relative mx-auto my-2 h-[170px] w-[170px]">
                <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                  <circle cx="70" cy="70" r="54" fill="none" stroke="#eef0f4" strokeWidth="16" />
                  {donut.map((s) => (
                    <circle
                      key={s.id}
                      cx="70"
                      cy="70"
                      r="54"
                      fill="none"
                      stroke={s.color}
                      strokeWidth="16"
                      strokeDasharray={s.dash}
                      strokeDashoffset={s.offset}
                      strokeLinecap="butt"
                      style={{ transition: 'stroke-dasharray .8s ease' }}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[24px] font-bold leading-none">{totals.open + totals.done}</span>
                  <span className="text-[11px] text-faint">issues</span>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {donut.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-[12.5px]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted">{s.label}</span>
                    <span className="ml-auto font-medium">{s.value}</span>
                    <span className="w-10 text-right text-[11px] text-faint">{Math.round(s.frac * 100)}%</span>
                  </div>
                ))}
                {donut.length === 0 && <p className="text-[13px] text-faint">No issues yet.</p>}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <section className="app-card a-up p-5 lg:col-span-2" style={{ animationDelay: '60ms' }}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold">Load by person</h2>
                  <p className="text-[13px] text-muted">Open vs closed, plus story points</p>
                </div>
                <span className="flex items-center gap-1.5 text-[12px] text-faint"><Users className="h-3.5 w-3.5" /> {data?.assigneeLoad?.length || 0} rows</span>
              </div>
              <div className="flex flex-col gap-3.5">
                {(data?.assigneeLoad || []).map((a, i) => {
                  const total = a.total || 1
                  return (
                    <div key={a.id} className="a-up" style={{ animationDelay: `${i * 55}ms` }}>
                      <div className="mb-1.5 flex items-center gap-2 text-[12.5px]">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[9.5px] font-bold text-white" style={{ background: a.color }}>
                          {a.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span>{a.name}</span>
                        {a.points > 0 && <span className="text-faint">· {a.points} pts</span>}
                        <span className="ml-auto text-faint">{a.done}/{a.total} done</span>
                      </div>
                      <div className="meter">
                        <i style={{ width: `${(a.done / total) * 100}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', animationDelay: `${i * 55}ms` }} />
                        <i style={{ width: `${(a.open / total) * 100}%`, background: 'linear-gradient(90deg,#6d6df0,#8b8bf5)', animationDelay: `${i * 55 + 40}ms` }} />
                      </div>
                    </div>
                  )
                })}
                {(data?.assigneeLoad || []).length === 0 && <p className="text-[13px] text-faint">No issues to measure.</p>}
              </div>
            </section>

            <div className="flex flex-col gap-4">
              <section className="app-card a-up flex items-center gap-5 p-5" style={{ animationDelay: '120ms' }}>
                <ProgressRing percent={completion} size={96} sub="done" />
                <div>
                  <h2 className="text-[15px] font-semibold">Completion</h2>
                  <p className="mt-1 text-[13px] text-muted">
                    {completion}% of {totals.open + totals.done} issues are closed.
                  </p>
                </div>
              </section>

              <section className="app-card a-up p-5" style={{ animationDelay: '180ms' }}>
                <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold"><Tag className="h-4 w-4 text-accent" /> Label usage</h2>
                <div className="flex flex-col gap-2.5">
                  {(data?.labelUsage || []).map((l, i) => {
                    const max = data.labelUsage[0]?.count || 1
                    return (
                      <div key={l.id} className="a-up flex items-center gap-2.5 text-[12.5px]" style={{ animationDelay: `${i * 50}ms` }}>
                        <span className="w-20 shrink-0 truncate text-muted">{l.name}</span>
                        <div className="meter flex-1">
                          <i style={{ width: `${(l.count / max) * 100}%`, background: `linear-gradient(90deg, ${l.color}, ${l.color}99)` }} />
                        </div>
                        <span className="w-6 text-right text-faint">{l.count}</span>
                      </div>
                    )
                  })}
                  {(data?.labelUsage || []).length === 0 && <p className="text-[13px] text-faint">No labels applied yet.</p>}
                </div>
              </section>

              {busiest && (
                <section className="app-card a-up grad-border p-5" style={{ animationDelay: '240ms' }}>
                  <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold"><Flame className="h-4 w-4 text-accent" /> What the data says</h2>
                  <p className="text-[13.5px] leading-relaxed text-muted">
                    <span className="font-medium text-fg">{busiest.name}</span> carries the most work with {busiest.open} open issue{busiest.open === 1 ? '' : 's'}.
                    {totals.unestimated > 0 && <> {totals.unestimated} issue{totals.unestimated === 1 ? ' is' : 's are'} still unestimated, so point totals will shift.</>}
                  </p>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const TONES = {
  accent: 'from-accent/12 to-accent/0 text-accent',
  sky: 'from-sky-500/12 to-sky-500/0 text-sky-600',
  emerald: 'from-emerald-500/12 to-emerald-500/0 text-emerald-600',
  red: 'from-red-500/12 to-red-500/0 text-red-600',
  violet: 'from-violet-500/12 to-violet-500/0 text-violet-600',
}

function Tile({ icon: Icon, label, value, hint, tone = 'accent' }) {
  return (
    <div className="app-card hoverable a-up relative overflow-hidden p-5">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${TONES[tone]}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[12.5px] font-medium text-muted">{label}</div>
          <div className="mt-2 text-[28px] font-bold leading-none tracking-tight">{value}</div>
          <div className="mt-2 text-[12px] text-faint">{hint}</div>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${TONES[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

function Skeleton({ body }) {
  if (!body) return <div className="p-6"><div className="h-10 w-64 rounded-xl skeleton" /></div>
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-[116px] rounded-2xl skeleton" />)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="h-80 rounded-2xl skeleton lg:col-span-2" />
        <div className="h-80 rounded-2xl skeleton" />
      </div>
    </div>
  )
}
