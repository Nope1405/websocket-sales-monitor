/*
  ============================================================================
  File: 02_add_idx_live_orders_created_at.sql
  Purpose:
  - Creates a B-Tree index for time-window filters on LIVE_ORDERS.CREATED_AT.

  Why this matters:
  - Most dashboard queries use predicates like:
      WHERE CREATED_AT >= SYSTIMESTAMP - INTERVAL '20' MINUTE
  - Without an index, Oracle may perform a Full Table Scan as the table grows.
  - A B-Tree index allows Oracle to perform an Index Range Scan on CREATED_AT,
    reading only relevant leaf blocks in the requested time window.
  ============================================================================
*/

CREATE INDEX IDX_LIVE_ORDERS_CREATED_AT
  ON LIVE_ORDERS (CREATED_AT);
