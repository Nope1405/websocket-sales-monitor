export type BackendOrderStatus = 'SUCCESS' | 'FAIL'

export type BackendOrder = {
  timestamp: string
  order_id: string
  product: string
  amount: number
  quantity: number
  channel: string
  status: BackendOrderStatus
}

export type UseWebSocketResult = {
  incomingOrder: BackendOrder | null
  initialOrders: BackendOrder[]
  isConnected: boolean
}

declare function useWebSocket(url: string): UseWebSocketResult

export default useWebSocket
