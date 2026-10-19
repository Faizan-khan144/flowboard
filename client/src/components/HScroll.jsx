import { useEffect, useRef } from 'react'
import { Command, Tags, Users, CalendarRange, PanelRight } from 'lucide-react'
import SplitHeading from './SplitHeading'

const cards = [
  {
    icon: PanelRight,
    tag: 'Issue detail',
    title: 'Everything on one panel',
    text: 'Description, labels, priority, assignee and the full comment thread — no modals, no navigation.',
    body: (
      <div className="rounded-xl border border-line bg-white p-4 text-left shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-[11px] text-faint">
          <span className="rounded bg-raised px-1.5 py-0.5 font-semibold">FB-6</span>
          <span className="rounded bg-[#dc2626] px-1.5 py-0.5 text-[9px] font-bold text-white">URGENT</span>
        </div>
        <div className="text-sm font-semibold">Build issue board</div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
          Kanban board with drag and drop columns, optimistic updates and live sync.
        </p>
        <div className="mt-3 flex gap-1.5">
          <span className="rounded-full bg-[#10b981] px-2 py-0.5 text-[10px] text-white">feature</span>
          <span className="rounded-full bg-[#8b5cf6] px-2 py-0.5 text-[10px] text-white">design</span>
        </div>
        <div className="mt-3 border-t border-line pt-2.5 text-[11px] text-faint">2 comments · updated 3m ago</div>
      </div>
    ),
  },
  {
    icon: Command,
    tag: 'Command palette',
    title: 'Move at keyboard speed',
    text: 'Jump to any issue, switch status and fire actions without your hands ever leaving the keys.',
    body: (
      <div className="rounded-xl border border-line bg-white p-3 text-left shadow-sm">
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-line bg-bg px-2.5 py-2 text-[12px] text-faint">
          <Command className="h-3.5 w-3.5" /> Type a command or search…
        </div>
        {['Move to In Progress', 'Assign to me', 'Set priority: Urgent', 'Add label: bug'].map((c, i) => (
          <div
            key={c}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] ${i === 0 ? 'bg-accent/10 text-accent' : 'text-muted'}`}
          >
            {c}
            <span className="text-[10px] text-faint">↵</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Tags,
    tag: 'Labels & filters',
    title: 'Slice the backlog instantly',
    text: 'Stack status, priority, label and text filters — hundreds of issues narrow down as you type.',
    body: (
      <div className="rounded-xl border border-line bg-white p-4 text-left shadow-sm">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {['bug', 'feature', 'design', 'chore'].map((l, i) => (
            <span
              key={l}
              className={`rounded-full px-2 py-0.5 text-[11px] ${i < 2 ? 'bg-accent text-white' : 'border border-line text-muted'}`}
            >
              {l}
            </span>
          ))}
        </div>
        {[
          ['FB-12  Race condition in socket join', 'bug'],
          ['FB-8  Empty state for inbox', 'design'],
          ['FB-3  Seed data script', 'chore'],
        ].map(([t, l]) => (
          <div key={t} className="flex items-center justify-between border-t border-line py-2 text-[12px]">
            <span className="truncate text-fg">{t}</span>
            <span className="ml-2 shrink-0 text-[10px] text-faint">{l}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Users,
    tag: 'Multiplayer',
    title: 'Work side by side, live',
    text: 'Assign issues, comment, and watch cards fly across the board the moment a teammate moves them.',
    body: (
      <div className="rounded-xl border border-line bg-white p-4 text-left shadow-sm">
        <div className="mb-3 flex -space-x-2">
          {['#6366f1', '#ec4899', '#10b981', '#f59e0b'].map((c, i) => (
            <span
              key={c}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white"
              style={{ background: c, zIndex: 4 - i }}
            >
              {['F', 'A', 'B', 'S'][i]}
            </span>
          ))}
        </div>
        {['Ayesha is editing FB-6', 'Bilal commented on FB-7', 'Sana moved FB-5 → Done'].map((t) => (
          <div key={t} className="mb-2 flex items-center gap-2 text-[12px] text-muted last:mb-0">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            {t}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: CalendarRange,
    tag: 'Cycles',
    title: 'Ship on a rhythm',
    text: 'Time-box cycles, see what is committed, and roll unfinished work forward without a planning spreadsheet.',
    body: (
      <div className="rounded-xl border border-line bg-white p-4 text-left shadow-sm">
        <div className="mb-2 flex items-center justify-between text-[12px]">
          <span className="font-semibold">Cycle 3 · Oct 12 – Oct 26</span>
          <span className="text-faint">68%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-violet-500" style={{ width: '68%' }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[['12', 'done'], ['4', 'active'], ['3', 'todo']].map(([n, l]) => (
            <div key={l} className="rounded-lg bg-bg py-2">
              <div className="text-sm font-bold">{n}</div>
              <div className="text-[10px] text-faint">{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export default function HScroll() {
  const wrapRef = useRef(null)
  const trackRef = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const track = trackRef.current
    if (!wrap || !track) return
    let raf = 0

    const update = () => {
      raf = 0
      const rect = wrap.getBoundingClientRect()
      const total = wrap.offsetHeight - window.innerHeight
      if (total <= 0) return
      const p = Math.min(Math.max(-rect.top / total, 0), 1)
      const max = Math.max(track.scrollWidth - window.innerWidth + 64, 0)
      track.style.transform = `translate3d(${(-p * max).toFixed(2)}px, 0, 0)`
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={wrapRef} className="relative border-t border-line bg-bg" style={{ height: '340vh' }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">A closer look</div>
              <SplitHeading
                text="Scroll through the workspace"
                className="text-4xl font-bold tracking-tight md:text-5xl"
              />
            </div>
            <p className="max-w-sm text-[15px] text-muted md:text-right">
              Keep scrolling — the panel slides sideways while the section stays pinned.
            </p>
          </div>
        </div>

        <div className="overflow-visible">
          <div ref={trackRef} className="flex w-max gap-6 pl-[max(1.5rem,calc((100vw-72rem)/2))] pr-24 will-change-transform">
            {cards.map(({ icon: Icon, tag, title, text, body }) => (
              <article
                key={tag}
                className="group w-[min(84vw,26rem)] shrink-0 rounded-3xl border border-line bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/10"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-accent group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-accent">{tag}</div>
                <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                <p className="mb-5 mt-2 text-[14.5px] leading-relaxed text-muted">{text}</p>
                <div className="animate-float">{body}</div>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 w-full max-w-6xl px-6">
          <div className="h-1 overflow-hidden rounded-full bg-line">
            <div ref={barRef} className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-violet-500" style={{ transform: 'scaleX(0)' }} />
          </div>
        </div>
      </div>
    </section>
  )
}
