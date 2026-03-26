const { generateMockOrderPayload } = require('../services/mockDataGenerator')
const dbService = require('../services/dbService')

/**
 * Sends historical rows to a newly connected client before live deltas arrive.
 * This enables the hydrate-then-stream pattern for chart/table rendering.
 *
 * @param {import('socket.io').Socket} socket Newly connected socket instance.
 * @param {{ limit?: number }} options Historical fetch options.
 */
async function sendInitialData(socket, options = {}) {
  const limit = options.limit || 50

  try {
    const historicalDesc = await dbService.getHistoricalOrders(limit)

    // Query returns DESC by CREATED_AT, while chart hydration expects ASC chronology.
    const historicalChronological = [...historicalDesc].reverse()

    socket.emit('initial_data', historicalChronological)
    console.log(`[socket] initial_data sent to ${socket.id} (${historicalChronological.length} rows)`)
  } catch (error) {
    console.error(`[socket] failed to fetch initial_data for ${socket.id}:`, error)
    socket.emit('initial_data', [])
  }
}

/**
 * Starts the periodic stream that emits live orders to all connected clients.
 * @param {import('socket.io').Server} io Socket.IO server instance.
 * @param {{ intervalMs?: number }} options Streaming options.
 * @returns {NodeJS.Timeout} The interval handle for advanced lifecycle management.
 */
function startOrderStream(io, options = {}) {
  const intervalMs = options.intervalMs || 2000

  return setInterval(async () => {
    const payload = generateMockOrderPayload()

    try {
      // Persist first so clients only receive events that are already durable in Oracle.
      await dbService.saveOrder(payload)

      // Emit only after successful commit, guaranteeing DB and realtime stream consistency.
      io.emit('new_order', payload)
      console.log(`[stream] saved+emitted order ${payload.order_id} (${payload.status})`)
    } catch (error) {
      // As requested, DB failures are logged and the event is intentionally not emitted.
      console.error(`[stream] failed to save order ${payload.order_id}:`, error)
    }
  }, intervalMs)
}

module.exports = {
  sendInitialData,
  startOrderStream,
}
