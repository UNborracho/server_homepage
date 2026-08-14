import type { ApiService } from "@/lib/api"

/**
 * Card link target. Derived from the address the dashboard was opened on —
 * services run on the same host, so whatever hostname reached the dashboard
 * (LAN IP, mDNS name, …) also reaches them. `url` overrides for services
 * living on another machine.
 */
export function resolveServiceUrl(svc: ApiService): string {
  if (svc.url) return svc.url
  return `${svc.scheme ?? "http"}://${window.location.hostname}:${svc.port}`
}
