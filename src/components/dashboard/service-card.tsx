import type { CSSProperties } from "react"
import { ArrowUpRight } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { getServiceIcon } from "@/lib/icons"
import type { ApiService } from "@/lib/api"

export function ServiceCard({ service }: { service: ApiService }) {
  const Icon = getServiceIcon(service.iconKey)
  const running = service.status === "running"

  return (
    <a
      href={service.url}
      target="_blank"
      rel="noreferrer"
      className="glass-card svc-card group block cursor-pointer p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
      style={{ "--svc": service.color } as CSSProperties}
    >
      <div className="mb-3.5 flex items-start justify-between">
        <span
          className="flex size-[42px] items-center justify-center rounded-xl border"
          style={{
            background: `${service.color}18`,
            borderColor: `${service.color}30`,
          }}
        >
          <Icon className="size-5" style={{ color: service.color } as CSSProperties} />
        </span>
        <StatusBadge status={service.status} />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-ink">{service.name}</span>
          <ArrowUpRight className="size-4 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <div className="mono mt-1 text-xs text-ink-faint">
          :{service.port} · {service.category}
        </div>
      </div>

      <div className="flex items-center">
        <span className="text-[11px] text-ink-soft">
          {running
            ? service.latencyMs != null
              ? `${service.latencyMs} ms`
              : "Online"
            : "Offline"}
        </span>
      </div>
    </a>
  )
}
