# Real-Time Sales Dashboard

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=061A23)
![Oracle](https://img.shields.io/badge/Oracle-Database-F80000?logo=oracle&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white)
![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)

A production-minded monorepo for real-time sales monitoring with Oracle-backed persistence, hydrate-from-history initialization, and Socket.IO live deltas.

## Overview

This dashboard solves three core real-time problems cleanly:

- Fast first paint with historical hydration.
- Reliable incremental updates with websocket deltas.
- Data consistency by saving to Oracle before broadcasting new events.

The backend follows repository-based data access and centralized connection handling, while the frontend consumes a stable socket contract for both initial snapshots and ongoing updates.

## Key Features

- Monorepo architecture with clear separation between backend and frontend.
- Node.js + Express + Socket.IO backend.
- Oracle Database integration via oracledb connection pool.
- Repository pattern for database operations:
  - BaseRepository centralizes connection and transaction lifecycle.
  - OrderRepository focuses on LIVE_ORDERS SQL.
- Hydrate from History, then Stream Delta pattern:
  - initial_data sent only to the newly connected client.
  - new_order broadcast to all connected clients.
- Database as Code support with version-controlled schema script.

## Architecture and Data Flow

1. Backend interval generates one mock order payload.
2. Backend writes payload to Oracle LIVE_ORDERS.
3. If insert succeeds, backend emits new_order to all clients.
4. When a new client connects, backend fetches latest history from Oracle.
5. Backend reverses history into chronological order and emits initial_data only to that client.
6. Frontend hydrates charts/tables from initial_data, then appends new_order deltas.

## Database as Code

The Oracle initialization script is provided at:

- backend/database/01_init_schema.sql

It creates LIVE_ORDERS with this shape:

- ORDER_ID VARCHAR2(50) PRIMARY KEY
- PRODUCT VARCHAR2(100)
- AMOUNT NUMBER
- QUANTITY NUMBER
- CHANNEL VARCHAR2(50)
- STATUS VARCHAR2(20)
- CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Run this script in your target Oracle schema (for example DEMO_DASHBOARD) before starting the backend.

## Prerequisites

- Node.js 20+
- npm
- Oracle Database (XE or full edition)
- SQL Developer (recommended for schema/query validation)

## Environment Variables

Backend file:

- backend/.env

Example:

```env
PORT=5000

ORACLE_USER=DEMO_DASHBOARD
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECTION_STRING=localhost:1521/XEPDB1

# Optional schema/table targeting for cross-schema setups
ORACLE_SCHEMA=DEMO_DASHBOARD
ORACLE_TABLE=LIVE_ORDERS
```

Frontend file:

- frontend/.env

Example:

```env
VITE_SOCKET_URL=http://localhost:5000
```

## Install and Run

1. Install backend dependencies.

```bash
cd backend
npm install
```

2. Install frontend dependencies.

```bash
cd ../frontend
npm install
```

3. Initialize Oracle schema.

- Execute backend/database/01_init_schema.sql in your Oracle schema.

4. Start backend.

```bash
cd ../backend
npm run dev
```

5. Start frontend.

```bash
cd ../frontend
npm run dev
```

6. Open app and verify.

- Frontend: http://localhost:5173
- Health check: http://localhost:5000/health

## Verify Persistence and Hydration

Use SQL Developer to confirm data is saved:

```sql
SELECT COUNT(*) AS TOTAL_ROWS FROM LIVE_ORDERS;

SELECT ORDER_ID, PRODUCT, AMOUNT, QUANTITY, CHANNEL, STATUS, CREATED_AT
FROM LIVE_ORDERS
ORDER BY CREATED_AT DESC
FETCH FIRST 20 ROWS ONLY;
```

Expected behavior:

- Row count increases as stream runs.
- New client receives initial_data once on connect.
- All clients receive new_order continuously.

## Folder Highlights

```text
backend/
  database/
    01_init_schema.sql
  src/
    config/
      db.js
    repositories/
      BaseRepository.js
      OrderRepository.js
    sockets/
      SocketManager.js
    services/
      mockDataGenerator.js
frontend/
  src/
    hooks/
    components/
```

## Notes

- If Oracle returns ORA-00942, verify schema, table name, and grants.
- For best practice, connect the app as the schema owner that owns LIVE_ORDERS.

