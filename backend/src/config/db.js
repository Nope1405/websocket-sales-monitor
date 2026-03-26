const oracledb = require('oracledb')

let poolInitialized = false

/**
 * Initializes a shared Oracle connection pool for the whole app lifecycle.
 * Pooling avoids the overhead of opening a brand-new TCP/session connection
 * for every order insert emitted by the realtime stream.
 */
async function initializePool() {
  if (poolInitialized) {
    return
  }

  const user = process.env.ORACLE_USER
  const password = process.env.ORACLE_PASSWORD
  const connectString = process.env.ORACLE_CONNECTION_STRING

  if (!user || !password || !connectString) {
    throw new Error(
      'Missing Oracle env vars. Please set ORACLE_USER, ORACLE_PASSWORD, and ORACLE_CONNECTION_STRING.'
    )
  }

  await oracledb.createPool({
    user,
    password,
    connectString,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
    poolAlias: 'default',
  })

  poolInitialized = true
  console.log('[db] Oracle connection pool initialized')
}

/**
 * Returns a pooled Oracle connection.
 * Callers must release this with connection.close() in a finally block.
 */
async function getConnection() {
  return oracledb.getConnection('default')
}

/**
 * Gracefully closes the pool.
 * close(10) gives active connections up to 10 seconds to finish in-flight work.
 */
async function closePool() {
  if (!poolInitialized) {
    return
  }

  await oracledb.getPool('default').close(10)
  poolInitialized = false
  console.log('[db] Oracle connection pool closed')
}

module.exports = {
  initializePool,
  getConnection,
  closePool,
}
