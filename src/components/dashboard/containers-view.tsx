import { useState, type CSSProperties } from "react"
import { FileText, X } from "lucide-react"

import { ContainerControls } from "@/components/dashboard/container-controls"
import { PageHeader } from "@/components/dashboard/page-header"
import {
  fetchContainerLogs,
  fetchContainers,
  type ContainerInfo,
} from "@/lib/api"
import { formatBytes } from "@/lib/format"
import { usePoll } from "@/lib/use-poll"

const STATE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  running: { label: "running", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  created: { label: "created", color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  restarting: { label: "restarting", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  paused: { label: "paused", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  exited: { label: "exited", color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  dead: { label: "dead", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
}

export function ContainersView() {
  const { data, loading, refetch } = usePoll<ContainerInfo[]>(fetchContainers, 5000)
  const list = data ?? []
  const running = list.filter((c) => c.state === "running").length

  const [logName, setLogName] = useState<string | null>(null)
  const [logText, setLogText] = useState<string | null>(null)
  const [logBusy, setLogBusy] = useState(false)

  async function openLogs(name: string) {
    setLogName(name)
    setLogText(null)
    setLogBusy(true)
    try {
      setLogText(await fetchContainerLogs(name))
    } catch {
      setLogText(null)
    } finally {
      setLogBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Monitoring"
        subtitle={`${list.length} containers · ${running} running`}
      />

      <div className="glass-card overflow-x-auto p-2">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-ink-faint">
              <th className="px-3 py-2 font-semibold">Container</th>
              <th className="px-3 py-2 font-semibold">Image</th>
              <th className="px-3 py-2 font-semibold">State</th>
              <th className="px-3 py-2 font-semibold">CPU</th>
              <th className="px-3 py-2 font-semibold">Memory</th>
              <th className="px-3 py-2 font-semibold">Ports</th>
              <th className="px-3 py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && list.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-ink-faint">
                  loading…
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-ink-faint">
                  No containers — is the Docker socket mounted?
                </td>
              </tr>
            ) : (
              list.map((c) => (
                <ContainerRow key={c.id} c={c} refetch={refetch} onLogs={openLogs} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {logName && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
          onClick={() => setLogName(null)}
        >
          <div
            className="glass-card flex max-h-[72vh] w-full max-w-3xl flex-col overflow-hidden"
            style={{ background: "var(--bg-elevated)" } as CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className="mono text-xs font-semibold text-ink">
                logs · {logName} <span className="font-normal text-ink-faint">· last 200</span>
              </span>
              <button
                type="button"
                onClick={() => setLogName(null)}
                className="flex size-6 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-ink/10 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <pre className="mono flex-1 overflow-auto whitespace-pre-wrap px-5 py-4 text-xs leading-relaxed text-ink-soft">
              {logBusy ? "loading…" : logText && logText.length > 0 ? logText : "(no output)"}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}

function ContainerRow({
  c,
  refetch,
  onLogs,
}: {
  c: ContainerInfo
  refetch: () => void
  onLogs: (name: string) => void
}) {
  const st = STATE_STYLE[c.state] ?? {
    label: c.state,
    color: "#6B7280",
    bg: "rgba(107,114,128,0.12)",
  }
  const cpu = c.cpuPercent ?? null
  const memPct = c.memPercent ?? null

  return (
    <tr className="border-t border-line">
      <td className="px-3 py-2.5 font-medium text-ink">{c.name}</td>
      <td className="mono px-3 py-2.5 text-xs text-ink-soft">{c.image}</td>
      <td className="px-3 py-2.5">
        <span
          className="mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: st.bg, color: st.color } as CSSProperties}
        >
          {st.label}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <MiniMetric value={cpu} max={100} suffix="%" />
      </td>
      <td className="mono px-3 py-2.5 text-xs text-ink-soft">
        {c.memUsage != null ? formatBytes(c.memUsage) : "—"}
        {memPct != null && (
          <span className="text-ink-faint"> ({memPct.toFixed(0)}%)</span>
        )}
      </td>
      <td className="mono px-3 py-2.5 text-xs text-ink-faint">
        {c.ports.join(" ") || "—"}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onLogs(c.name)}
            title="View logs"
            className="inline-flex items-center gap-1 rounded-[7px] border border-line px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <FileText className="size-3" />
            Logs
          </button>
          <ContainerControls
            name={c.name}
            running={c.state === "running"}
            onControl={refetch}
          />
        </div>
      </td>
    </tr>
  )
}

function MiniMetric({
  value,
  max,
  suffix,
}: {
  value: number | null
  max: number
  suffix: string
}) {
  if (value == null) return <span className="text-ink-faint">—</span>
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-12 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-cyan-glow"
          style={{ width: `${pct}%` } as CSSProperties}
        />
      </div>
      <span className="mono w-12 text-right text-xs text-ink-soft">
        {value.toFixed(1)}
        {suffix}
      </span>
    </div>
  )
}
