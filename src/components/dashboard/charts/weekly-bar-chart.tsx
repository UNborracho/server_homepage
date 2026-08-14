import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip, chartColors } from "@/components/dashboard/charts/chart-tooltip"
import { ChartEmpty } from "@/components/dashboard/charts/network-area-chart"
import type { WeeklyStat } from "@/lib/api"

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Day labels for the last 7 calendar days, oldest first, ending today. */
function dayLabels(): string[] {
  const now = Date.now()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86_400_000)
    return i === 6 ? "Today" : DOW[d.getDay()]
  })
}

export function WeeklyBarChart({ weekly }: { weekly: WeeklyStat[] }) {
  const c = chartColors()
  const labels = dayLabels()
  const data = weekly.map((w, i) => ({
    day: labels[i] ?? "",
    rx: w.rxGB,
    tx: w.txGB,
    cpu: w.cpuAvg,
  }))
  const empty = data.length === 0 || !data.some((d) => d.rx > 0 || d.tx > 0)

  return (
    <div className="glass-card flex flex-col px-[22px] pb-4 pt-[22px]">
      <div className="mb-3.5">
        <div className="mb-0.5 text-sm font-semibold text-ink">Weekly Traffic</div>
        <div className="mono text-[11px] text-ink-faint">rx + tx · GB per day</div>
      </div>

      <div className="h-[196px]">
        {empty ? (
          <ChartEmpty loading={data.length === 0} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 0 }} barGap={3}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis
                dataKey="day"
                stroke="transparent"
                tick={{ fill: c.tick, fontSize: 10, fontFamily: "var(--font-mono)" }}
                tickMargin={8}
              />
              <YAxis
                width={40}
                tickFormatter={(v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(1))}
                stroke="transparent"
                tick={{ fill: c.tick, fontSize: 10, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: c.grid }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0].payload as { day: string; rx: number; tx: number; cpu: number | null }
                  return (
                    <ChartTooltip
                      title={p.day}
                      items={[
                        { name: "rx", value: `${p.rx.toFixed(2)} GB`, color: c.cyan },
                        { name: "tx", value: `${p.tx.toFixed(2)} GB`, color: c.violet },
                        ...(p.cpu != null
                          ? [{ name: "cpu", value: `${p.cpu.toFixed(1)}%`, color: c.tick }]
                          : []),
                      ]}
                    />
                  )
                }}
              />
              <Bar dataKey="rx" fill={c.cyan} radius={[4, 4, 0, 0]} maxBarSize={14} />
              <Bar dataKey="tx" fill={c.violet} radius={[4, 4, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
