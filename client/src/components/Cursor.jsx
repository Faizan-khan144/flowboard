import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mx = -100
    let my = -100
    let rx = -100
    let ry = -100
    let raf = 0

    const loop = () => {
      rx += (mx - rx) * 0.16
      ry += (my - ry) * 0.16
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }

    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
    }

    const onOver = (e) => {
      const t = e.target
      const interactive = t.closest && t.closest('a, button, [role="button"], input, textarea, summary, label')
      ring.classList.toggle('is-hover', !!interactive)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    document.body.classList.add('has-fb-cursor')
    raf = requestAnimationFrame(loop)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.body.classList.remove('has-fb-cursor')
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden="true" className="hidden md:block">
      <div ref={dotRef} className="fb-cursor-dot" />
      <div ref={ringRef} className="fb-cursor-ring" />
    </div>
  )
}
