import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import Reveal from '../components/Reveal'

export default function NotFound() {
  return (
    <div className="min-h-full bg-white">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent/10 blur-2xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-violet-500/10 blur-2xl" />

        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center">
          <Reveal>
            <div className="mx-auto flex w-max items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-[13px] text-muted shadow-sm">
              <Compass className="h-3.5 w-3.5 text-accent" /> 404
            </div>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-8 text-[64px] font-bold leading-none tracking-tight md:text-[104px]">
              <span className="sheen">Lost</span> in the backlog
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-lg text-lg text-muted">
              This page either moved, got archived, or never existed. The board is still exactly where
              you left it.
            </p>
          </Reveal>
          <Reveal delay={230} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/" className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-6 py-3.5 font-medium text-white shadow-xl shadow-accent/30 transition-all hover:-translate-y-0.5">
              <ArrowLeft className="h-4 w-4" /> Back home
            </Link>
            <Link to="/app/board" className="rounded-xl border border-line bg-white px-6 py-3.5 font-medium transition-all hover:bg-raised">
              Open the board
            </Link>
          </Reveal>

          <Reveal delay={300} className="mx-auto mt-14 max-w-md">
            <div className="overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-xl shadow-slate-900/5">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  ['Backlog', 2, '#9aa0ad'],
                  ['In Progress', 1, '#2563eb'],
                  ['Done', 3, '#059669'],
                ].map(([name, n, color]) => (
                  <div key={name} className="rounded-lg bg-bg p-2.5 text-left">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {name}
                    </div>
                    {Array.from({ length: n }).map((_, i) => (
                      <div key={i} className="mb-1.5 rounded-md border border-line bg-white px-2 py-1.5" style={{ animation: `float-soft 3s ease-in-out ${i * 0.3}s infinite` }}>
                        <div className="h-1.5 w-7 rounded bg-line" />
                        <div className="mt-1.5 h-1.5 w-full rounded bg-raised" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
