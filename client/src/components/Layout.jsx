import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import AppHeader from './AppHeader'
import Sidebar from './Sidebar'
import CommandMenu from './CommandMenu'
import NewIssue from './NewIssue'
import IssueDrawer from './IssueDrawer'
import Toasts from './Toasts'

export default function Layout() {
  const { user, teamId, loading, teams } = useAuth()
  const { sidebarOpen, toggleSidebar, toggleCommand, drawerIssueId, openIssue, closeIssue } = useUI()
  const navigate = useNavigate()
  const location = useLocation()
  const [team, setTeam] = useState(null)
  const [unread, setUnread] = useState(0)
  const [showNewIssue, setShowNewIssue] = useState(false)
  const [composerDefaults, setComposerDefaults] = useState(null)
  const gRef = useRef(0)

  async function loadTeam() {
    if (!teamId) return
    try {
      const data = await api(`/teams/${teamId}`)
      setTeam(data)

      const stored = useUI.getState().activeProjectId
      const projects = (data.projects || []).filter((p) => !p.archived)
      if (projects.length && !projects.some((p) => p.id === stored)) {
        useUI.getState().setActiveProject(projects[0].id)
      }
    } catch {

    }
  }

  async function loadUnread() {
    try {
      const data = await api('/notifications')
      setUnread(data.unread)
    } catch {

    }
  }

  useEffect(() => {
    setTeam(null)
    loadTeam()
    loadUnread()
  }, [teamId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onNotif = () => loadUnread()
    const onMembership = () => useAuth.getState().bootstrap()
    socket.on('notification', onNotif)
    socket.on('membership:changed', onMembership)
    return () => {
      socket.off('notification', onNotif)
      socket.off('membership:changed', onMembership)
    }
  }, [teamId])

  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleCommand(true)
        return
      }
      if (typing) return

      if (e.key === '/') {
        e.preventDefault()
        toggleCommand(true)
        return
      }
      if (e.key.toLowerCase() === 'c' && !e.shiftKey && !mod) {
        e.preventDefault()
        setComposerDefaults(null)
        setShowNewIssue(true)
        return
      }
      if (e.key === 'Escape' && drawerIssueId) {
        closeIssue()
        return
      }
      if (e.key.toLowerCase() === 'g') {
        gRef.current = Date.now()
        return
      }
      if (Date.now() - gRef.current < 900) {
        const map = { b: '/app/board', h: '/app', i: '/app/issues', c: '/app/cycles', n: '/app/inbox', t: '/app/team', s: '/app/settings' }
        const target = map[e.key.toLowerCase()]
        if (target) {
          e.preventDefault()
          navigate(target)
          gRef.current = 0
        }
      }
      const num = Number(e.key)
      if (num >= 1 && num <= 5) {
        const statuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED']
        window.dispatchEvent(new CustomEvent('fb:set-status', { detail: statuses[num - 1] }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerIssueId, navigate, toggleCommand, closeIssue])

  useEffect(() => {
    toggleSidebar(false)
  }, [location.pathname, toggleSidebar])

  if (loading || !user) {
    return (
      <div className="flex h-full items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent" />
          <span className="text-[13px] text-faint">Loading your workspace…</span>
        </div>
      </div>
    )
  }

  if (!teams.length) {
    return (
      <div className="flex h-full items-center justify-center bg-bg px-6 text-center">
        <div>
          <p className="text-[15px] font-medium">You are not in a workspace yet.</p>
          <button onClick={() => navigate('/welcome')} className="app-btn app-btn-primary mt-4 px-5 py-2.5">
            Set one up
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg">
      <Sidebar team={{ ...(team || {}), unread }} onNewIssue={() => { setComposerDefaults(null); setShowNewIssue(true) }} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          team={team || teams.find((t) => t.id === teamId)}
          onNewIssue={() => { setComposerDefaults(null); setShowNewIssue(true) }}
          onOpenMobile={() => toggleSidebar(true)}
        />
        <main key={location.pathname} className="app-fade thin-scroll min-h-0 flex-1 overflow-y-auto">
          <Outlet context={{ team, reloadTeam: loadTeam, unread, setUnread, newIssue: (defaults) => { setComposerDefaults(defaults || null); setShowNewIssue(true) }, openIssue }} />
        </main>
      </div>

      <CommandMenu team={team} onNewIssue={() => { setComposerDefaults(null); setShowNewIssue(true) }} />
      <NewIssue
        open={showNewIssue}
        onClose={() => setShowNewIssue(false)}
        team={team}
        defaultProjectId={composerDefaults?.projectId || useUI.getState().activeProjectId}
        defaultStatus={composerDefaults?.status}
        onCreated={(issue) => window.dispatchEvent(new CustomEvent('fb:issue-created', { detail: issue }))}
      />
      {drawerIssueId && <IssueDrawer issueId={drawerIssueId} team={team} onClose={closeIssue} onChanged={() => window.dispatchEvent(new CustomEvent('fb:issues-changed'))} />}
      <Toasts />
    </div>
  )
}
