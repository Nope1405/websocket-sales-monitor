import { AlertTriangle } from 'lucide-react'
import type { BackendOrder } from '../../hooks/useSalesStream'
import { formatTimeLabel, formatVND } from '../../utils/formatters'

type LiveOrdersTableProps = {
  orders: BackendOrder[]
}

const MAX_VISIBLE_ROWS = 120

/**
 * Counts the latest consecutive failed orders to power the alert message.
 * @param orders Newest-first order list.
 * @returns Number of consecutive FAIL rows from the top of the table.
 */
function getFailedStreak(orders: BackendOrder[]): number {
  let streak = 0

  for (let index = orders.length - 1; index >= 0; index -= 1) {
    const order = orders[index]

    if (order.status === 'FAIL') {
      streak += 1
    } else {
      break
    }
  }

  return streak
}

/**
 * Returns only the latest N rows in newest-first order without cloning full arrays.
 * @param {BackendOrder[]} orders
 * @param {number} limit
 * @returns {BackendOrder[]}
 */
function getLatestRows(orders: BackendOrder[], limit: number): BackendOrder[] {
  const rows: BackendOrder[] = []

  for (let index = orders.length - 1; index >= 0 && rows.length < limit; index -= 1) {
    rows.push(orders[index])
  }

  return rows
}

/**
 * Renders the real-time orders table and warning banner based on stream health.
 */
function LiveOrdersTable({ orders }: LiveOrdersTableProps) {
  const failedStreak = getFailedStreak(orders)
  const newestFirstRows = getLatestRows(orders, MAX_VISIBLE_ROWS)
  const shouldShowWarning = failedStreak >= 3

  return (
    <section className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-lg border border-[#2a3d63] bg-gradient-to-b from-[#1a2b4a] to-[#101a31] p-3 sm:p-4">
      {shouldShowWarning ? (
        <div className="shrink-0 mb-3 rounded-lg border border-rose-800/60 bg-gradient-to-r from-rose-950 to-red-900/80 px-3 py-2 text-rose-100">
          <p className="flex items-center gap-2 text-sm font-semibold sm:text-base">
            <AlertTriangle className="h-4 w-4 text-yellow-300" />
            ⚠️ Cảnh báo : Nhiều giao dịch thất bại liên tiếp! ({failedStreak} lần)
          </p>
        </div>
      ) : null}

      <h2 className="mb-2 shrink-0 text-base font-semibold text-slate-100 sm:text-lg">Live Sales Stream</h2>
      <p className="mb-2 shrink-0 text-xs text-slate-300/80">
        Showing latest {MAX_VISIBLE_ROWS} orders for smoother realtime rendering.
      </p>

      <div className="flex-1 overflow-auto min-h-0 relative">
        <table className="min-w-[920px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 bg-[#0f192f] shadow-sm z-10">
            <tr className="text-slate-300">
              {[
                'Timestamp',
                'Order ID',
                'Product',
                'Quantity',
                'Amount (VND)',
                'Channel',
                'Status',
              ].map((head) => (
                <th key={head} className="border-b border-slate-700 px-3 py-3 font-medium">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {newestFirstRows.map((order) => (
              <tr key={order.order_id + order.timestamp} className="text-slate-200/95">
                <td className="border-b border-slate-700/70 px-3 py-3">{formatTimeLabel(order.timestamp)}</td>
                <td className="border-b border-slate-700/70 px-3 py-3 font-medium text-slate-100">
                  {order.order_id}
                </td>
                <td className="border-b border-slate-700/70 px-3 py-3">{order.product}</td>
                <td className="border-b border-slate-700/70 px-3 py-3">{order.quantity}</td>
                <td className="border-b border-slate-700/70 px-3 py-3 font-semibold text-emerald-400">
                  {formatVND(order.amount)}
                </td>
                <td className="border-b border-slate-700/70 px-3 py-3">{order.channel}</td>
                <td className="border-b border-slate-700/70 px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      order.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default LiveOrdersTable
