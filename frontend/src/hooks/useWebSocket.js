import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

/**
 * Custom hook that manages a single Socket.IO connection lifecycle.
 * It exposes the latest order payload and connection status for UI consumption.
 *
 * @param {string} url Backend WebSocket endpoint.
 * @returns {{ incomingOrder: null | {
 *   timestamp: string,
 *   order_id: string,
 *   product: string,
 *   amount: number,
 *   quantity: number,
 *   channel: string,
 *   status: 'SUCCESS' | 'FAIL'
 * }, initialOrders: Array<{
 *   timestamp: string,
 *   order_id: string,
 *   product: string,
 *   amount: number,
 *   quantity: number,
 *   channel: string,
 *   status: 'SUCCESS' | 'FAIL'
 * }>, isConnected: boolean }}
 */
function useWebSocket(url) {
  const socketRef = useRef(null)
  const [incomingOrder, setIncomingOrder] = useState(null)
  const [initialOrders, setInitialOrders] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket = io(url, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketRef.current = socket

    /**
     * Marks the connection as ready and logs successful handshake events.
     */
    const onConnect = () => {
      console.log(`[ws] connected: ${socket.id}`)
      setIsConnected(true)
    }

    /**
     * Marks the connection as disconnected and logs disconnect reason.
     * @param {string} reason Reason returned by socket.io.
     */
    const onDisconnect = (reason) => {
      console.log(`[ws] disconnected: ${reason}`)
      setIsConnected(false)
    }

    /**
     * Stores the latest order payload emitted by the backend stream.
     * @param {{ timestamp: string, order_id: string, product: string, amount: number, quantity: number, channel: string, status: 'SUCCESS' | 'FAIL' }} payload
     */
    const onNewOrder = (payload) => {
      setIncomingOrder(payload)
    }

    /**
     * Stores server-hydrated historical records for initial chart/table rendering.
     * @param {Array<{ timestamp: string, order_id: string, product: string, amount: number, quantity: number, channel: string, status: 'SUCCESS' | 'FAIL' }>} payload
     */
    const onInitialData = (payload) => {
      setInitialOrders(Array.isArray(payload) ? payload : [])
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('initial_data', onInitialData)
    socket.on('new_order', onNewOrder)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('initial_data', onInitialData)
      socket.off('new_order', onNewOrder)
      socket.disconnect()
      socketRef.current = null
    }
  }, [url])

  return { incomingOrder, initialOrders, isConnected }
}

export default useWebSocket
