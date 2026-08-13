export function KpiCard({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="glass-card flex-1 p-[22px]">
      <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.04em] text-ink-soft">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="mono text-4xl font-bold leading-none tracking-[-0.02em] text-ink">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-ink-soft">{unit}</span>}
      </div>
    </div>
  )
}
