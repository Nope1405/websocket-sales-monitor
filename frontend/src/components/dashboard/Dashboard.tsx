import StatCard from '../common/StatCard'
import LiveSalesChart from '../charts/LiveSalesChart'
import LiveOrdersTable from '../tables/LiveOrdersTable'
import useDashboardData from '../../hooks/useDashboardData'

function getConnectionBadgeClassName(isConnected: boolean): string {
  if (isConnected) {
    return 'bg-emerald-950 text-emerald-300'
  }

  return 'bg-rose-950 text-rose-300'
}

function getConnectionLabel(isConnected: boolean): string {
  if (isConnected) {
    return 'WebSocket Connected'
  }

  return 'WebSocket Disconnected'
}

/**
 * Composes the realtime dashboard from focused presentation components.
 *
 * Why this component is intentionally simple:
 * - The file should read like a plain English story for maintainers.
 * - Data preparation lives in a dedicated hook and rendering is declarative.
 * - Reusable blocks minimize duplication and improve long-term consistency.
 */
function Dashboard() {
  const { orders, isConnected, kpis, chartData } = useDashboardData()

  const connectionBadgeClassName = getConnectionBadgeClassName(isConnected)
  const connectionLabel = getConnectionLabel(isConnected)

  return (
    <main className="h-screen w-screen overflow-hidden bg-slate-900 text-slate-100">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-2 p-2 sm:gap-3 sm:p-3">
        <header className="shrink-0 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/95 px-3 py-2">
          <h1 className="text-base font-semibold text-white sm:text-lg">Real-Time Sales Dashboard</h1>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${connectionBadgeClassName}`}>
            {connectionLabel}
          </span>
        </header>

        <section className="shrink-0 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={kpis.totalRevenueLabel}
            description="From live stream"
            valueClassName="text-emerald-400"
          />
          <StatCard
            title="Orders Per Minute"
            value={kpis.ordersPerMinuteLabel}
            description="Rolling 60 seconds"
          />
          <StatCard
            title="Current Users"
            value={kpis.currentUsersLabel}
            description="Estimated live audience"
          />
          <StatCard title="Top Product" value={kpis.topProductLabel} description={kpis.topProductDescription} />
        </section>

        <LiveSalesChart data={chartData} />
        <LiveOrdersTable orders={orders} />
      </div>
    </main>
  )
}

export default Dashboard
