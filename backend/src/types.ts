export type ServiceStatus = "running" | "stopped" | "error"

export interface ServiceConfig {
  id: string
  name: string
  url: string
  category: string
  iconKey: string
  color: string
  port: number
  /** Docker container name (for start/stop control). Optional. */
  container?: string
}

export interface ServiceStatusResult extends ServiceConfig {
  status: ServiceStatus
  latencyMs: number | null
  checkedAt: number
  /** Docker container state if a container is mapped, e.g. "running" / "exited". */
  containerState?: string | null
}

export interface ContainerInfo {
  id: string
  name: string
  image: string
  state: string
  status: string
  ports: string[]
  cpuPercent: number | null
  memUsage: number | null
  memPercent: number | null
}

export type ContainerAction = "start" | "stop" | "restart"

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
