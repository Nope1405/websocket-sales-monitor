import { useMemo } from 'react'
import KpiCards from './components/common/KpiCards'
import SalesTrendChart, { type ChartPoint } from './components/charts/SalesTrendChart'
import LiveOrdersTable from './components/tables/LiveOrdersTable'
import useSalesStream, { type BackendOrder } from './hooks/useSalesStream'
import { formatTimeLabel } from './utils/formatters'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

/**
 * Calculates KPI values from the current orders state.
 * This function keeps KPI logic in one place for cleaner rendering code.
 *
 * @param orders Latest orders list (chronological: oldest -> newest).
 * @returns Aggregated KPI values and top-product metrics.
 */
function computeKpis(orders: BackendOrder[]) {
  const nowMs = Date.now()

  const totalRevenue = orders.reduce((sum, order) => {
    return order.status === 'SUCCESS' ? sum + order.amount : sum
  }, 0)

  const ordersPerMinute = orders.filter((order) => {
    return nowMs - new Date(order.timestamp).getTime() <= 60_000
  }).length

  const ordersLastFiveMinutes = orders.filter((order) => {
    return nowMs - new Date(order.timestamp).getTime() <= 5 * 60_000
  }).length

  const currentUsers = Math.max(5, Math.min(400, Math.round(ordersLastFiveMinutes * 2.8)))

  const topProductMap = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.product] = (acc[order.product] || 0) + order.quantity
    return acc
  }, {})

  const sortedTopProducts = Object.entries(topProductMap).sort((a, b) => b[1] - a[1])
  const [topProduct = 'No data yet', topProductSold = 0] = sortedTopProducts[0] || []

  return {
    totalRevenue,
    ordersPerMinute,
    currentUsers,
    topProduct,
    topProductSold,
  }
}

/**
 * Builds chart points from hydrated and streamed orders by creating a cumulative revenue curve.
 * @param orders Latest orders list (chronological: oldest -> newest).
 * @returns Revenue chart points sorted from oldest to newest.
 */
function buildChartData(orders: BackendOrder[]): ChartPoint[] {
  let runningRevenue = 0

  return orders.map((order) => {
    if (order.status === 'SUCCESS') {
      runningRevenue += order.amount
    }

    return {
      time: formatTimeLabel(order.timestamp),
      revenue: runningRevenue,
    }
  })
}

/**
 * Main dashboard container that receives WebSocket orders and composes sections.
 */
function App() {
  const { orders, isConnected } = useSalesStream(SOCKET_URL)

  const kpis = useMemo(() => computeKpis(orders), [orders])
  const chartData = useMemo(() => buildChartData(orders), [orders])

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/95 px-4 py-3">
          <h1 className="text-lg font-semibold text-white sm:text-xl">Real-Time Sales Dashboard</h1>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              isConnected ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
            }`}
          >
            {isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
          </span>
        </header>

        <KpiCards
          totalRevenue={kpis.totalRevenue}
          ordersPerMinute={kpis.ordersPerMinute}
          currentUsers={kpis.currentUsers}
          topProduct={kpis.topProduct}
          topProductSold={kpis.topProductSold}
        />

        <SalesTrendChart data={chartData} />

        <LiveOrdersTable orders={orders} />
      </div>
    </main>
  )
}

export default App
