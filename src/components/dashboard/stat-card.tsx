import type { CSSProperties } from "react"

export function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="glass-card-sm p-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
        {label}
      </div>
      <div
        className="mono mb-1 text-2xl font-bold tracking-[-0.02em]"
        style={{ color } as CSSProperties}
      >
        {value}
      </div>
      <div className="text-[10px] text-ink-faint">{sub}</div>
    </div>
  )
}
