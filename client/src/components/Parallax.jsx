import { useEffect, useRef } from 'react'

export default function Parallax({ speed = 0.18, className = '', style, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0

    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return
      const centerOffset = window.innerHeight / 2 - (r.top + r.height / 2)
      el.style.transform = `translate3d(0, ${(centerOffset * speed).toFixed(2)}px, 0)`
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
  }, [speed])

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
