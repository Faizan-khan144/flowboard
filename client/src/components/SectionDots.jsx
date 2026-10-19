import { useEffect, useState } from 'react'

export default function SectionDots({ sections }) {
  const [active, setActive] = useState('')

  useEffect(() => {
    const ids = sections.filter(Boolean)
    if (!ids.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        const top = entries.find((e) => e.isIntersecting)
        if (top) setActive(top.target.id)
      },
      { threshold: 0.4, rootMargin: '-10% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [sections])

  return (
    <div className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 xl:flex">
      {sections.map((id) => {
        if (!id) return null
        const a = active === id
        return (
          <a
            key={id}
            href={`#${id}`}
            aria-label={`Go to ${id}`}
            className={`group flex h-2 w-2 items-center justify-center rounded-full transition-all duration-300 ${a ? 'scale-125' : 'hover:scale-110'}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full transition-all ${a ? 'bg-accent shadow-[0_0_0_4px_rgba(91,91,214,.15)]' : 'bg-line group-hover:bg-accent/60'}`} />
          </a>
        )
      })}
    </div>
  )
}
