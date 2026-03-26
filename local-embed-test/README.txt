Run local embed test website:
1) Start your existing dashboard frontend at http://localhost:5173
2) In this folder, run: node server.js
3) Open: http://localhost:5500

Optional custom dashboard URL:
- Windows PowerShell:
  $env:DASHBOARD_URL='http://localhost:4173'; node server.js
- macOS/Linux bash:
  DASHBOARD_URL=http://localhost:4173 node server.js
