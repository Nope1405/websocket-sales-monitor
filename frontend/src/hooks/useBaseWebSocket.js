import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_EVENTS } from '../utils/constants'

/**
 * ============================================================================
 * useBaseWebSocket (Base Hook)
 *
 * Senior rationale:
 * - Base hook owns connection lifecycle and connectivity state only.
 * - Domain hooks can compose this safely without duplicating socket plumbing.
 * ============================================================================
 *
 * @param {string} url Socket.IO server URL.
 * @returns {{ socket: import('socket.io-client').Socket | null, isConnected: boolean }}
 */
function useBaseWebSocket(url) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = io(url, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    setSocket(socketInstance)

    /**
     * Tracks successful socket handshake.
     */
    const onConnect = () => {
      setIsConnected(true)
      console.log(`[ws-base] connected: ${socketInstance.id}`)
    }

    /**
     * Tracks disconnection state and reason.
     * @param {string} reason
     */
    const onDisconnect = (reason) => {
      setIsConnected(false)
      console.log(`[ws-base] disconnected: ${reason}`)
    }

    socketInstance.on(SOCKET_EVENTS.CONNECT, onConnect)
    socketInstance.on(SOCKET_EVENTS.DISCONNECT, onDisconnect)

    return () => {
      socketInstance.off(SOCKET_EVENTS.CONNECT, onConnect)
      socketInstance.off(SOCKET_EVENTS.DISCONNECT, onDisconnect)
      socketInstance.disconnect()
      setSocket(null)
    }
  }, [url])

  return {
    socket,
    isConnected,
  }
}

export default useBaseWebSocket
