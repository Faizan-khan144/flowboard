export const STATUSES = [
  { id: 'BACKLOG', label: 'Backlog', color: '#8b8b9e', icon: 'circle' },
  { id: 'TODO', label: 'Todo', color: '#6b7280', icon: 'circle-dashed' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6', icon: 'circle-half' },
  { id: 'DONE', label: 'Done', color: '#10b981', icon: 'check' },
  { id: 'CANCELED', label: 'Canceled', color: '#9aa0ad', icon: 'x' },
]

export const PRIORITIES = [
  { id: 'URGENT', label: 'Urgent', color: '#ef4444', short: 'P0' },
  { id: 'HIGH', label: 'High', color: '#f59e0b', short: 'P1' },
  { id: 'MEDIUM', label: 'Medium', color: '#3b82f6', short: 'P2' },
  { id: 'LOW', label: 'Low', color: '#8b8b9e', short: 'P3' },
  { id: 'NONE', label: 'None', color: '#5b5b6e', short: '—' },
]

export const ROLES = [
  { id: 'OWNER', label: 'Owner', hint: 'Full control, approves requests' },
  { id: 'MEMBER', label: 'Member', hint: 'Create and edit work' },
  { id: 'VIEWER', label: 'Viewer', hint: 'Read-only access' },
]

export const REACTIONS = ['👍', '🔥', '🎉', '🚀', '❤️', '👀', '✅', '🙌']

export const statusMeta = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0]
export const priorityMeta = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[4]
export const roleMeta = (id) => ROLES.find((r) => r.id === id) || ROLES[1]

export const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 }
export const statusOrder = (id) => STATUSES.findIndex((s) => s.id === id)

export function relativeTime(date) {
  if (!date) return ''
  const then = new Date(date).getTime()
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function shortDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function dueMeta(date, status) {
  if (!date) return null
  const target = new Date(date)
  const diff = target.getTime() - Date.now()
  const days = Math.ceil(diff / 864e5)
  if (status === 'DONE') return { label: shortDate(date), tone: 'done' }
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: 'overdue' }
  if (days === 0) return { label: 'Today', tone: 'today' }
  if (days === 1) return { label: 'Tomorrow', tone: 'soon' }
  if (days <= 6) return { label: `${days}d left`, tone: 'soon' }
  return { label: shortDate(date), tone: 'calm' }
}

export function groupBy(list, keyFn) {
  return list.reduce((acc, item) => {
    const key = keyFn(item)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}
