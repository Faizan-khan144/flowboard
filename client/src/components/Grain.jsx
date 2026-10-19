import { useEffect, useRef } from 'react'
import Reveal from './Reveal'

export default function Grain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    let raf = 0
    let frame = 0

    const resize = () => {
      const d = window.devicePixelRatio || 1
      c.width = window.innerWidth * d
      c.height = window.innerHeight * d
      c.style.width = window.innerWidth + 'px'
      c.style.height = window.innerHeight + 'px'
      ctx.scale(d, d)
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      if (++frame % 2 !== 0) return
      const w = window.innerWidth
      const h = window.innerHeight
      const len = (w * h) / 26000
      const img = ctx.createImageData(w, h)
      const data = img.data
      for (let i = 0; i < len; i++) {
        const x = Math.floor(Math.random() * w)
        const y = Math.floor(Math.random() * h)
        const idx = (y * w + x) * 4
        const val = Math.random() * 38
        data[idx] = data[idx + 1] = data[idx + 2] = 120
        data[idx + 3] = val
      }
      ctx.putImageData(img, 0, 0)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-50 mix-blend-multiply opacity-60"
      style={{ background: 'transparent' }}
    />
  )
}
