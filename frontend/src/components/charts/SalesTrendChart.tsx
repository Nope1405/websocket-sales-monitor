import { useMemo } from 'react'
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
import { ceilToStep, formatTickTime, generateTickRange } from './baseChartTime'

export type ChartPoint = {
  ts: number
  revenue: number
}

type SalesTrendChartProps = {
  data: ChartPoint[]
}

const ONE_MINUTE_MS = 60_000
const CHART_WINDOW_MINUTES = 20
const TICK_INTERVAL_MINUTES = 5
const WINDOW_MS = CHART_WINDOW_MINUTES * ONE_MINUTE_MS
const TICK_INTERVAL_MS = TICK_INTERVAL_MINUTES * ONE_MINUTE_MS
const X_AXIS_TICK_STYLE = { fill: '#cbd5e1', fontSize: 12, fontWeight: 600 }

/**
 * Renders the revenue-over-time area chart based on WebSocket-fed state.
 */
function SalesTrendChart({ data }: SalesTrendChartProps) {
  // Sliding window logic:
  // 1) Anchor to latest data timestamp (fallback to now)
  // 2) Snap the right edge to a 5-minute boundary
  // 3) Keep a strict 20-minute viewport
  // 4) Pre-generate ticks only inside the current viewport to avoid crowded labels
  const { startTime, endTime, ticks } = useMemo(() => {
    const latestDataTs = data.length > 0 ? data[data.length - 1].ts : Date.now()
    const end = ceilToStep(latestDataTs, TICK_INTERVAL_MS)
    const start = end - WINDOW_MS
    const generatedTicks = generateTickRange(start, end, TICK_INTERVAL_MS)

    return {
      startTime: start,
      endTime: end,
      ticks: generatedTicks,
    }
  }, [data])

  return (
    <section className="rounded-lg border border-[#2a3d63] bg-gradient-to-b from-[#1a2b4a] to-[#101a31] p-4 sm:p-6">
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
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={[startTime, endTime]}
              ticks={ticks}
              tick={X_AXIS_TICK_STYLE}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
              tickMargin={10}
              height={48}
              tickFormatter={formatTickTime}
            />
            <YAxis
              tick={{ fill: '#cbd5e1', fontSize: 14, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${Math.round(value / 1_000_000)}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0e1930',
                border: '1px solid #2f4367',
                borderRadius: '10px',
                color: '#e2e8f0',
              }}
              labelFormatter={(label) => {
                const ts = typeof label === 'number' ? label : Number(label ?? Date.now())
                return formatTickTime(ts)
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
