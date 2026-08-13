import {
  Bot,
  Container,
  Images,
  Sparkles,
  SquareKanban,
  type LucideIcon,
} from "lucide-react"

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  images: Images,
  sparkles: Sparkles,
  kanban: SquareKanban,
  container: Container,
  bot: Bot,
}

export function getServiceIcon(iconKey: string): LucideIcon {
  return SERVICE_ICONS[iconKey] ?? Container
}
