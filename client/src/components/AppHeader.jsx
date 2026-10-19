import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, Bell, Plus, ChevronDown, Check, LogOut, Settings, Link2, Home,
  CircleUser, Inbox as InboxIcon, UserPlus, MessageSquare, ArrowRight, Menu, Command,
} from 'lucide-react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import { relativeTime } from '../lib/constants'
import { teamInviteUrl } from '../lib/share'
import { modKey } from '../lib/utils'
import Avatar from './Avatar'

const TYPE_ICON = {
  assigned: UserPlus,
  comment: MessageSquare,
  request: CircleUser,
  invite: UserPlus,
  reaction: Bell,
  mention: MessageSquare,
}

export default function AppHeader({ team, onNewIssue, onOpenMobile }) {
  const { user, teams, teamId, selectTeam, logout } = useAuth()
  const { activeProjectId, setActiveProject, toggleCommand, openIssue, toast } = useUI()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [online, setOnline] = useState([])
  const [deleted, setDeleted] = useState([])
  const wrapRef = useRef(null)

  const projects = (team?.projects || []).filter((p) => !p.archived)
  const project = projects.find((p) => p.id === activeProjectId) || projects[0]

  useEffect(() => {
    if (!project && projects.length) setActiveProject(projects[0].id)
  }, [project, projects, setActiveProject])

  useEffect(() => {
    if (!team) return
    api('/notifications')
      .then((d) => {
        setNotifs(d.notifications)
        setUnread(d.unread)
      })
      .catch(() => {})
  }, [team?.id])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !team?.id) return
    socket.emit('team:join', team.id)
    const onNotif = (payload) => {
      api('/notifications')
        .then((d) => {
          setNotifs(d.notifications)
          setUnread(d.unread)
        })
        .catch(() => {})
      if (payload?.body) toast(payload.body)
    }
    const onPresence = (payload) => {
      if (payload.teamId === team.id) setOnline(payload.users || [])
    }
    socket.on('notification', onNotif)
    socket.on('presence:update', onPresence)
    socket.emit('presence:ping', team.id)
    return () => {
      socket.off('notification', onNotif)
      socket.off('presence:update', onPresence)
    }
  }, [team?.id])

  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowNotifs(false)
        setShowUser(false)
        setShowProjects(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function markAllRead() {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {})
    setNotifs((list) => list.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  async function openNotif(n) {
    if (!n.read) {
      api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {})
      setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnread((u) => Math.max(0, u - 1))
    }
    setShowNotifs(false)
    if (n.issue) openIssue(n.issue.id)
    else if (n.type === 'request') navigate('/app/team')
  }

  const pinned = online.slice(0, 4)
  const extra = Math.max(0, online.length - 4)

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-white/85 px-3 backdrop-blur-xl md:px-4">
      <div ref={wrapRef} className="flex min-w-0 flex-1 items-center gap-2">
        <button onClick={onOpenMobile} className="app-btn app-btn-ghost h-9 w-9 md:hidden">
          <Menu className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setShowProjects((v) => !v)
              setShowNotifs(false)
              setShowUser(false)
            }}
            className="app-btn app-btn-ghost h-9 max-w-[52vw] gap-2 px-2.5 md:max-w-none"
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white"
              style={{ background: `linear-gradient(140deg, ${project?.color || '#5b5bd6'}, #a855f7)` }}
            >
              {(project?.key || team?.name || 'F')[0]}
            </span>
            <span className="truncate text-[13.5px] font-medium">{team?.name || 'Workspace'}</span>
            <span className="hidden text-faint sm:inline">/</span>
            <span className="hidden truncate text-[13.5px] text-muted sm:inline">{project?.name || 'Projects'}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-faint" />
          </button>

          {showProjects && (
            <div className="dropdown-in absolute left-0 top-11 z-50 w-[280px] rounded-xl border border-line bg-white p-2 shadow-2xl shadow-slate-900/15">
              <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Projects</div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProject(p.id)
                    setShowProjects(false)
                    navigate('/app/board')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px] transition-colors hover:bg-raised"
                >
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="font-mono text-[11px] text-faint">{p.key}</span>
                  {p.id === project?.id && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              ))}
              <div className="my-1 border-t border-line" />
              <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Workspaces</div>
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    selectTeam(t.id)
                    setShowProjects(false)
                    navigate('/app/board')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px] transition-colors hover:bg-raised"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-white">
                    {t.name[0]}
                  </span>
                  <span className="flex-1 truncate">{t.name}</span>
                  {t.id === teamId && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              ))}
              <div className="my-1 border-t border-line" />
              <button
                onClick={async () => {
                  const url = await teamInviteUrl(team)
                  if (url) {
                    await navigator.clipboard.writeText(url).catch(() => {})
                    toast('Invite link copied', { tone: 'success' })
                  }
                  setShowProjects(false)
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px] text-muted transition-colors hover:bg-raised"
              >
                <Link2 className="h-4 w-4" /> Copy invite link
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => toggleCommand(true)}
          className="app-btn app-btn-ghost ml-auto h-9 gap-2 px-3 text-muted md:ml-2 md:w-[260px] md:justify-start lg:w-[320px]"
        >
          <Search className="h-4 w-4" />
          <span className="hidden text-[13px] md:inline">Search or jump to…</span>
          <span className="ml-auto hidden items-center gap-1 md:flex">
            <span className="kbd">{modKey()}</span>
            <span className="kbd">K</span>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">

        <div className="mr-1 hidden items-center lg:flex">
          {pinned.length === 0 && <span className="text-[12px] text-faint">No one else online</span>}
          <div className="flex -space-x-2">
            {pinned.map((u) => (
              <Avatar key={u.id} user={u} size={26} ring presence className="a-zoom" />
            ))}
          </div>
          {extra > 0 && <span className="ml-2 text-[12px] text-faint">+{extra}</span>}
        </div>

        <button onClick={onNewIssue} className="app-btn app-btn-primary h-9 px-3 md:px-3.5 press">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New issue</span>
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs((v) => !v)
              setShowUser(false)
              setShowProjects(false)
            }}
            className="app-btn app-btn-ghost relative h-9 w-9"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="pop-in-scale absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="dropdown-in absolute right-0 top-11 z-50 w-[340px] overflow-hidden rounded-xl border border-line bg-white shadow-2xl shadow-slate-900/15">
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <span className="text-[13px] font-semibold">Inbox</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-[12px] font-medium text-accent hover:underline">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => { setShowNotifs(false); navigate('/app/inbox') }} className="text-[12px] text-muted hover:text-fg">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="thin-scroll max-h-[330px] overflow-y-auto">
                {notifs.length === 0 && (
                  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <span className="anim-float flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Check className="h-5 w-5" />
                    </span>
                    <p className="text-[13px] text-muted">You are all caught up.</p>
                  </div>
                )}
                {notifs.slice(0, 12).map((n) => {
                  const Icon = TYPE_ICON[n.type] || Bell
                  return (
                    <button
                      key={n.id}
                      onClick={() => openNotif(n)}
                      className={`flex w-full items-start gap-2.5 border-b border-line/60 px-3.5 py-2.5 text-left transition-colors last:border-0 hover:bg-raised/70 ${n.read ? 'opacity-60' : ''}`}
                    >
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${n.read ? 'bg-raised text-muted' : 'bg-accent/10 text-accent'}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] leading-snug">{n.body}</span>
                        <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-faint">
                          {relativeTime(n.createdAt)}
                          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                        </span>
                      </span>
                      {n.actor && <Avatar user={n.actor} size={20} />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowUser((v) => !v)
              setShowNotifs(false)
              setShowProjects(false)
            }}
            className="rounded-full ring-offset-2 transition-transform hover:scale-105 focus-ring"
          >
            <Avatar user={user} size={30} presence />
          </button>

          {showUser && (
            <div className="dropdown-in absolute right-0 top-11 z-50 w-[250px] overflow-hidden rounded-xl border border-line bg-white shadow-2xl shadow-slate-900/15">
              <div className="flex items-center gap-3 border-b border-line px-3.5 py-3">
                <Avatar user={user} size={36} />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold">{user?.name}</div>
                  <div className="truncate text-[12px] text-faint">{user?.email}</div>
                </div>
              </div>
              <div className="p-1.5">
                {[
                  { icon: Settings, label: 'Profile & settings', to: '/app/settings' },
                  { icon: InboxIcon, label: 'Inbox', to: '/app/inbox' },
                  { icon: Home, label: 'Landing page', to: '/' },
                ].map(({ icon: Icon, label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={() => setShowUser(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-muted transition-colors hover:bg-raised hover:text-fg"
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setShowUser(false)
                    logout()
                    navigate('/')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
              <div className="flex items-center gap-1.5 border-t border-line bg-bg px-3.5 py-2 text-[11px] text-faint">
                <Command className="h-3 w-3" /> Press <span className="kbd">{modKey()}</span> <span className="kbd">K</span> anywhere
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
