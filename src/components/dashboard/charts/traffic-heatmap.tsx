import type { CSSProperties } from "react"

import { ChartEmpty } from "@/components/dashboard/charts/network-area-chart"

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** 7×24 traffic intensity grid — rows are days (oldest → today), cols hours. */
export function TrafficHeatmap({
  heatmap,
  maxMbps,
}: {
  heatmap: (number | null)[]
  maxMbps: number
}) {
  const rows = Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) => heatmap[d * 24 + h] ?? null),
  )
  const hasData = maxMbps > 0

  // Day labels for the last 7 calendar days, oldest first.
  const now = Date.now()
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86_400_000)
    return i === 6 ? "Today" : DOW[d.getDay()]
  })

  return (
    <div className="glass-card flex flex-col px-[22px] pb-4 pt-[22px]">
      <div className="mb-3.5">
        <div className="mb-0.5 text-sm font-semibold text-ink">Traffic Heatmap</div>
        <div className="mono text-[11px] text-ink-faint">avg MB/s · hour of day</div>
      </div>

      {hasData ? (
        <div className="flex gap-2.5">
          <div className="flex shrink-0 flex-col gap-[3px] pt-[1px]">
            {labels.map((l) => (
              <span
                key={l}
                className="mono flex h-[14px] items-center text-right text-[9px] leading-none text-ink-faint"
                style={{ width: 34 }}
              >
                {l}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
            >
              {rows.flatMap((row, d) =>
                row.map((v, h) => {
                  const intensity =
                    v == null ? 0 : Math.min(1, v / maxMbps)
                  const bg =
                    v == null
                      ? "var(--glass-bg)"
                      : `color-mix(in srgb, var(--accent-cyan) ${(12 + intensity * 88).toFixed(0)}%, transparent)`
                  const border =
                    v == null ? "1px solid var(--glass-border)" : "none"
                  return (
                    <div
                      key={`${d}-${h}`}
                      className="h-[14px] rounded-[3px]"
                      title={
                        v == null
                          ? `${labels[d]} ${String(h).padStart(2, "0")}:00 · no data`
                          : `${labels[d]} ${String(h).padStart(2, "0")}:00 · ${v.toFixed(2)} MB/s`
                      }
                      style={{ background: bg, border } as CSSProperties}
                    />
                  )
                }),
              )}
            </div>
            <div className="mono mt-1.5 flex justify-between text-[9px] leading-none text-ink-faint">
              <span>00</span>
              <span>06</span>
              <span>12</span>
              <span>18</span>
              <span>24</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[125px]">
          <ChartEmpty loading={heatmap.length === 0} />
        </div>
      )}
    </div>
  )
}
