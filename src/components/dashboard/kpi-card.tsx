import { Area, AreaChart, ResponsiveContainer } from "recharts"

export interface KpiCardProps {
  label: string
  value: string
  unit: string
  /** Sparkline stroke/fill color (theme-resolved hex). */
  color?: string
  /** Last-24h series for the mini chart; nulls are bridged. */
  spark?: (number | null)[]
  /** Percent change vs 24h ago; null renders nothing (still accumulating). */
  delta?: number | null
}

export function KpiCard({ label, value, unit, color, spark, delta }: KpiCardProps) {
  const hasSpark = !!spark && spark.length > 1 && spark.some((v) => v != null)
  const gid = `kpi-${label.replace(/\W+/g, "")}`
  const up = (delta ?? 0) >= 0

  return (
    <div className="glass-card flex flex-1 flex-col p-[22px]">
      <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.04em] text-ink-soft">
        {label}
      </div>
      {hasSpark && (
        <div className="mb-3 h-9">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={spark!.map((v, i) => ({ i, v }))}
              margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#${gid})`}
                connectNulls
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-auto flex items-baseline gap-1.5">
        <span className="mono text-4xl font-bold leading-none tracking-[-0.02em] text-ink">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-ink-soft">{unit}</span>}
        {delta != null && (
          <span
            className="mono ml-auto pl-2 text-[11px] font-semibold"
            style={{ color: up ? "#22C55E" : "#EF4444" }}
          >
            {up ? "↑ +" : "↓ −"}
            {Math.abs(delta).toFixed(1)}%
            <span className="ml-1 font-normal text-ink-faint">vs 24h</span>
          </span>
        )}
      </div>
    </div>
  )
}
