import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light'
type ServiceStatus = 'running' | 'stopped' | 'error'

interface Service {
  id: string
  name: string
  category: string
  status: ServiceStatus
  port: number
  uptime: string
  cpu: number
  icon: string
  color: string
}

// ── Data ───────────────────────────────────────────────────────────────────────

const SERVICES: Service[] = [
  { id: 'portainer', name: 'Portainer',   category: 'Infra',    status: 'running', port: 9000, uptime: '14d 6h',  cpu: 0.4, icon: '🐋', color: '#00E5FF' },
  { id: 'grafana',   name: 'Grafana',     category: 'Monitor',  status: 'running', port: 3000, uptime: '14d 6h',  cpu: 2.1, icon: '📊', color: '#A855F7' },
  { id: 'jenkins',   name: 'Jenkins',     category: 'CI/CD',    status: 'running', port: 8080, uptime: '9d 2h',   cpu: 8.7, icon: '⚙️', color: '#F59E0B' },
  { id: 'minio',     name: 'MinIO',       category: 'Storage',  status: 'running', port: 9001, uptime: '14d 6h',  cpu: 1.2, icon: '🗄️', color: '#22C55E' },
  { id: 'postgres',  name: 'PostgreSQL',  category: 'Database', status: 'running', port: 5432, uptime: '42d 11h', cpu: 3.5, icon: '🐘', color: '#3B82F6' },
  { id: 'redis',     name: 'Redis',       category: 'Cache',    status: 'stopped', port: 6379, uptime: '—',       cpu: 0,   icon: '⚡', color: '#EF4444' },
  { id: 'nginx',     name: 'Nginx',       category: 'Proxy',    status: 'running', port: 80,   uptime: '42d 11h', cpu: 0.6, icon: '🌐', color: '#00E5FF' },
  { id: 'prometheus',name: 'Prometheus',  category: 'Monitor',  status: 'error',   port: 9090, uptime: '—',       cpu: 0,   icon: '🔥', color: '#F97316' },
]

const NAV_CATEGORIES = [
  { label: 'Overview',   icon: '◉', id: 'overview' },
  { label: 'Services',   icon: '▦',  id: 'services' },
  { label: 'Monitoring', icon: '📈', id: 'monitoring' },
  { label: 'Storage',    icon: '💾', id: 'storage' },
  { label: 'Network',    icon: '🌐', id: 'network' },
  { label: 'Logs',       icon: '📋', id: 'logs' },
  { label: 'Settings',   icon: '⚙️', id: 'settings' },
]

// Generate time-series data
function makeSeries(base: number, variance: number, points = 24) {
  return Array.from({ length: points }, (_, i) => ({
    t: `${String(i).padStart(2, '0')}:00`,
    v: Math.max(0, base + (Math.random() - 0.5) * variance * 2),
  }))
}

const networkData   = makeSeries(420, 180)
const cpuData       = makeSeries(38, 22)
const requestData   = makeSeries(1200, 600)

const barData = [
  { name: 'Mon', req: 8400, err: 120 },
  { name: 'Tue', req: 9200, err: 80 },
  { name: 'Wed', req: 7800, err: 210 },
  { name: 'Thu', req: 10500, err: 65 },
  { name: 'Fri', req: 11200, err: 90 },
  { name: 'Sat', req: 6300, err: 40 },
  { name: 'Sun', req: 5800, err: 30 },
]

const donutData = [
  { name: 'System',  value: 28 },
  { name: 'Apps',    value: 45 },
  { name: 'Docker',  value: 18 },
  { name: 'Free',    value: 9 },
]

// Heatmap: 7 days × 24 hours
const heatmapData = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => ({
    day: d, hour: h,
    value: Math.round(Math.random() * 100),
  }))
).flat()

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = [0, 4, 8, 12, 16, 20, 23]

