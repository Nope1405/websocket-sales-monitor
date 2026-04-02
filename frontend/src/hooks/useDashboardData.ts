import { useMemo } from 'react'
import useSalesStream, { type BackendOrder } from './useSalesStream'
import { formatVND } from '../utils/formatters'
import type { ChartPoint } from '../components/charts/LiveSalesChart'

const ONE_MINUTE_MS = 60_000
const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS
const CHART_WINDOW_MINUTES = 60
const CHART_WINDOW_MS = CHART_WINDOW_MINUTES * ONE_MINUTE_MS
const MAX_RENDER_POINTS = 120
const MIN_CURRENT_USERS = 5
const MAX_CURRENT_USERS = 400
const CURRENT_USER_MULTIPLIER = 2.8
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

type NormalizedOrder = BackendOrder & {
  timestampMs: number
  livestreamAmount?: number
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
  const startOfDayMs = new Date().setHours(0, 0, 0, 0)

  const totalRevenue = orders.reduce((sum, order) => {
    const status = String(order.status || '').toUpperCase()
    const isRevenueStatus = status === 'SUCCESS' || status === 'PAID'
    const isToday = order.timestampMs >= startOfDayMs && order.timestampMs <= nowMs

    if (isRevenueStatus && isToday) {
      return sum + Math.abs(order.amount)
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
    topProductDescription: `${topProductSoldCount} Sold`,
  }
}

function buildChartData(orders: NormalizedOrder[]): ChartPoint[] {
  const sortedOrders = [...orders].sort((left, right) => left.timestampMs - right.timestampMs)
  const endTime = sortedOrders.length > 0 ? sortedOrders[sortedOrders.length - 1].timestampMs : Date.now()
  const startTime = endTime - CHART_WINDOW_MS
  const startOfDayMs = new Date().setHours(0, 0, 0, 0)
  const points: ChartPoint[] = []
  let runningRevenue = 0

  // Keep chart revenue consistent with Total Revenue KPI business rule.
  const getRevenueDelta = (order: NormalizedOrder) => {
    const status = String(order.status || '').toUpperCase()
    const isRevenueStatus = status === 'SUCCESS' || status === 'PAID'
    const isToday = order.timestampMs >= startOfDayMs && order.timestampMs <= endTime

    if (!isRevenueStatus || !isToday) {
      return 0
    }

    return Math.abs(order.amount)
  }

  for (const order of sortedOrders) {
    const revenueDelta = getRevenueDelta(order)

    if (order.timestampMs < startTime) {
      runningRevenue += revenueDelta
      continue
    }

    runningRevenue += revenueDelta
    points.push({ ts: order.timestampMs, revenue: runningRevenue })
  }

  if (points.length === 0) {
    return [{ ts: startTime, revenue: runningRevenue }]
  }

  if (points[0].ts > startTime) {
    points.unshift({ ts: startTime, revenue: points[0].revenue })
  }

  if (points[points.length - 1].ts < endTime) {
    points.push({ ts: endTime, revenue: points[points.length - 1].revenue })
  }

  if (points.length <= MAX_RENDER_POINTS) {
    return points
  }

  const preservedIndexes = new Set<number>([0, points.length - 1])

  // Always keep descending transitions so FAIL events are visible as clear drop segments.
  for (let index = 1; index < points.length; index += 1) {
    if (points[index].revenue < points[index - 1].revenue) {
      preservedIndexes.add(index - 1)
      preservedIndexes.add(index)
    }
  }

  const nonPreservedIndexes: number[] = []
  for (let index = 0; index < points.length; index += 1) {
    if (!preservedIndexes.has(index)) {
      nonPreservedIndexes.push(index)
    }
  }

  const remainingBudget = Math.max(0, MAX_RENDER_POINTS - preservedIndexes.size)

  if (remainingBudget > 0 && nonPreservedIndexes.length > 0) {
    const stride = Math.ceil(nonPreservedIndexes.length / remainingBudget)

    for (let pickIndex = 0; pickIndex < nonPreservedIndexes.length; pickIndex += stride) {
      preservedIndexes.add(nonPreservedIndexes[pickIndex])
    }
  }

  return Array.from(preservedIndexes)
    .sort((left, right) => left - right)
    .map((index) => points[index])
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
