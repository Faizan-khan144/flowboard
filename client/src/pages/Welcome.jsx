import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles, ArrowRight, Check, Plus, Link2, Copy, Rocket, Users, Boxes, PartyPopper,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import { copyText } from '../lib/share'
import Logo from '../components/Logo'
import Avatar from '../components/Avatar'

export default function Welcome() {
  const { user, teams, teamId, loading, clearIsNew } = useAuth()
  const { toast } = useUI()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [team, setTeam] = useState(null)
  const [issueTitle, setIssueTitle] = useState('')
  const [created, setCreated] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/signup', { replace: true })
  }, [loading, user, navigate])

  useEffect(() => {
    if (teamId) api(`/teams/${teamId}`).then(setTeam).catch(() => {})
  }, [teamId])

  const inviteUrl = team ? `${window.location.origin}/join/${team.inviteCode}` : ''
  const firstProject = useMemo(() => team?.projects?.find((p) => !p.archived), [team])

  useEffect(() => {
    clearIsNew?.()
  }, [clearIsNew])

  async function addIssue(e) {
    e?.preventDefault()
    if (!issueTitle.trim() || !firstProject) return
    setBusy(true)
    try {
      const issue = await api('/issues', { method: 'POST', body: { projectId: firstProject.id, title: issueTitle.trim(), status: 'TODO' } })
      setCreated((prev) => [...prev, issue])
      setIssueTitle('')
      toast('Issue created', { tone: 'success' })
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  function finish() {
    navigate('/app/board')
  }

  if (loading || !user) {
    return (
      <div className="flex h-full items-center justify-center bg-bg">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    )
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-bg">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece absolute top-[-10px] h-2.5 w-1.5 rounded-sm"
            style={{
              left: `${(i * 5.6) % 100}%`,
              background: ['#5b5bd6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][i % 5],
              animationDelay: `${i * 160}ms`,
              animationDuration: `${2600 + (i % 5) * 400}ms`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex min-h-full max-w-2xl flex-col items-center px-6 py-16">
        <div className="a-bounce mb-6">
          <Logo size={56} withWord={false} />
        </div>

        <div className="mb-8 flex items-center gap-2">
          {['Welcome', 'First issue', 'Invite', 'Done'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`flex h-6 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-medium transition-all ${
                i === step ? 'bg-accent text-white' : i < step ? 'bg-accent/10 text-accent' : 'bg-raised text-faint'
              }`}>
                {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                {label}
              </span>
              {i < 3 && <span className={`h-px w-5 ${i < step ? 'bg-accent/40' : 'bg-line'}`} />}
            </div>
          ))}
        </div>

        <div key={step} className="app-card a-up w-full rounded-3xl p-8 text-center shadow-xl shadow-slate-900/5">
          {step === 0 && (
            <>
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <PartyPopper className="h-6 w-6" />
              </span>
              <h1 className="text-[26px] font-bold tracking-tight">Welcome aboard, {user.name.split(' ')[0]}</h1>
              <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-muted">
                {team
                  ? <>Your workspace <span className="font-medium text-fg">{team.name}</span> is ready with a <span className="font-medium text-fg">{firstProject?.name || 'Main'}</span> project and a fresh set of labels.</>
                  : 'Your workspace is being set up.'}
              </p>
              <div className="mt-6 flex items-center justify-center gap-4 text-[12.5px] text-faint">
                <span className="flex items-center gap-1.5"><Boxes className="h-3.5 w-3.5" /> {team?.projects?.length || 0} projects</span>
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> just you so far</span>
              </div>
              <button onClick={() => setStep(1)} className="app-btn app-btn-primary mt-8 h-11 gap-1.5 px-6 text-[14px] press">
                Let's add your first issue <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Plus className="h-6 w-6" />
              </span>
              <h1 className="text-[24px] font-bold tracking-tight">What are you working on?</h1>
              <p className="mx-auto mt-3 max-w-md text-[14px] text-muted">
                Everything starts as an issue. Add one in {firstProject?.name || 'your project'} — you can rename it later.
              </p>
              <form onSubmit={addIssue} className="mx-auto mt-6 flex max-w-md items-center gap-2">
                <input
                  autoFocus
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="e.g. Fix the mobile overflow on the board"
                  className="app-input h-11 flex-1 text-[14px]"
                />
                <button type="submit" disabled={busy || !issueTitle.trim()} className="app-btn app-btn-primary h-11 px-5 text-[13.5px] disabled:opacity-50">
                  Add
                </button>
              </form>

              {created.length > 0 && (
                <div className="mx-auto mt-5 max-w-md text-left">
                  {created.map((i) => (
                    <div key={i.id} className="a-up flex items-center gap-2.5 rounded-lg border border-line bg-raised/50 px-3 py-2 text-[13px]">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-mono text-[11px] text-faint">{i.project?.key || firstProject?.key}-{i.number}</span>
                      <span className="truncate">{i.title}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-3">
                <button onClick={() => setStep(0)} className="app-btn app-btn-ghost h-11 px-5 text-[13.5px]">Back</button>
                <button onClick={() => setStep(2)} className="app-btn app-btn-primary h-11 gap-1.5 px-6 text-[14px] press">
                  {created.length ? 'Next' : 'Skip for now'} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Link2 className="h-6 w-6" />
              </span>
              <h1 className="text-[24px] font-bold tracking-tight">Bring your team in</h1>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted">
                Share this link. Anyone who opens it can <span className="font-medium text-fg">ask to join</span> — you approve each
                request before they can see or change anything.
              </p>

              <div className="mx-auto mt-6 flex max-w-md items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-xl border border-line bg-raised/50 px-3 py-3 font-mono text-[12px]">{inviteUrl}</code>
                <button
                  onClick={async () => {
                    const ok = await copyText(inviteUrl)
                    toast(ok ? 'Invite link copied' : 'Copy failed', { tone: ok ? 'success' : 'error' })
                  }}
                  className="app-btn app-btn-primary h-11 gap-1.5 px-4 text-[13px]"
                >
                  <Copy className="h-4 w-4" /> Copy
                </button>
              </div>

              <p className="mt-4 text-[12.5px] text-faint">You can mint scoped links any time from Team → Invites.</p>

              <div className="mt-8 flex items-center justify-center gap-3">
                <button onClick={() => setStep(1)} className="app-btn app-btn-ghost h-11 px-5 text-[13.5px]">Back</button>
                <button onClick={() => setStep(3)} className="app-btn app-btn-primary h-11 gap-1.5 px-6 text-[14px] press">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Rocket className="h-6 w-6" />
              </span>
              <h1 className="text-[24px] font-bold tracking-tight">You're set up</h1>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted">
                {created.length > 0
                  ? `${created.length} issue${created.length === 1 ? '' : 's'} waiting on the board. Press c to add more, Cmd/Ctrl+K to jump anywhere.`
                  : 'Press c to add an issue, Cmd/Ctrl+K to jump anywhere.'}
              </p>

              <div className="mx-auto mt-6 grid max-w-md gap-2 text-left">
                {[
                  ['Board & list views', 'Drag cards, filter, group by anything'],
                  ['Cycles with rollover', 'Finish or roll forward, nothing rots'],
                  ['Inbox with mentions', 'Type @name in a comment'],
                ].map(([title, hint], i) => (
                  <div key={title} className="a-up flex items-start gap-3 rounded-xl border border-line bg-raised/40 px-4 py-3" style={{ animationDelay: `${i * 80}ms` }}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Sparkles className="h-3 w-3" />
                    </span>
                    <span>
                      <span className="block text-[13.5px] font-medium">{title}</span>
                      <span className="block text-[12.5px] text-faint">{hint}</span>
                    </span>
                  </div>
                ))}
              </div>

              <button onClick={finish} className="app-btn app-btn-primary mt-8 h-11 gap-1.5 px-6 text-[14px] press">
                Open the board <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-[12px] text-faint">
                or <Link to="/app" className="text-accent hover:underline">go to the dashboard</Link>
              </p>
            </>
          )}
        </div>

        {teams?.length > 0 && (
          <p className="mt-6 flex items-center gap-2 text-[12.5px] text-faint">
            Signed in as {user.email}
            <Avatar user={user} size={18} />
          </p>
        )}

        <button onClick={finish} className="mt-4 text-[12.5px] text-faint underline decoration-dotted hover:text-muted">
          Skip onboarding
        </button>
      </div>
    </div>
  )
}
