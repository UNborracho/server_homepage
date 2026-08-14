export type ServiceStatus = "running" | "stopped" | "error"

export interface ApiService {
  id: string
  name: string
  url: string
  category: string
  iconKey: string
  color: string
  port: number
  container?: string
  status: ServiceStatus
  latencyMs: number | null
  checkedAt: number
  containerState?: string | null
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

export type HistoryWindow = "1h" | "6h" | "24h" | "7d"

export interface HistoryPoint {
  t: number
  cpu: number | null
  mem: number | null
  disk: number | null
  rx: number | null
  tx: number | null
  load: number | null
  tcp: number | null
  temp: number | null
}

export interface HistorySeries {
  window: HistoryWindow
  stepMs: number
  from: number
  to: number
  points: HistoryPoint[]
}

export interface WeeklyStat {
  rxGB: number
  txGB: number
  cpuAvg: number | null
}

export interface HistoryAggregate {
  weekly: WeeklyStat[]
  heatmap: (number | null)[]
  maxMbps: number
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

export async function fetchContainers(): Promise<ContainerInfo[]> {
  const res = await fetch(`${API}/containers`)
  if (!res.ok) throw new Error(`containers ${res.status}`)
  return (await res.json()) as ContainerInfo[]
}

export async function controlContainer(
  name: string,
  action: ContainerAction,
): Promise<void> {
  const res = await fetch(`${API}/containers/${encodeURIComponent(name)}/${action}`, {
    method: "POST",
  })
  if (!res.ok) throw new Error(`control ${res.status}`)
}

export async function fetchHistory(window: HistoryWindow): Promise<HistorySeries> {
  const res = await fetch(`${API}/history?window=${window}`)
  if (!res.ok) throw new Error(`history ${res.status}`)
  return (await res.json()) as HistorySeries
}

export async function fetchHistoryAggregate(): Promise<HistoryAggregate> {
  const res = await fetch(`${API}/history/aggregate`)
  if (!res.ok) throw new Error(`history aggregate ${res.status}`)
  return (await res.json()) as HistoryAggregate
}

export async function fetchContainerLogs(name: string): Promise<string> {
  const res = await fetch(`${API}/containers/${encodeURIComponent(name)}/logs`)
  if (!res.ok) throw new Error(`logs ${res.status}`)
  const body = (await res.json()) as { text: string }
  return body.text
}
