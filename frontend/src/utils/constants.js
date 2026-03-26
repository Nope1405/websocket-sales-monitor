/**
 * ============================================================================
 * Frontend constants mirrored with backend socket contract.
 *
 * Senior rationale:
 * - Avoid duplicated hardcoded event names.
 * - Keep FE/BE realtime protocol easy to audit and refactor.
 * ============================================================================
 */

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  INITIAL_DATA: 'initial_data',
  NEW_ORDER: 'new_order',
}
