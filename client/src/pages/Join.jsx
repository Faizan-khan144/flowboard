import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight, Check, Clock, Lock, Mail, Shield, UserPlus, X, Boxes, Users, AlertTriangle,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import Logo from '../components/Logo'
import Avatar from '../components/Avatar'

export default function Join() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, refreshTeams } = useAuth()
  const { toast } = useUI()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  async function load() {
    try {
      setData(await api(`/join/${token}`))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    load()
  }, [token])

  async function requestAccess() {
    setBusy(true)
    try {
      await api(`/join/${token}/request`, { method: 'POST', body: { note } })
      toast('Request sent — an owner will review it', { tone: 'success' })
      load()
    } catch (err) {
      if (err.status === 409) {
        await refreshTeams()
        toast('You are already in this workspace')
        navigate('/app/board')
        return
      }
      toast(err.message, { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function openWorkspace() {
    await refreshTeams()
    navigate('/app/board')
  }

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center"><Logo size={28} wordClass="text-[15px]" /></Link>
        {user && !authLoading && (
          <Link to="/app/board" className="text-[13px] text-muted hover:text-fg">Go to app</Link>
        )}
      </header>

      <div className="flex flex-1 items-start justify-center px-6 pb-16">
        <div className="w-full max-w-lg">
          {loading ? (
            <div className="app-card a-up p-8">
              <div className="mx-auto h-14 w-14 rounded-2xl skeleton" />
              <div className="mx-auto mt-5 h-6 w-48 rounded skeleton" />
              <div className="mx-auto mt-3 h-4 w-64 rounded skeleton" />
              <div className="mt-8 h-11 rounded-xl skeleton" />
            </div>
          ) : error ? (
            <div className="app-card a-up p-8 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <h1 className="text-[20px] font-bold tracking-tight">That link doesn't work</h1>
              <p className="mx-auto mt-2 max-w-sm text-[13.5px] text-muted">{error}</p>
              <Link to="/" className="app-btn app-btn-primary mt-6 inline-flex h-10 px-5 text-[13px]">Back to home</Link>
            </div>
          ) : (
            <div className="app-card a-up overflow-hidden">
              <div className="border-b border-line bg-raised/40 px-8 py-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-[18px] font-bold text-white" style={{ background: data.team.projects[0]?.color || '#5b5bd6' }}>
                  {data.team.name.slice(0, 1).toUpperCase()}
                </span>
                <h1 className="mt-4 text-[22px] font-bold tracking-tight">{data.team.name}</h1>
                {data.team.description && <p className="mx-auto mt-2 max-w-sm text-[13.5px] text-muted">{data.team.description}</p>}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[12px] text-faint">
                  <span className="flex items-center gap-1.5">              <Users className="h-3.5 w-3.5" /> {data.team.memberCount === 1 ? '1 member' : `${data.team.memberCount} members`}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><Boxes className="h-3.5 w-3.5" /> {data.team.projectCount} projects</span>
                  {data.invitedBy && <><span>·</span><span>invited by {data.invitedBy}</span></>}
                </div>
                <div className="mt-5 flex items-center justify-center gap-2">
                  {data.team.members.map((m) => (
                    <div key={m.id} className="tip" data-tip={m.name}>
                      <Avatar user={m} size={30} />
                    </div>
                  ))}
                </div>
                {data.team.projects.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
                    {data.team.projects.map((p) => (
                      <span key={p.id} className="chip" style={{ background: `${p.color}16`, color: p.color }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} /> {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-8 py-7">
                {data.expired || data.used ? (
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-2 text-[14px] font-medium text-amber-600">
                      <Clock className="h-4 w-4" /> {data.expired ? 'This invite link has expired' : 'This invite has been used up'}
                    </p>
                    <p className="mt-2 text-[13px] text-muted">Ask an owner to send you a fresh link.</p>
                  </div>
                ) : data.membership ? (
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-2 text-[14px] font-medium text-emerald-600">
                      <Check className="h-4 w-4" /> You are already a {data.membership.role.toLowerCase()} of this workspace
                    </p>
                    <button onClick={openWorkspace} className="app-btn app-btn-primary mt-5 h-11 w-full gap-1.5 justify-center text-[14px] press">
                      Open the workspace <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : data.request && data.request.status === 'PENDING' ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-center">
                    <p className="flex items-center justify-center gap-2 text-[14px] font-medium text-amber-700">
                      <Clock className="h-4 w-4" /> Your request is waiting for approval
                    </p>
                    <p className="mt-2 text-[13px] text-amber-700/80">
                      An owner of {data.team.name} will approve or decline it. You will get a notification either way.
                    </p>
                    <button onClick={load} className="app-btn app-btn-ghost mt-4 h-9 px-4 text-[12.5px]">Check again</button>
                  </div>
                ) : data.request && data.request.status === 'DENIED' ? (
                  <div className="rounded-2xl border border-line bg-raised/50 p-5 text-center">
                    <p className="flex items-center justify-center gap-2 text-[14px] font-medium">
                      <X className="h-4 w-4 text-red-500" /> Your last request was declined
                    </p>
                    <p className="mt-2 text-[13px] text-muted">You can ask again if something changed — the owner will review it fresh.</p>
                    <button onClick={requestAccess} disabled={busy} className="app-btn app-btn-primary mt-4 h-10 px-5 text-[13px] disabled:opacity-60">
                      {busy ? 'Sending…' : 'Request access again'}
                    </button>
                  </div>
                ) : !user || authLoading ? (
                  <div>
                    <div className="rounded-2xl border border-line bg-raised/40 p-5">
                      <p className="flex items-start gap-2.5 text-[13.5px] text-muted">
                        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        Joining {data.team.name} needs an account. Create one in a few seconds, then the owner approves your request.
                      </p>
                    </div>
                    <div className="mt-5 flex flex-col gap-2">
                      <button
                        onClick={() => navigate('/signup', { state: { next: `/join/${token}` } })}
                        className="app-btn app-btn-primary h-11 gap-1.5 justify-center text-[14px] press"
                      >
                        <UserPlus className="h-4 w-4" /> Create an account to request access
                      </button>
                      <button
                        onClick={() => navigate('/login', { state: { next: `/join/${token}` } })}
                        className="app-btn app-btn-ghost h-11 gap-1.5 justify-center text-[13.5px]"
                      >
                        <Mail className="h-4 w-4" /> I already have an account
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="rounded-2xl border border-line bg-raised/40 p-5">
                      <p className="flex items-start gap-2.5 text-[13.5px] text-muted">
                        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        You'll join as a <span className="font-medium text-fg">{data.role.toLowerCase()}</span>. An owner has to approve
                        your request first — no one gets in silently.
                      </p>
                    </div>
                    <label className="mt-4 flex flex-col gap-1.5">
                      <span className="text-[12px] font-medium text-muted">Add a note (optional)</span>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder={`Hi, I'd like to help with ${data.team.name}.`}
                        className="app-input resize-none py-2.5 text-[13.5px]"
                      />
                    </label>
                    <button onClick={requestAccess} disabled={busy} className="app-btn app-btn-primary mt-4 h-11 w-full gap-1.5 justify-center text-[14px] press disabled:opacity-60">
                      {busy ? 'Sending request…' : 'Request to join'} <ArrowRight className="h-4 w-4" />
                    </button>
                    <p className="mt-3 text-center text-[12px] text-faint">
                      Signed in as {user.email} · <button onClick={() => useAuth.getState().logout()} className="underline decoration-dotted">switch account</button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
