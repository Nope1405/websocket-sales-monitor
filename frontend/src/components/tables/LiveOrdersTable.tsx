import { AlertTriangle } from 'lucide-react'
import type { BackendOrder } from '../../hooks/useWebSocket'
import { formatTimeLabel, formatVND } from '../../utils/formatters'

type LiveOrdersTableProps = {
  orders: BackendOrder[]
}

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
 * Renders the real-time orders table and warning banner based on stream health.
 */
function LiveOrdersTable({ orders }: LiveOrdersTableProps) {
  const failedStreak = getFailedStreak(orders)
  const newestFirstRows = [...orders].reverse()

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/95 p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-100 sm:text-xl">Live Sales Stream</h2>

      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
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

      <div className="mt-5 rounded-lg border border-rose-800/60 bg-gradient-to-r from-rose-950 to-red-900/80 px-4 py-3 text-rose-100">
        <p className="flex items-center gap-2 text-sm font-semibold sm:text-base">
          <AlertTriangle className="h-5 w-5 text-yellow-300" />
          ⚠️ Cảnh báo : Nhiều giao dịch thất bại liên tiếp!
          {failedStreak >= 3 ? ` (${failedStreak} lần)` : ''}
        </p>
      </div>
    </section>
  )
}

export default LiveOrdersTable
