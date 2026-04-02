/**
 * BaseStreamConfig
 *
 * Base configuration consumed by socket stream child modules.
 */

// Use a 24h hydration window so frontend KPI can compute today's total from 00:00.
const HISTORY_WINDOW_MINUTES = 24 * 60
const HISTORY_MAX_ROWS = 50_000
const DEFAULT_STREAM_INTERVAL_MS = 2000

/**
 * Resolves stream interval with a safe default.
 * @param {{intervalMs?: number}} options
 * @returns {number}
 */
function resolveStreamInterval(options = {}) {
  return options.intervalMs || DEFAULT_STREAM_INTERVAL_MS
}

/**
 * Resolves history options with safe defaults.
 * @param {{windowMinutes?: number, maxRows?: number}} options
 * @returns {{windowMinutes: number, maxRows: number}}
 */
function resolveHistoryOptions(options = {}) {
  return {
    windowMinutes: options.windowMinutes || HISTORY_WINDOW_MINUTES,
    maxRows: options.maxRows || HISTORY_MAX_ROWS,
  }
}

module.exports = {
  HISTORY_WINDOW_MINUTES,
  HISTORY_MAX_ROWS,
  DEFAULT_STREAM_INTERVAL_MS,
  resolveStreamInterval,
  resolveHistoryOptions,
}
