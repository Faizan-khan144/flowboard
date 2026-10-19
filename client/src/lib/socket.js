import { io } from 'socket.io-client'

let socket = null

export function connectSocket() {
  if (socket) return socket
  const token = localStorage.getItem('fb_token')
  if (!token) return null
  socket = io('/', { auth: { token }, transports: ['websocket', 'polling'] })
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
