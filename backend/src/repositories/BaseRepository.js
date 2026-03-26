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
   * Executes SQL with safe connection/transaction lifecycle handling.
   *
   * @param {string} sql Oracle SQL statement.
   * @param {Record<string, any>} binds Named bind values.
   * @param {Record<string, any>} options Oracle execute options.
   * @returns {Promise<any[] | import('oracledb').Result<any>>}
   */
  async execute(sql, binds = {}, options = {}) {
    let connection
    const { mutation = false, ...oracleOptions } = options
    let originalError = null;
    // === [CORE] CONNECTION MANAGEMENT ===
    try {
      connection = await getConnection()

      // === [CORE] EXECUTION POLICY ===
      // Keep writes explicit with commit/rollback and keep reads object-shaped.
      const executeOptions = {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: false,
        ...oracleOptions,
      }

      const result = await connection.execute(sql, binds, executeOptions)

      // === [CORE] TRANSACTION COMMIT ===
      if (mutation) {
        await connection.commit()
      }

      return result.rows || result
    } catch (error) {
        originalError = error
      // === [CORE] TRANSACTION ROLLBACK ===
      if (connection && mutation) {
        try {
          await connection.rollback()
        } catch (rollbackError) {
          console.error('[repository] rollback failed:', rollbackError)
        }
      }

      throw error
    } finally {
      // === [CORE] CONNECTION RELEASE ===
      if (connection) {
        try{
            await connection.close()
        } catch (closeError){
        console.error('[repository] connection close failed:', closeError)
        if(!originalError){
            throw closeError
        }
     }
    }
  }
}
}

module.exports = BaseRepository
