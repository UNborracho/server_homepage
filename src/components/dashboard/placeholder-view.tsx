import type { LucideIcon } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"

export function PlaceholderView({
  label,
  icon: Icon,
}: {
  label: string
  icon: LucideIcon
}) {
  return (
    <>
      <PageHeader title={label} subtitle="homeserver · 192.168.1.10" />

      <div className="glass-card flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-line bg-glass">
          <Icon className="size-7 text-ink-faint" />
        </div>
        <div>
          <div className="text-lg font-semibold text-ink">Coming soon</div>
          <p className="mt-1 text-sm text-ink-soft">
            「{label}」模块正在开发中，敬请期待。
          </p>
        </div>
      </div>
    </>
  )
}
