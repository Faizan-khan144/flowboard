import { Link } from 'react-router-dom'
import {
  SquareKanban, Zap, Users, Bell, Search, GitBranch, Gauge, Lock, Globe,
  ArrowRight, Command, Timer, RefreshCw, MousePointerClick, TrendingUp, Layers, Sparkles,
} from 'lucide-react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import Reveal from '../components/Reveal'
import SplitHeading from '../components/SplitHeading'
import Parallax from '../components/Parallax'

const groups = [
  {
    tag: 'Plan',
    title: 'Everything lives in one key',
    text: 'Every card carries an ID like FB-12, a priority dot, labels and the face of whoever owns it. Nobody asks "which task?" again.',
    items: [
      { icon: SquareKanban, name: 'Drag-and-drop board', text: 'Five columns, instant reflow, zero spinners.' },
      { icon: GitBranch, name: 'Cycles', text: 'Two-week boxes with a progress bar that never lies.' },
      { icon: Layers, name: 'Projects & labels', text: 'Group work without building a folder tree.' },
      { icon: Gauge, name: 'Readable priorities', text: 'Urgent to None — four dots on the card face.' },
    ],
  },
  {
    tag: 'Track',
    title: 'See the work as it moves',
    text: 'Assignments, comments and status changes stream in over sockets. Open the app on any device and you are never a refresh behind.',
    items: [
      { icon: Bell, name: 'Realtime inbox', text: 'Every ping your work generates, in one feed.' },
      { icon: RefreshCw, name: 'Live sync', text: 'Card moves land on every screen in the same beat.' },
      { icon: Timer, name: 'Instant filters', text: 'Status, priority, label and text — combined.' },
      { icon: Search, name: 'Search that keeps up', text: 'Type three letters, results are already there.' },
    ],
  },
  {
    tag: 'Ship',
    title: 'Built to get out of the way',
    text: 'No setup wizard, no seat maths, no settings maze. The workspace opens warm with demo data so you can feel the flow in seconds.',
    items: [
      { icon: Zap, name: 'Optimistic updates', text: 'The UI moves before the network answers.' },
      { icon: MousePointerClick, name: 'Drag everything', text: 'Board, columns, priorities — all grabbable.' },
      { icon: Users, name: 'Teams & roles', text: 'One owner per team, everyone else just works.' },
      { icon: Lock, name: 'Private by default', text: 'Your workspace is yours; demo data is separate.' },
    ],
  },
]

const perks = [
  { icon: Command, label: 'Keyboard-first' },
  { icon: TrendingUp, label: 'Optimistic UI' },
  { icon: Globe, label: 'Works anywhere' },
  { icon: Sparkles, label: 'Feels instant' },
]

export default function Features() {
  return (
    <div className="min-h-full bg-white">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-accent/12 to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center">
          <Reveal className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-[13px] text-muted shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Features
          </Reveal>
          <SplitHeading
            text="Small surface. Serious depth."
            className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl"
          />
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Flowboard looks simple because it is. What sits underneath is a real tracker: teams,
              projects, cycles, labels, priorities, comments, notifications and live updates.
            </p>
          </Reveal>
          <Reveal delay={200} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/app/board" className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-7 py-3.5 font-medium text-white shadow-xl shadow-accent/30 transition-all hover:-translate-y-0.5">
              Try it live <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/pricing" className="rounded-xl border border-line bg-white px-7 py-3.5 font-medium transition-all hover:bg-raised">
              See pricing
            </Link>
          </Reveal>
        </div>
      </section>

      {groups.map((g, gi) => (
        <section key={g.tag} className={`relative overflow-hidden border-t border-line py-24 ${gi % 2 ? 'bg-bg' : 'bg-white'}`}>
          <Parallax speed={gi % 2 ? 0.1 : -0.1} className="pointer-events-none absolute -right-24 top-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-6">
            <Reveal className="mb-14 max-w-2xl">
              <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">{g.tag}</div>
              <SplitHeading text={g.title} className="text-3xl font-bold tracking-tight md:text-5xl" />
              <p className="mt-5 text-lg leading-relaxed text-muted">{g.text}</p>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              {g.items.map(({ icon: Icon, name, text }, i) => (
                <Reveal key={name} delay={i * 80} variant={i % 2 ? 'right' : 'left'}>
                  <div className="lift-glow sheen-sweep group flex h-full items-start gap-4 rounded-2xl border border-line bg-white p-6">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-[17px] font-semibold">{name}</span>
                      <span className="mt-1 block text-[14.5px] leading-relaxed text-muted">{text}</span>
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="relative overflow-hidden border-t border-line bg-bg py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Reveal>
            <SplitHeading text="Every shortcut you expect" className="text-3xl font-bold tracking-tight md:text-4xl" />
          </Reveal>
          <Reveal delay={120} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {perks.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm text-muted shadow-sm transition-all hover:-translate-y-1 hover:border-accent/40 hover:text-fg">
                <Icon className="h-4 w-4 text-accent" /> {label}
              </span>
            ))}
          </Reveal>
          <Reveal delay={200} className="mt-12">
            <Link to="/signup" className="btn-shine conic-border inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-8 py-4 font-medium text-white shadow-xl shadow-accent/30">
              Create your workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
