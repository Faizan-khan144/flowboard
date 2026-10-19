import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, Lock, Sparkles, Check, Shield } from 'lucide-react'
import Logo from '../components/Logo'
import Reveal from '../components/Reveal'
import { useAuth } from '../store/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuth((s) => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const next = location.state?.next

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(form.email.trim(), form.password)
      navigate(next || '/app/board')
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
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-[15px] text-muted">
              Log in to keep your issues, cycles and comments exactly where you left them.
            </p>
          </Reveal>

          <Reveal delay={100} className="mt-8">
            <form onSubmit={submit} className="flex flex-col gap-4">
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
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
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
                {busy ? 'Signing in…' : 'Log in'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </Reveal>

          <Reveal delay={160} className="mt-6 text-sm text-muted">
            New here?{' '}
            <Link to="/signup" className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </Reveal>

          <Reveal delay={220} className="mt-8 rounded-2xl border border-line bg-bg p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium text-fg">
              <Sparkles className="h-4 w-4 text-accent" /> Just exploring?
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Skip the form and open the seeded demo workspace — no account needed.
            </p>
            <Link
              to="/app/board"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-medium transition-all hover:-translate-y-0.5 hover:border-accent/40"
            >
              Continue as guest <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-bg lg:block">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 animate-drift-a rounded-full bg-accent/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-24 h-72 w-72 animate-drift-b rounded-full bg-violet-500/12 blur-3xl" />

        <div className="relative flex h-full flex-col justify-center gap-6 px-14">
          <Reveal>
            <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
              Your work, <span className="sheen">exactly</span> how you left it.
            </h2>
          </Reveal>
          <Reveal delay={120} className="flex flex-col gap-3">
            {['Boards and cycles synced live', 'Inbox read state saved per user', 'Comments and labels kept in order', 'Switch teams without losing context'].map((t) => (
              <span key={t} className="flex items-center gap-2.5 text-[15px] text-muted">
                <Check className="h-4 w-4 text-ok" /> {t}
              </span>
            ))}
          </Reveal>
          <Reveal delay={200}>
            <div className="max-w-sm rounded-2xl border border-line bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Shield className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold">Access is explicit</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                Every workspace is invite-based. Someone shares a link, you ask to join, and the owner approves it before
                anything becomes visible.
              </p>
            </div>
          </Reveal>
        </div>
      </aside>
    </div>
  )
}
