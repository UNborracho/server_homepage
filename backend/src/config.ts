import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import type { ServiceConfig } from "./types"

const HERE = dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH =
  process.env.SERVICES_CONFIG ?? join(HERE, "..", "config", "services.json")

/**
 * Services listen on the *host* — from inside the container the host is reached
 * via host.docker.internal (compose maps it to host-gateway). On a dev machine
 * (backend outside Docker) override with PROBE_HOST=127.0.0.1.
 */
const PROBE_HOST = process.env.PROBE_HOST ?? "host.docker.internal"

/** Read on every call — services.json is a per-server volume mount; edits apply live. */
export function readServices(): ServiceConfig[] {
  const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as {
    services?: ServiceConfig[]
  }
  return raw.services ?? []
}

/** Where the backend probes; the browser link is derived client-side instead. */
export function probeUrl(svc: ServiceConfig): string {
  if (svc.url) return svc.url
  return `${svc.scheme ?? "http"}://${PROBE_HOST}:${svc.port}`
}
