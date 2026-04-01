/*
  =============================================================================
  File: 01_init_schema.sql
  Purpose:
  - Initializes the Oracle schema objects required by the Real-Time Sales Dashboard.
  - Creates the LIVE_ORDERS table used for both historical hydration and live delta streaming.
  - Intended to be version-controlled as Database as Code and executed during environment setup.
  =============================================================================
*/

CREATE TABLE LIVE_ORDERS (
  ORDER_ID    VARCHAR2(50) PRIMARY KEY,
  PRODUCT     VARCHAR2(100) NOT NULL,
  AMOUNT      NUMBER NOT NULL,
  QUANTITY    NUMBER NOT NULL,
  CHANNEL     VARCHAR2(50) NOT NULL,
  STATUS      VARCHAR2(20) NOT NULL,
  CREATED_AT  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
