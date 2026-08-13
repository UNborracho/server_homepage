import type { CSSProperties } from "react"

import type { ServiceStatus } from "@/lib/api"

const CONFIG: Record<
  ServiceStatus,
  { label: string; color: string; background: string }
> = {
  running: { label: "Running", color: "#22C55E", background: "rgba(34,197,94,0.12)" },
  stopped: { label: "Stopped", color: "#6B7280", background: "rgba(107,114,128,0.12)" },
  error: { label: "Error", color: "#EF4444", background: "rgba(239,68,68,0.12)" },
}

export function StatusBadge({ status }: { status: ServiceStatus }) {
  const cfg = CONFIG[status]
  return (
    <span
      className="mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
      style={{ background: cfg.background, color: cfg.color }}
    >
      <span
        className={
          status === "running"
            ? "pulse inline-block size-[5px] rounded-full"
            : "inline-block size-[5px] rounded-full"
        }
        style={{ background: cfg.color } as CSSProperties}
      />
      {cfg.label}
    </span>
  )
}
