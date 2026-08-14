import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip, chartColors } from "@/components/dashboard/charts/chart-tooltip"
import type { HistoryPoint, HistoryWindow } from "@/lib/api"
import { formatBytes } from "@/lib/format"

const WINDOW_OPTIONS: { id: HistoryWindow; label: string }[] = [
  { id: "1h", label: "1H" },
  { id: "6h", label: "6H" },
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
]

export function NetworkAreaChart({
  points,
  window,
  onWindow,
  loading,
}: {
  points: HistoryPoint[]
  window: HistoryWindow
  onWindow: (w: HistoryWindow) => void
  loading: boolean
}) {
  const c = chartColors()
  const data = points.map((p) => ({
    t: p.t,
    rx: p.rx != null ? p.rx / 1e6 : null,
    tx: p.tx != null ? p.tx / 1e6 : null,
  }))
  const empty = !data.some((d) => d.rx != null || d.tx != null)
  const fmtTime = (t: number) => {
    const d = new Date(t)
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return window === "7d"
      ? `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]} ${hh}:00`
      : `${hh}:${mm}`
  }

  return (
    <div className="glass-card flex flex-col px-[22px] pb-4 pt-[22px]">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <div className="mb-0.5 text-sm font-semibold text-ink">Network Traffic</div>
          <div className="mono text-[11px] text-ink-faint">rx / tx · MB/s</div>
        </div>
        <div className="glass-card-sm flex gap-0.5 p-0.5">
          {WINDOW_OPTIONS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onWindow(w.id)}
              className={`mono rounded-[9px] px-2.5 py-1 text-[11px] font-medium transition-colors ${
                window === w.id
                  ? "text-ink"
                  : "text-ink-faint hover:text-ink-soft"
              }`}
              style={
                window === w.id
                  ? { background: "color-mix(in srgb, var(--accent-cyan) 15%, transparent)", color: "var(--accent-cyan)" }
                  : undefined
              }
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[218px]">
        {empty ? (
          <ChartEmpty loading={loading} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.cyan} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={c.cyan} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.violet} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={c.violet} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={fmtTime}
                stroke="transparent"
                tick={{ fill: c.tick, fontSize: 10, fontFamily: "var(--font-mono)" }}
                tickMargin={8}
                minTickGap={48}
              />
              <YAxis
                width={44}
                tickFormatter={(v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(1))}
                stroke="transparent"
                tick={{ fill: c.tick, fontSize: 10, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0].payload as { t: number; rx: number | null; tx: number | null }
                  return (
                    <ChartTooltip
                      title={fmtTime(p.t)}
                      items={[
                        { name: "rx", value: p.rx != null ? `${formatBytes(p.rx * 1e6)}/s` : "—", color: c.cyan },
                        { name: "tx", value: p.tx != null ? `${formatBytes(p.tx * 1e6)}/s` : "—", color: c.violet },
                      ]}
                    />
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="rx"
                stroke={c.cyan}
                strokeWidth={1.8}
                fill="url(#rxGrad)"
                connectNulls
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="tx"
                stroke={c.violet}
                strokeWidth={1.8}
                fill="url(#txGrad)"
                connectNulls
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export function ChartEmpty({ loading }: { loading: boolean }) {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="mono text-xs text-ink-faint">
        {loading ? "loading…" : "history accumulating — check back in a bit"}
      </span>
    </div>
  )
}
