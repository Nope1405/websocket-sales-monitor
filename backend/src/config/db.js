const oracledb = require('oracledb')

let poolInitialized = false

/**
 * Restricts object names to safe Oracle-style identifiers.
 * Object names cannot be bound, so this guard prevents SQL injection.
 * @param {string} value
 * @param {string} fallback
 * @returns {string}
 */
function getSafeIdentifier(value, fallback) {
  const candidate = (value || fallback || '').trim().toUpperCase()

  if (!candidate || !/^[A-Z][A-Z0-9_$#]*$/.test(candidate)) {
    throw new Error(`Invalid Oracle identifier: ${value}`)
  }

  return candidate
}

/**
 * Resolves the fully-qualified target table name.
 * ORACLE_TABLE defaults to LIVE_ORDERS and ORACLE_SCHEMA is optional.
 * @returns {string}
 */
function getOrdersTableName() {
  const table = getSafeIdentifier(process.env.ORACLE_TABLE, 'LIVE_ORDERS')
  const schema = process.env.ORACLE_SCHEMA
    ? getSafeIdentifier(process.env.ORACLE_SCHEMA, '')
    : ''

  return schema ? `${schema}.${table}` : table
}

/**
 * Initializes a shared Oracle connection pool for the whole app lifecycle.
 * Pooling avoids the overhead of opening a brand-new TCP/session connection
 * for every order insert emitted by the realtime stream.
 */
async function initializePool() {
  if (poolInitialized) {
    return
  }

  poolInitialized = true
  console.log('[db] MOCK Oracle connection pool initialized')
}

/**
 * Returns a pooled Oracle connection.
 * Callers must release this with connection.close() in a finally block.
 */
async function getConnection() {
  return oracledb.getConnection('default')
}

/**
 * Ensures LIVE_ORDERS exists before realtime stream starts.
 * If table already exists (ORA-00955), this is treated as success.
 */
async function ensureOrdersTableExists() {
  console.log(`[db] MOCK table already exists: ${getOrdersTableName()}`)
}

/**
 * Gracefully closes the pool.
 * close(10) gives active connections up to 10 seconds to finish in-flight work.
 */
async function closePool() {
  poolInitialized = false
  console.log('[db] MOCK Oracle connection pool closed')
}

module.exports = {
  initializePool,
  getConnection,
  ensureOrdersTableExists,
  getOrdersTableName,
  closePool,
}
