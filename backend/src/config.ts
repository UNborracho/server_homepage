import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import type { ServiceConfig } from "./types"

const HERE = dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH =
  process.env.SERVICES_CONFIG ?? join(HERE, "..", "config", "services.json")

let cached: ServiceConfig[] | null = null

export function readServices(): ServiceConfig[] {
  if (cached) return cached
  const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as {
    services?: ServiceConfig[]
  }
  cached = raw.services ?? []
  return cached
}
