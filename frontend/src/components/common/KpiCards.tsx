import { ShoppingCart, Users } from 'lucide-react'
import { formatVND } from '../../utils/formatters'

type KpiCardsProps = {
  totalRevenue: number
  ordersPerMinute: number
  currentUsers: number
  topProduct: string
  topProductSold: number
}

const PHONE_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect x="20" y="6" width="56" height="84" rx="10" fill="%231e293b" stroke="%23475569" stroke-width="4"/><rect x="28" y="16" width="40" height="56" rx="6" fill="%23334155"/><circle cx="48" cy="79" r="4" fill="%2394a3b8"/></svg>'

/**
 * Renders the top summary cards that highlight current dashboard KPIs.
 */
function KpiCards({
  totalRevenue,
  ordersPerMinute,
  currentUsers,
  topProduct,
  topProductSold,
}: KpiCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-lg border border-slate-700 bg-slate-800/95 p-5 shadow-lg shadow-black/20">
        <p className="text-lg font-semibold text-blue-300">Total Revenue</p>
        {/* Always show full financial value; unit can wrap when the card gets narrow. */}
        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <span className="break-all text-3xl font-bold leading-none text-emerald-400 md:text-4xl">
            {formatVND(totalRevenue)}
          </span>
          <span className="text-lg font-semibold leading-none text-emerald-400/80 md:text-xl">VND</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">From Live Stream</p>
      </article>

      <article className="rounded-lg border border-slate-700 bg-slate-800/95 p-5 shadow-lg shadow-black/20">
        <p className="text-lg font-semibold text-blue-300">Orders Per Minute</p>
        <div className="mt-4 flex items-center gap-3">
          <ShoppingCart className="h-7 w-7 text-slate-200" />
          <p className="truncate text-3xl font-bold leading-none text-white md:text-4xl">{ordersPerMinute}</p>
        </div>
        <p className="mt-2 text-xs text-gray-500">Rolling 60 Seconds</p>
      </article>

      <article className="rounded-lg border border-slate-700 bg-slate-800/95 p-5 shadow-lg shadow-black/20">
        <p className="text-lg font-semibold text-blue-300">Current Users</p>
        <div className="mt-4 flex items-center gap-3">
          <Users className="h-7 w-7 text-amber-400" />
          <p className="truncate text-3xl font-bold leading-none text-white md:text-4xl">{currentUsers}</p>
        </div>
        <p className="mt-2 text-xs text-gray-500">Estimated Live Audience</p>
      </article>

      <article className="rounded-lg border border-slate-700 bg-slate-800/95 p-5 shadow-lg shadow-black/20">
        <p className="text-lg font-semibold text-blue-300">Top Product</p>
        <div className="mt-4 flex items-center gap-3">
          <img
            src={PHONE_PLACEHOLDER}
            alt="Phone placeholder"
            className="h-16 w-16 rounded-md border border-slate-600 bg-slate-900 object-cover"
          />
          <div>
            <p className="text-xl font-semibold text-white">{topProduct}</p>
            <p className="mt-2 text-xs text-gray-500">{topProductSold} Sold</p>
          </div>
        </div>
      </article>
    </section>
  )
}

export default KpiCards
