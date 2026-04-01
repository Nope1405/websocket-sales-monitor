type StatCardProps = {
  title: string
  value: string
  description?: string
  valueClassName?: string
}

/**
 * Displays one dashboard statistic with a consistent visual structure.
 *
 * Why this component exists:
 * - KPI blocks are repeated UI patterns with only data differences.
 * - A shared component prevents drift in spacing, typography, and semantics.
 * - Explicit props keep intent obvious for future maintainers.
 */
function StatCard({ title, value, description, valueClassName = 'text-white' }: StatCardProps) {
  return (
    <article className="rounded-lg border border-slate-700 bg-slate-800/95 p-3 sm:p-4 shadow-lg shadow-black/20">
      <p className="text-sm font-semibold text-blue-300 sm:text-base">{title}</p>
      <p className={`mt-1 text-2xl font-bold leading-tight sm:text-3xl ${valueClassName}`}>{value}</p>
      {description ? <p className="mt-1 text-xs text-gray-500">{description}</p> : null}
    </article>
  )
}

export default StatCard
