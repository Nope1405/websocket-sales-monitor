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
 * Ensures LIVE_ORDERS exists before realtime stream starts.
 * If table already exists (ORA-00955), this is treated as success.
 */
async function ensureOrdersTableExists() {
  let connection

  try {
    const targetTable = getOrdersTableName()
    connection = await getConnection()

    await connection.execute(
      `
        CREATE TABLE ${targetTable} (
          ORDER_ID    VARCHAR2(50) PRIMARY KEY,
          PRODUCT     VARCHAR2(100) NOT NULL,
          AMOUNT      NUMBER NOT NULL,
          QUANTITY    NUMBER NOT NULL,
          CHANNEL     VARCHAR2(50) NOT NULL,
          STATUS      VARCHAR2(20) NOT NULL,
          CREATED_AT  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    )

    await connection.commit()
    console.log(`[db] created table ${targetTable}`)
  } catch (error) {
    // ORA-00955: name is already used by an existing object.
    if (error && error.errorNum === 955) {
      console.log(`[db] table already exists: ${getOrdersTableName()}`)
      return
    }

    throw error
  } finally {
    if (connection) {
      await connection.close()
    }
  }
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
  ensureOrdersTableExists,
  getOrdersTableName,
  closePool,
}
