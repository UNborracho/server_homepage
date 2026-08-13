export type ServiceStatus = "running" | "stopped" | "error"

export interface ApiService {
  id: string
  name: string
  url: string
  category: string
  iconKey: string
  color: string
  port: number
  status: ServiceStatus
  latencyMs: number | null
  checkedAt: number
}

export interface HostMetrics {
  ts: number
  cpu: { percent: number } | null
  memory: { used: number; total: number; percent: number } | null
  disk: { used: number; total: number; percent: number } | null
  network: { rxBytesPerSec: number; txBytesPerSec: number } | null
  load: { one: number; five: number; fifteen: number } | null
  processes: number | null
  tcpConnections: number | null
  temperatureC: number | null
  uptimeSeconds: number | null
}

const API = "/api"

export async function fetchHost(): Promise<HostMetrics> {
  const res = await fetch(`${API}/host`)
  if (!res.ok) throw new Error(`host ${res.status}`)
  return (await res.json()) as HostMetrics
}

export async function fetchServices(): Promise<ApiService[]> {
  const res = await fetch(`${API}/services`)
  if (!res.ok) throw new Error(`services ${res.status}`)
  return (await res.json()) as ApiService[]
}
