const BaseRepository = require('./BaseRepository')
const { getOrdersTableName } = require('../config/db')
const {
  parseHistoricalOptions,
  buildHistoricalOrdersQuery,
  normalizeHistoricalRows,
} = require('../services/baseOrderHistory')

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
    * Pulls rows for a recent time window (default 60 minutes), oldest-first.
   * @returns {Promise<Array<{order_id: string, product: string, amount: number, quantity: number, channel: string, status: string, timestamp: string | Date}>>}
   */
  async getHistoricalOrders(options = {}) {
    const { windowMinutes, maxRows } = parseHistoricalOptions(options)

    const targetTable = getOrdersTableName()
    const sql = buildHistoricalOrdersQuery(targetTable)
    const rows = await this.execute(sql, { windowMinutes, maxRows })

    return normalizeHistoricalRows(rows)
  }
}

module.exports = OrderRepository
