const express = require('express')
const http = require('http')
const cors = require('cors')
const dotenv = require('dotenv')
const SocketManager = require('./src/sockets/SocketManager')
const { initializePool, ensureOrdersTableExists, closePool } = require('./src/config/db')

dotenv.config()

let activeSocketManager = null

/**
 * Creates and configures the Express application with CORS and health route.
 * @returns {import('express').Express} Configured Express app.
 */
function createExpressApp() {
  const app = express()

  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      credentials: true,
    })
  )

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'sales-dashboard-backend' })
  })

  return app
}

/**
 * Boots the HTTP + Socket.IO servers and starts the order stream loop.
 * Oracle pool initialization happens before listening for requests/events.
 */
async function bootstrap() {
  const port = Number(process.env.PORT || 5000)
  const app = createExpressApp()
  const server = http.createServer(app)
  const socketManager = new SocketManager(server, { intervalMs: 2000 })
  activeSocketManager = socketManager

  await initializePool()
  await ensureOrdersTableExists()
  socketManager.initialize()

  server.listen(port, () => {
    console.log(`[server] REST and WebSocket server listening on http://localhost:${port}`)
  })
}

/**
 * Performs graceful shutdown for Oracle resources when process exits.
 */
async function shutdown(signal) {
  console.log(`[server] received ${signal}, shutting down...`)

  try {
    if (activeSocketManager) {
      activeSocketManager.stop()
    }

    await closePool()
    process.exit(0)
  } catch (error) {
    console.error('[server] error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGINT', () => {
  shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  shutdown('SIGTERM')
})

bootstrap().catch((error) => {
  console.error('[server] failed to bootstrap application:', error)
  process.exit(1)
})
