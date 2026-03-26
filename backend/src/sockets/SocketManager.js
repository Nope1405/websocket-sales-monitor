const { Server } = require('socket.io')
const { SOCKET_EVENTS } = require('../utils/constants')
const { generateMockOrderPayload } = require('../services/mockDataGenerator')
const OrderRepository = require('../repositories/OrderRepository')

/**
 * ============================================================================
 * SocketManager
 *
 * Senior rationale:
 * - Encapsulates socket setup + hydrate + delta stream in one cohesive object.
 * - Composition used with OrderRepository to keep concerns isolated and testable.
 * - Keeps server bootstrap thin and readable.
 * ============================================================================
 */
class SocketManager {
  /**
   * @param {import('http').Server} httpServer
   * @param {{ intervalMs?: number }} options
   */
  constructor(httpServer, options = {}) {
    this.intervalMs = options.intervalMs || 2000
    this.orderRepository = new OrderRepository()
    this.streamTimer = null

    this.io = new Server(httpServer, {
      cors: {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })
  }

  /**
   * Sets up connection listeners and starts global delta stream.
   */
  initialize() {
    this.io.on(SOCKET_EVENTS.CONNECT, async (socket) => {
      console.log(`[socket] client connected: ${socket.id}`)

      await this.sendInitialData(socket)

      socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log(`[socket] client disconnected: ${socket.id} (${reason})`)
      })
    })

    this.startDeltaStream()
  }

  /**
   * Fetches historical orders and emits only to a specific client.
   * @param {import('socket.io').Socket} socket
   */
  async sendInitialData(socket) {
    try {
      const historyDesc = await this.orderRepository.getHistoricalOrders(50)

      // DB query is DESC; chart hydration needs chronological ASC.
      const historyChronological = [...historyDesc].reverse()

      socket.emit(SOCKET_EVENTS.INITIAL_DATA, historyChronological)
      console.log(`[socket] initial_data sent to ${socket.id} (${historyChronological.length} rows)`)
    } catch (error) {
      console.error(`[socket] failed to send initial_data to ${socket.id}:`, error)
      socket.emit(SOCKET_EVENTS.INITIAL_DATA, [])
    }
  }

  /**
   * Runs the global delta loop and emits NEW_ORDER to all connected clients.
   */
  startDeltaStream() {
    let isInFlight = false

    this.streamTimer = setInterval(async () => {
      if (isInFlight) {
        return
      }

      isInFlight = true
      const payload = generateMockOrderPayload()

      try {
        await this.orderRepository.saveOrder(payload)
        this.io.emit(SOCKET_EVENTS.NEW_ORDER, payload)
        console.log(`[stream] saved+emitted order ${payload.order_id} (${payload.status})`)
      } catch (error) {
        console.error(`[stream] failed to save order ${payload.order_id}:`, error)
      } finally {
        isInFlight = false
      }
    }, this.intervalMs)
  }

  /**
   * Clears stream timers for graceful shutdown.
   */
  stop() {
    if (this.streamTimer) {
      clearInterval(this.streamTimer)
      this.streamTimer = null
    }
  }
}

module.exports = SocketManager
