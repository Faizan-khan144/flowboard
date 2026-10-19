import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Settings as SettingsIcon, User, Building2, Keyboard, MonitorSmartphone, LogOut, Check,
  Save, Palette, Command, Sparkles, Info, Shield,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import { modKey } from '../lib/utils'
import Avatar from '../components/Avatar'

const COLORS = ['#5b5bd6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6b7280']

const SHORTCUTS = [
  ['⌘/Ctrl + K', 'Open the command menu'],
  ['/', 'Jump into search'],
  ['c', 'Create an issue'],
  ['g then b', 'Go to board'],
  ['g then h', 'Go to home dashboard'],
  ['g then i', 'Go to issue list'],
  ['g then t', 'Go to timeline'],
  ['g then c', 'Go to cycles'],
  ['g then n', 'Go to inbox'],
  ['j / k', 'Move down / up the list'],
  ['Enter', 'Open the focused issue'],
  ['x', 'Select the focused issue'],
  ['1 – 5', 'Set status on the open issue'],
  ['Esc', 'Close the drawer'],
]

export default function Settings() {
  const { team, reloadTeam } = useOutletContext()
  const { user, updateUser } = useAuth()
  const { toast, sidebarCollapsed, toggleCollapse } = useUI()
  const [profile, setProfile] = useState({ name: '', title: '', bio: '', timezone: '' })
  const [workspace, setWorkspace] = useState({ name: '', description: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingWorkspace, setSavingWorkspace] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('fb_reduce_motion') === '1')
  const [tab, setTab] = useState('profile')

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', title: user.title || '', bio: user.bio || '', timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone })
  }, [user])

  useEffect(() => {
    if (team) setWorkspace({ name: team.name || '', description: team.description || '' })
  }, [team])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
    localStorage.setItem('fb_reduce_motion', reduceMotion ? '1' : '0')
  }, [reduceMotion])

  async function saveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const updated = await api('/users/me', { method: 'PATCH', body: profile })
      updateUser(updated)
      toast('Profile saved', { tone: 'success' })
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveWorkspace(e) {
    e.preventDefault()
    setSavingWorkspace(true)
    try {
      await api(`/teams/${team.id}`, { method: 'PATCH', body: workspace })
      toast('Workspace updated', { tone: 'success' })
      reloadTeam()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setSavingWorkspace(false)
    }
  }

  async function setAvatarColor(color) {
    updateUser({ avatarColor: color })
    try {
      await api('/users/me', { method: 'PATCH', body: { avatarColor: color } })
      toast('Avatar colour updated')
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  async function leave() {
    if (!confirm(`Leave ${team.name}? Your issues stay with the workspace.`)) return
    try {
      await api(`/teams/${team.id}/members/${user.id}`, { method: 'DELETE' })
      toast('You left the workspace')
      useAuth.getState().logout()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    }
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'workspace', label: 'Workspace', icon: Building2 },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'about', label: 'About', icon: Info },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-tight">
        <SettingsIcon className="h-5 w-5 text-accent" /> Settings
      </h1>
      <p className="mt-1 text-[14px] text-muted">Your account, this workspace, and how the app feels.</p>

      <div className="mt-6 flex flex-wrap items-center gap-1 rounded-xl border border-line bg-raised/60 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-all ${tab === id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
          >
            <Icon className={`h-3.5 w-3.5 ${tab === id ? 'text-accent' : ''}`} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="app-card a-up p-6">
            <div className="flex items-center gap-4">
              <Avatar user={user} size={56} />
              <div>
                <div className="text-[15px] font-semibold">{user?.name}</div>
                <div className="text-[13px] text-faint">{user?.email}</div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Avatar colour</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${user?.avatarColor === c ? 'ring-2 ring-offset-2 ring-accent' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-muted">Full name</span>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="app-input h-10 text-[13.5px]" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-muted">Job title</span>
                <input value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} placeholder="Frontend engineer" className="app-input h-10 text-[13.5px]" />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[12px] font-medium text-muted">Timezone</span>
                <input value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })} className="app-input h-10 text-[13.5px]" />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[12px] font-medium text-muted">Short bio</span>
                <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} placeholder="What you work on." className="app-input resize-none py-2.5 text-[13.5px]" />
              </label>
            </div>

            <button type="submit" disabled={savingProfile} className="app-btn app-btn-primary mt-5 h-10 gap-1.5 px-5 text-[13px] disabled:opacity-60">
              <Save className="h-4 w-4" /> {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        )}

        {tab === 'workspace' && (
          <div className="flex flex-col gap-4">
            <form onSubmit={saveWorkspace} className="app-card a-up p-6">
              <h2 className="text-[15px] font-semibold">Workspace details</h2>
              <p className="mt-1 text-[13px] text-muted">
                {team?.role === 'OWNER' ? 'Only owners can rename the workspace.' : 'Ask an owner to change these details.'}
              </p>
              <div className="mt-4 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-muted">Name</span>
                  <input
                    value={workspace.name}
                    disabled={team?.role !== 'OWNER'}
                    onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
                    className="app-input h-10 text-[13.5px] disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-muted">Description</span>
                  <textarea
                    value={workspace.description}
                    disabled={team?.role !== 'OWNER'}
                    onChange={(e) => setWorkspace({ ...workspace, description: e.target.value })}
                    rows={3}
                    className="app-input resize-none py-2.5 text-[13.5px] disabled:opacity-60"
                  />
                </label>
                <div className="flex items-center gap-3 text-[12.5px] text-faint">
                  <span className="font-mono">{team?.slug}</span>
                  <span>·</span>
                  <span>{team?.members?.length === 1 ? '1 member' : `${team?.members?.length} members`}</span>
                  <span>·</span>
                  <span>{team?.projects?.length} projects</span>
                </div>
              </div>
              {team?.role === 'OWNER' && (
                <button type="submit" disabled={savingWorkspace} className="app-btn app-btn-primary mt-5 h-10 gap-1.5 px-5 text-[13px] disabled:opacity-60">
                  <Save className="h-4 w-4" /> {savingWorkspace ? 'Saving…' : 'Save workspace'}
                </button>
              )}
            </form>

            <div className="app-card a-up border-red-200 p-6" style={{ animationDelay: '60ms' }}>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-red-600"><Shield className="h-4 w-4" /> Danger zone</h2>
              <p className="mt-1 text-[13px] text-muted">Leaving removes your access immediately. Your issues and comments stay in the workspace.</p>
              <button onClick={leave} className="app-btn mt-4 h-10 gap-1.5 border border-red-200 px-5 text-[13px] text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Leave {team?.name}
              </button>
            </div>
          </div>
        )}

        {tab === 'preferences' && (
          <div className="flex flex-col gap-4">
            <div className="app-card a-up p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Sparkles className="h-4 w-4 text-accent" /> Motion</h2>
              <p className="mt-1 text-[13px] text-muted">Animations are on by default. Turn them down if you prefer a stiller screen.</p>
              <Toggle
                className="mt-4"
                checked={reduceMotion}
                onChange={setReduceMotion}
                label="Reduce motion"
                hint="Cuts entrance animations and hover transitions"
              />
            </div>

            <div className="app-card a-up p-6" style={{ animationDelay: '60ms' }}>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold"><MonitorSmartphone className="h-4 w-4 text-accent" /> Layout</h2>
              <Toggle
                className="mt-4"
                checked={sidebarCollapsed}
                onChange={toggleCollapse}
                label="Collapse the sidebar"
                hint="Show icons only — shortcuts still work"
              />
            </div>

            <div className="app-card a-up p-6" style={{ animationDelay: '120ms' }}>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Command className="h-4 w-4 text-accent" /> Command menu</h2>
              <p className="mt-1 text-[13px] text-muted">
                Press <span className="kbd">{modKey()}</span> <span className="kbd">K</span> anywhere to search issues, jump between views or copy the invite link.
              </p>
            </div>
          </div>
        )}

        {tab === 'shortcuts' && (
          <div className="app-card a-up p-6">
            <h2 className="text-[15px] font-semibold">Keyboard shortcuts</h2>
            <p className="mt-1 text-[13px] text-muted">Every one of these works anywhere inside the app.</p>
            <div className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
              {SHORTCUTS.map(([keys, label], i) => (
                <div key={keys} className="a-up flex items-center justify-between gap-4 border-b border-line/60 py-2.5 last:border-0" style={{ animationDelay: `${i * 25}ms` }}>
                  <span className="text-[13px] text-muted">{label}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {keys.split(' ').map((k, ki) => (
                      k === 'then' || k === '/' ? <span key={ki} className="px-1 text-[11px] text-faint">{k}</span> : <kbd key={ki} className="kbd">{k}</kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'about' && (
          <div className="app-card a-up p-6">
            <h2 className="text-[15px] font-semibold">About this build</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Fact label="Front end" value="React 19 · Vite · Tailwind CSS 4" />
              <Fact label="Back end" value="Express 5 · Prisma · SQLite" />
              <Fact label="Realtime" value="Socket.IO rooms per team" />
              <Fact label="Auth" value="Email + password, JWT sessions" />
              <Fact label="Sign-in" value={useAuth.getState().isGuest ? 'You are in the shared demo session' : `Signed in as ${user?.email}`} />
              <Fact label="Your role here" value={team?.role ? team.role.toLowerCase() : '—'} />
            </div>
            <p className="mt-5 text-[12.5px] text-faint">
              No analytics scripts, no third-party trackers, no hidden telemetry. Everything you see comes from this app's own API.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-raised/40 px-4 py-3">
      <div className="text-[11.5px] font-medium uppercase tracking-wide text-faint">{label}</div>
      <div className="mt-1 text-[13.5px]">{value}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label, hint, className = '' }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`flex w-full items-center gap-3 text-left ${className}`}>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </span>
      <span>
        <span className="block text-[13.5px] font-medium">{label}</span>
        <span className="block text-[12.5px] text-faint">{hint}</span>
      </span>
      {checked && <Check className="ml-auto h-4 w-4 text-accent" />}
    </button>
  )
}
