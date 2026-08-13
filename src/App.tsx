import { useState } from "react"

import { OverviewView } from "@/components/dashboard/overview-view"
import { PlaceholderView } from "@/components/dashboard/placeholder-view"
import { ServicesView } from "@/components/dashboard/services-view"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import { NAV_ITEMS } from "@/lib/data"
import { fetchServices, type ApiService } from "@/lib/api"
import { usePoll } from "@/lib/use-poll"
import { useTheme } from "@/lib/use-theme"

export default function App() {
  const { isDark, toggle } = useTheme()
  const [activeNav, setActiveNav] = useState("overview")
  const { data: services, error, loading } = usePoll(fetchServices, 5000)
  const serviceList = services ?? []

  return (
    <div className="min-h-svh bg-canvas">
      <Sidebar
        services={serviceList}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      <div className="layout">
        <Topbar
          services={serviceList}
          search=""
          onSearch={() => {}}
          isDark={isDark}
          onToggleTheme={toggle}
          online={!error}
        />

        <main className="flex-1 px-7 pb-12 pt-7">
          {renderView(activeNav, serviceList, loading)}
        </main>
      </div>
    </div>
  )
}

function renderView(
  activeNav: string,
  services: ApiService[] | null,
  loading: boolean,
) {
  switch (activeNav) {
    case "services":
      return <ServicesView services={services ?? []} loading={loading} />
    case "overview":
      return <OverviewView />
    default: {
      const item = NAV_ITEMS.find((n) => n.id === activeNav)
      return (
        <PlaceholderView
          label={item?.label ?? activeNav}
          icon={item?.icon ?? NAV_ITEMS[0].icon}
        />
      )
    }
  }
}
