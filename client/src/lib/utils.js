import { PRIORITY_ORDER, statusOrder } from './constants'

export const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n))

export const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0)

export const sum = (list, fn = (x) => x) => list.reduce((a, b) => a + (Number(fn(b)) || 0), 0)

export const round = (n, digits = 1) => {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

export const formatNumber = (n) => {
  if (n == null) return '0'
  if (Math.abs(n) >= 1000) return `${round(n / 1000, 1)}k`
  return String(n)
}

export const truncate = (text, len = 80) => (text && text.length > len ? `${text.slice(0, len - 1)}…` : text || '')

export const pluralize = (n, one, many) => `${n} ${n === 1 ? one : many ?? `${one}s`}`

export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

export const initials = (name) =>
  String(name || '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

/* ------------------------------------------------------------------ */
/* colors                                                             */
/* ------------------------------------------------------------------ */

export const hexToRgb = (hex) => {
  const n = parseInt(String(hex || '#6366f1').replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export const rgbCss = ({ r, g, b }, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`

export const shade = (hex, amount = 30) => {
  const { r, g, b } = hexToRgb(hex)
  return rgbCss({ r: Math.max(0, r - amount), g: Math.max(0, g - amount), b: Math.max(0, b - amount) })
}

export const tint = (hex, alpha = 0.12) => rgbCss(hexToRgb(hex), alpha)

export const gradientFor = (hex) => `linear-gradient(140deg, ${hex}, ${shade(hex, 40)})`

export const hashColor = (str) => {
  const palette = ['#5b5bd6', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444']
  let hash = 0
  for (let i = 0; i < String(str).length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) % 9973
  return palette[hash % palette.length]
}

/* ------------------------------------------------------------------ */
/* dates                                                              */
/* ------------------------------------------------------------------ */

export const startOfDay = (d = new Date()) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 864e5)

export const isOverdue = (issue) => Boolean(issue?.dueDate) && daysBetween(new Date(), issue.dueDate) < 0 && issue.status !== 'DONE'

export const isDueSoon = (issue, days = 7) => {
  if (!issue?.dueDate || issue.status === 'DONE') return false
  const d = daysBetween(new Date(), issue.dueDate)
  return d >= 0 && d <= days
}

export const formatDate = (date, opts = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  date ? new Date(date).toLocaleDateString(undefined, opts) : ''

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''

export const isoDate = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '')

export const greeting = (date = new Date()) => {
  const h = date.getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 22) return 'Good evening'
  return 'Late night'
}

/* ------------------------------------------------------------------ */
/* arrays & objects                                                   */
/* ------------------------------------------------------------------ */

export const uniqueBy = (list, keyFn) => {
  const seen = new Set()
  return list.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const sortBy = (list, fn, dir = 'asc') =>
  [...list].sort((a, b) => {
    const va = fn(a)
    const vb = fn(b)
    if (va === vb) return 0
    const result = va > vb ? 1 : -1
    return dir === 'asc' ? result : -result
  })

export const groupBy = (list, keyFn) =>
  list.reduce((acc, item) => {
    const key = keyFn(item)
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {})

export const chunk = (list, size) =>
  list.reduce((acc, item, i) => {
    if (i % size === 0) acc.push([])
    acc[acc.length - 1].push(item)
    return acc
  }, [])

export const range = (n) => Array.from({ length: n }, (_, i) => i)

export const toggleInArray = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

export const moveItem = (list, from, to) => {
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

export const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj?.[key] !== undefined) acc[key] = obj[key]
    return acc
  }, {})

export const sameShallow = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* ------------------------------------------------------------------ */
/* timing                                                             */
/* ------------------------------------------------------------------ */

export function debounce(fn, wait = 250) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

export function throttle(fn, wait = 120) {
  let last = 0
  let timer
  return (...args) => {
    const now = Date.now()
    if (now - last >= wait) {
      last = now
      fn(...args)
    } else {
      clearTimeout(timer)
      timer = setTimeout(() => {
        last = Date.now()
        fn(...args)
      }, wait - (now - last))
    }
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ------------------------------------------------------------------ */
/* issue-specific helpers                                             */
/* ------------------------------------------------------------------ */

export const issueKey = (issue) => (issue?.project ? `${issue.project.key}-${issue.number}` : `#${issue?.number ?? ''}`)

export const issueMatches = (issue, { q, status = [], priority = [], assignee = [], label = [], cycle = [], project = [], due, me }) => {
  if (q) {
    const haystack = `${issueKey(issue)} ${issue.title} ${issue.description || ''}`.toLowerCase()
    if (!haystack.includes(q.toLowerCase())) return false
  }
  if (status.length && !status.includes(issue.status)) return false
  if (priority.length && !priority.includes(issue.priority)) return false
  if (project.length && !project.includes(issue.projectId)) return false
  if (label.length && !issue.labels?.some((l) => label.includes(l.labelId))) return false
  if (cycle.length) {
    const inCycle = issue.cycleId && cycle.includes(issue.cycleId)
    if (!inCycle && !(cycle.includes('none') && !issue.cycleId)) return false
  }
  if (assignee.length) {
    const isMe = assignee.includes('me') && issue.assigneeId === me
    const isNone = assignee.includes('none') && !issue.assigneeId
    if (!isMe && !isNone && !assignee.includes(issue.assigneeId)) return false
  }
  if (due === 'overdue' && !isOverdue(issue)) return false
  if (due === 'soon' && !isDueSoon(issue)) return false
  if (due === 'none' && issue.dueDate) return false
  return true
}

export const sortIssuesBy = (list, sort = 'updated', dir = 'desc') => {
  const mul = dir === 'asc' ? 1 : -1
  const comparators = {
    priority: (a, b) => mul * ((PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)),
    status: (a, b) => mul * (statusOrder(a.status) - statusOrder(b.status)),
    number: (a, b) => mul * (a.number - b.number),
    title: (a, b) => mul * a.title.localeCompare(b.title),
    due: (a, b) => mul * ((a.dueDate ? new Date(a.dueDate).getTime() : Infinity) - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity)),
    estimate: (a, b) => mul * ((a.estimate || 0) - (b.estimate || 0)),
    created: (a, b) => mul * (new Date(a.createdAt) - new Date(b.createdAt)),
    updated: (a, b) => mul * (new Date(a.updatedAt) - new Date(b.updatedAt)),
  }
  return [...list].sort(comparators[sort] || comparators.updated)
}

export const issueStats = (issues) => {
  const total = issues.length
  const done = issues.filter((i) => i.status === 'DONE').length
  const byStatus = groupBy(issues, (i) => i.status)
  const byPriority = groupBy(issues, (i) => i.priority)
  const byAssignee = groupBy(issues.filter((i) => i.assigneeId), (i) => i.assigneeId)
  return {
    total,
    done,
    completion: pct(done, total),
    open: total - done,
    overdue: issues.filter(isOverdue).length,
    dueSoon: issues.filter((i) => isDueSoon(i)).length,
    estimate: sum(issues, (i) => i.estimate),
    byStatus,
    byPriority,
    byAssignee,
  }
}

/* ------------------------------------------------------------------ */
/* charts (lightweight, no deps)                                      */
/* ------------------------------------------------------------------ */

export const sparklinePoints = (values, width = 120, height = 32) => {
  if (!values.length) return ''
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  return values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * width
      const y = height - ((v - min) / span) * height
      return `${round(x, 1)},${round(y, 1)}`
    })
    .join(' ')
}

export const donutSegments = (entries, size = 120, stroke = 14) => {
  const total = sum(entries, (e) => e.value) || 1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return entries.map((entry) => {
    const length = (entry.value / total) * c
    const segment = { ...entry, dash: `${length} ${c - length}`, offset: -offset, color: entry.color }
    offset += length
    return segment
  })
}

/* ------------------------------------------------------------------ */
/* files & clipboard                                                  */
/* ------------------------------------------------------------------ */

export const toCsv = (rows, columns) => {
  const head = columns.map((c) => c.label).join(',')
  const body = rows
    .map((row) => columns.map((c) => `"${String(c.value(row) ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  return `${head}\n${body}`
}

export const downloadFile = (filename, content, type = 'text/csv;charset=utf-8') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/* keyboard                                                           */
/* ------------------------------------------------------------------ */

export const isTypingTarget = (el) => {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export const isMac = () => /mac/i.test(navigator.platform || navigator.userAgent)
export const modKey = () => (isMac() ? '⌘' : 'Ctrl')
