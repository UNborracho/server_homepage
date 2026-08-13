import { Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"

export function ModeToggle({
  isDark,
  onToggle,
}: {
  isDark: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle dark / light theme"
      title="Toggle theme"
      className={cn(
        "flex size-9 items-center justify-center rounded-[10px] border border-line bg-glass",
        "text-base text-ink-soft transition-colors duration-150 hover:text-ink",
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
