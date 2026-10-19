import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import Reveal from '../components/Reveal'
import Parallax from '../components/Parallax'
import SplitHeading from '../components/SplitHeading'
import SectionDots from '../components/SectionDots'
import BackToTop from '../components/BackToTop'
import Cursor from '../components/Cursor'
import Magnetic from '../components/Magnetic'
import ScrollScrub from '../components/ScrollScrub'
import HScroll from '../components/HScroll'
import HeroScene from '../components/HeroScene'
import { useAuth } from '../store/auth'
import {
  ArrowRight, SquareKanban, Zap, Users, Bell, Search, GitBranch,
  Check, X, ArrowUpRight, Sparkles, Gauge, Lock, Globe, Shield,
  Workflow, MousePointerClick, Layers, Boxes, Rocket, Timer,
  RefreshCw, Command, TrendingUp,
} from 'lucide-react'





function Counter({ to, suffix = '', prefix = '', duration = 1500 }) {
  const ref = useRef(null)
  const [val, setVal] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const t0 = performance.now()
          const tick = (t) => {
            const p = Math.min((t - t0) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setVal(Math.round(eased * to))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref}>
      {prefix}
      {val}
      {suffix}
    </span>
  )
}

function ScrollProgress() {
  const ref = useRef(null)
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      if (ref.current) ref.current.style.transform = `scaleX(${p})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return <div ref={ref} className="scroll-progress" style={{ transform: 'scaleX(0)' }} />
}

function DrawLine() {
  const ref = useRef(null)
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setDrawn(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <svg ref={ref} viewBox="0 0 1100 80" className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-20 w-full -translate-y-1/2 lg:block" fill="none">
      <path
        className={`draw-line ${drawn ? 'drawn' : ''}`}
        d="M40 40 C 300 -20, 400 100, 550 40 S 850 -10, 1060 40"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeDasharray="1200"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1100" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5b5bd6" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#9333ea" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0.15" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function TiltCard({ children, className = '' }) {
  const ref = useRef(null)

  function onMove(e) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1400px) rotateX(${-py * 7}deg) rotateY(${px * 9}deg) translateY(-4px)`
  }

  function onLeave() {
    const el = ref.current
    if (el) el.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)'
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`transition-transform duration-300 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  )
}

function RotatorWord({ words, interval = 2400 }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % words.length), interval)
    return () => clearInterval(t)
  }, [words.length, interval])

  return (
    <span className="relative inline-grid overflow-hidden align-bottom">
      {words.map((w, k) => (
        <span
          key={`${w}-${k}`}
          aria-hidden={k !== i}
          className={`col-start-1 row-start-1 whitespace-nowrap transition-all duration-500 ease-out ${
            k === i ? 'translate-y-0 opacity-100' : 'translate-y-[75%] opacity-0'
          }`}
          style={{
            backgroundImage: 'linear-gradient(100deg, #5b5bd6 0%, #7c3aed 45%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {w}
        </span>
      ))}
    </span>
  )
}

function Newsletter() {
  return (
    <section className="border-t border-line bg-bg py-20">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal variant="zoom">
          <div className="conic-border relative overflow-hidden rounded-3xl bg-white p-8 text-center shadow-xl shadow-accent/5 md:p-12">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
            <div className="relative">
              <SplitHeading text="Every change is written down" className="text-2xl font-bold tracking-tight md:text-3xl" />
              <p className="mx-auto mt-3 max-w-lg text-[15px] text-muted">
                No mailing list and no newsletter form. The changelog ships with this build, so you can read
                exactly what landed and when.
              </p>
              <Magnetic strength={0.15} className="mt-7">
                <Link
                  to="/changelog"
                  className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-6 py-3 font-medium text-white shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5"
                >
                  Read the changelog
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}





const P_COLOR = { P0: '#dc2626', P1: '#d97706', P2: '#2563eb', P3: '#9aa0ad' }

function MockBoard({ compact = false }) {
  const cols = [
    { name: 'Backlog', color: '#9aa0ad', cards: [['FB-5', 'Burndown chart', 'P2'], ['FB-4', 'Command palette', 'P3']] },
    { name: 'In Progress', color: '#2563eb', cards: [['FB-6', 'Build issue board', 'P0'], ['FB-7', 'Mobile overflow fix', 'P1']] },
    { name: 'Done', color: '#059669', cards: [['FB-1', 'Set up auth flow', 'P1'], ['FB-3', 'Seed data script', 'P3']] },
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-2xl shadow-slate-900/10">
      <div className="flex items-center gap-1.5 border-b border-line bg-raised/60 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 flex items-center gap-1.5 text-xs text-faint">
          <Logo size={14} withWord={false} /> flowboard — Main / Board
        </span>
      </div>
      <div className="flex">
        <div className="hidden w-40 shrink-0 border-r border-line bg-raised/40 p-3 text-left sm:block">
          <div className="mb-3 flex items-center gap-2 rounded-md bg-white px-2 py-1.5 text-[11px] font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-accent" /> Board
          </div>
          {['Issues', 'Inbox', 'Team'].map((l) => (
            <div key={l} className="px-2 py-1.5 text-[11px] text-faint">{l}</div>
          ))}
          <div className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-wide text-faint">Projects</div>
          <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted">
            <span className="h-2 w-2 rounded-sm bg-accent" /> Main
          </div>
        </div>
        <div className="relative grid flex-1 grid-cols-3 gap-2.5 p-3">
          {!compact && (
            <>
              <div className="demo-ghost">
                <div className="g-id">FB-9</div>
                <div className="g-title">Ship landing page</div>
                <div className="mt-1 inline rounded bg-[#7c3aed] px-1.5 py-0.5 text-[8px] font-bold text-white">P1</div>
              </div>
              <div className="demo-cursor" />
            </>
          )}
          {cols.map((c, ci) => (
            <div key={c.name} className="rounded-lg bg-bg p-2">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                <span className="text-[11px] font-medium">{c.name}</span>
                <span className="ml-auto text-[10px] text-faint">{c.cards.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {c.cards.map(([id, title, p], i) => (
                  <div
                    key={id}
                    className={`rounded-md border border-line bg-white px-2 py-2 shadow-sm transition-shadow hover:shadow-md ${
                      !compact && ci === 1 && i === 0 ? 'animate-shuffle' : ''
                    } ${!compact && ci === 1 && i === 1 ? 'animate-shuffle-2' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[9px] text-faint">{id}</span>
                      <span className="rounded px-1 text-[8px] font-bold text-white" style={{ background: P_COLOR[p] }}>{p}</span>
                    </div>
                    <div className="text-[10.5px] leading-snug">{title}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}





