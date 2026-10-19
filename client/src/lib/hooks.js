import { useCallback, useEffect, useRef, useState } from 'react'
import { isTypingTarget } from './utils'

export function useCountUp(value = 0, duration = 900) {
  const [display, setDisplay] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const initial = from.current
    let raf
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setDisplay(initial + (value - initial) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return Math.round(display)
}

export function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {

    }
  }, [key, value])

  return [value, setValue]
}

export function useHotkeys(combo, handler, deps = []) {
  useEffect(() => {
    const parts = combo.toLowerCase().split('+')
    const needsMod = parts.includes('mod')
    const needsShift = parts.includes('shift')
    const key = parts.filter((p) => !['mod', 'shift', 'alt'].includes(p))[0]

    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey
      if (needsMod !== mod) return
      if (needsShift && !e.shiftKey) return
      if (e.key.toLowerCase() !== key) return
      if (key !== 'escape' && key !== '/' && isTypingTarget(e.target) && !needsMod) return
      e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)

  }, [combo, ...deps])
}

export function useOnClickOutside(callback) {
  const ref = useRef(null)
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) callback(e)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [callback])
  return ref
}

export function useInView({ threshold = 0.15, once = true } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) setInView(false)
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once])

  return [ref, inView]
}

export function useInterval(callback, delay) {
  const saved = useRef(callback)
  useEffect(() => {
    saved.current = callback
  }, [callback])
  useEffect(() => {
    if (delay == null) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(query).matches))
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export function usePrevious(value) {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

export function useCopy(timeout = 1600) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        const el = document.createElement('textarea')
        el.value = text
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
      return true
    },
    [timeout],
  )
  return [copied, copy]
}

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const memo = useCallback(fn, deps)

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try {
      const data = await memo()
      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      setState({ data: null, loading: false, error })
      return null
    }
  }, [memo])

  useEffect(() => {
    run()
  }, [run])

  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) }
}
