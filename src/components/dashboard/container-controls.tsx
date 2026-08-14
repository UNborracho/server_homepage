import { useState, type ReactNode } from "react"
import { Play, RotateCw, Square } from "lucide-react"

import { controlContainer, type ContainerAction } from "@/lib/api"

export function ContainerControls({
  name,
  running,
  onControl,
}: {
  name: string
  running: boolean
  onControl?: () => void
}) {
  const [pending, setPending] = useState<ContainerAction | null>(null)

  async function act(action: ContainerAction) {
    setPending(action)
    try {
      await controlContainer(name, action)
    } finally {
      setPending(null)
      onControl?.()
    }
  }

  const busy = pending !== null

  return (
    <div className="flex gap-1.5">
      {running ? (
        <>
          <Btn
            icon={<RotateCw className="size-3" />}
            color="#F59E0B"
            label="Restart"
            busy={busy}
            onClick={() => act("restart")}
          />
          <Btn
            icon={<Square className="size-3" />}
            color="#EF4444"
            label="Stop"
            busy={busy}
            onClick={() => act("stop")}
          />
        </>
      ) : (
        <Btn
          icon={<Play className="size-3" />}
          color="#22C55E"
          label="Start"
          busy={busy}
          onClick={() => act("start")}
        />
      )}
    </div>
  )
}

function Btn({
  icon,
  color,
  label,
  busy,
  onClick,
}: {
  icon: ReactNode
  color: string
  label: string
  busy: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      title={label}
      className="inline-flex items-center gap-1 rounded-[7px] border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 disabled:opacity-50"
      style={{ background: `${color}1a`, color, borderColor: `${color}33` }}
    >
      {icon}
      {label}
    </button>
  )
}
