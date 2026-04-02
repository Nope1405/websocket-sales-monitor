/**
 * BaseChartTime
 *
 * Base utility module for chart time math shared across chart components.
 * Child chart components consume these helpers to keep logic DRY.
 */

export function floorToStep(value: number, step: number): number {
  return Math.floor(value / step) * step
}

export function ceilToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step
}

export function formatTickTime(value: number): string {
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function generateTickRange(start: number, end: number, step: number): number[] {
  const ticks: number[] = []

  for (let tick = start; tick <= end; tick += step) {
    ticks.push(tick)
  }

  return ticks
}
