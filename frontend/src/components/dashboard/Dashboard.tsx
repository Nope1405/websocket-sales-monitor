import { ShoppingCart, Users } from 'lucide-react'
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
    <main className="absolute inset-0 flex flex-col overflow-hidden bg-[#050a16] text-slate-100">
      <div className="mx-auto flex flex-1 min-h-0 w-full flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <header className="shrink-0 flex items-center justify-between rounded-lg border border-[#2a3d63] bg-gradient-to-b from-[#1a2b4a] to-[#101a31] px-3 py-2">
          <h1 className="text-base font-semibold text-white sm:text-lg">Real-Time Sales Dashboard</h1>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${connectionBadgeClassName}`}>
            {connectionLabel}
          </span>
        </header>

        <section className="shrink-0 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={kpis.totalRevenueLabel}
            description="From Live Stream"
            valueClassName="text-emerald-400"
          />
          <StatCard
            title="Orders Per Minute"
            value={
              <div className="flex items-center justify-center gap-3">
                <ShoppingCart className="h-9 w-9 text-slate-100" />
                <span>{kpis.ordersPerMinuteLabel}</span>
              </div>
            }
            description="Orders / Min"
            cardClassName="border-[#2a3d63] bg-gradient-to-b from-[#1a2b4a] to-[#101a31]"
          />
          <StatCard
            title="Current Users"
            value={
              <div className="flex items-center justify-center gap-3">
                <Users className="h-9 w-9 text-amber-300" />
                <span>{kpis.currentUsersLabel}</span>
              </div>
            }
            description="Current Users"
            cardClassName="border-[#2a3d63] bg-gradient-to-b from-[#1a2b4a] to-[#101a31]"
          />
          <StatCard
            title="Top Product"
            value={
              <div className="inline-flex items-center gap-3 pl-1 text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[#3a5079] bg-[#0d1830] text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Logo
                </div>
                <span className="max-w-[180px] whitespace-normal break-words leading-snug">{kpis.topProductLabel}</span>
              </div>
            }
            valueClassName="text-xl font-bold leading-tight text-white sm:text-2xl"
            description={kpis.topProductDescription}
          />
        </section>

        <LiveSalesChart data={chartData} />

        <LiveOrdersTable orders={orders} />
      </div>
    </main>
  )
}

export default Dashboard
