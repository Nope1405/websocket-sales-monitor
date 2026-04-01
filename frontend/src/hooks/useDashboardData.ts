import { useMemo } from 'react'
import useSalesStream, { type BackendOrder } from './useSalesStream'
import { formatVND } from '../utils/formatters'
import type { ChartPoint } from '../components/charts/LiveSalesChart'

const ONE_MINUTE_MS = 60_000
const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS
const MIN_CURRENT_USERS = 5
const MAX_CURRENT_USERS = 400
const CURRENT_USER_MULTIPLIER = 2.8
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

type NormalizedOrder = BackendOrder & {
  timestampMs: number
}

type DashboardKpis = {
  totalRevenueLabel: string
  ordersPerMinuteLabel: string
  currentUsersLabel: string
  topProductLabel: string
  topProductDescription: string
}

function normalizeOrders(rawOrders: BackendOrder[]): NormalizedOrder[] {
  return rawOrders.map((order) => {
    const timestampMs = new Date(order.timestamp).getTime()

    return {
      ...order,
      timestampMs: Number.isFinite(timestampMs) ? timestampMs : Date.now(),
    }
  })
}

function buildKpis(orders: NormalizedOrder[]): DashboardKpis {
  const nowMs = Date.now()

  const totalRevenue = orders.reduce((sum, order) => {
    if (order.status === 'SUCCESS') {
      return sum + order.amount
    }

    return sum
  }, 0)

  const ordersPerMinute = orders.filter((order) => {
    return nowMs - order.timestampMs <= ONE_MINUTE_MS
  }).length

  const ordersLastFiveMinutes = orders.filter((order) => {
    return nowMs - order.timestampMs <= FIVE_MINUTES_MS
  }).length

  const currentUsers = Math.max(
    MIN_CURRENT_USERS,
    Math.min(MAX_CURRENT_USERS, Math.round(ordersLastFiveMinutes * CURRENT_USER_MULTIPLIER))
  )

  const productSalesMap = orders.reduce<Record<string, number>>((accumulator, order) => {
    const existingValue = accumulator[order.product] || 0
    accumulator[order.product] = existingValue + order.quantity
    return accumulator
  }, {})

  const sortedProducts = Object.entries(productSalesMap).sort((left, right) => right[1] - left[1])

  let topProductLabel = 'No data yet'
  let topProductSoldCount = 0

  if (sortedProducts.length > 0) {
    topProductLabel = sortedProducts[0][0]
    topProductSoldCount = sortedProducts[0][1]
  }

  return {
    totalRevenueLabel: `${formatVND(totalRevenue)} VND`,
    ordersPerMinuteLabel: String(ordersPerMinute),
    currentUsersLabel: String(currentUsers),
    topProductLabel,
    topProductDescription: `${topProductSoldCount} sold`,
  }
}

function buildChartData(orders: NormalizedOrder[]): ChartPoint[] {
  const sortedOrders = [...orders].sort((left, right) => left.timestampMs - right.timestampMs)
  let runningRevenue = 0

  return sortedOrders.map((order) => {
    if (order.status === 'SUCCESS') {
      runningRevenue += order.amount
    }

    return {
      ts: order.timestampMs,
      revenue: runningRevenue,
    }
  })
}

/**
 * Prepares dashboard-ready data from the realtime stream.
 *
 * Why this hook exists:
 * - Data orchestration should be isolated from rendering markup.
 * - A dedicated hook keeps the dashboard component readable and focused.
 * - Memoized transformations avoid repeated computation noise during updates.
 */
function useDashboardData() {
  const { orders, isConnected } = useSalesStream(SOCKET_URL)

  const normalizedOrders = useMemo(() => {
    return normalizeOrders(orders)
  }, [orders])

  const kpis = useMemo(() => {
    return buildKpis(normalizedOrders)
  }, [normalizedOrders])

  const chartData = useMemo(() => {
    return buildChartData(normalizedOrders)
  }, [normalizedOrders])

  return {
    orders,
    isConnected,
    kpis,
    chartData,
  }
}

export default useDashboardData
