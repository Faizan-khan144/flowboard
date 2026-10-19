import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Inbox as InboxIcon, Check, CheckCheck, Trash2, Bell, AtSign, MessageSquare, UserPlus,
  CircleDot, MailOpen, Clock,
} from 'lucide-react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useUI } from '../store/ui'
import { relativeTime } from '../lib/constants'
import { issueKey } from '../lib/utils'
import Avatar from '../components/Avatar'

const TABS = [
  { id: 'all', label: 'All', icon: InboxIcon },
  { id: 'unread', label: 'Unread', icon: MailOpen },
  { id: 'mention', label: 'Mentions', icon: AtSign },
  { id: 'comment', label: 'Comments', icon: MessageSquare },
  { id: 'invite', label: 'Invites', icon: UserPlus },
]

const TYPE_META = {
  mention: { icon: AtSign, color: '#8b5cf6', label: 'mentioned you' },
  comment: { icon: MessageSquare, color: '#3b82f6', label: 'commented' },
  invite: { icon: UserPlus, color: '#10b981', label: 'invited you' },
  request: { icon: UserPlus, color: '#f59e0b', label: 'workspace request' },
  assign: { icon: CircleDot, color: '#5b5bd6', label: 'assigned you' },
}

export default function Inbox() {
  const { openIssue, setUnread } = useOutletContext()
  const { toast } = useUI()
  const [data, setData] = useState({ notifications: [], unread: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  async function load() {
    try {
      const res = await api('/notifications')
      setData(res)
      setUnread?.(res.unread)
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onNotif = () => load()
    socket.on('notification', onNotif)
    return () => socket.off('notification', onNotif)
  }, [setUnread])

  const filtered = useMemo(() => {
    const list = data.notifications
    if (tab === 'all') return list
    if (tab === 'unread') return list.filter((n) => !n.read)
    return list.filter((n) => n.type === tab)
  }, [data, tab])

  const grouped = useMemo(() => {
    const out = { Today: [], Yesterday: [], Earlier: [] }
    for (const n of filtered) {
      const days = Math.floor((Date.now() - new Date(n.createdAt)) / 864e5)
      const key = days < 1 ? 'Today' : days < 2 ? 'Yesterday' : 'Earlier'
      out[key].push(n)
    }
    return out
  }, [filtered])

  const counts = useMemo(() => ({
    all: data.notifications.length,
    unread: data.notifications.filter((n) => !n.read).length,
    mention: data.notifications.filter((n) => n.type === 'mention').length,
    comment: data.notifications.filter((n) => n.type === 'comment').length,
    invite: data.notifications.filter((n) => n.type === 'invite').length,
  }), [data])

  async function markRead(n, read) {
    try {
      await api(`/notifications/${n.id}/${read ? 'read' : 'unread'}`, { method: 'POST' })
      setData((d) => {
        const notifications = d.notifications.map((x) => (x.id === n.id ? { ...x, read } : x))
        const unread = notifications.filter((x) => !x.read).length
        setUnread?.(unread)
        return { notifications, unread }
      })
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function readAll() {
    try {
      await api('/notifications/read-all', { method: 'POST' })
      toast('Inbox cleared to read', { tone: 'success' })
      load()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function clearRead() {
    try {
      await api('/notifications/clear', { method: 'POST' })
      toast('Read items removed')
      load()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-tight">
            <InboxIcon className="h-5 w-5 text-accent" /> Inbox
            {counts.unread > 0 && <span className="chip bg-accent text-white">{counts.unread} unread</span>}
          </h1>
          <p className="mt-1 text-[14px] text-muted">Assignments, mentions and replies — everything that wants your attention.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={readAll} className="app-btn app-btn-ghost h-10 gap-1.5 px-4 text-[13px]">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
          <button onClick={clearRead} className="app-btn app-btn-ghost h-10 gap-1.5 px-4 text-[13px] text-red-500 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Clear read
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-xl border border-line bg-raised/60 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-all ${
              tab === id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${tab === id ? 'text-accent' : ''}`} /> {label}
            {counts[id] > 0 && <span className={`rounded-full px-1.5 text-[11px] ${tab === id ? 'bg-accent/10 text-accent' : 'bg-raised text-faint'}`}>{counts[id]}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl skeleton" style={{ animationDelay: `${i * 60}ms` }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <span className="anim-float flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Check className="h-5 w-5" />
          </span>
          <p className="text-[14px] font-medium">Inbox zero</p>
          <p className="max-w-xs text-[13px] text-muted">
            {tab === 'all' ? 'Nothing waiting on you. Mention a teammate with @name to start something.' : 'No notifications in this filter.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([label, items]) => (
            items.length > 0 && (
              <section key={label}>
                <h2 className="mb-2 flex items-center gap-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-faint">
                  <Clock className="h-3.5 w-3.5" /> {label}
                </h2>
                <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                  {items.map((n, i) => {
                    const meta = TYPE_META[n.type] || TYPE_META.comment
                    const Icon = meta.icon
                    return (
                      <div
                        key={n.id}
                        className={`a-up group flex items-start gap-3 border-b border-line/70 px-4 py-3.5 last:border-0 transition-colors hover:bg-raised/50 ${
                          n.read ? '' : 'bg-accent/[0.03]'
                        }`}
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <span className="relative shrink-0">
                          {n.actor ? (
                            <Avatar user={n.actor} size={34} />
                          ) : (
                            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-raised text-faint">
                              <Bell className="h-4 w-4" />
                            </span>
                          )}
                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface" style={{ background: meta.color }}>
                            <Icon className="h-2.5 w-2.5 text-white" />
                          </span>
                        </span>

                        <button
                          onClick={() => {
                            if (n.issue) openIssue(n.issue.id)
                            if (!n.read) markRead(n, true)
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="text-[13.5px] leading-snug">
                            {n.body}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[11.5px] text-faint">
                            {n.issue && (
                              <span className="rounded bg-raised px-1.5 py-0.5 font-mono">
                                {issueKey({ project: n.issue.project, number: n.issue.number })}
                              </span>
                            )}
                            {n.issue && <span className="truncate">{n.issue.title}</span>}
                            <span className="ml-auto shrink-0">{relativeTime(n.createdAt)}</span>
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => markRead(n, !n.read)}
                            className="rounded-md p-1.5 text-faint hover:bg-raised hover:text-fg"
                            title={n.read ? 'Mark unread' : 'Mark read'}
                          >
                            {n.read ? <CircleDot className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent dot-live" />}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          ))}
        </div>
      )}
    </div>
  )
}
