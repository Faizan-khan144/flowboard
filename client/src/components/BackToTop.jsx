import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [show, setShow] = useState(false)
  const [p, setP] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > 700)
      const h = document.documentElement.scrollHeight - window.innerHeight
      setP(h > 0 ? window.scrollY / h : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white/90 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
      >
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle cx="18" cy="18" r="16" stroke="rgba(91,91,214,.25)" strokeWidth="1.5" fill="none" />
          <circle
            cx="18"
            cy="18"
            r="16"
            stroke="url(#bt)"
            strokeWidth="1.5"
            strokeDasharray="100.5"
            strokeDashoffset={100.5 - 100.5 * p}
            strokeLinecap="round"
            fill="none"
          />
          <defs>
            <linearGradient id="bt" x1="0" y1="0" x2="36" y2="0">
              <stop stopColor="#5b5bd6" />
              <stop offset="1" stopColor="#9333ea" />
            </linearGradient>
          </defs>
        </svg>
        <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
      </button>
    </div>
  )
}
