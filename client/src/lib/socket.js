import { io } from 'socket.io-client'

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const SOCKET_ORIGIN = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '')
const FORCE_POLL = import.meta.env.VITE_REALTIME === 'poll'
const FORCE_LIVE = import.meta.env.VITE_REALTIME === 'live'
const LIVE = FORCE_LIVE || (!FORCE_POLL && import.meta.env.DEV)
const POLL_MS = Number(import.meta.env.VITE_POLL_MS) || 4000

let socket = null

function createPollingSocket() {
  const handlers = new Map()
  const revisions = {}
  let teamId = null
  let timer = null
  let primed = false
  let focused = false

  const fire = (event, payload) => {
    const set = handlers.get(event)
    if (!set) return
    for (const handler of [...set]) {
      try {
        handler(payload)
      } catch {
        set.delete(handler)
      }
    }
  }

  const tick = async () => {
    const token = localStorage.getItem('fb_token')
    if (!token || !teamId) return
    try {
      const res = await fetch(`${API_ORIGIN}/api/live?teamId=${encodeURIComponent(teamId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (!primed) {
        Object.assign(revisions, data)
        primed = true
        return
      }
      if (revisions.issues !== data.issues) {
        revisions.issues = data.issues
        fire('issues:changed', { teamId })
        fire('issue:updated', { teamId })
      }
      if (revisions.comments !== data.comments) {
        revisions.comments = data.comments
        fire('comment:created', { teamId })
        fire('reaction:updated', { teamId })
      }
      if (revisions.activity !== data.activity) {
        revisions.activity = data.activity
        fire('activity:changed', { teamId })
      }
      if (revisions.members !== data.members) {
        revisions.members = data.members
        fire('membership:changed', { teamId })
      }
      if (revisions.notifications !== data.notifications) {
        revisions.notifications = data.notifications
        fire('notification', { unread: data.unread })
      }
    } catch {
      return
    }
  }

  const client = {
    connected: true,
    on(event, handler) {
      if (!handlers.has(event)) handlers.set(event, new Set())
      handlers.get(event).add(handler)
      start()
      return client
    },
    off(event, handler) {
      const set = handlers.get(event)
      if (!set) return client
      set.delete(handler)
      if (!set.size) handlers.delete(event)
      return client
    },
    emit(event, payload) {
      if (event === 'team:join' && payload) {
        teamId = payload
        primed = false
        tick()
      }
    },
    close() {
      if (timer) clearInterval(timer)
      timer = null
      handlers.clear()
    },
  }

  function start() {
    if (!timer) timer = setInterval(tick, POLL_MS)
    if (!focused) {
      focused = true
      window.addEventListener('focus', tick)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') tick()
      })
    }
  }

  return client
}

export function connectSocket() {
  if (socket) return socket
  const token = localStorage.getItem('fb_token')
  if (!token) return null
  socket = LIVE
    ? io(SOCKET_ORIGIN || '/', { auth: { token }, transports: ['websocket', 'polling'] })
    : createPollingSocket()
  return socket
}

export function getSocket() {
  return socket || connectSocket()
}

export function disconnectSocket() {
  if (!socket) return
  if (typeof socket.close === 'function') socket.close()
  else socket.disconnect()
  socket = null
}
