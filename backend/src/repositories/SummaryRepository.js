const BaseRepository = require('./BaseRepository')
const { getSummaryTableName } = require('../config/db')

/**
 * ============================================================================
 * SummaryRepository (Child Class)
 *
 * Senior rationale:
 * - Keeps 5-minute summary storage isolated from raw order persistence.
 * - Provides a single query for 24-hour dashboard hydration.
 * ============================================================================
 */
class SummaryRepository extends BaseRepository {
  /**
   * Persists one 5-minute summary block into Oracle.
   * @param {{ period_start: string, period_end: string, period_revenue: number, period_orders: number, top_product: string, top_product_sold: number }} summary
   */
  async saveSummary(summary) {
    const targetTable = getSummaryTableName()

    const sql = `
      INSERT INTO ${targetTable} (
        PERIOD_START,
        PERIOD_END,
        PERIOD_REVENUE,
        PERIOD_ORDERS,
        TOP_PRODUCT,
        TOP_PRODUCT_SOLD
      ) VALUES (
        :period_start,
        :period_end,
        :period_revenue,
        :period_orders,
        :top_product,
        :top_product_sold
      )
    `

    const binds = {
      period_start: new Date(summary.period_start),
      period_end: new Date(summary.period_end),
      period_revenue: summary.period_revenue,
      period_orders: summary.period_orders,
      top_product: summary.top_product,
      top_product_sold: summary.top_product_sold,
    }

    return this.execute(sql, binds, { mutation: true })
  }

  /**
   * Fetches the last 24 hours of 5-minute summaries (oldest -> newest).
   * @param {number} limit Maximum number of blocks to fetch.
   * @returns {Promise<Array<{period_start: string | Date, period_end: string | Date, period_revenue: number, period_orders: number, top_product: string, top_product_sold: number}>>}
   */
  async getSummaryHistory(limit = 288) {
    const targetTable = getSummaryTableName()

    const sql = `
      SELECT
        PERIOD_START as "period_start",
        PERIOD_END as "period_end",
        PERIOD_REVENUE as "period_revenue",
        PERIOD_ORDERS as "period_orders",
        TOP_PRODUCT as "top_product",
        TOP_PRODUCT_SOLD as "top_product_sold"
      FROM ${targetTable}
      WHERE PERIOD_END >= SYSTIMESTAMP - INTERVAL '24' HOUR
      ORDER BY PERIOD_END ASC
      FETCH FIRST :limit ROWS ONLY
    `

    return this.execute(sql, { limit })
  }
}

module.exports = SummaryRepository
