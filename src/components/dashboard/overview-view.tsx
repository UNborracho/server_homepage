import { useEffect, useState } from "react"

import { GaugeBar } from "@/components/dashboard/gauge-bar"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { PageHeader } from "@/components/dashboard/page-header"
import { SectionTitle } from "@/components/dashboard/section-title"
import { StatCard } from "@/components/dashboard/stat-card"
import { DiskDonutChart } from "@/components/dashboard/charts/disk-donut-chart"
import { NetworkAreaChart } from "@/components/dashboard/charts/network-area-chart"
import { TrafficHeatmap } from "@/components/dashboard/charts/traffic-heatmap"
import { WeeklyBarChart } from "@/components/dashboard/charts/weekly-bar-chart"
import { GAUGE_DEFS, STAT_DEFS, type GaugeKey, type StatKey } from "@/lib/data"
import {
  fetchHistory,
  fetchHistoryAggregate,
  fetchHost,
  type HistoryAggregate,
  type HistorySeries,
  type HistoryWindow,
  type HostMetrics,
} from "@/lib/api"
import { usePoll } from "@/lib/use-poll"
import { formatDuration, formatNumber } from "@/lib/format"

export function OverviewView() {
  const { data: host } = usePoll<HostMetrics>(fetchHost, 5000)

  // History charts: Prometheus-free, fed by the backend recorder.
  const [win, setWin] = useState<HistoryWindow>("24h")
  const {
    data: hist,
    loading: histLoading,
    refetch: refetchHist,
  } = usePoll<HistorySeries>(() => fetchHistory(win), 60_000)
  const { data: agg } = usePoll<HistoryAggregate>(fetchHistoryAggregate, 60_000)

  useEffect(() => {
    refetchHist() // window switch → immediate refetch
  }, [win, refetchHist])

  const kpis = [
    {
      label: "Network I/O",
      value: host?.network
        ? ((host.network.rxBytesPerSec + host.network.txBytesPerSec) / 1e6).toFixed(1)
        : "—",
      unit: "MB/s",
    },
    {
      label: "CPU",
      value: host?.cpu ? host.cpu.percent.toFixed(1) : "—",
      unit: "%",
    },
    {
      label: "Memory",
      value: host?.memory ? host.memory.percent.toFixed(0) : "—",
      unit: "%",
    },
    {
      label: "Uptime",
      value: host?.uptimeSeconds ? formatDuration(host.uptimeSeconds) : "—",
      unit: "",
    },
  ]

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="homeserver · 192.168.0.118 · Ubuntu 26.04 LTS"
      />

      {/* KPI row */}
      <div className="mb-7 flex flex-wrap gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Storage + history placeholder */}
      <div className="mb-8">
        <SectionTitle>Metrics</SectionTitle>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_2fr]">
          <div className="glass-card flex flex-col px-[22px] pb-3 pt-[22px]">
            <div className="mb-3.5">
              <div className="mb-0.5 text-sm font-semibold text-ink">Disk Usage</div>
              <div className="mono text-[11px] text-ink-faint">root filesystem</div>
            </div>
            <DiskDonutChart
              used={host?.disk?.used ?? 0}
              total={host?.disk?.total ?? 0}
            />
          </div>
          <NetworkAreaChart
            points={hist?.points ?? []}
            window={win}
            onWindow={setWin}
            loading={histLoading}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <WeeklyBarChart weekly={agg?.weekly ?? []} />
          <TrafficHeatmap heatmap={agg?.heatmap ?? []} maxMbps={agg?.maxMbps ?? 0} />
        </div>
      </div>

      {/* System monitor */}
      <div>
        <SectionTitle>System Monitor</SectionTitle>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {GAUGE_DEFS.map((def) => (
            <GaugeBar
              key={def.key}
              label={def.label}
              color={def.color}
              icon={def.icon}
              {...gaugeFor(host, def.key)}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STAT_DEFS.map((def) => (
            <StatCard
              key={def.key}
              label={def.label}
              color={def.color}
              {...statFor(host, def.key)}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function gaugeFor(host: HostMetrics | null, key: GaugeKey) {
  switch (key) {
    case "cpu":
      return {
        value: host?.cpu ? host.cpu.percent.toFixed(1) : "—",
        unit: "%",
        max: "100",
        percent: host?.cpu?.percent ?? 0,
      }
    case "memory": {
      const m = host?.memory
      return {
        value: m ? (m.used / 1e9).toFixed(1) : "—",
        unit: " GB",
        max: m ? (m.total / 1e9).toFixed(0) : "—",
        percent: m?.percent ?? 0,
      }
    }
    case "disk": {
      const d = host?.disk
      return {
        value: d ? (d.used / 1e9).toFixed(0) : "—",
        unit: " GB",
        max: d ? (d.total / 1e9).toFixed(0) : "—",
        percent: d?.percent ?? 0,
      }
    }
    case "network": {
      const n = host?.network
      const mbps = n ? (n.rxBytesPerSec + n.txBytesPerSec) / 1e6 : 0
      return {
        value: n ? mbps.toFixed(1) : "—",
        unit: " MB/s",
        max: "125",
        percent: Math.min(100, (mbps / 125) * 100),
      }
    }
  }
}

function statFor(host: HostMetrics | null, key: StatKey) {
  switch (key) {
    case "load":
      return {
        value: host?.load ? host.load.one.toFixed(2) : "—",
        sub: host?.load
          ? `${host.load.one} / ${host.load.five} / ${host.load.fifteen} (1/5/15m)`
          : "1m / 5m / 15m",
      }
    case "processes":
      return {
        value: formatNumber(host?.processes),
        sub: "running",
      }
    case "connections":
      return {
        value: formatNumber(host?.tcpConnections),
        sub: "TCP active",
      }
    case "temperature":
      return {
        value:
          host?.temperatureC != null ? `${host.temperatureC.toFixed(0)}°C` : "—",
        sub: "hottest zone",
      }
  }
}
