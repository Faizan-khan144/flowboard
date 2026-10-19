import { useEffect, useRef, useState } from 'react'

export default function ScrollScrub({ text, className = '', highlight = [] }) {
  const ref = useRef(null)
  const [p, setP] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    let last = -1

    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const start = window.innerHeight * 0.9
      const dist = window.innerHeight * 0.55 + r.height * 0.25
      const prog = Math.min(1, Math.max(0, (start - r.top) / dist))
      if (Math.abs(prog - last) < 0.008) return
      last = prog
      setP(prog)
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

  const words = text.split(' ')
  const active = p * (words.length + 2)

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        const lit = Math.min(1, Math.max(0, active - i))
        const isHi = highlight.includes(w.replace(/[^a-zA-Z]/g, '').toLowerCase())
        return (
          <span
            key={`${w}-${i}`}
            style={{
              opacity: lit * 0.85 + 0.15,
              color: isHi ? `rgba(91, 91, 214, ${0.35 + lit * 0.65})` : undefined,
              transition: 'opacity .3s linear, color .3s linear',
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </p>
  )
}