function FeatureVisual({ kind }) {
  if (kind === 'realtime') {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xl shadow-slate-900/5">
        {[
          ['Ayesha moved FB-6 → In Progress', 'now', '#2563eb'],
          ['Bilal commented on FB-7', '2s ago', '#059669'],
          ['You assigned FB-5 to Sana', '1m ago', '#5b5bd6'],
        ].map(([text, time, color], i) => (
          <div
            key={text}
            className="animate-fade-up mb-3 flex items-start gap-3 rounded-lg border border-line bg-bg px-3 py-2.5 last:mb-0"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <span className="relative mt-1.5 flex h-2 w-2 shrink-0">
              <span className="animate-ping-ring absolute inline-flex h-full w-full rounded-full" style={{ background: color }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] leading-snug">{text}</div>
              <div className="text-[11px] text-faint">{time}</div>
            </div>
          </div>
        ))}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ok">
          <Sparkles className="h-3.5 w-3.5" /> live via websocket
        </div>
      </div>
    )
  }
  if (kind === 'inbox') {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xl shadow-slate-900/5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold">Inbox</span>
          <span className="animate-pop-in rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">3 unread</span>
        </div>
        {['You were assigned FB-7: Mobile overflow fix', 'Bilal commented on FB-6: Build issue board', 'FB-1 moved to Done by Ayesha'].map((t, i) => (
          <div
            key={t}
            className="animate-fade-up mb-2 flex items-start gap-2.5 rounded-lg border border-line px-3 py-2.5 transition-colors hover:border-accent/40 last:mb-0"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span className="text-[12.5px] leading-snug">{t}</span>
          </div>
        ))}
      </div>
    )
  }
  return <MockBoard />
}