// ── Sub-components ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ServiceStatus }) {
  const cfg = {
    running: { label: 'Running', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    stopped: { label: 'Stopped', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
    error:   { label: 'Error',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  }[status]

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      fontFamily: 'JetBrains Mono, monospace',
      background: cfg.bg, color: cfg.color,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: cfg.color, display: 'inline-block',
        animation: status === 'running' ? 'pulse-dot 2s ease-in-out infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  )
}

function ServiceCard({ svc, theme }: { svc: Service; theme: Theme }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="glass-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px 22px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered
          ? `var(--glass-shadow), 0 0 30px ${svc.color}20`
          : 'var(--glass-shadow)',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `${svc.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, border: `1px solid ${svc.color}30`,
        }}>
          {svc.icon}
        </div>
        <StatusBadge status={svc.status} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{svc.name}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 16 }}>
        :{svc.port} · {svc.category}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {svc.status === 'running' ? `↑ ${svc.uptime}` : 'Offline'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {svc.status === 'running' && (
            <button style={{
              padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              background: 'rgba(0,229,255,0.1)', color: 'var(--accent-cyan)',
              border: '1px solid rgba(0,229,255,0.2)',
              transition: 'background 0.15s',
            }}>
              Open
            </button>
          )}
          <button style={{
            padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: 'pointer',
            background: svc.status === 'running' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            color: svc.status === 'running' ? '#EF4444' : '#22C55E',
            border: `1px solid ${svc.status === 'running' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
            transition: 'background 0.15s',
          }}>
            {svc.status === 'running' ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Mini sparkline SVG
function Sparkline({ data, color, up }: { data: number[]; color: string; up: boolean }) {
  const w = 72, h = 28
  const min = Math.min(...data), max = Math.max(...data)
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / (max - min + 0.001)) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        points={pts} fill="none"
        stroke={color} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  )
}

function KPICard({
  label, value, unit, delta, deltaUp, color, sparkData,
}: {
  label: string; value: string; unit: string;
  delta: string; deltaUp: boolean; color: string; sparkData: number[];
}) {
  return (
    <div className="glass-card" style={{ padding: '22px 24px', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <Sparkline data={sparkData} color={color} up={deltaUp} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{
          fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em',
          color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace',
          lineHeight: 1,
        }}>
          {value}
        </span>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{unit}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: deltaUp ? '#22C55E' : '#EF4444',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {deltaUp ? '▲' : '▼'} {delta}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>vs last 24h</span>
      </div>
    </div>
  )
}

// Custom tooltip for Recharts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '9px 13px', fontSize: 12,
      backdropFilter: 'blur(12px)', color: 'rgba(255,255,255,0.85)',
    }}>
      <div style={{ marginBottom: 5, color: 'rgba(255,255,255,0.45)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{p.name ?? p.dataKey}:</span>
          <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'var(--text-secondary)', marginBottom: 18,
    }}>
      {children}
    </h2>
  )
}

