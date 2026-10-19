import { Link } from 'react-router-dom'
import { Sparkles, Rocket, Users, Globe, Heart } from 'lucide-react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import Reveal from '../components/Reveal'
import SplitHeading from '../components/SplitHeading'
import Parallax from '../components/Parallax'

export default function About() {
  return (
    <div className="min-h-full bg-white">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-6 pb-16 pt-24 text-center">
          <Reveal className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-[13px] text-muted shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> About
          </Reveal>
          <SplitHeading text="We built the tracker we kept abandoning." className="text-4xl font-bold tracking-tight md:text-6xl" />
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Every tool we tried asked for a workspace URL, an org chart and forty settings before
              showing a single task. So we wrote the opposite: a tracker that opens warm, moves fast
              and says no to features that only look good on a pricing page.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-line bg-bg py-24">
        <Parallax speed={0.08} className="pointer-events-none absolute -right-20 top-16 h-64 w-64 rounded-full bg-accent/10 blur-2xl" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Rocket, title: 'Small on purpose', text: 'Every screen earns its place. If a setting does not change how you work, it is not there.' },
              { icon: Users, title: 'Built for real teams', text: 'Owners, members, guests — enough structure to stay honest, not enough to become admin work.' },
              { icon: Globe, title: 'Yours to host', text: 'A SQLite file and an Express API. Run it locally, in a container, or anywhere you like.' },
              { icon: Heart, title: 'Fast by default', text: 'Optimistic updates and sockets. The interface answers before the network finishes thinking.' },
              { icon: Sparkles, title: 'Honest by habit', text: 'No dark patterns, no fake urgency, no "contact sales" wall between you and the board.' },
              { icon: Users, title: 'Open roadmap', text: 'Everything we ship is written in the changelog with a date. Quiet rewrites are not our style.' },
            ].map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={(i % 3) * 90} variant="zoom">
                <div className="lift-glow sheen-sweep h-full rounded-2xl border border-line bg-white p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-[17px] font-semibold">{title}</div>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white py-24">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 text-center sm:grid-cols-4">
          {[
            ['2026', 'First board shipped'],
            ['5', 'Statuses, zero config'],
            ['<50ms', 'Board interactions'],
            ['0', 'Setup screens'],
          ].map(([n, l], i) => (
            <Reveal key={l} delay={i * 90}>
              <div className="text-4xl font-bold tracking-tight text-accent">{n}</div>
              <div className="mt-2 text-[13.5px] text-muted">{l}</div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-16 text-center">
          <Link to="/signup" className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-7 py-3.5 font-medium text-white shadow-xl shadow-accent/30 transition-all hover:-translate-y-0.5">
            Start your workspace
          </Link>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  )
}