const features = [
  { icon: SquareKanban, title: 'A board that drags right', text: 'Grab a card, fling it to Done — the column reflows instantly and every teammate\'s screen follows along in the same beat.' },
  { icon: Zap, title: 'No spinners, ever', text: 'Clicks register before the network even wakes up. Filters, moves and edits feel local because, well, they practically are.' },
  { icon: Users, title: 'Teams, minus the org chart', text: 'A workspace holds your people, a project holds the work, and every card gets a key like FB-12 so "that one bug" is always one paste away.' },
  { icon: Bell, title: 'An inbox that taps you', text: 'Someone assigns you something or replies on your issue, it pops up in realtime. Mark it read, keep moving.' },
  { icon: Search, title: 'Filters in plain English', text: '"urgent + bug + not mine" — type it, get three results, done. No saved-view ceremony, no filter builder wizard.' },
  { icon: GitBranch, title: 'Cycles with a deadline pulse', text: 'Pick two weeks, load the cycle, watch the bar fill. Whatever\'s unfinished rolls over instead of silently rotting in a backlog.' },
  { icon: Gauge, title: 'Priorities a human can read', text: 'Four dots, red to grey, right on the card face. Nobody needs a legend to know what\'s on fire.' },
  { icon: Lock, title: 'One admin, zero politics', text: 'Owners add people and projects; everyone else just works. No permission matrix to decode before your first standup.' },
  { icon: Globe, title: 'Opens like a local file', text: 'No sign-up wall, no trial countdown, no credit card field. Click, and the workspace is already warm with demo data.' },
]

const showcase = [
  {
    tag: 'Board',
    title: 'Five columns, one heartbeat',
    text: 'Backlog to Done, colour-coded, with cards that show the ID, the dot, the labels and the face of whoever owns it — nothing hidden behind a hover.',
    visual: 'board',
  },
  {
    tag: 'Realtime',
    title: 'Watch the work move',
    text: 'Sockets, not refresh buttons. When someone drags a card or drops a comment, it lands on your screen mid-sentence.',
    visual: 'realtime',
  },
  {
    tag: 'Inbox',
    title: 'A feed that ends',
    text: 'Every ping your work generates — assignments, mentions, replies — stacks up here. Clear it and get your morning back.',
    visual: 'inbox',
  },
]

const steps = [
  { n: '01', icon: Boxes, title: 'Dump it in', text: 'Bugs found at 2am, ideas from the shower, tasks forwarded from chat — everything lands in the backlog before it evaporates.' },
  { n: '02', icon: Workflow, title: 'Shape it', text: 'Wrap related work in a project, tag it, set the priority dot, and load it into a cycle the team can actually commit to.' },
  { n: '03', icon: Rocket, title: 'Move it right', text: 'Drag the card to Done. The board updates for everyone in the same instant, and the inbox keeps the paper trail honest.' },
]

const includedToday = [
  'Drag-and-drop board with live columns',
  'Websocket updates, no refresh button',
  'Issues with labels, priorities, estimates and due dates',
  'Cycles with one-click rollover',
  'Inbox with reactions and @mentions',
  'Invite links where the owner approves each request',
  'Sub-issues, watchers and a full activity trail',
]

const notBuiltYet = [
  'Email notifications',
  'Slack or GitHub integrations',
  'Native mobile app',
  'SSO / SAML and audit log',
  'Time tracking and reports export',
  'Recurring automations',
]


const faqs = [
  ['Do I need an account?', 'No. The demo workspace opens instantly with a seeded project. There is no sign-up wall anywhere in the app.'],
  ['Is this production-ready?', 'It is a complete working tracker: persistent SQLite storage, JWT sessions, websockets and a React front end.'],
  ['What powers it?', 'React + Vite + Tailwind on the front, Express + Prisma + SQLite + Socket.IO on the back, Three.js for this page.'],
  ['Can I reset the demo data?', 'Yes — the server ships with a seed script that rebuilds users, projects, labels, cycles and issues.'],
  ['Does it work on mobile?', 'The board scrolls horizontally on small screens and every view is responsive down to phone widths.'],
]

const marqueeTech = [
  'React 19', 'Vite', 'Tailwind CSS 4', 'Express', 'Prisma', 'SQLite', 'Socket.IO', 'Zustand', 'JWT auth', 'Three.js', 'React Router', 'Drag & drop',
]





