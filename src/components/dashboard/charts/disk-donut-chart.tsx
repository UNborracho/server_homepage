import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

import { formatBytes } from "@/lib/format"

const COLORS = ["#00E5FF", "rgba(255,255,255,0.12)"]

export function DiskDonutChart({
  used,
  total,
}: {
  used: number
  total: number
}) {
  const free = Math.max(0, total - used)
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const data = [
    { name: "Used", value: used },
    { name: "Free", value: free > 0 ? free : 1 },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="relative size-40">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                dataKey="value"
                strokeWidth={0}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="mono text-[22px] font-bold text-ink">
              {percent.toFixed(0)}%
            </span>
            <span className="text-[10px] text-ink-faint">used</span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-[2px]"
            style={{ background: COLORS[0] }}
          />
          <span className="mono text-[10px] text-ink-soft">
            {formatBytes(used)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-[2px]"
            style={{ background: COLORS[1] }}
          />
          <span className="mono text-[10px] text-ink-soft">
            {formatBytes(free)} free
          </span>
        </div>
      </div>
    </div>
  )
}
