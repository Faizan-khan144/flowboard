import { io } from 'socket.io-client'

const SOCKET_ORIGIN = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '')

let socket = null

export function connectSocket() {
  if (socket) return socket
  const token = localStorage.getItem('fb_token')
  if (!token) return null
  socket = io(SOCKET_ORIGIN || '/', { auth: { token }, transports: ['websocket', 'polling'] })
  return socket
}

export function getSocket() {
  return socket || connectSocket()
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
