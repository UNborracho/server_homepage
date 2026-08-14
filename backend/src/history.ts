import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type HistoryWindow = "1h" | "6h" | "24h" | "7d"

const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), "data")
const PREFIX = "hist-"
const SAMPLE_SEC = 15 // recorder interval — converts rate samples into totals

const WINDOW_MS: Record<HistoryWindow, number> = {
  "1h": 3_600_000,
  "6h": 21_600_000,
  "24h": 86_400_000,
  "7d": 604_800_000,
}

// Per-window downsample step → ~240–340 buckets for every window.
const STEP_MS: Record<HistoryWindow, number> = {
  "1h": 15_000,
  "6h": 60_000,
  "24h": 300_000,
  "7d": 1_800_000,
}

const KEYS = ["cpu", "mem", "disk", "rx", "tx", "load", "tcp", "temp"] as const
type Key = (typeof KEYS)[number]

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

interface RawPoint extends HistoryPoint {}

function dayKey(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Yields all recorded points with t >= fromMs, oldest first. */
function* readRange(fromMs: number): Generator<RawPoint> {
  let files: string[] = []
  try {
    files = readdirSync(DATA_DIR)
      .filter((f) => f.startsWith(PREFIX))
      .sort()
  } catch {
    return // no data directory yet
  }
  // Include the previous day's file too — day keys are local, parsing is UTC.
  const from = dayKey(fromMs - 86_400_000)
  for (const f of files) {
    if (f.slice(PREFIX.length) < from) continue
    let text: string
    try {
      text = readFileSync(join(DATA_DIR, f), "utf8")
    } catch {
      continue
    }
    for (const line of text.split("\n")) {
      if (!line) continue
      try {
        const p = JSON.parse(line) as RawPoint
        if (typeof p.t === "number" && p.t >= fromMs) yield p
      } catch {
        /* skip corrupt line */
      }
    }
  }
}

/** Downsampled time series for the area chart. */
export function querySeries(window: HistoryWindow) {
  const span = WINDOW_MS[window]
  const step = STEP_MS[window]
  const to = Date.now()
  const from = to - span
  const buckets = Math.ceil(span / step)
  const acc = Array.from({ length: buckets }, () => {
    const a = {} as Record<Key, { s: number; n: number }>
    for (const k of KEYS) a[k] = { s: 0, n: 0 }
    return a
  })

  for (const p of readRange(from)) {
    const i = Math.min(buckets - 1, Math.max(0, Math.floor((p.t - from) / step)))
    const a = acc[i]
    for (const k of KEYS) {
      const v = p[k]
      if (v != null) {
        a[k].s += v
        a[k].n++
      }
    }
  }

  const points = acc.map((a, i) => {
    const point: Record<string, number | null> = { t: from + i * step }
    for (const k of KEYS) point[k] = a[k].n > 0 ? a[k].s / a[k].n : null
    return point as unknown as HistoryPoint
  })

  return { window, stepMs: step, from, to, points }
}

/** Last 7 calendar days: per-day traffic totals + 7×24 hourly heatmap cells. */
export function queryAggregate() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const to = todayStart.getTime() + 86_400_000 // all of today
  const from = to - 7 * 86_400_000

  const weekly = Array.from({ length: 7 }, () => ({
    rx: 0,
    tx: 0,
    rxN: 0,
    txN: 0,
    cpuS: 0,
    cpuN: 0,
  }))
  const heat = Array.from({ length: 7 * 24 }, () => ({ s: 0, n: 0 }))

  for (const p of readRange(from)) {
    const d = new Date(p.t)
    const dayStart = new Date(d)
    dayStart.setHours(0, 0, 0, 0)
    const idx =
      6 - Math.round((todayStart.getTime() - dayStart.getTime()) / 86_400_000)
    if (idx < 0 || idx > 6) continue
    const w = weekly[idx]
    if (p.rx != null) {
      w.rx += p.rx
      w.rxN++
    }
    if (p.tx != null) {
      w.tx += p.tx
      w.txN++
    }
    if (p.cpu != null) {
      w.cpuS += p.cpu
      w.cpuN++
    }
    const cell = heat[idx * 24 + d.getHours()]
    if (p.rx != null || p.tx != null) {
      cell.s += ((p.rx ?? 0) + (p.tx ?? 0)) / 1e6
      cell.n++
    }
  }

  return {
    weekly: weekly.map((w) => ({
      rxGB: (w.rx * SAMPLE_SEC) / 1e9,
      txGB: (w.tx * SAMPLE_SEC) / 1e9,
      cpuAvg: w.cpuN > 0 ? w.cpuS / w.cpuN : null,
    })),
    heatmap: heat.map((h) => (h.n > 0 ? h.s / h.n : null)),
    maxMbps: heat.reduce<number>((m, h) => (h.n > 0 && h.s / h.n > m ? h.s / h.n : m), 0),
  }
}