export default function Landing() {
  const heroRef = useRef(null)
  const user = useAuth((s) => s.user)
  const isGuest = useAuth((s) => s.isGuest)
  const signedIn = Boolean(user) && !isGuest
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navItems = [
    ['Features', '/features'],
    ['Product', '#product'],
    ['Closer look', '#closer'],
    ['Pricing', '/pricing'],
    ['Changelog', '/changelog'],
    ['FAQ', '#faq'],
  ]
  const [active, setActive] = useState('')

  useEffect(() => {
    const ids = navItems.filter(([, h]) => h.startsWith('#')).map(([, h]) => h.slice(1))
    if (typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()

  }, [])

  return (
    <div className="min-h-full bg-white">
      <Cursor />
      <BackToTop />
      <SectionDots sections={['features', 'product', 'closer', 'how', 'compare', 'faq']} />
      <ScrollProgress />

      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="mx-auto max-w-6xl">
          <div className={`nav-pill relative flex h-14 items-center justify-between overflow-hidden rounded-2xl border border-line/70 bg-white/70 px-4 ring-1 ring-white/60 backdrop-blur-xl ${scrolled ? 'scrolled' : ''}`}>
            <span className="nav-hairline" />
            <Link to="/" className="group relative z-10 flex items-center">
              <span className="transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110">
                <Logo size={28} wordClass="text-[15px]" />
              </span>
            </Link>

            <nav className="relative z-10 hidden items-center gap-6 text-[13.5px] font-medium text-muted lg:flex">
              {navItems.map(([label, href]) =>
                href.startsWith('#') ? (
                  <a
                    key={label}
                    href={href}
                    className={`nav-link transition-colors ${active === href.slice(1) ? 'on font-semibold text-fg' : 'hover:text-fg'}`}
                  >
                    {label}
                  </a>
                ) : (
                  <Link key={label} to={href} className="nav-link transition-colors hover:text-fg">
                    {label}
                  </Link>
                ),
              )}
            </nav>

            <div className="relative z-10 flex items-center gap-1.5">
              {signedIn ? (
                <Link
                  to="/app/board"
                  className="btn-shine hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/35 sm:flex"
                >
                  Open app <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-fg sm:block"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-shine hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/35 sm:flex"
                  >
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
              <button
                onClick={() => setMenu((v) => !v)}
                aria-label="Menu"
                className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-white transition-colors hover:bg-raised lg:hidden"
              >
                <span className={`h-0.5 w-4 rounded-full bg-fg transition-all duration-300 ${menu ? 'translate-y-[4px] rotate-45' : ''}`} />
                <span className={`h-0.5 w-4 rounded-full bg-fg transition-all duration-300 ${menu ? '-translate-y-[4px] -rotate-45' : ''}`} />
              </button>
            </div>
          </div>

          {menu && (
            <div className="nav-menu mt-2 flex flex-col gap-1 rounded-2xl border border-line bg-white/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
              {navItems.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMenu(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                >
                  {label}
                </a>
              ))}
              {signedIn ? (
                <Link
                  to="/app/board"
                  onClick={() => setMenu(false)}
                  className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
                >
                  Open app <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenu(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/app/board"
                    onClick={() => setMenu(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    Open demo workspace
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenu(false)}
                    className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
                  >
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>


      <section
        ref={heroRef}
        className="relative overflow-hidden"
        onMouseMove={(e) => {
          const el = e.currentTarget
          const r = el.getBoundingClientRect()
          el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(2)}%`)
          el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(2)}%`)
        }}
      >
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="hero-spot pointer-events-none absolute inset-0" />
        <HeroScene className="pointer-events-none absolute inset-0 h-full w-full opacity-90" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[64rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-accent/12 via-violet-500/8 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-accent/10 blur-2xl" />
        <div className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-violet-500/10 blur-2xl" />

        <div className="relative mx-auto max-w-6xl px-6 pb-28 pt-24 text-center md:pt-32">
          <Reveal className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-[13px] text-muted shadow-sm backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping-ring absolute inline-flex h-full w-full rounded-full bg-ok" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ok" />
            </span>
            No sign-up · seeded workspace · realtime out of the box
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mx-auto max-w-5xl text-balance text-[52px] font-bold leading-[1.03] tracking-tight md:text-[86px]">
              One{' '}
              <RotatorWord words={['live', 'fast', 'clean', 'shared']} />{' '}
              board for
              <br className="hidden sm:inline" />{' '}
              <span className="sheen">everything your team ships</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-muted md:text-xl">
              Flowboard is a fast, minimal issue tracker for small teams — boards, cycles,
              labels, priorities and realtime updates in one clean, zero-setup workspace.
            </p>
          </Reveal>

          <Reveal delay={230} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnetic strength={0.22}>
              <Link
                to="/app/board"
                className="btn-shine group flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-base font-medium text-white shadow-xl shadow-accent/30 transition-all hover:bg-accent-hover"
              >
                Open the board
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Magnetic strength={0.16}>
              <a
                href="#product"
                className="rounded-xl border border-line bg-white px-8 py-4 text-base font-medium text-fg transition-all hover:bg-raised"
              >
                See the product
              </a>
            </Magnetic>
          </Reveal>

            <Reveal delay={300} className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[13px] text-faint">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-ok" /> Seeded demo workspace</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-ok" /> Realtime out of the box</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-ok" /> SQLite + Express + React</span>
            </Reveal>

            <div className="mt-12 flex justify-center">
              <span className="scroll-cue flex h-10 w-6 items-start justify-center rounded-full border border-line-strong p-1">
                <span className="scroll-cue-dot h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
            </div>


          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="pointer-events-none absolute -left-6 top-10 z-10 hidden animate-bob rounded-xl border border-line bg-white px-3 py-2 text-left shadow-lg md:block">
              <div className="text-[11px] text-faint">FB-6</div>
              <div className="text-[12.5px] font-medium">Build issue board</div>
              <div className="mt-1 inline rounded bg-[#dc2626] px-1.5 py-0.5 text-[9px] font-bold text-white">URGENT</div>
            </div>
            <div className="pointer-events-none absolute -right-4 top-1/3 z-10 hidden animate-bob-delay rounded-xl border border-line bg-white px-3 py-2 text-left shadow-lg md:block">
              <div className="text-[11px] text-faint">FB-7</div>
              <div className="text-[12.5px] font-medium">Mobile overflow fix</div>
              <div className="mt-1 inline rounded bg-[#2563eb] px-1.5 py-0.5 text-[9px] font-bold text-white">IN PROGRESS</div>
            </div>
            <div className="pointer-events-none absolute -bottom-6 left-1/4 z-10 hidden animate-bob rounded-full border border-line bg-white px-3 py-1.5 text-[12px] text-muted shadow-lg md:flex md:items-center md:gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" /> 3 teammates online
            </div>

            <Reveal delay={120}>
              <TiltCard>
                <MockBoard />
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>


      <section className="border-y border-line bg-bg py-8">
        <div className="marquee-mask grp overflow-hidden">
          <div className="flex w-max animate-marquee" style={{ ['--marquee-duration']: '34s' }}>
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center">
                {marqueeTech.map((t) => (
                  <span key={`${dup}-${t}`} className="mx-5 flex items-center gap-2 text-sm font-medium text-faint">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/50" />
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-4">
          {[
            { to: 5, suffix: '', label: 'issue statuses, zero config' },
            { to: 4, suffix: '', label: 'priority levels on every card' },
            { to: 3, suffix: '', label: 'roles: owner, member, viewer' },
            { to: 0, suffix: '', label: 'tracking scripts on this page' },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="text-center">
              <div className="animate-rise text-4xl font-bold tracking-tight text-fg md:text-5xl">
                <Counter to={s.to} prefix={s.prefix || ''} suffix={s.suffix || ''} />
              </div>
              <div className="mt-2 text-[13px] text-muted">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>


      <section id="features" className="relative overflow-hidden bg-white py-24 md:py-32">
        <Parallax speed={0.12} className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <Parallax speed={-0.1} className="pointer-events-none absolute -left-20 bottom-24 h-56 w-56 rotate-12 rounded-[3rem] bg-violet-500/10 blur-2xl" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Features</div>
            <SplitHeading
              text="Everything you need, nothing you don't"
              className="text-4xl font-bold tracking-tight md:text-5xl"
            />
            <p className="mt-5 text-lg text-muted">The core of a real issue tracker, without 40 settings screens.</p>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={(i % 3) * 90}>
                <div className="lift-glow sheen-sweep group h-full rounded-2xl border border-line bg-white p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-[17px] font-semibold">{title}</h3>
                  <p className="text-[14.5px] leading-relaxed text-muted">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      <section id="product" className="relative border-t border-line bg-bg py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto mb-20 max-w-2xl text-center">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Product</div>
            <SplitHeading
              text="Built to feel instant"
              className="text-4xl font-bold tracking-tight md:text-5xl"
            />
            <p className="mt-5 text-lg text-muted">Three things that make daily tracking actually pleasant.</p>
          </Reveal>

          <div className="flex flex-col gap-24 md:gap-32">
            {showcase.map((s, i) => (
              <Reveal key={s.tag} variant="big" className={`flex flex-col items-center gap-10 md:flex-row md:gap-16 ${i % 2 ? 'md:flex-row-reverse' : ''}`}>
                <div className="w-full md:w-[55%]">
                  <div className="animate-float">
                    <FeatureVisual kind={s.visual} />
                  </div>
                </div>
                <div className="w-full md:w-[45%]">
                  <div className="mb-4 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[13px] font-medium text-accent">
                    {s.tag}
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-4 text-[17px] leading-relaxed text-muted">{s.text}</p>
                  <Link to="/app/board" className="group mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-accent hover:underline">
                    Try it live <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      <div id="closer">
        <HScroll />
      </div>


      <section id="how" className="relative border-t border-line bg-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">How it works</div>
            <SplitHeading
              text="From idea to shipped, in three moves"
              className="text-4xl font-bold tracking-tight md:text-5xl"
            />
          </Reveal>

          <div className="relative grid gap-12 md:grid-cols-3">
            <DrawLine />
            {steps.map(({ n, icon: Icon, title, text }, i) => (
              <Reveal key={n} delay={i * 150} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-white text-accent shadow-lg shadow-accent/10 transition-transform hover:scale-110">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="mb-2 text-sm font-bold uppercase tracking-widest text-accent/70">Step {n}</div>
                <h3 className="mb-3 text-2xl font-bold tracking-tight">{title}</h3>
                <p className="mx-auto max-w-xs text-[15px] leading-relaxed text-muted">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      <section className="relative overflow-hidden border-t border-line bg-bg py-24 md:py-32">
        <Parallax speed={0.08} className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-accent/10 blur-2xl" />
        <div className="relative mx-auto max-w-5xl px-6">
          <Reveal className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">The rhythm</div>
            <SplitHeading text="A day on Flowboard" className="text-4xl font-bold tracking-tight md:text-5xl" />
            <p className="mt-5 text-lg text-muted">Work lands, moves and finishes without anyone chasing status.</p>
          </Reveal>

          <div className="relative">
            <span className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/50 via-line to-transparent md:left-1/2" />
            {[
              { time: '09:00', title: 'Standup, already current', text: 'Overnight moves are on the board. Nobody reports anything — they just read it.', icon: Timer },
              { time: '11:30', title: 'A bug shows up', text: 'It goes straight into the backlog with a priority dot and a label, before it evaporates.', icon: Bell },
              { time: '14:00', title: 'Someone starts it', text: 'The card slides to In Progress and every screen updates in the same beat.', icon: MousePointerClick },
              { time: '17:30', title: 'Cycle bar moves', text: 'Done cards lift the progress bar, the inbox is cleared, tomorrow is already queued.', icon: TrendingUp },
            ].map(({ time, title, text, icon: Icon }, i) => (
              <Reveal key={time} variant={i % 2 ? 'right' : 'left'} delay={i * 90} className="relative mb-8 last:mb-0">
                <div className={`flex items-start gap-5 md:w-1/2 ${i % 2 ? 'md:ml-auto md:pl-10' : 'md:pr-10'}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-white text-accent shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="lift-glow flex-1 rounded-2xl border border-line bg-white p-5">
                    <div className="text-[12.5px] font-semibold uppercase tracking-wide text-accent">{time}</div>
                    <div className="mt-1 text-[17px] font-semibold">{title}</div>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      <section className="relative overflow-hidden border-t border-line bg-bg py-28 md:py-36">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute left-10 top-16 h-40 w-40 animate-spin-slow rounded-2xl border-2 border-accent/20" />
        <div className="pointer-events-none absolute bottom-16 right-10 h-32 w-32 animate-spin-rev rounded-full border-2 border-violet-500/20" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <Sparkles className="mx-auto mb-6 h-8 w-8 text-accent" />
            <ScrollScrub
              text="The best tracker is the one nobody notices — it just keeps up."
              highlight={['keeps', 'up']}
              className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl"
            />
          </Reveal>
          <Reveal delay={140} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Command, label: 'Keyboard-first' },
              { icon: Timer, label: 'Instant filters' },
              { icon: RefreshCw, label: 'Live updates' },
              { icon: MousePointerClick, label: 'Drag everything' },
              { icon: TrendingUp, label: 'Optimistic UI' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm text-muted shadow-sm transition-all hover:-translate-y-1 hover:border-accent/40 hover:text-fg hover:shadow-md"
              >
                <Icon className="h-4 w-4 text-accent" />
                {label}
              </span>
            ))}
          </Reveal>
        </div>
      </section>


      <section className="relative overflow-hidden border-t border-line bg-bg py-24 md:py-32">
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Works with your stack</div>
            <SplitHeading text="Plugs into where work already happens" className="text-4xl font-bold tracking-tight md:text-5xl" />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: GitBranch, name: 'Repositories', text: 'Link issues to branches and pull requests so context never gets lost.' },
              { icon: Bell, name: 'Notifications', text: 'Assignments and replies land in your inbox, not in three different apps.' },
              { icon: Layers, name: 'Docs & specs', text: 'Keep the brief inside the project instead of a folder nobody opens.' },
              { icon: Command, name: 'Command menu', text: 'Keyboard-first navigation for people who hate reaching for the mouse.' },
              { icon: Boxes, name: 'Import & export', text: 'Move a backlog in from CSV or out to your own database whenever you like.' },
              { icon: Workflow, name: 'REST API', text: 'Everything the UI does is an endpoint — script it, automate it, own it.' },
            ].map(({ icon: Icon, name, text }, i) => (
              <Reveal key={name} delay={(i % 3) * 90} variant="zoom">
                <div className="lift-glow sheen-sweep group h-full rounded-2xl border border-line bg-white p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-[17px] font-semibold">{name}</div>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      <section id="compare" className="relative border-t border-line bg-white py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Compare</div>
            <SplitHeading
              text="Less software. More shipped."
              className="text-4xl font-bold tracking-tight md:text-5xl"
            />
            <p className="mt-5 text-lg text-muted">Here is exactly what this build does today, and an honest list of what it does not.</p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            <Reveal variant="left">
              <div className="conic-border relative h-full rounded-3xl bg-white p-7 shadow-2xl shadow-accent/10">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">In the app today</span>
                  <span className="rounded-full bg-ok/15 px-3 py-1 text-[12px] font-semibold text-ok">Working</span>
                </div>
                <div className="mt-6 flex flex-col gap-3.5">
                  {includedToday.map((label, i) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 text-[15px] text-fg opacity-0"
                      style={{ animation: `row-in .5s cubic-bezier(.16,1,.3,1) ${i * 90}ms forwards` }}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ok/15">
                        <Check className="h-3.5 w-3.5 text-ok" />
                      </span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal variant="right" delay={100}>
              <div className="h-full rounded-3xl border border-line bg-bg p-7">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-muted">Honestly not here yet</span>
                  <span className="rounded-full bg-line px-3 py-1 text-[12px] font-semibold text-faint">Backlog</span>
                </div>
                <div className="mt-6 flex flex-col gap-3.5">
                  {notBuiltYet.map((label, i) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 text-[15px] text-faint opacity-0"
                      style={{ animation: `row-in .5s cubic-bezier(.16,1,.3,1) ${i * 90}ms forwards` }}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-line/70">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>


      <section id="faq" className="relative border-t border-line bg-white py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal className="mb-12 text-center">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">FAQ</div>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Questions, answered</h2>
          </Reveal>
          <div className="flex flex-col gap-4">
            {faqs.map(([q, a], i) => (
              <Reveal key={q} delay={i * 70}>
                <details className="group rounded-xl border border-line bg-bg px-5 py-4 transition-colors hover:border-accent/40">
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


      <section className="relative overflow-hidden border-t border-line bg-white py-24 md:py-32">
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 md:grid-cols-2">
          <Reveal variant="left">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Your data, your rules</div>
            <SplitHeading text="Nothing leaves unless you move it." className="text-4xl font-bold tracking-tight md:text-5xl" />
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              Flowboard runs on a plain SQLite file behind a JWT-secured API. No tracking pixels, no
              data brokers, no surprise exports — everything lives in a database you can hold.
            </p>
            <div className="mt-8 flex flex-col gap-3.5">
              {[
                'Self-hostable in a single container or file',
                'Signed tokens for every request, roles per team',
                'Delete your workspace and it is actually deleted',
              ].map((t) => (
                <span key={t} className="flex items-start gap-2.5 text-[15px] text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> {t}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal variant="right" delay={120}>
            <div className="relative rounded-3xl border border-line bg-bg p-7">
              <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[15px] font-semibold">Workspace access</div>
                  <div className="text-[13px] text-faint">Encrypted at rest, token-scoped per user</div>
                </div>
              </div>
              <div className="relative mt-6 flex flex-col gap-3">
                {[
                  ['Ayesha R.', 'Owner', '#6366f1'],
                  ['Bilal K.', 'Member', '#10b981'],
                  ['You', 'Owner', '#8b5cf6'],
                ].map(([name, role, color], i) => (
                  <div key={name} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3" style={{ animation: `row-in .5s cubic-bezier(.16,1,.3,1) ${i * 120}ms both` }}>
                    <span className="flex items-center gap-3 text-[14.5px]">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold text-white" style={{ background: color }}>{name[0]}</span>
                      {name}
                    </span>
                    <span className="rounded-full bg-raised px-2.5 py-1 text-[11.5px] font-medium text-muted">{role}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>


      <Newsletter />


      <section
        className="relative overflow-hidden border-t border-line bg-bg py-32"
        onMouseMove={(e) => {
          const el = e.currentTarget
          const r = el.getBoundingClientRect()
          el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(2)}%`)
          el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(2)}%`)
        }}
      >
        <div className="hero-spot pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-10 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-accent/12 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <div className="mx-auto mb-8 w-max animate-bob">
              <Logo size={64} withWord={false} />
            </div>
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
              Ready to organise <span className="sheen">your work</span>?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
              No sign-up wall, no credit card — the seeded workspace opens straight away.
            </p>
            <Magnetic strength={0.25} className="mt-9">
              <Link
                to="/app/board"
                className="btn-shine conic-border group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-9 py-4 text-base font-medium text-white shadow-xl shadow-accent/30 transition-all hover:shadow-2xl"
              >
                Open Flowboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </section>


      <footer className="border-t border-line bg-white py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo size={30} wordClass="text-[16px]" />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A fast, minimal Linear-style issue tracker for small teams. Boards, cycles,
              labels and realtime updates.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 text-sm sm:grid-cols-3">
            {[
              ['Product', ['Features', 'Product', 'How it works', 'Compare', 'FAQ'], 'anchor'],
              ['Workspace', ['Open board', 'Issue list', 'Timeline', 'Inbox'], 'app'],
              ['Resources', ['Docs', 'Changelog', 'About', 'Contact'], 'page'],
            ].map(([head, links, kind]) => (
              <div key={head}>
                <div className="mb-3 font-semibold">{head}</div>
                <div className="flex flex-col gap-2.5 text-muted">
                  {links.map((l) => {
                    if (kind === 'anchor') {
                      return <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="transition-colors hover:text-accent">{l}</a>
                    }
                    if (kind === 'app') {
                      const map = { 'Open board': '/app/board', 'Issue list': '/app/issues', Timeline: '/app/timeline', Inbox: '/app/inbox' }
                      return <Link key={l} to={map[l]} className="transition-colors hover:text-accent">{l}</Link>
                    }
                    const map = { Docs: '/docs', Changelog: '/changelog', About: '/about', Contact: '/contact' }
                    return <Link key={l} to={map[l]} className="transition-colors hover:text-accent">{l}</Link>
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-line px-6 pt-6 text-[13px] text-faint sm:flex-row">
          <span>© {new Date().getFullYear()} Flowboard — a Linear-style tracker, built end to end.</span>
          <span className="flex items-center gap-3">
            <Link to="/terms" className="transition-colors hover:text-accent">Terms</Link>
            <Link to="/privacy" className="transition-colors hover:text-accent">Privacy</Link>
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> No trackers, no ads</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
