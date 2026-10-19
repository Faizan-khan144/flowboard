import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PRIORITY_ORDER, statusOrder } from './constants'

const LIST_KEYS = ['status', 'priority', 'assignee', 'label', 'project', 'cycle']

export function useIssueFilters(defaults = {}) {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(() => {
    const out = { group: 'none', sort: 'updated', dir: 'desc', due: null, q: '' }
    for (const key of LIST_KEYS) out[key] = []
    Object.assign(out, defaults)
    for (const key of LIST_KEYS) {
      const raw = params.get(key)
      if (raw) out[key] = raw.split(',')
    }
    for (const key of ['q', 'group', 'sort', 'dir', 'due']) {
      const raw = params.get(key)
      if (raw) out[key] = raw
    }
    return out

  }, [params])

  const setFilters = useCallback(
    (next) => {
      const merged = typeof next === 'function' ? next(filters) : next
      const p = new URLSearchParams()
      for (const key of LIST_KEYS) {
        if (merged[key]?.length) p.set(key, merged[key].join(','))
      }
      for (const key of ['q', 'group', 'sort', 'dir', 'due']) {
        if (merged[key] && merged[key] !== 'none' && !(key === 'sort' && merged[key] === 'updated') && !(key === 'dir' && merged[key] === 'desc')) {
          p.set(key, merged[key])
        }
      }
      setParams(p, { replace: true })
    },
    [filters, setParams],
  )

  return [filters, setFilters]
}

export function applyClientFilters(issues, filters, userId) {
  let list = [...(issues || [])]
  const { q, status, priority, assignee, label, project, cycle, due } = filters

  if (q) {
    const needle = q.toLowerCase()
    list = list.filter((i) =>
      `${i.project?.key}-${i.number} ${i.title} ${i.description || ''}`.toLowerCase().includes(needle),
    )
  }
  if (status?.length) list = list.filter((i) => status.includes(i.status))
  if (priority?.length) list = list.filter((i) => priority.includes(i.priority))
  if (assignee?.length) {
    list = list.filter((i) => {
      if (assignee.includes('none') && !i.assigneeId) return true
      if (assignee.includes('me') && i.assigneeId === userId) return true
      return i.assigneeId && assignee.includes(i.assigneeId)
    })
  }
  if (label?.length) list = list.filter((i) => i.labels?.some((l) => label.includes(l.labelId)))
  if (project?.length) list = list.filter((i) => project.includes(i.projectId))
  if (cycle?.length) list = list.filter((i) => (cycle.includes('none') && !i.cycleId) || (i.cycleId && cycle.includes(i.cycleId)))
  if (due === 'overdue') list = list.filter((i) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'DONE')
  if (due === 'soon') {
    const week = Date.now() + 7 * 864e5
    list = list.filter((i) => i.dueDate && new Date(i.dueDate) <= week && new Date(i.dueDate) >= new Date())
  }
  if (due === 'none') list = list.filter((i) => !i.dueDate)

  const dir = filters.dir === 'asc' ? 1 : -1
  const by = filters.sort || 'updated'
  list.sort((a, b) => {
    switch (by) {
      case 'priority':
        return dir * ((PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
      case 'status':
        return dir * (statusOrder(a.status) - statusOrder(b.status))
      case 'number':
        return dir * (a.number - b.number)
      case 'title':
        return dir * a.title.localeCompare(b.title)
      case 'estimate':
        return dir * ((a.estimate || 0) - (b.estimate || 0))
      case 'due':
        return dir * (new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
      case 'created':
        return dir * (new Date(a.createdAt) - new Date(b.createdAt))
      default:
        return dir * (new Date(a.updatedAt) - new Date(b.updatedAt))
    }
  })
  return list
}
