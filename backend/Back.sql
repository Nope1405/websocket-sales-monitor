SELECT 
    ORDER_ID as "order_id", 
    PRODUCT as "product", 
    AMOUNT as "amount", 
    QUANTITY as "quantity", 
    CHANNEL as "channel", 
    STATUS as "status", 
    CREATED_AT as "timestamp"
FROM LIVE_ORDERS 
ORDER BY CREATED_AT DESC 
FETCH FIRST 50 ROWS ONLY;