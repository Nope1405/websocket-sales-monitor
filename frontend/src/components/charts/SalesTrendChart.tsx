import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatVND } from '../../utils/formatters'

export type ChartPoint = {
  time: string
  revenue: number
}

type SalesTrendChartProps = {
  data: ChartPoint[]
}

/**
 * Renders the revenue-over-time area chart based on WebSocket-fed state.
 */
function SalesTrendChart({ data }: SalesTrendChartProps) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/95 p-4 sm:p-6">
      <h2 className="mb-4 text-center text-lg font-semibold text-slate-100 sm:text-xl">
        Sales Trend - Real-Time
      </h2>
      <div className="h-[300px] w-full sm:h-[340px]">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="3 5" />
            <XAxis dataKey="time" tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${Math.round(value / 1_000_000)}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#e2e8f0',
              }}
              formatter={(value) => {
                const numericValue = typeof value === 'number' ? value : Number(value ?? 0)
                return [`${formatVND(numericValue)} VND`, 'Revenue']
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4ade80"
              strokeWidth={3}
              fill="url(#salesGlow)"
              dot={false}
              activeDot={{ r: 5, stroke: '#4ade80', fill: '#052e16' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default SalesTrendChart
