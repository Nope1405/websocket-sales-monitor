const { Server } = require('socket.io')
const { sendInitialData } = require('../sockets/streamHandler')

/**
 * Creates the Socket.IO server with explicit localhost CORS settings.
 * @param {import('http').Server} httpServer The shared HTTP server instance.
 * @returns {import('socket.io').Server} Socket.IO server instance.
 */
function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    console.log(`[socket] client connected: ${socket.id}`)

    // Hydrate this specific client with historical orders before live deltas.
    sendInitialData(socket, { limit: 50 })

    socket.on('disconnect', (reason) => {
      console.log(`[socket] client disconnected: ${socket.id} (${reason})`)
    })
  })

  return io
}

module.exports = {
  createSocketServer,
}
