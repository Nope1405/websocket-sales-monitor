/**
 * BaseOrderHistory
 *
 * Base module shared by repository/service layers.
 * Child modules consume these helpers to keep query/normalization logic DRY.
 */

const DEFAULT_HISTORY_WINDOW_MINUTES = 24 * 60
const DEFAULT_HISTORY_MAX_ROWS = 50_000

/**
 * Parses historical query options while preserving backward compatibility.
 * @param {number | {windowMinutes?: number, maxRows?: number}} options
 * @returns {{windowMinutes: number, maxRows: number}}
 */
function parseHistoricalOptions(options = {}) {
  const normalizedOptions =
    typeof options === 'number'
      ? { maxRows: options }
      : options

  return {
    windowMinutes: Number(normalizedOptions.windowMinutes || DEFAULT_HISTORY_WINDOW_MINUTES),
    maxRows: Number(normalizedOptions.maxRows || DEFAULT_HISTORY_MAX_ROWS),
  }
}

/**
 * Builds the historical orders SQL query text with a configurable target table.
 * @param {string} targetTable
 * @returns {string}
 */
function buildHistoricalOrdersQuery(targetTable) {
  return `
    SELECT
      ORDER_ID as "order_id",
      PRODUCT as "product",
      AMOUNT as "amount",
      QUANTITY as "quantity",
      CHANNEL as "channel",
      STATUS as "status",
      CREATED_AT as "timestamp"
    FROM ${targetTable}
    WHERE CREATED_AT >= (SYSTIMESTAMP - NUMTODSINTERVAL(:windowMinutes, 'MINUTE'))
    ORDER BY CREATED_AT ASC
    FETCH FIRST :maxRows ROWS ONLY
  `
}

/**
 * Normalizes raw Oracle rows to the dashboard order payload shape.
 * @param {Array<any>} rows
 * @returns {Array<{order_id: string, product: string, amount: number, quantity: number, channel: string, status: string, timestamp: string | Date}>}
 */
function normalizeHistoricalRows(rows) {
  return (rows || []).map((row) => ({
    order_id: row.order_id,
    product: row.product,
    amount: row.amount,
    quantity: row.quantity,
    channel: row.channel,
    status: row.status,
    timestamp: row.timestamp,
  }))
}

module.exports = {
  DEFAULT_HISTORY_WINDOW_MINUTES,
  DEFAULT_HISTORY_MAX_ROWS,
  parseHistoricalOptions,
  buildHistoricalOrdersQuery,
  normalizeHistoricalRows,
}
