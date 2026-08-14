import { PageHeader } from "@/components/dashboard/page-header"
import { ServiceCard } from "@/components/dashboard/service-card"
import type { ApiService } from "@/lib/api"

export function ServicesView({
  services,
  loading,
  onControl,
}: {
  services: ApiService[]
  loading: boolean
  onControl?: () => void
}) {
  const running = services.filter((s) => s.status === "running").length
  const stopped = services.filter((s) => s.status === "stopped").length
  const error = services.filter((s) => s.status === "error").length
  const showSkeleton = loading && services.length === 0

  return (
    <>
      <PageHeader
        title="Services"
        subtitle={
          showSkeleton
            ? "loading…"
            : `${services.length} services · ${running} running · ${stopped} stopped · ${error} error`
        }
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {showSkeleton
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : services.map((service) => (
              <ServiceCard key={service.id} service={service} onControl={onControl} />
            ))}
      </div>
    </>
  )
}

function SkeletonCard() {
  return (
    <div className="glass-card svc-card p-5">
      <div className="mb-3.5 flex items-start justify-between">
        <div className="size-[42px] animate-pulse rounded-xl bg-ink/10" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-ink/10" />
      </div>
      <div className="mb-4">
        <div className="mb-2 h-4 w-2/3 animate-pulse rounded bg-ink/10" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-ink/10" />
      </div>
      <div className="h-3 w-1/3 animate-pulse rounded bg-ink/10" />
    </div>
  )
}
