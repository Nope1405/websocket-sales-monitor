import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatVND } from '../../utils/formatters'
import { floorToStep, formatTickTime, generateTickRange } from './baseChartTime'

export type ChartPoint = {
  ts: number
  revenue: number
}

type LiveSalesChartProps = {
  data: ChartPoint[]
}

type MarkerPoint = ChartPoint & {
  __isMarker: true
  delta: number
}

type TooltipEntry = {
  value?: number | string
  name?: string
  dataKey?: string
  payload?: {
    __isMarker?: boolean
    delta?: number
    ts?: number
    revenue?: number
  }
}

type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipEntry[]
  label?: number | string
}

const ONE_MINUTE_MS = 60_000
const CHART_WINDOW_MINUTES = 60
const TICK_INTERVAL_MINUTES = 5
const WINDOW_MS = CHART_WINDOW_MINUTES * ONE_MINUTE_MS
const TICK_INTERVAL_MS = TICK_INTERVAL_MINUTES * ONE_MINUTE_MS
const DOT_INTERVAL_MS = 150_000
const X_AXIS_TICK_STYLE = { fill: '#cbd5e1', fontSize: 12, fontWeight: 600 }
const MILLION = 1_000_000
const DEFAULT_STEP_M = 100
const MIN_AXIS_MAX_M = 100
const STEP_CANDIDATES_M = [100, 200, 500, 1000, 2000]

/**
 * Renders exactly one revenue row in tooltip.
 * Marker series is preferred to avoid duplicated rows from multiple series.
 */
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const markerRevenueEntry = payload.find((entry) => {
    const isMarker = Boolean(entry?.payload?.__isMarker)
    const isRevenueKey = entry?.dataKey === 'revenue' || String(entry?.name || '').toLowerCase() === 'revenue'
    const isRevenueValue = Number(entry?.value) === Number(entry?.payload?.revenue)

    return isMarker && (isRevenueKey || isRevenueValue)
  })

  const areaRevenueEntry = payload.find((entry) => {
    const isRevenueKey = entry?.dataKey === 'revenue' || String(entry?.name || '').toLowerCase() === 'revenue'
    const isRevenueValue = Number(entry?.value) === Number(entry?.payload?.revenue)
    return isRevenueKey || isRevenueValue
  })

  const selectedEntry = markerRevenueEntry || areaRevenueEntry || payload[payload.length - 1]

  if (!selectedEntry) {
    return null
  }

  const numericValue = Number(selectedEntry.value ?? 0)
  const deltaValue = Number(selectedEntry.payload?.delta ?? 0)
  const deltaPrefix = deltaValue >= 0 ? '+' : ''
  const timestampValue = typeof label === 'number' ? label : Number(label ?? Date.now())

  return (
    <div
      style={{
        backgroundColor: '#0e1930',
        border: '1px solid #2f4367',
        borderRadius: '10px',
        color: '#e2e8f0',
        padding: '10px 12px',
      }}
    >
      <div style={{ marginBottom: '6px' }}>{formatTickTime(timestampValue)}</div>
      <div>{`Revenue : ${formatVND(numericValue)} VND (${deltaPrefix}${formatVND(deltaValue)})`}</div>
    </div>
  )
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
  const detailedData = useMemo(() => {
    return data.map((point, index) => {
      const previousRevenue = index > 0 ? data[index - 1].revenue : point.revenue

      return {
        ...point,
        delta: point.revenue - previousRevenue,
      }
    })
  }, [data])

  const chartWindow = useMemo(() => {
    const now = Date.now()
    const latestTimestamp = detailedData.length > 0 ? detailedData[detailedData.length - 1].ts : now
    const endTime = Math.min(now, latestTimestamp)
    const endTick = floorToStep(endTime, TICK_INTERVAL_MS)
    const startTick = endTick - WINDOW_MS
    const ticks = generateTickRange(startTick, endTick, TICK_INTERVAL_MS)

    return {
      startTime: startTick,
      endTime,
      ticks,
    }
  }, [detailedData])

  const markerPoints = useMemo(() => {
    if (detailedData.length < 2) {
      return []
    }

    const markers: MarkerPoint[] = []
    const markerStart = Math.ceil(chartWindow.startTime / DOT_INTERVAL_MS) * DOT_INTERVAL_MS
    let segmentIndex = 0
    let previousMarkerRevenue: number | null = null

    for (let markerTs = markerStart; markerTs <= chartWindow.endTime; markerTs += DOT_INTERVAL_MS) {
      while (
        segmentIndex < detailedData.length - 2 &&
        detailedData[segmentIndex + 1].ts < markerTs
      ) {
        segmentIndex += 1
      }

      const left = detailedData[segmentIndex]
      const right = detailedData[segmentIndex + 1]

      if (!left || !right) {
        continue
      }

      if (markerTs < left.ts || markerTs > right.ts) {
        continue
      }

      const timeRange = right.ts - left.ts
      const ratio = timeRange === 0 ? 0 : (markerTs - left.ts) / timeRange
      const revenue = left.revenue + (right.revenue - left.revenue) * ratio
      const previousRevenue = previousMarkerRevenue ?? revenue
      const delta = revenue - previousRevenue

      markers.push({ ts: markerTs, revenue, delta, __isMarker: true })
      previousMarkerRevenue = revenue
    }

    return markers
  }, [detailedData, chartWindow.startTime, chartWindow.endTime])

  const yAxisConfig = useMemo(() => {
    const maxRevenue = detailedData.reduce((maxValue, point) => {
      return Math.max(maxValue, Number(point.revenue ?? 0))
    }, 0)

    const maxRevenueM = Math.max(0, Math.ceil(maxRevenue / MILLION))

    const selectedStepM = STEP_CANDIDATES_M.find((stepM) => {
      const axisMaxM = Math.max(MIN_AXIS_MAX_M, Math.ceil(maxRevenueM / stepM) * stepM)
      return axisMaxM / stepM <= 6
    }) || DEFAULT_STEP_M

    const axisMaxM = Math.max(MIN_AXIS_MAX_M, Math.ceil(maxRevenueM / selectedStepM) * selectedStepM)
    const axisMaxValue = axisMaxM * MILLION
    const ticks: number[] = []

    for (let valueM = 0; valueM <= axisMaxM; valueM += selectedStepM) {
      ticks.push(valueM * MILLION)
    }

    return {
      axisMaxValue,
      ticks,
    }
  }, [detailedData])

  return (
    <section className="rounded-lg border border-[#2a3d63] bg-gradient-to-b from-[#1a2b4a] to-[#101a31] p-4 sm:p-6">
      <h2 className="mb-4 text-center text-lg font-semibold text-slate-100 sm:text-xl">
        Sales Trend - Real-Time
      </h2>
      <div className="w-full h-[450px] overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={detailedData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
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
              tick={X_AXIS_TICK_STYLE}
              tickLine={false}
              axisLine={false}
              interval="preserveStart"
              minTickGap={28}
              tickMargin={10}
              height={48}
              tickFormatter={formatTickTime}
            />
            <YAxis
              tick={{ fill: '#cbd5e1', fontSize: 14, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              domain={[0, yAxisConfig.axisMaxValue]}
              ticks={yAxisConfig.ticks}
              tickFormatter={(value: number) => `${Math.round(value / MILLION)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="linear"
              dataKey="revenue"
              stroke="#4ade80"
              strokeWidth={2.5}
              fill="url(#salesGlow)"
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 5, stroke: '#4ade80', fill: '#052e16' }}
            />
            <Scatter data={markerPoints} dataKey="revenue" fill="#22c55e" shape="circle" r={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default LiveSalesChart
