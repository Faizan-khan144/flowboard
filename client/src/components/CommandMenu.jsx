import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft, ArrowRight, Hash, User, CircleDot, Plus, LayoutGrid, List, Inbox, Users, Timer, Settings, LogOut, Link2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import { statusMeta, priorityMeta } from '../lib/constants'
import { teamInviteUrl } from '../lib/share'
import Avatar from './Avatar'

export default function CommandMenu({ team, onNewIssue }) {
  const open = useUI((s) => s.commandOpen)
  const toggle = useUI((s) => s.toggleCommand)
  const openIssue = useUI((s) => s.openIssue)
  const toast = useUI((s) => s.toast)
  const { teamId } = useAuth()
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
    else {
      setQ('')
      setResults(null)
      setCursor(0)
    }
  }, [open])

  useEffect(() => {
    if (!open || !q.trim()) {
      setResults(null)
      return
    }
    let alive = true
    const t = setTimeout(() => {
      api(`/search?q=${encodeURIComponent(q)}&teamId=${teamId || ''}`)
        .then((data) => alive && setResults(data))
        .catch(() => alive && setResults(null))
    }, 140)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [q, open, teamId])

  const actions = useMemo(
    () => [
      { id: 'new', label: 'Create new issue', icon: Plus, run: () => onNewIssue?.() },
      { id: 'board', label: 'Go to board', icon: LayoutGrid, run: () => navigate('/app/board') },
      { id: 'issues', label: 'Go to all issues', icon: List, run: () => navigate('/app/issues') },
      { id: 'cycles', label: 'Go to cycles', icon: Timer, run: () => navigate('/app/cycles') },
      { id: 'inbox', label: 'Go to inbox', icon: Inbox, run: () => navigate('/app/inbox') },
      { id: 'team', label: 'Canvas & people', icon: Users, run: () => navigate('/app/team') },
      { id: 'settings', label: 'Settings', icon: Settings, run: () => navigate('/app/settings') },
      {
        id: 'invite',
        label: 'Copy invite link',
        icon: Link2,
        run: async () => {
          const url = await teamInviteUrl(team)
          if (url) {
            await navigator.clipboard.writeText(url).catch(() => {})
            toast('Invite link copied — anyone can request access', { tone: 'success' })
          }
        },
      },
      { id: 'logout', label: 'Log out', icon: LogOut, run: () => { logout(); navigate('/') } },
    ],
    [navigate, team, toast, onNewIssue, logout],
  )

  const filteredActions = q.trim()
    ? actions.filter((a) => a.label.toLowerCase().includes(q.toLowerCase()))
    : actions

  const flat = useMemo(() => {
    const items = []
    if (results) {
      results.issues?.forEach((i) => items.push({ type: 'issue', item: i }))
      results.projects?.forEach((p) => items.push({ type: 'project', item: p }))
      results.people?.forEach((p) => items.push({ type: 'person', item: p }))
      results.labels?.forEach((l) => items.push({ type: 'label', item: l }))
    }
    filteredActions.forEach((a) => items.push({ type: 'action', item: a }))
    return items
  }, [results, filteredActions])

  useEffect(() => setCursor(0), [q, results])

  if (!open) return null

  function run(entry) {
    toggle(false)
    if (entry.type === 'issue') openIssue(entry.item.id)
    else if (entry.type === 'project') {
      useUI.getState().setActiveProject(entry.item.id)
      navigate('/app/board')
    } else if (entry.type === 'person') navigate('/app/team')
    else if (entry.type === 'label') navigate('/app/issues')
    else if (entry.type === 'action') entry.item.run()
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter' && flat[cursor]) {
      e.preventDefault()
      run(flat[cursor])
    }
  }

  let index = -1
  const renderRow = (entry) => {
    index += 1
    const active = index === cursor
    const i = entry.item
    const base = `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors ${active ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-raised'}`

    if (entry.type === 'issue') {
      const s = statusMeta(i.status)
      const p = priorityMeta(i.priority)
      return (
        <button key={`i-${i.id}`} onMouseDown={(e) => e.preventDefault()} onClick={() => run(entry)} className={base}>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
          <span className="w-16 shrink-0 font-mono text-[11.5px] text-faint">
            {i.project?.key}-{i.number}
          </span>
          <span className="flex-1 truncate">{i.title}</span>
          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: p.color }} title={p.label} />
        </button>
      )
    }
    if (entry.type === 'project')
      return (
        <button key={`p-${i.id}`} onMouseDown={(e) => e.preventDefault()} onClick={() => run(entry)} className={base}>
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{i.name}</span>
          <span className="font-mono text-[11px] text-faint">{i.key}</span>
        </button>
      )
    if (entry.type === 'person')
      return (
        <button key={`u-${i.id}`} onMouseDown={(e) => e.preventDefault()} onClick={() => run(entry)} className={base}>
          <Avatar user={i} size={20} />
          <span className="flex-1 truncate">{i.name}</span>
          <span className="truncate text-[11.5px] text-faint">{i.email}</span>
        </button>
      )
    if (entry.type === 'label')
      return (
        <button key={`l-${i.id}`} onMouseDown={(e) => e.preventDefault()} onClick={() => run(entry)} className={base}>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: i.color }} />
          <span className="flex-1 truncate">{i.name}</span>
        </button>
      )
    const Icon = i.icon
    return (
      <button key={`a-${i.id}`} onMouseDown={(e) => e.preventDefault()} onClick={() => run(entry)} className={base}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{i.label}</span>
      </button>
    )
  }

  const hasIssues = results?.issues?.length
  const hasProjects = results?.projects?.length
  const hasPeople = results?.people?.length
  const hasLabels = results?.labels?.length

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]" onMouseDown={() => toggle(false)}>
      <div className="drawer-scrim absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" />
      <div
        className="cmd-in relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl shadow-slate-900/20"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
          <Search className="h-4 w-4 text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search issues, projects, people — or type a command"
            className="flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-faint"
          />
          <span className="kbd">esc</span>
        </div>

        <div className="thin-scroll max-h-[52vh] overflow-y-auto p-2">
          {q && !results && <div className="px-3 py-6 text-center text-[13px] text-faint">Searching…</div>}

          {hasIssues > 0 && <Group label="Issues">{results.issues.map((i) => renderRow({ type: 'issue', item: i }))}</Group>}
          {hasProjects > 0 && <Group label="Projects">{results.projects.map((p) => renderRow({ type: 'project', item: p }))}</Group>}
          {hasPeople > 0 && <Group label="People">{results.people.map((p) => renderRow({ type: 'person', item: p }))}</Group>}
          {hasLabels > 0 && <Group label="Labels">{results.labels.map((l) => renderRow({ type: 'label', item: l }))}</Group>}
          {filteredActions.length > 0 && <Group label="Actions">{filteredActions.map((a) => renderRow({ type: 'action', item: a }))}</Group>}

          {q && results && !hasIssues && !hasProjects && !hasPeople && !hasLabels && !filteredActions.length && (
            <div className="px-3 py-6 text-center text-[13px] text-faint">Nothing matched “{q}”.</div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-bg px-4 py-2.5 text-[11.5px] text-faint">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="kbd">↑</span>
              <span className="kbd">↓</span> navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> open
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <CircleDot className="h-3 w-3" /> <Hash className="h-3 w-3" /> <User className="h-3 w-3" /> indexed across your workspaces
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  )
}

function Group({ label, children }) {
  return (
    <div className="mb-1">
      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">{label}</div>
      {children}
    </div>
  )
}
