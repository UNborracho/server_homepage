import http from "node:http"
import https from "node:https"

import type {
  ServiceConfig,
  ServiceStatus,
  ServiceStatusResult,
} from "./types"

const CACHE_MS = 5000
const TIMEOUT_MS = 3000

interface Cache {
  ts: number
  data: ServiceStatusResult[]
}
let cache: Cache | null = null

function probe(url: string): Promise<{
  status: ServiceStatus
  latencyMs: number | null
}> {
  return new Promise((resolve) => {
    let target: URL
    try {
      target = new URL(url)
    } catch {
      resolve({ status: "error", latencyMs: null })
      return
    }
    const lib = target.protocol === "https:" ? https : http
    const start = Date.now()
    const req = lib.get(
      url,
      { timeout: TIMEOUT_MS, rejectUnauthorized: false },
      (res) => {
        res.destroy()
        resolve({ status: "running", latencyMs: Date.now() - start })
      },
    )
    req.on("error", (err: NodeJS.ErrnoException) => {
      resolve({
        status: err.code === "ECONNREFUSED" ? "stopped" : "error",
        latencyMs: null,
      })
    })
    req.on("timeout", () => {
      req.destroy()
      resolve({ status: "error", latencyMs: null })
    })
  })
}

export async function probeAll(
  services: ServiceConfig[],
): Promise<ServiceStatusResult[]> {
  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.data
  const results = await Promise.all(
    services.map(async (service) => {
      const result = await probe(service.url)
      return {
        ...service,
        status: result.status,
        latencyMs: result.latencyMs,
        checkedAt: Date.now(),
      }
    }),
  )
  cache = { ts: Date.now(), data: results }
  return results
}