// Heatmap
function HeatmapChart({ theme }: { theme: Theme }) {
  const maxVal = 100
  const getColor = (v: number) => {
    const t = v / maxVal
    if (theme === 'dark') {
      if (t < 0.2) return 'rgba(0,229,255,0.06)'
      if (t < 0.4) return `rgba(0,229,255,${0.15 + t * 0.3})`
      if (t < 0.7) return `rgba(168,85,247,${0.3 + t * 0.3})`
      return `rgba(168,85,247,${0.5 + t * 0.45})`
    } else {
      if (t < 0.2) return 'rgba(8,145,178,0.08)'
      if (t < 0.5) return `rgba(8,145,178,${0.15 + t * 0.4})`
      return `rgba(124,58,237,${0.2 + t * 0.5})`
    }
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(24, 1fr)`, gap: 3, minWidth: 520 }}>
        {/* Header hours */}
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{
            textAlign: 'center', fontSize: 9, color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            display: HOURS.includes(h) ? 'block' : 'none',
          }}>
            {String(h).padStart(2, '0')}
          </div>
        ))}
        {/* Spacer row for hidden hour cells */}
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{ fontSize: 9, color: 'transparent', pointerEvents: 'none' }}>.</div>
        ))}

        {/* Data rows */}
        {DAYS.map((day, d) => (
          <React.Fragment key={day}>
            <div style={{
              fontSize: 10, color: 'var(--text-muted)', display: 'flex',
              alignItems: 'center', fontFamily: 'JetBrains Mono, monospace',
            }}>
              {day}
            </div>
            {Array.from({ length: 24 }, (_, h) => {
              const cell = heatmapData.find(c => c.day === d && c.hour === h)
              return (
                <div
                  key={`${d}-${h}`}
                  title={`${day} ${String(h).padStart(2,'0')}:00 — ${cell?.value ?? 0} req/s`}
                  style={{
                    height: 16, borderRadius: 3,
                    background: getColor(cell?.value ?? 0),
                    transition: 'opacity 0.15s',
                    cursor: 'default',
                  }}
                />
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// System monitor gauge bar
function GaugeBar({ label, value, unit, max, color, icon }: {
  label: string; value: number; unit: string; max: number; color: string; icon: string;
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="glass-card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        <span style={{
          fontSize: 22, fontWeight: 700, color: 'var(--text-primary)',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em',
        }}>
          {value}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 2 }}>{unit}</span>
        </span>
      </div>
      <div style={{
        height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: 'width 0.6s ease',
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>0</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {pct.toFixed(0)}%
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{max}{unit}</span>
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────────

const DONUT_COLORS = ['#00E5FF', '#A855F7', '#22C55E', 'rgba(255,255,255,0.1)']

export default function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [activeNav, setActiveNav] = useState('overview')
  const [search, setSearch] = useState('')

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    document.body.style.background = theme === 'dark' ? '#08080E' : '#F0F2F8'
  }, [theme])

  // Apply dark as default on mount
  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.body.style.background = '#08080E'
  }, [])

  const runningCount = SERVICES.filter(s => s.status === 'running').length
  const errorCount   = SERVICES.filter(s => s.status === 'error').length

  const sparkNet  = networkData.map(d => d.v)
  const sparkCpu  = cpuData.map(d => d.v)
  const sparkReq  = requestData.map(d => d.v)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #00E5FF, #A855F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, boxShadow: '0 0 16px rgba(0,229,255,0.3)',
            }}>
              ◈
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                HomeBase
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                v2.4.1
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--text-muted)', padding: '0 6px', marginBottom: 8 }}>
            Navigation
          </div>
          {NAV_CATEGORIES.map(item => (
            <div
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}

          {/* Service categories */}
          <div style={{ marginTop: 20, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 6px', marginBottom: 8 }}>
            Services
          </div>
          {['Infra', 'Monitor', 'CI/CD', 'Storage', 'Database', 'Cache', 'Proxy'].map(cat => {
            const svcs = SERVICES.filter(s => s.category === cat)
            const hasError = svcs.some(s => s.status === 'error')
            const hasStop = svcs.some(s => s.status === 'stopped')
            return (
              <div key={cat} className="nav-item" style={{ justifyContent: 'space-between' }}>
                <span>{cat}</span>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                  background: hasError ? '#EF4444' : hasStop ? '#6B7280' : '#22C55E',
                }} />
              </div>
            )
          })}
        </nav>

        {/* User / system status footer */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12,
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #A855F7, #00E5FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>
              AD
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                admin
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                root@homeserver
              </div>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E',
              boxShadow: '0 0 6px #22C55E', flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      {/* ── Main layout ── */}
      <div className="layout">

        {/* ── Top bar ── */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 28px' }}>
            {/* Search */}
            <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none',
              }}>⌕</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search services, logs, metrics…"
                style={{
                  width: '100%', padding: '9px 14px 9px 34px',
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  borderRadius: 10, color: 'var(--text-primary)', fontSize: 13,
                  outline: 'none', fontFamily: 'Inter, sans-serif',
                  backdropFilter: 'blur(10px)',
                }}
              />
            </div>

            {/* Global status indicators */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 99,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E',
                  display: 'inline-block', boxShadow: '0 0 6px #22C55E' }} className="pulse" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#22C55E', fontFamily: 'JetBrains Mono, monospace' }}>
                  {runningCount} up
                </span>
              </div>
              {errorCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 99,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#EF4444', fontFamily: 'JetBrains Mono, monospace' }}>
                    {errorCount} err
                  </span>
                </div>
              )}
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Theme switcher */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              style={{
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)', fontSize: 14,
                transition: 'all 0.15s',
              }}
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
        </header>

        {/* ── Main content ── */}
        <main style={{ padding: '28px 28px 48px', flex: 1 }}>

          {/* Page heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em',
              color: 'var(--text-primary)', marginBottom: 4,
            }}>
              Overview
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              homeserver · 192.168.1.10 · Ubuntu 24.04 LTS
            </p>
          </div>

          {/* ── 1. KPI Row ── */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <KPICard label="Network I/O" value="432" unit="MB/s" delta="+12.4%" deltaUp={true}  color="#00E5FF" sparkData={sparkNet} />
            <KPICard label="CPU Usage"   value="38"  unit="%" delta="-3.1%" deltaUp={false} color="#A855F7" sparkData={sparkCpu} />
            <KPICard label="Requests"    value="1.2" unit="k/s" delta="+8.7%" deltaUp={true}  color="#22C55E" sparkData={sparkReq} />
            <KPICard label="Uptime"      value="99.7" unit="%" delta="+0.1%" deltaUp={true}  color="#F59E0B"
              sparkData={Array.from({length:24}, () => 98 + Math.random() * 2)} />
          </div>

          {/* ── 2. Service Grid ── */}
          <div style={{ marginBottom: 32 }}>
            <SectionTitle>Services</SectionTitle>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}>
              {SERVICES.map(svc => (
                <ServiceCard key={svc.id} svc={svc} theme={theme} />
              ))}
            </div>
          </div>

          {/* ── 3. Charts area ── */}
          <div style={{ marginBottom: 32 }}>
            <SectionTitle>Metrics</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

              {/* Area chart — Network I/O */}
              <div className="glass-card" style={{ padding: '22px 22px 12px' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Network I/O</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>MB/s · Last 24h</div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={networkData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono' }}
                      axisLine={false} tickLine={false} interval={5} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono' }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="v" name="Net I/O" stroke="#00E5FF" strokeWidth={2}
                      fill="url(#cyanGrad)" dot={false} activeDot={{ r: 4, fill: '#00E5FF', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Donut chart — Disk usage */}
              <div className="glass-card" style={{ padding: '22px 22px 12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Disk Allocation</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>1.8 TB total</div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: 160, height: 160 }}>
                    <PieChart width={160} height={160}>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={72}
                        dataKey="value" strokeWidth={0} paddingAngle={2}>
                        {donutData.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                    }}>
                      <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>91%</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>used</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 10 }}>
                  {donutData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: DONUT_COLORS[i], display: 'inline-block' }} />
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar chart + heatmap row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Bar chart — Weekly requests */}
              <div className="glass-card" style={{ padding: '22px 22px 12px' }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Weekly Requests</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Requests vs Errors</div>
                </div>
                <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                  {[{ label: 'Requests', color: '#A855F7' }, { label: 'Errors', color: '#EF4444' }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono' }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="req" name="Requests" fill="#A855F7" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                    <Bar dataKey="err" name="Errors" fill="#EF4444" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Heatmap — Traffic */}
              <div className="glass-card" style={{ padding: '22px 22px 14px' }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Traffic Heatmap</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Requests/s by hour</div>
                </div>
                <HeatmapChart theme={theme} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Low</span>
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map(t => (
                    <div key={t} style={{
                      width: 14, height: 10, borderRadius: 2,
                      background: `rgba(0,229,255,${0.06 + t * 0.6})`,
                    }} />
                  ))}
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>High</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. System Monitor ── */}
          <div>
            <SectionTitle>System Monitor</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              <GaugeBar label="CPU" value={38} unit="%" max={100} color="#00E5FF" icon="⚡" />
              <GaugeBar label="Memory" value={11.2} unit=" GB" max={32} color="#A855F7" icon="🧠" />
              <GaugeBar label="Disk" value={1640} unit=" GB" max={1800} color="#22C55E" icon="💾" />
              <GaugeBar label="Network" value={432} unit=" MB/s" max={1000} color="#F59E0B" icon="🌐" />
            </div>

            {/* Extra system stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16 }}>
              {[
                { label: 'Load Avg',     value: '1.24',   sub: '1m / 5m / 15m',  color: '#00E5FF' },
                { label: 'Processes',    value: '247',    sub: 'running',         color: '#A855F7' },
                { label: 'Connections',  value: '1,834',  sub: 'TCP active',      color: '#22C55E' },
                { label: 'Temperature',  value: '54°C',   sub: 'avg across cores',color: '#F59E0B' },
              ].map(stat => (
                <div key={stat.label} className="glass-card-sm" style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase',
                    letterSpacing: '0.06em', fontWeight: 600 }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em',
                    fontFamily: 'JetBrains Mono, monospace', color: stat.color, marginBottom: 4,
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
