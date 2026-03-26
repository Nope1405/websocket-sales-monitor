const oracledb = require('oracledb')
const { getConnection } = require('../config/db')

/**
 * Restricts SQL identifiers to safe Oracle-style names.
 * Object names cannot be passed as bind variables, so we validate them first.
 * @param {string} value Raw env value.
 * @param {string} fallback Fallback identifier.
 * @returns {string} A validated uppercase identifier.
 */
function getSafeIdentifier(value, fallback) {
  const candidate = (value || fallback || '').trim().toUpperCase()

  if (!candidate || !/^[A-Z][A-Z0-9_$#]*$/.test(candidate)) {
    throw new Error(`Invalid Oracle identifier: ${value}`)
  }

  return candidate
}

/**
 * Builds insert target as TABLE or SCHEMA.TABLE based on env variables.
 * ORACLE_SCHEMA is optional. ORACLE_TABLE defaults to LIVE_ORDERS.
 */
function getInsertTarget() {
  const table = getSafeIdentifier(process.env.ORACLE_TABLE, 'LIVE_ORDERS')
  const schema = process.env.ORACLE_SCHEMA
    ? getSafeIdentifier(process.env.ORACLE_SCHEMA, '')
    : ''

  return schema ? `${schema}.${table}` : table
}

/**
 * Persists one live order row to Oracle.
 * Uses bind variables to avoid SQL injection and to let Oracle reuse statement
 * execution plans efficiently for repeated inserts.
 *
 * @param {{
 *  order_id: string,
 *  product: string,
 *  amount: number,
 *  quantity: number,
 *  channel: string,
 *  status: string,
 *  timestamp?: string
 * }} orderData
 */
async function saveOrder(orderData) {
  let connection

  try {
    connection = await getConnection()
    const insertTarget = getInsertTarget()

    await connection.execute(
      `
        INSERT INTO ${insertTarget} (
          ORDER_ID,
          PRODUCT,
          AMOUNT,
          QUANTITY,
          CHANNEL,
          STATUS,
          CREATED_AT
        ) VALUES (
          :order_id,
          :product,
          :amount,
          :quantity,
          :channel,
          :status,
          :created_at
        )
      `,
      {
        order_id: orderData.order_id,
        product: orderData.product,
        amount: orderData.amount,
        quantity: orderData.quantity,
        channel: orderData.channel,
        status: orderData.status,
        created_at: orderData.timestamp ? new Date(orderData.timestamp) : new Date(),
      },
      {
        autoCommit: false,
      }
    )

    await connection.commit()
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('[db] rollback failed:', rollbackError)
      }
    }

    throw error
  } finally {
    if (connection) {
      await connection.close()
    }
  }
}

module.exports = {
  saveOrder,
  getHistoricalOrders,
}

/**
 * Reads the most recent orders from Oracle for initial dashboard hydration.
 *
 * The SQL statement intentionally matches the required projection aliases so
 * frontend payload keys are consistent between history and live delta events.
 *
 * @param {number} limit Max number of rows to fetch.
 * @returns {Promise<Array<{order_id: string, product: string, amount: number, quantity: number, channel: string, status: string, timestamp: string | Date}>>}
 */
async function getHistoricalOrders(limit = 50) {
  let connection

  try {
    connection = await getConnection()

    const result = await connection.execute(
      `SELECT ORDER_ID as "order_id", PRODUCT as "product", AMOUNT as "amount", QUANTITY as "quantity", CHANNEL as "channel", STATUS as "status", CREATED_AT as "timestamp" FROM LIVE_ORDERS ORDER BY CREATED_AT DESC FETCH FIRST :limit ROWS ONLY`,
      { limit },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    return (result.rows || []).map((row) => ({
      order_id: row.order_id,
      product: row.product,
      amount: row.amount,
      quantity: row.quantity,
      channel: row.channel,
      status: row.status,
      timestamp: row.timestamp,
    }))
  } finally {
    if (connection) {
      await connection.close()
    }
  }
}
