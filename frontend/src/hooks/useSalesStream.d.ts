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

declare function useSalesStream(url: string): {
  orders: BackendOrder[]
  isConnected: boolean
}

export default useSalesStream
