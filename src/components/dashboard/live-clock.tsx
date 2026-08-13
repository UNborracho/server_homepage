import { useEffect, useState } from "react"

export function LiveClock() {
  const [time, setTime] = useState(() => format())

  useEffect(() => {
    const id = setInterval(() => setTime(format()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="mono text-xs text-ink-faint">{time}</span>
  )
}

function format(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
