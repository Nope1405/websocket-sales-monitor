import { useEffect, useRef, useState } from 'react'
import useBaseWebSocket from './useBaseWebSocket'
import { SOCKET_EVENTS } from '../utils/constants'

// Keep enough points for 20-minute history (~600 points at 2s cadence) plus live deltas.
const CHART_WINDOW_MINUTES = 20
const STREAM_INTERVAL_SECONDS = 2
const SAFETY_BUFFER_POINTS = 400
const MAX_ORDERS = Math.ceil((CHART_WINDOW_MINUTES * 60) / STREAM_INTERVAL_SECONDS) + SAFETY_BUFFER_POINTS

/**
 * ============================================================================
 * useSalesStream (Domain Hook)
 *
 * Senior rationale:
 * - Composes base connectivity hook to implement business-specific stream state.
 * - Encapsulates hydrate-then-delta behavior in one reusable domain hook.
 * - Dashboard components consume clean API: { orders, isConnected }.
 * ============================================================================
 *
 * @param {string} url Socket endpoint.
 * @returns {{ orders: Array<{ timestamp: string, order_id: string, product: string, amount: number, quantity: number, channel: string, status: 'SUCCESS' | 'FAIL' }>, isConnected: boolean }}
 */
function useSalesStream(url) {
  const { socket, isConnected } = useBaseWebSocket(url)
  const [orders, setOrders] = useState([])
  const hydratedRef = useRef(false)
  const pendingDeltaRef = useRef([])

  useEffect(() => {
    if (!socket) {
      return
    }

    /**
     * Deduplicates records by (order_id + timestamp) and enforces bounded size.
     * This protects state integrity when snapshot + delta payloads overlap.
     * @param {Array<any>} items
     * @returns {Array<any>}
     */
    const dedupeAndTrim = (items) => {
      const keyedOrders = new Map()

      for (const item of items) {
        const key = `${item.order_id}|${item.timestamp}`
        keyedOrders.set(key, item)
      }

      return Array.from(keyedOrders.values()).slice(-MAX_ORDERS)
    }

    /**
     * Hydration: replace full client state with server history.
     * Server guarantees chronological order for charting.
     * @param {Array<any>} payload
     */
    const onInitialData = (payload) => {
      const safeRows = Array.isArray(payload) ? payload : []

      // Snapshot-first hydration: replace current state with full 20-minute history.
      const historySnapshot = dedupeAndTrim(safeRows)

      hydratedRef.current = true
      setOrders(historySnapshot)

      // Re-apply any buffered deltas that arrived before hydration completed.
      if (pendingDeltaRef.current.length > 0) {
        setOrders((prev) => dedupeAndTrim([...prev, ...pendingDeltaRef.current]))
        pendingDeltaRef.current = []
      }
    }

    /**
     * Delta stream: append newest record and keep bounded memory footprint.
     * @param {any} payload
     */
    const onNewOrder = (payload) => {
      if (!payload) {
        return
      }

      // Buffer deltas until hydration arrives, then merge once snapshot is ready.
      if (!hydratedRef.current) {
        pendingDeltaRef.current.push(payload)
        return
      }

      setOrders((prev) => dedupeAndTrim([...prev, payload]))
    }

    socket.on(SOCKET_EVENTS.INITIAL_DATA, onInitialData)
    socket.on(SOCKET_EVENTS.NEW_ORDER, onNewOrder)

    return () => {
      socket.off(SOCKET_EVENTS.INITIAL_DATA, onInitialData)
      socket.off(SOCKET_EVENTS.NEW_ORDER, onNewOrder)

      hydratedRef.current = false
      pendingDeltaRef.current = []
    }
  }, [socket])

  return {
    orders,
    isConnected,
  }
}

export default useSalesStream
