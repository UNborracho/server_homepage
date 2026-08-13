import type { ReactNode } from "react"

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children?: ReactNode
}) {
  return (
    <div className="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-ink">
          {title}
        </h1>
        <p className="text-[13px] text-ink-soft">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
