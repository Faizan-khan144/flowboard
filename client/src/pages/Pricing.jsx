import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Sparkles, ArrowRight } from 'lucide-react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import Reveal from '../components/Reveal'
import SplitHeading from '../components/SplitHeading'

const plans = [
  {
    name: 'Free',
    tagline: 'For solo builders and side projects.',
    monthly: 0,
    yearly: 0,
    cta: 'Start free',
    to: '/signup',
    features: ['Unlimited issues & labels', '1 team, 3 projects', 'Board, issues and inbox', 'Realtime updates', 'Demo workspace included'],
    missing: ['Cycles & analytics', 'Priority support'],
  },
  {
    name: 'Team',
    tagline: 'For small teams that ship on a rhythm.',
    monthly: 6,
    yearly: 5,
    cta: 'Start 14-day trial',
    to: '/signup',
    highlight: true,
    features: ['Everything in Free', 'Unlimited teams & projects', 'Cycles with rollover', 'Guest access links', 'Activity analytics', 'Priority support'],
    missing: [],
  },
  {
    name: 'Scale',
    tagline: 'For orgs that need control.',
    monthly: 12,
    yearly: 10,
    cta: 'Talk to us',
    to: '/signup',
    features: ['Everything in Team', 'SSO & SCIM', 'Audit log', 'Custom roles', '99.9% uptime SLA', 'Dedicated onboarding'],
    missing: [],
  },
]

export default function Pricing() {
  const [yearly, setYearly] = useState(true)

  return (
    <div className="min-h-full bg-white">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-6 pb-14 pt-24 text-center">
          <Reveal className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-[13px] text-muted shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Pricing
          </Reveal>
          <SplitHeading text="Priced like a tool, not a tax." className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl" />
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              Start free, no card required. Upgrade only when your team outgrows the board.
            </p>
          </Reveal>

          <Reveal delay={180} className="mt-9 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${yearly ? 'text-muted' : 'text-fg'}`}>Monthly</span>
            <button
              onClick={() => setYearly((v) => !v)}
              aria-label="Toggle billing period"
              className={`relative h-8 w-16 rounded-full transition-colors duration-300 ${yearly ? 'bg-accent' : 'bg-line-strong'}`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all duration-300 ${yearly ? 'left-9' : 'left-1'}`} />
            </button>
            <span className={`text-sm font-medium ${yearly ? 'text-fg' : 'text-muted'}`}>
              Yearly <span className="ml-1 rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-semibold text-ok">Save 20%</span>
            </span>
          </Reveal>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 100} variant="big">
              <div className={`lift-glow relative flex h-full flex-col rounded-3xl border p-7 ${p.highlight ? 'conic-border border-transparent bg-white shadow-2xl shadow-accent/10' : 'border-line bg-white'}`}>
                {p.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-accent to-violet-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <div className="text-lg font-semibold">{p.name}</div>
                <p className="mt-1 text-sm text-muted">{p.tagline}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-bold tracking-tight">${yearly ? p.yearly : p.monthly}</span>
                  <span className="pb-1 text-sm text-faint">/user / month</span>
                </div>
                <Link
                  to={p.to}
                  className={`btn-shine mt-6 flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 ${
                    p.highlight
                      ? 'bg-gradient-to-r from-accent to-violet-600 text-white shadow-lg shadow-accent/30'
                      : 'border border-line bg-white text-fg hover:bg-raised'
                  }`}
                >
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </Link>
                <ul className="mt-7 flex flex-col gap-3 text-[14.5px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> {f}
                    </li>
                  ))}
                  {p.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-faint">
                      <X className="mt-0.5 h-4 w-4 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-bg py-24">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal className="text-center">
            <SplitHeading text="Questions about pricing" className="text-3xl font-bold tracking-tight md:text-4xl" />
          </Reveal>
          <div className="mt-10 flex flex-col gap-4">
            {[
              ['Do I need a card to start?', 'No. The free plan and the demo workspace open immediately, no billing details anywhere.'],
              ['What counts as a user?', 'Anyone who can see your workspace. Guests with a read-only link are always free.'],
              ['Can I cancel anytime?', 'Yes — downgrade to Free with one click and keep every issue you have written.'],
              ['Is the free plan time limited?', 'No trial clock on Free. It stays free for as long as you want it.'],
            ].map(([q, a], i) => (
              <Reveal key={q} delay={i * 70}>
                <details className="group rounded-xl border border-line bg-white px-5 py-4 transition-colors hover:border-accent/40">
                  <summary className="cursor-pointer list-none text-[16px] font-medium marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {q}
                      <span className="text-xl text-accent transition-transform duration-300 group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
