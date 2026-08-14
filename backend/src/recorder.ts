import { appendFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs"
import { join } from "node:path"

import { getSnapshot } from "./metrics"

const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), "data")
const PREFIX = "hist-"
const SAMPLE_MS = 15_000
const RETENTION_DAYS = 30

let lastWarn = 0

function dayKey(ms: number): string {
  // Local-day key (TZ set via compose, default Asia/Shanghai — see docker-compose.yml).
  // readRange() also pulls the previous day's file, so cross-midnight drift is harmless.
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Flatten the live snapshot into the compact history record. */
function toRecord() {
  const s = getSnapshot()
  return {
    t: s.ts,
    cpu: s.cpu?.percent ?? null,
    mem: s.memory?.percent ?? null,
    disk: s.disk?.percent ?? null,
    rx: s.network?.rxBytesPerSec ?? null,
    tx: s.network?.txBytesPerSec ?? null,
    load: s.load?.one ?? null,
    tcp: s.tcpConnections,
    temp: s.temperatureC,
  }
}

function record(): void {
  const line = JSON.stringify(toRecord())
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    appendFileSync(join(DATA_DIR, `${PREFIX}${dayKey(Date.now())}.jsonl`), `${line}\n`)
  } catch {
    // Best-effort: warn at most once a minute and keep serving live metrics.
    if (Date.now() - lastWarn > 60_000) {
      lastWarn = Date.now()
      console.warn("recorder: cannot write history file")
    }
  }
}

function prune(): void {
  try {
    const cutoff = Date.now() - RETENTION_DAYS * 86_400_000
    for (const f of readdirSync(DATA_DIR)) {
      if (!f.startsWith(PREFIX)) continue
      const day = Date.parse(f.slice(PREFIX.length)) // UTC midnight — fine for cutoff
      if (Number.isFinite(day) && day < cutoff) rmSync(join(DATA_DIR, f))
    }
  } catch {
    /* nothing to prune */
  }
}

let started = false

export function startRecorder(): void {
  if (started) return
  started = true
  record()
  setInterval(record, SAMPLE_MS).unref?.()
  prune()
  setInterval(prune, 24 * 3_600_000).unref?.()
}
