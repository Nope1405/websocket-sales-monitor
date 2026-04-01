const oracledb = require('oracledb')
const { getConnection } = require('../config/db')

/**
 * ============================================================================
 * BaseRepository (Parent Class)
 *
 * Senior rationale:
 * - Inheritance is used here to abstract Oracle boilerplate from domain repos.
 * - Child repositories only describe SQL and binds (business intent).
 * - Transaction lifecycle and connection safety live in exactly one place.
 * ============================================================================
 */
class BaseRepository {
  /**
   * Executes SQL with a consistent connection lifecycle.
   *
   * Why this abstraction exists:
   * - Every repository operation should follow the same safety rules.
   * - Commits and rollbacks must be centralized to prevent inconsistent behavior.
   * - Child repositories should express business intent, not infrastructure plumbing.
   *
   * @param {string} sql Oracle SQL statement.
   * @param {Record<string, any>} binds Named bind values.
   * @param {Record<string, any>} options Oracle execute options.
   * @returns {Promise<any[] | import('oracledb').Result<any>>}
   */
  async execute(sql, binds = {}, options = {}) {
    let connection
    let originalError = null
    const { mutation = false, ...oracleOptions } = options

    try {
      connection = await getConnection()

      // Keep reads object-shaped and keep transaction behavior explicit.
      const executeOptions = {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: false,
        ...oracleOptions,
      }

      const result = await connection.execute(sql, binds, executeOptions)

      if (mutation) {
        await connection.commit()
      }

      return result.rows || result
    } catch (error) {
      originalError = error

      if (connection && mutation) {
        try {
          await connection.rollback()
        } catch (rollbackError) {
          console.error('[repository] rollback failed:', rollbackError)
        }
      }

      throw error
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (closeError) {
          console.error('[repository] connection close failed:', closeError)

          // Preserve the original SQL error when both query and close fail.
          if (!originalError) {
            throw closeError
          }
        }
      }
    }
  }
}

module.exports = BaseRepository
