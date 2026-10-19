import { Link } from 'react-router-dom'
import { Sparkles, Command, ArrowRight } from 'lucide-react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import Reveal from '../components/Reveal'
import SplitHeading from '../components/SplitHeading'

const groups = [
  {
    title: 'Getting started',
    items: [
      ['Create a workspace', 'Sign up with an email and you get a team, an owner role and a Main project instantly.'],
      ['Create your first issue', 'Open the board, press the new issue button, write a title and pick a priority dot.'],
      ['Move something', 'Drag a card between Backlog, Todo, In Progress and Done — the whole team sees it live.'],
    ],
  },
  {
    title: 'Teams & projects',
    items: [
      ['Invite members', 'Add people from the Team page. Owners manage projects, members just move cards.'],
      ['Project keys', 'Every project has a key like MAIN, so issues read FB-12 and stay linkable forever.'],
      ['Labels', 'Create workspace labels for bugs, features or chores and stack them on any issue.'],
    ],
  },
  {
    title: 'Cycles & prioritising',
    items: [
      ['Time-box work', 'Cycles are two-week boxes with a progress bar. Unfinished cards roll forward.'],
      ['Priorities', 'Urgent, High, Medium, Low or None — one dot, readable at a glance.'],
      ['Inbox', 'Assignments, mentions and replies collect in one feed that actually empties.'],
    ],
  },
]

export default function Docs() {
  return (
    <div className="min-h-full bg-white">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-6 pb-14 pt-24 text-center">
          <Reveal className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-[13px] text-muted shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Docs
          </Reveal>
          <SplitHeading text="Everything in ten minutes." className="text-4xl font-bold tracking-tight md:text-6xl" />
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              No manual, no academy. Three short guides and you know the whole product.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[220px,1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-2 text-sm">
              {groups.map((g) => (
                <a key={g.title} href={`#${g.title.toLowerCase().replace(/[^a-z]+/g, '-')}`} className="rounded-lg px-3 py-2 text-muted transition-colors hover:bg-raised hover:text-fg">
                  {g.title}
                </a>
              ))}
              <Link to="/app/board" className="mt-3 flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 font-medium text-accent">
                <Command className="h-3.5 w-3.5" /> Open the app
              </Link>
            </div>
          </aside>

          <div className="flex flex-col gap-16">
            {groups.map((g, gi) => (
              <div key={g.title} id={g.title.toLowerCase().replace(/[^a-z]+/g, '-')}>
                <Reveal>
                  <h2 className="text-2xl font-bold tracking-tight">{g.title}</h2>
                </Reveal>
                <div className="mt-6 flex flex-col gap-4">
                  {g.items.map(([t, d], i) => (
                    <Reveal key={t} delay={i * 80} variant="up">
                      <div className="lift-glow rounded-2xl border border-line bg-white p-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-[12.5px] font-semibold text-accent">
                            {gi + 1}.{i + 1}
                          </span>
                          <span className="text-[17px] font-semibold">{t}</span>
                        </div>
                        <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{d}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}

            <Reveal className="rounded-3xl border border-line bg-bg p-8">
              <h2 className="text-2xl font-bold tracking-tight">API in one glance</h2>
              <p className="mt-3 max-w-xl text-[15px] text-muted">
                Everything the interface does is a plain JSON endpoint behind a bearer token.
              </p>
              <pre className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white p-5 text-[12.5px] leading-relaxed text-muted">
{`POST /api/auth/login        { email, password }
GET  /api/teams/:id         → team, members, projects
GET  /api/projects/:id/issues
POST /api/issues            { projectId, title, priority }
PATCH/ api/issues/:id       { status, priority, assigneeId }
POST /api/issues/:id/comments
GET  /api/notifications     → unread count + feed`}
              </pre>
              <Link to="/app/board" className="group mt-6 inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
                Try it live <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
