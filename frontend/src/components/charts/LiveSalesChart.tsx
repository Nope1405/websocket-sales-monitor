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

export type ChartPoint = {
  ts: number
  revenue: number
}

type LiveSalesChartProps = {
  data: ChartPoint[]
}

const ONE_MINUTE_MS = 60_000
const CHART_WINDOW_MINUTES = 20
const TICK_INTERVAL_MINUTES = 5
const WINDOW_MS = CHART_WINDOW_MINUTES * ONE_MINUTE_MS
const TICK_INTERVAL_MS = TICK_INTERVAL_MINUTES * ONE_MINUTE_MS

function floorToStep(value: number, step: number) {
  return Math.floor(value / step) * step
}

function ceilToStep(value: number, step: number) {
  return Math.ceil(value / step) * step
}

function formatTickTime(value: number) {
  return new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Renders a time-windowed revenue chart for live sales visibility.
 *
 * Why this component exists:
 * - Chart behavior is independent from dashboard page orchestration.
 * - Isolating chart concerns keeps the dashboard file readable.
 * - The component can be reused in detail pages without duplicating logic.
 */
function LiveSalesChart({ data }: LiveSalesChartProps) {
  const chartWindow = useMemo(() => {
    const latestTimestamp = data.length > 0 ? data[data.length - 1].ts : Date.now()
    const endTime = ceilToStep(latestTimestamp, TICK_INTERVAL_MS)
    const startTime = endTime - WINDOW_MS

    const bufferedStart = floorToStep(startTime - TICK_INTERVAL_MS, TICK_INTERVAL_MS)
    const bufferedEnd = ceilToStep(endTime + TICK_INTERVAL_MS, TICK_INTERVAL_MS)
    const ticks: number[] = []

    for (let tickValue = bufferedStart; tickValue <= bufferedEnd; tickValue += TICK_INTERVAL_MS) {
      ticks.push(tickValue)
    }

    return {
      startTime,
      endTime,
      ticks,
    }
  }, [data])

  return (
    <section className="flex flex-col shrink-0 h-[160px] sm:h-[200px] rounded-lg border border-slate-700 bg-slate-800/95 p-2 sm:p-3">
      <h2 className="mb-1 shrink-0 text-center text-sm font-semibold text-slate-100 sm:text-base">
        Sales Trend - Real-Time
      </h2>
      <div className="flex-1 min-h-0 w-full">
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
              domain={[chartWindow.startTime, chartWindow.endTime]}
              ticks={chartWindow.ticks}
              tick={{ fill: '#cbd5e1', fontSize: 18, fontWeight: 800 }}
              tickLine={false}
              axisLine={false}
              interval={0}
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
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#e2e8f0',
              }}
              labelFormatter={(label) => {
                const timestampValue = typeof label === 'number' ? label : Number(label ?? Date.now())
                return formatTickTime(timestampValue)
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

export default LiveSalesChart
