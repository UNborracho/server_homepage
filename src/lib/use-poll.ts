import { useEffect, useRef, useState } from "react"

interface PollState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

/**
 * Polls `fetcher` immediately, then every `intervalMs`. On error the last
 * successful value is retained (stale) alongside the error flag so the UI can
 * keep showing data while a reconnect is attempted.
 */
export function usePoll<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
): PollState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const run = async () => {
      try {
        const value = await fetcherRef.current()
        if (alive) {
          setData(value)
          setError(null)
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        if (alive) timer = setTimeout(run, intervalMs)
      }
    }

    run()
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [intervalMs])

  return { data, error, loading: data === null && error === null }
}
