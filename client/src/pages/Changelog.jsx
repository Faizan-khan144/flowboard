import { Sparkles, Rocket, Zap, Bell, GitBranch, Gauge } from 'lucide-react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import Reveal from '../components/Reveal'
import SplitHeading from '../components/SplitHeading'

const releases = [
  {
    version: 'v0.9',
    date: 'October 2026',
    title: 'Closer look, cycles and analytics',
    items: [
      'Pinned horizontal showcase tour on the landing page',
      'Cycle progress bars with automatic rollover',
      'Activity feed with per-day grouping',
      'Faster filtering across large backlogs',
    ],
  },
  {
    version: 'v0.7',
    date: 'September 2026',
    title: 'Realtime everywhere',
    items: [
      'Socket-powered board, inbox and comments',
      'Optimistic drag and drop with rollback on failure',
      'Unread badges that clear as you read',
      'Guest read-only project links',
    ],
  },
  {
    version: 'v0.5',
    date: 'August 2026',
    title: 'Teams, projects, labels',
    items: [
      'Multi-team workspaces with owner roles',
      'Projects with keys like MAIN and per-project labels',
      'Priorities: Urgent, High, Medium, Low, None',
      'Issue modal with description, assignee and comments',
    ],
  },
  {
    version: 'v0.2',
    date: 'July 2026',
    title: 'The first board',
    items: [
      'Kanban board with five statuses',
      'Issue creation and inline edit',
      'Seeded demo workspace with sample data',
      'Light theme design system with tokens',
    ],
  },
]

export default function Changelog() {
  return (
    <div className="min-h-full bg-white">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-6 pb-16 pt-24 text-center">
          <Reveal className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-[13px] text-muted shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Changelog
          </Reveal>
          <SplitHeading text="Every release, out in the open." className="text-4xl font-bold tracking-tight md:text-6xl" />
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              Small, steady, honest updates. No quiet rewrites — if it shipped, it is written here.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="relative border-l border-line pl-8">
            {releases.map((r, i) => (
              <Reveal key={r.version} delay={i * 90} className="relative pb-14 last:pb-0">
                <span className="absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-accent to-violet-600" />
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[12.5px] font-semibold text-accent">{r.version}</span>
                  <span className="text-sm text-faint">{r.date}</span>
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-tight">{r.title}</h3>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {r.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-muted">
                      <Zap className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" /> {it}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-6 rounded-2xl border border-line bg-bg p-8 text-center">
            <Rocket className="mx-auto mb-4 h-7 w-7 text-accent" />
            <SplitHeading text="What is coming next" className="text-2xl font-bold tracking-tight" />
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">
              Keyboard command menu, saved views, burndown insights and Slack-style digests.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2"><Bell className="h-4 w-4 text-accent" /> Digest notifications</span>
              <span className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2"><GitBranch className="h-4 w-4 text-accent" /> Sub-issues</span>
              <span className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2"><Gauge className="h-4 w-4 text-accent" /> Burndown charts</span>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
