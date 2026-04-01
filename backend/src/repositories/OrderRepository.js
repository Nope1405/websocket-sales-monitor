const BaseRepository = require('./BaseRepository')
const { getOrdersTableName } = require('../config/db')

/**
 * ============================================================================
 * OrderRepository (Child Class)
 *
 * Senior rationale:
 * - Child repository focuses on SQL intent for LIVE_ORDERS only.
 * - Reuses BaseRepository.execute for all connection/transaction concerns.
 * ============================================================================
 */
class OrderRepository extends BaseRepository {
  /**
   * Persists one order into LIVE_ORDERS.
   * @param {{order_id: string, product: string, amount: number, quantity: number, channel: string, status: string, timestamp?: string}} orderData
   */
  async saveOrder(orderData) {
    const targetTable = getOrdersTableName()

    const sql = `
      INSERT INTO ${targetTable} (
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
    `

    const binds = {
      order_id: orderData.order_id,
      product: orderData.product,
      amount: orderData.amount,
      quantity: orderData.quantity,
      channel: orderData.channel,
      status: orderData.status,
      created_at: orderData.timestamp ? new Date(orderData.timestamp) : new Date(),
    }

    return this.execute(sql, binds, { mutation: true })
  }

  /**
   * Fetches historical rows for dashboard hydration.
   *
    * Pulls recent rows in descending order with a configurable maximum count.
   * @returns {Promise<Array<{order_id: string, product: string, amount: number, quantity: number, channel: string, status: string, timestamp: string | Date}>>}
   */
  async getHistoricalOrders(limit = 50) {
    const targetTable = getOrdersTableName()
    const sql = `SELECT ORDER_ID as "order_id", PRODUCT as "product", AMOUNT as "amount", QUANTITY as "quantity", CHANNEL as "channel", STATUS as "status", CREATED_AT as "timestamp" FROM ${targetTable} ORDER BY CREATED_AT DESC FETCH FIRST :limit ROWS ONLY`
    const rows = await this.execute(sql, { limit })

    const normalizedRows = (rows || []).map((row) => ({
      order_id: row.order_id,
      product: row.product,
      amount: row.amount,
      quantity: row.quantity,
      channel: row.channel,
      status: row.status,
      timestamp: row.timestamp,
    }))

    // Query returns newest-first, but charts hydrate correctly with oldest-first.
    return normalizedRows.reverse()
  }
}

module.exports = OrderRepository
