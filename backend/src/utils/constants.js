/**
 * ============================================================================
 * Shared backend constants.
 *
 * Senior rationale:
 * - Centralize event names to avoid magic strings across modules.
 * - Keep backend/frontend socket contracts explicit and DRY.
 * ============================================================================
 */

const SOCKET_EVENTS = {
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  INITIAL_DATA: 'initial_data',
  NEW_ORDER: 'new_order',
}

module.exports = {
  SOCKET_EVENTS,
}
