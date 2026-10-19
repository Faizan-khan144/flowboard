import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, List, Timer, Inbox as InboxIcon, Users, Settings, Star,
  ChevronDown, ChevronLeft, ChevronRight, Plus, Link2, Bookmark, CircleDot, X, Sparkles,
} from 'lucide-react'
import Logo from './Logo'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import { teamInviteUrl } from '../lib/share'
import { ROLES } from '../lib/constants'
import Avatar from './Avatar'

export default function Sidebar({ team, onNewIssue }) {
  const { user, teams, teamId, selectTeam } = useAuth()
  const { activeProjectId, setActiveProject, sidebarCollapsed, toggleCollapse, sidebarOpen, toggleSidebar, toast } = useUI()
  const navigate = useNavigate()
  const [views, setViews] = useState([])
  const [starred, setStarred] = useState([])
  const [showWorkspaces, setShowWorkspaces] = useState(false)

  const projects = (team?.projects || []).filter((p) => !p.archived)

  useEffect(() => {
    api('/users/me/starred').then(setStarred).catch(() => {})
  }, [])

  useEffect(() => {
    if (!teamId) return
    api(`/users/me/views?teamId=${teamId}`).then(setViews).catch(() => {})
  }, [teamId])

  async function toggleStar(e, projectId) {
    e.stopPropagation()
    e.preventDefault()
    const res = await api(`/users/me/starred/${projectId}`, { method: 'POST' }).catch(() => null)
    if (!res) return
    setStarred((list) => (res.starred ? [...list, projectId] : list.filter((id) => id !== projectId)))
    toast(res.starred ? 'Pinned project' : 'Unpinned project')
  }

  const navItems = [
    { to: '/app', label: 'Home', icon: Home, end: true },
    { to: '/app/issues?assignee=me', label: 'My issues', icon: List },
    { to: '/app/inbox', label: 'Inbox', icon: InboxIcon, badgeKey: 'inbox' },
    { to: '/app/cycles', label: 'Cycles', icon: Timer },
    { to: '/app/team', label: 'People', icon: Users },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ]

  const roleLabel = ROLES.find((r) => r.id === team?.role)?.label || 'Member'
  const collapsed = sidebarCollapsed

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px] md:hidden" onClick={() => toggleSidebar(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-line bg-white transition-[width,transform] duration-300 md:static md:z-auto md:translate-x-0 ${
          collapsed ? 'md:w-[68px]' : 'md:w-[248px]'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-[248px]`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >

        <div className="flex h-14 items-center gap-2 border-b border-line px-3">
          <NavLink to="/" className="group flex items-center" title="Flowboard home">
            <span className="transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-105">
              <Logo size={collapsed ? 30 : 28} withWord={!collapsed} wordClass="text-[15px]" />
            </span>
          </NavLink>
          <button
            onClick={() => toggleSidebar(false)}
            className="ml-auto rounded-lg p-1.5 text-faint hover:bg-raised md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={toggleCollapse}
            className="ml-auto hidden rounded-lg p-1.5 text-faint transition-colors hover:bg-raised hover:text-fg md:block"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative px-2 pt-2">
          <button
            onClick={() => setShowWorkspaces((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-raised"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-[11px] font-bold text-white">
              {(team?.name || 'F')[0]}
            </span>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold">{team?.name || 'Workspace'}</span>
                <span className="block truncate text-[11px] text-faint">
                  {roleLabel} · {(team?.members?.length || 0) === 1 ? 'just you' : `${team?.members?.length} members`}
                </span>
              </span>
            )}
            {!collapsed && <ChevronDown className={`h-3.5 w-3.5 text-faint transition-transform ${showWorkspaces ? 'rotate-180' : ''}`} />}
          </button>

          {showWorkspaces && !collapsed && (
            <div className="dropdown-in absolute left-2 right-2 top-[54px] z-50 rounded-xl border border-line bg-white p-1.5 shadow-2xl shadow-slate-900/15">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    selectTeam(t.id)
                    setShowWorkspaces(false)
                    navigate('/app/board')
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors hover:bg-raised ${
                    t.id === teamId ? 'font-medium' : 'text-muted'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-white">{t.name[0]}</span>
                  <span className="flex-1 truncate">{t.name}</span>
                  {t.id === teamId && <CircleDot className="h-3.5 w-3.5 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="mt-2 flex flex-col gap-0.5 px-2">
          {navItems.map(({ to, label, icon: Icon, badgeKey, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => toggleSidebar(false)}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13.5px] transition-all duration-200 ${
                  isActive ? 'bg-accent/10 font-medium text-accent' : 'text-muted hover:bg-raised hover:text-fg'
                } ${collapsed ? 'md:justify-center' : ''}`
              }
              title={label}
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {!collapsed && badgeKey === 'inbox' && team?.unread > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">{team.unread}</span>
              )}
            </NavLink>
          ))}
          <button
            onClick={onNewIssue}
            className={`mt-1 flex items-center gap-2.5 rounded-xl border border-dashed border-line px-2.5 py-2 text-[13.5px] text-muted transition-all hover:border-accent/50 hover:bg-accent/5 hover:text-accent ${
              collapsed ? 'md:justify-center' : ''
            }`}
            title="New issue (c)"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!collapsed && <span>New issue</span>}
          </button>
        </nav>

        <div className="thin-scroll mt-3 flex-1 overflow-y-auto px-2 pb-2">

          <div className="mt-2">
            {!collapsed && (
              <div className="flex items-center justify-between px-2.5 pb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">Projects</span>
                <button onClick={() => navigate('/app/team')} className="text-faint transition-colors hover:text-accent" title="Manage projects">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {projects.map((p) => {
              const active = p.id === activeProjectId
              const isStarred = starred.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProject(p.id)
                    navigate('/app/board')
                    toggleSidebar(false)
                  }}
                  className={`group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13.5px] transition-all duration-200 ${
                    active ? 'bg-accent/10 font-medium text-accent' : 'text-muted hover:bg-raised hover:text-fg'
                  } ${collapsed ? 'md:justify-center' : ''}`}
                  title={p.name}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm transition-transform duration-300 group-hover:scale-125" style={{ background: p.color }} />
                  {!collapsed && <span className="flex-1 truncate">{p.name}</span>}
                  {!collapsed && (
                    <span
                      onClick={(e) => toggleStar(e, p.id)}
                      className={`rounded p-0.5 transition-all ${isStarred ? 'text-amber-400' : 'text-transparent group-hover:text-faint hover:!text-amber-400'}`}
                      title={isStarred ? 'Unpin' : 'Pin project'}
                    >
                      <Star className="h-3.5 w-3.5" fill={isStarred ? 'currentColor' : 'none'} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {views.length > 0 && (
            <div className="mt-3">
              {!collapsed && <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Views</div>}
              {views.map((v) => (
                <button
                  key={v.id}
                  onClick={() => navigate('/app/issues', { state: { viewConfig: v.config, viewName: v.name } })}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13.5px] text-muted transition-colors hover:bg-raised hover:text-fg ${
                    collapsed ? 'md:justify-center' : ''
                  }`}
                  title={v.name}
                >
                  <Bookmark className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{v.name}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-line p-2">
          <button
            onClick={async () => {
              const url = await teamInviteUrl(team)
              if (url) {
                await navigator.clipboard.writeText(url).catch(() => {})
                toast('Invite link copied — they can request access', { tone: 'success' })
              }
            }}
            className={`sheen-hover mb-1 flex w-full items-center gap-2.5 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-2.5 py-2 text-[13px] font-medium text-white shadow-lg shadow-accent/25 transition-transform hover:-translate-y-0.5 ${
              collapsed ? 'md:justify-center' : ''
            }`}
            title="Invite people"
          >
            <Link2 className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Invite people</span>}
          </button>
          <div className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 ${collapsed ? 'md:justify-center' : ''}`}>
            <Avatar user={user} size={28} presence />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{user?.name}</div>
                <div className="flex items-center gap-1 truncate text-[11px] text-faint">
                  <Sparkles className="h-3 w-3 text-accent" /> {roleLabel}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
