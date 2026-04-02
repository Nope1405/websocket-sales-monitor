import type { ReactNode } from 'react'

type StatCardProps = {
  title: string
  value: ReactNode
  description?: string
  valueClassName?: string
  cardClassName?: string
}

/**
 * Displays one dashboard statistic with a consistent visual structure.
 *
 * Why this component exists:
 * - KPI blocks are repeated UI patterns with only data differences.
 * - A shared component prevents drift in spacing, typography, and semantics.
 * - Explicit props keep intent obvious for future maintainers.
 */
function StatCard({
  title,
  value,
  description,
  valueClassName = 'text-white',
  cardClassName = '',
}: StatCardProps) {
  return (
    <article
      className={`flex min-h-[210px] flex-col items-center justify-center rounded-lg border border-[#2a3d63] bg-gradient-to-b from-[#1a2b4a] to-[#101a31] p-5 text-center shadow-lg shadow-black/20 ${cardClassName}`}
    >
      <p className="text-lg font-semibold text-blue-300">{title}</p>
      <div className={`mt-4 text-3xl font-bold leading-tight md:text-4xl ${valueClassName}`}>{value}</div>
      {description ? (
        <p className="mt-4 text-sm font-semibold tracking-wide text-sky-200/90 sm:text-base">{description}</p>
      ) : null}
    </article>
  )
}

export default StatCard
