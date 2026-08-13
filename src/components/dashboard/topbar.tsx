import { Search, TriangleAlert } from "lucide-react"

import { LiveClock } from "@/components/dashboard/live-clock"
import { ModeToggle } from "@/components/mode-toggle"
import type { ApiService } from "@/lib/api"

export function Topbar({
  services,
  search,
  onSearch,
  isDark,
  onToggleTheme,
  online,
}: {
  services: ApiService[]
  search: string
  onSearch: (value: string) => void
  isDark: boolean
  onToggleTheme: () => void
  online: boolean
}) {
  const running = services.filter((s) => s.status === "running").length
  const errors = services.filter((s) => s.status === "error").length

  return (
    <header className="topbar">
      <div className="flex items-center gap-4 px-7 py-3.5">
        {/* Search */}
        <div className="relative max-w-[360px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search services, logs, metrics…"
            className="glass-card-sm w-full rounded-[10px] py-2 pl-[34px] pr-3.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-cyan-glow/50"
          />
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-green-glow/20 bg-green-glow/10 px-3 py-1.5">
            <span className="pulse inline-block size-1.5 rounded-full bg-green-glow shadow-[0_0_6px_#22C55E]" />
            <span className="mono text-xs font-semibold text-green-glow">
              {running} up
            </span>
          </div>

          {errors > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-red-glow/20 bg-red-glow/10 px-3 py-1.5">
              <span className="mono text-xs font-semibold text-red-glow">
                {errors} err
              </span>
            </div>
          )}

          {!online && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-glow/20 bg-amber-glow/10 px-3 py-1.5">
              <TriangleAlert className="size-3 text-amber-glow" />
              <span className="mono text-xs font-semibold text-amber-glow">
                reconnecting
              </span>
            </div>
          )}

          <LiveClock />
        </div>

        <ModeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}
