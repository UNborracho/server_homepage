export type ServiceStatus = "running" | "stopped" | "error"

export interface ServiceConfig {
  id: string
  name: string
  url: string
  category: string
  iconKey: string
  color: string
  port: number
}

export interface ServiceStatusResult extends ServiceConfig {
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
