import { readdirSync, readFileSync, statfsSync } from "node:fs"
import { join } from "node:path"

import type { HostMetrics } from "./types"

const PROC = process.env.HOST_PROC ?? "/proc"
const SYS = process.env.HOST_SYS ?? "/sys"
const FS_ROOT = process.env.HOST_FS ?? "/"

interface CpuSample {
  idle: number
  total: number
}
interface NetSample {
  rx: number
  tx: number
}

let prevCpu: CpuSample | null = null
let prevNet: NetSample | null = null
let lastTick = Date.now()
let snapshot: HostMetrics = empty()

function empty(): HostMetrics {
  return {
    ts: Date.now(),
    cpu: null,
    memory: null,
    disk: null,
    network: null,
    load: null,
    processes: null,
    tcpConnections: null,
    temperatureC: null,
    uptimeSeconds: null,
  }
}

function tryRead(file: string): string | null {
  try {
    return readFileSync(file, "utf8")
  } catch {
    return null
  }
}

function readCpu(): CpuSample | null {
  const data = tryRead(join(PROC, "stat"))
  if (!data) return null
  const first = data.split("\n")[0] ?? ""
  const parts = first.split(/\s+/).slice(1).map(Number)
  if (parts.length < 4) return null
  const idle = (parts[3] ?? 0) + (parts[4] ?? 0)
  const total = parts.reduce((a, b) => a + (b || 0), 0)
  return { idle, total }
}

function readNet(): NetSample | null {
  const data = tryRead(join(PROC, "net", "dev"))
  if (!data) return null
  let rx = 0
  let tx = 0
  for (const line of data.split("\n").slice(2)) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 10) continue
    const iface = parts[0].replace(":", "")
    if (iface === "lo") continue
    rx += Number(parts[1]) || 0
    tx += Number(parts[9]) || 0
  }
  return { rx, tx }
}

function readMem() {
  const data = tryRead(join(PROC, "meminfo"))
  if (!data) return null
  const pick = (key: string): number | null => {
    const m = new RegExp(`^${key}:\\s+(\\d+)`, "m").exec(data)
    return m ? Number(m[1]) * 1024 : null
  }
  const total = pick("MemTotal")
  const avail = pick("MemAvailable")
  if (total == null || avail == null) return null
  const used = total - avail
  return { total, used, percent: total > 0 ? (used / total) * 100 : 0 }
}

function readDisk() {
  try {
    const s = statfsSync(FS_ROOT)
    const total = Number(s.blocks) * Number(s.bsize)
    const free = Number(s.bfree) * Number(s.bsize)
    const used = total - free
    return { total, used, percent: total > 0 ? (used / total) * 100 : 0 }
  } catch {
    return null
  }
}

function readLoad() {
  const data = tryRead(join(PROC, "loadavg"))
  if (!data) return null
  const p = data.split(/\s+/)
  return { one: Number(p[0]), five: Number(p[1]), fifteen: Number(p[2]) }
}

function readProcesses(): number | null {
  try {
    return readdirSync(PROC).filter((n) => /^\d+$/.test(n)).length
  } catch {
    return null
  }
}

function readTcp(): number | null {
  let count = 0
  let saw = false
  for (const name of ["tcp", "tcp6"]) {
    const data = tryRead(join(PROC, "net", name))
    if (!data) continue
    saw = true
    for (const line of data.split("\n").slice(1)) {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 4 && parts[3] === "01") count++
    }
  }
  return saw ? count : null
}

function readTemp(): number | null {
  try {
    const zones = readdirSync(join(SYS, "class", "thermal")).filter((n) =>
      n.startsWith("thermal_zone"),
    )
    let max: number | null = null
    for (const zone of zones) {
      const raw = tryRead(join(SYS, "class", "thermal", zone, "temp"))
      if (!raw) continue
      const c = Number(raw.trim()) / 1000
      if (Number.isFinite(c)) max = max == null ? c : Math.max(max, c)
    }
    return max
  } catch {
    return null
  }
}

function readUptime(): number | null {
  const data = tryRead(join(PROC, "uptime"))
  if (!data) return null
  return Number(data.split(/\s+/)[0])
}

function tick(): void {
  const now = Date.now()
  const dt = (now - lastTick) / 1000
  lastTick = now

  const cpu = readCpu()
  let cpuPercent: number | null = null
  if (cpu && prevCpu) {
    const dTotal = cpu.total - prevCpu.total
    const dIdle = cpu.idle - prevCpu.idle
    if (dTotal > 0) cpuPercent = (1 - dIdle / dTotal) * 100
  }
  prevCpu = cpu

  const net = readNet()
  let netRate: HostMetrics["network"] = null
  if (net && prevNet && dt > 0) {
    netRate = {
      rxBytesPerSec: Math.max(0, (net.rx - prevNet.rx) / dt),
      txBytesPerSec: Math.max(0, (net.tx - prevNet.tx) / dt),
    }
  }
  prevNet = net

  snapshot = {
    ts: now,
    cpu: cpuPercent != null ? { percent: cpuPercent } : null,
    memory: readMem(),
    disk: readDisk(),
    network: netRate,
    load: readLoad(),
    processes: readProcesses(),
    tcpConnections: readTcp(),
    temperatureC: readTemp(),
    uptimeSeconds: readUptime(),
  }
}

let started = false

export function startSampler(): void {
  if (started) return
  started = true
  prevCpu = readCpu()
  prevNet = readNet()
  lastTick = Date.now()
  tick()
  setInterval(tick, 1000).unref?.()
}

export function getSnapshot(): HostMetrics {
  if (!started) startSampler()
  return snapshot
}
