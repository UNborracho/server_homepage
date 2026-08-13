import { Clock } from "lucide-react"

export function HistoryPlaceholder() {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-line bg-glass">
        <Clock className="size-5 text-ink-faint" />
      </div>
      <div>
        <div className="text-sm font-semibold text-ink">历史数据开发中</div>
        <p className="mt-1 text-xs text-ink-soft">
          Network I/O 趋势、周请求、流量热力图将在接入时序存储后上线。
        </p>
      </div>
    </div>
  )
}
