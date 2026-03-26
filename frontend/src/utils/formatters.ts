/**
 * Formats integer values into Vietnamese currency-like group formatting.
 * @param value Numeric amount to format.
 * @returns Formatted string with separators.
 */
export function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formats ISO timestamps into HH:mm for compact chart and table display.
 * @param timestamp ISO timestamp string.
 * @returns Local time label in 24-hour format.
 */
export function formatTimeLabel(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
