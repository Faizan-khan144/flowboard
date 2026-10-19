import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, Lock, User, Sparkles, Check, Rocket } from 'lucide-react'
import Logo from '../components/Logo'
import Reveal from '../components/Reveal'
import { useAuth } from '../store/auth'

export default function Signup() {
  const navigate = useNavigate()
  const location = useLocation()
  const signup = useAuth((s) => s.signup)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const next = location.state?.next

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signup(form.name.trim(), form.email.trim(), form.password)
      navigate(next || '/welcome')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="relative flex flex-col px-6 py-10 sm:px-12">
        <Link to="/" className="inline-flex w-max">
          <Logo size={30} wordClass="text-[16px]" />
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-14">
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight">Create your workspace</h1>
            <p className="mt-2 text-[15px] text-muted">
              One minute to set up. Your team and first project are created with it.
            </p>
          </Reveal>

          <Reveal delay={100} className="mt-8">
            <form onSubmit={submit} className="flex flex-col gap-4">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-muted">Your name</span>
                <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 transition-all focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                  <User className="h-4 w-4 text-faint" />
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Faizan Khan"
                    className="w-full bg-transparent text-[15px] outline-none placeholder:text-faint"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-muted">Email</span>
                <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 transition-all focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                  <Mail className="h-4 w-4 text-faint" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-[15px] outline-none placeholder:text-faint"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-muted">Password</span>
                <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 transition-all focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                  <Lock className="h-4 w-4 text-faint" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full bg-transparent text-[15px] outline-none placeholder:text-faint"
                  />
                </div>
              </label>

              {error && <p className="rounded-xl border border-[#dc2626]/30 bg-[#dc2626]/5 px-3 py-2 text-[13px] text-[#dc2626]">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="btn-shine mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-5 py-3 font-medium text-white shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {busy ? 'Creating…' : 'Create workspace'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </Reveal>

          <Reveal delay={160} className="mt-6 text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </Reveal>

          <Reveal delay={220} className="mt-8 rounded-2xl border border-line bg-bg p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium text-fg">
              <Sparkles className="h-4 w-4 text-accent" /> Not ready yet?
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Peek at the demo workspace first — it is already full of issues.
            </p>
            <Link
              to="/app/board"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-medium transition-all hover:-translate-y-0.5 hover:border-accent/40"
            >
              Open demo workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-bg lg:block">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 animate-drift-b rounded-full bg-violet-500/12 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-20 h-72 w-72 animate-drift-a rounded-full bg-accent/12 blur-3xl" />

        <div className="relative flex h-full flex-col justify-center gap-7 px-14">
          <Reveal>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Rocket className="h-6 w-6" />
            </span>
            <h2 className="mt-5 max-w-md text-4xl font-bold leading-tight tracking-tight">
              Set up once. <span className="sheen">Ship every day.</span>
            </h2>
          </Reveal>
          <Reveal delay={140} className="flex flex-col gap-3">
            {[
              'Your own workspace with owner controls',
              'A Main project ready for issues',
              'Realtime board and inbox for the team',
              'Invite links with approval before access',
            ].map((t) => (
              <span key={t} className="flex items-center gap-2.5 text-[15px] text-muted">
                <Check className="h-4 w-4 text-ok" /> {t}
              </span>
            ))}
          </Reveal>
          <Reveal delay={220}>
            <div className="max-w-sm overflow-hidden rounded-2xl border border-line bg-white shadow-xl shadow-slate-900/5">
              <div className="flex items-center gap-1.5 border-b border-line bg-raised/60 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 text-[11px] text-faint">your-team / board</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3">
                {[['Backlog', 3], ['In Progress', 2], ['Done', 4]].map(([c, n]) => (
                  <div key={c} className="rounded-lg bg-bg p-2">
                    <div className="mb-2 flex items-center justify-between text-[10.5px] font-medium">
                      {c} <span className="text-faint">{n}</span>
                    </div>
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="mb-1.5 rounded-md border border-line bg-white px-2 py-1.5">
                        <div className="h-1.5 w-8 rounded bg-line" />
                        <div className="mt-1.5 h-1.5 w-full rounded bg-raised" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </aside>
    </div>
  )
}
