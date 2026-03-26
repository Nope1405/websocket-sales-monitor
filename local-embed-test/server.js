const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 5600
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5173'

function sendHtml(res, filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Internal Server Error')
      return
    }

    const html = data.replace(/__DASHBOARD_URL__/g, DASHBOARD_URL)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  })
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    sendHtml(res, path.join(__dirname, 'index.html'))
    return
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ status: 'ok', service: 'local-embed-test' }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`[embed-test] running at http://localhost:${PORT}`)
  console.log(`[embed-test] iframe source: ${DASHBOARD_URL}`)
})
