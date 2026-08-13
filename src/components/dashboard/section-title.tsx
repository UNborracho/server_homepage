import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h2
      className={cn(
        "mb-[18px] text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-soft",
        className
      )}
    >
      {children}
    </h2>
  )
}
