import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Wifi, WifiOff } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Crosswind, HardwareFrame, VehicleType } from '../lib/simulation'

const TrafficScene = lazy(() => import('./TrafficScene'))
type PassEvent = { type: VehicleType; energyWh: number; ts: Date }
type SceneTelemetry = {
  airflow: number
  rpm: number
  voltage: number
  currentMa: number
  powerW: number
  passes: number
  energyWh: number
}

const VEHICLE_TYPES: { k: VehicleType; label: string }[] = [
  { k: 'car', label: 'CAR' },
  { k: 'suv', label: 'SUV' },
  { k: 'bus', label: 'BUS' },
  { k: 'truck', label: 'TRUCK' },
]
const DENSITIES = [
  { k: 'low', label: 'LOW' },
  { k: 'medium', label: 'MEDIUM' },
  { k: 'high', label: 'HIGH' },
] as const
const CROSSWINDS = ['LOW', 'MEDIUM', 'HIGH'] as const

const EMPTY_TEL: SceneTelemetry = {
  airflow: 0,
  rpm: 0,
  voltage: 0,
  currentMa: 0,
  powerW: 0,
  passes: 0,
  energyWh: 0,
}

function statusLine(tel: SceneTelemetry): { text: string; tone: 'idle' | 'warn' | 'live' } {
  if (tel.rpm === 0 && tel.airflow < 0.05)
    return { text: 'WAITING FOR AIRFLOW EVENT…', tone: 'idle' }
  if (tel.rpm === 0) return { text: 'TURBINE IDLE — below cut-in', tone: 'warn' }
  if (tel.airflow < 1.2) return { text: 'BELOW OPTIMAL OPERATING RANGE', tone: 'warn' }
  return { text: 'ENERGY HARVESTING', tone: 'live' }
}

export default function LiveDemo() {
  const [speedKmh, setSpeedKmh] = useState(80)
  const [vehicleType, setVehicleType] = useState<VehicleType>('car')
  const [guideOn, setGuideOn] = useState(true)
  const [crosswind, setCrosswind] = useState<Crosswind>('low')
  const [density, setDensity] = useState<'low' | 'medium' | 'high'>('medium')

  const [tel, setTel] = useState<SceneTelemetry>(EMPTY_TEL)
  const telRef = useRef<SceneTelemetry>(EMPTY_TEL)
  const [events, setEvents] = useState<PassEvent[]>([])
  const [hist, setHist] = useState<{ t: number; p: number }[]>([])

  // wow moment state
  const [burst, setBurst] = useState<{ key: number; n: number }>()
  const burstTarget = useRef<number | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  // hardware mode
  const [mode, setMode] = useState<'simulation' | 'hardware'>('simulation')
  const [wsUrl, setWsUrl] = useState('ws://192.168.4.1:81/')
  const [hwStatus, setHwStatus] = useState<'offline' | 'connecting' | 'online'>('offline')
  const [hwFrame, setHwFrame] = useState<HardwareFrame | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const onFrame = (t: SceneTelemetry) => {
    telRef.current = t
    setTel(t)
  }

  const onPass = (e: PassEvent) => {
    setEvents((prev) => [{ ...e }, ...prev].slice(0, 8))
    setHist((h) => [...h.slice(-119), { t: Date.now(), p: telRef.current.powerW }])
    if (burstTarget.current !== null && telRef.current.passes >= burstTarget.current) {
      burstTarget.current = null
      setShowBanner(true)
      window.setTimeout(() => setShowBanner(false), 4200)
    }
  }

  useEffect(() => {
    const iv = window.setInterval(() => {
      setHist((h) => [...h.slice(-119), { t: Date.now(), p: telRef.current.powerW }])
    }, 250)
    return () => window.clearInterval(iv)
  }, [])

  const sendTraffic = () => {
    const key = Date.now()
    burstTarget.current = tel.passes + 8
    setShowBanner(false)
    setBurst({ key, n: 8 })
  }

  const connectHardware = () => {
    try {
      wsRef.current?.close()
    } catch {
      /* ignore */
    }
    setHwStatus('connecting')
    let ws: WebSocket
    try {
      ws = new WebSocket(wsUrl)
    } catch {
      setHwStatus('offline')
      return
    }
    wsRef.current = ws
    ws.onopen = () => setHwStatus('online')
    ws.onmessage = (msg) => {
      try {
        const f = JSON.parse(String(msg.data)) as HardwareFrame
        if (typeof f.rpm === 'number' && typeof f.voltage === 'number') setHwFrame(f)
      } catch {
        /* ignore malformed frames */
      }
    }
    ws.onerror = () => setHwStatus('offline')
    ws.onclose = () => setHwStatus((s) => (s === 'online' ? 'offline' : s))
  }

  useEffect(() => () => wsRef.current?.close(), [])

  const st = statusLine(mode === 'hardware' ? hwTelAdapter(hwFrame) : tel)
  const chartData = hist.map((d, i) => ({ i, p: d.p }))
  const live =
    mode === 'hardware'
      ? hwFrame
        ? {
            airflow: hwFrame.airflow ?? 0,
            rpm: hwFrame.rpm,
            voltage: hwFrame.voltage,
            currentMa: hwFrame.currentMa,
            powerW: hwFrame.powerW,
            passes: hwFrame.vehicleCount ?? 0,
            energyWh: hwFrame.energyWh,
          }
        : null
      : tel

  return (
    <section id="demo" className="section-pad mx-auto max-w-[1400px] pb-20 md:pb-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mono-label">SECTION 04 — INTERACTIVE DEMONSTRATION</div>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-mega md:text-5xl">
            LIVE TRAFFIC → ENERGY SIMULATOR
          </h2>
        </div>

        {/* mode switch */}
        <div className="flex items-center gap-3 rounded-xl border border-edge bg-deep/70 p-1.5">
          {(['simulation', 'hardware'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded-lg px-4 py-2 font-mono text-[11px] tracking-[0.16em] transition-colors ${
                mode === m ? 'bg-accent font-semibold text-void' : 'text-dim hover:text-mist'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-xl border border-emeraldx/40 bg-emeraldx/10 px-6 py-4 text-center font-display text-sm font-semibold tracking-wide2 text-emeraldx"
          >
            Traffic has become measurable energy data.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* LEFT: scene + controls */}
        <div className="flex flex-col gap-6">
          <div className="panel relative overflow-hidden">
            {mode === 'hardware' ? (
              <div className="grid-bg flex h-[380px] flex-col items-center justify-center gap-4 md:h-[480px]">
                {hwFrame ? (
                  <div className="text-center">
                    <span className="live-badge mb-4 inline-flex">LIVE HARDWARE FEED</span>
                    <div className="font-display text-6xl font-bold tracking-mega text-emeraldx">
                      {hwFrame.rpm.toFixed(0)}
                      <span className="ml-2 text-sm font-normal text-dim">RPM</span>
                    </div>
                    <div className="mt-2 font-mono text-sm text-mist">
                      {hwFrame.voltage.toFixed(2)} V · {(hwFrame.currentMa / 1000).toFixed(3)} A ·{' '}
                      {hwFrame.powerW.toFixed(2)} W
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <WifiOff className="mx-auto h-10 w-10 text-faint" />
                    <div className="mt-4 font-mono text-xs uppercase tracking-[0.22em] text-dim">
                      ESP32 OFFLINE — simulation data suspended
                    </div>
                    <p className="mx-auto mt-2 max-w-sm px-6 text-center text-[11px] leading-relaxed text-faint">
                      Connect the prototype over Wi-Fi to stream real measurements. No fake
                      readings are shown in this mode — by design.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Suspense fallback={<div className="grid-bg h-[380px] md:h-[480px]" />}>
                  <TrafficScene
                    speedKmh={speedKmh}
                    vehicleType={vehicleType}
                    guideOn={guideOn}
                    crosswind={crosswind}
                    autoTraffic
                    density={density}
                    burst={burst}
                    onPass={onPass}
                    onFrame={onFrame}
                    className="h-[380px] md:h-[480px]"
                  />
                </Suspense>
                <div className="sim-badge absolute left-4 top-4">MODEL / SIMULATION</div>
                <div
                  className={`absolute right-4 top-4 rounded-full border px-3 py-1 font-mono text-[9px] tracking-[0.18em] ${
                    st.tone === 'live'
                      ? 'border-emeraldx/40 bg-emeraldx/10 text-emeraldx'
                      : st.tone === 'warn'
                        ? 'border-amberx/40 bg-amberx/10 text-amberx'
                        : 'border-line bg-deep text-dim'
                  }`}
                >
                  {st.text}
                </div>
              </>
            )}
          </div>

          {/* controls */}
          {mode === 'simulation' && (
            <div className="panel-flat grid gap-6 p-6 md:grid-cols-2">
              <label className="block md:col-span-2">
                <div className="flex items-baseline justify-between">
                  <span className="mono-label">YOU CONTROL — VEHICLE SPEED</span>
                  <span className="font-mono text-sm text-accent">{speedKmh} km/h</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={speedKmh}
                  onChange={(e) => setSpeedKmh(parseInt(e.target.value))}
                  className="mt-3 w-full"
                  aria-label="Vehicle speed in kilometres per hour"
                />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100 km/h</span>
                </div>
              </label>

              <div>
                <div className="mono-label mb-2">VEHICLE TYPE</div>
                <div className="flex flex-wrap gap-1.5">
                  {VEHICLE_TYPES.map((v) => (
                    <button
                      key={v.k}
                      onClick={() => setVehicleType(v.k)}
                      aria-pressed={vehicleType === v.k}
                      className={`rounded-md border px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] transition-colors ${
                        vehicleType === v.k
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-line text-dim hover:border-edge hover:text-mist'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mono-label mb-2">TRAFFIC DENSITY</div>
                <div className="flex flex-wrap gap-1.5">
                  {DENSITIES.map((d) => (
                    <button
                      key={d.k}
                      onClick={() => setDensity(d.k)}
                      aria-pressed={density === d.k}
                      className={`rounded-md border px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] transition-colors ${
                        density === d.k
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-line text-dim hover:border-edge hover:text-mist'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mono-label mb-2">TURBINE GUIDE</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setGuideOn(false)}
                    aria-pressed={!guideOn}
                    className={`rounded-md border px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] transition-colors ${
                      !guideOn
                        ? 'border-rosex/60 bg-rosex/10 text-rosex'
                        : 'border-line text-dim hover:border-edge hover:text-mist'
                    }`}
                  >
                    OFF — BASELINE
                  </button>
                  <button
                    onClick={() => setGuideOn(true)}
                    aria-pressed={guideOn}
                    className={`rounded-md border px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] transition-colors ${
                      guideOn
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-line text-dim hover:border-edge hover:text-mist'
                    }`}
                  >
                    ON — VAYU-GUIDE
                  </button>
                </div>
              </div>

              <div>
                <div className="mono-label mb-2">CROSSWIND</div>
                <div className="flex flex-wrap gap-1.5">
                  {CROSSWINDS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCrosswind(c.toLowerCase() as Crosswind)}
                      aria-pressed={crosswind === c.toLowerCase()}
                      className={`rounded-md border px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] transition-colors ${
                        crosswind === c.toLowerCase()
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-line text-dim hover:border-edge hover:text-mist'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <button onClick={sendTraffic} className="btn-primary w-full justify-center md:w-auto">
                  <Send className="h-4 w-4" /> SEND TRAFFIC — 8 VEHICLES
                </button>
              </div>
            </div>
          )}

          {/* hardware connect panel */}
          {mode === 'hardware' && (
            <div className="panel-flat p-6">
              <div className="flex items-center justify-between">
                <span className="mono-label">ESP32 DATA ADAPTER</span>
                <span
                  className={
                    hwStatus === 'online'
                      ? 'live-badge'
                      : hwStatus === 'connecting'
                        ? 'sim-badge'
                        : 'inline-flex items-center gap-1 rounded border border-line bg-deep px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-dim'
                  }
                >
                  <Wifi className="h-3 w-3" /> {hwStatus}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  spellCheck={false}
                  className="min-w-0 flex-1 rounded-md border border-line bg-void px-3 py-2 font-mono text-xs text-mist outline-none focus:border-accent"
                  placeholder="ws://192.168.4.1:81/"
                  aria-label="ESP32 WebSocket URL"
                />
                <button onClick={connectHardware} className="btn-primary !py-2 text-xs">
                  CONNECT
                </button>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-void p-3 font-mono text-[10px] leading-relaxed text-dim">
{`// expected JSON frame from prototype
{
  "source": "hardware",   "vehicleDetected": true,
  "rpm": 684,             "voltage": 3.2,
  "currentMa": 82,        "powerW": 0.262,
  "energyWh": 0.018
}`}
              </pre>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {['ESP32', 'RPM SENSOR', 'VOLTAGE', 'CURRENT', 'VEHICLE'].map((s) => (
                  <div
                    key={s}
                    className={`rounded-md border px-2 py-2 text-center font-mono text-[9px] tracking-[0.14em] ${
                      hwStatus === 'online'
                        ? 'border-emeraldx/40 bg-emeraldx/5 text-emeraldx'
                        : 'border-line bg-deep text-dim'
                    }`}
                  >
                    <span className={hwStatus === 'online' ? 'mr-1 text-emeraldx' : 'mr-1 text-faint'}>
                      ●
                    </span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: dashboard */}
        <div className="flex flex-col gap-6">
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="mono-label">{mode === 'hardware' ? 'LIVE READOUT' : 'NODE DASHBOARD'}</span>
              {mode === 'hardware' ? (
                hwFrame ? (
                  <span className="live-badge">LIVE</span>
                ) : (
                  <span className="chip">NO SIGNAL</span>
                )
              ) : (
                <span className="sim-badge">MODEL / SIMULATION</span>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {[
                ['AIRFLOW', live ? `${live.airflow.toFixed(1)} m/s` : '—'],
                ['TURBINE RPM', live ? `${Math.round(live.rpm)}` : '—'],
                ['VOLTAGE', live ? `${live.voltage.toFixed(2)} V` : '—'],
                ['CURRENT', live ? `${Math.round(live.currentMa)} mA` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between border-b border-line pb-2.5">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-dim">{k}</span>
                  <span className="font-mono text-lg font-semibold text-ink">{v}</span>
                </div>
              ))}
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-accent">POWER</span>
                  <span className="font-mono text-2xl font-bold text-accent">
                    {live ? live.powerW.toFixed(3) : '—'}
                    <span className="ml-1 text-xs font-normal text-dim">W</span>
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-amberx/30 bg-amberx/5 p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-amberx">
                    ENERGY HARVESTED
                  </span>
                  <span className="font-mono text-2xl font-bold text-amberx">
                    {live ? live.energyWh.toFixed(4) : '—'}
                    <span className="ml-1 text-xs font-normal text-dim">Wh</span>
                  </span>
                </div>
                <div className="mt-2 h-1 w-full rounded bg-line">
                  <div
                    className="h-full rounded bg-amberx transition-all duration-500"
                    style={{ width: `${Math.min(100, (live?.energyWh ?? 0) * 2000)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-mono text-[10px] tracking-[0.2em] text-dim">
                  VEHICLE EVENTS
                </span>
                <span className="font-mono text-sm text-mist">{live?.passes ?? 0}</span>
              </div>
            </div>
          </div>

          {/* power graph */}
          <div className="panel p-5">
            <div className="mono-label">POWER OUTPUT — LAST ~30 S</div>
            <div className="mt-3 h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#15243c" strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="i" hide />
                  <YAxis
                    width={38}
                    tick={{ fill: '#5f7a96', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0a1524',
                      border: '1px solid #15243c',
                      borderRadius: 8,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                    }}
                    formatter={(v) => [`${Number(v).toFixed(3)} W`, 'POWER']}
                  />
                  <Area
                    type="monotone"
                    dataKey="p"
                    stroke="#22d3ee"
                    strokeWidth={1.8}
                    fill="url(#pg)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">
              SPIKES ARE VEHICLES — traffic is intermittent, so generation is intermittent.
            </p>
          </div>

          {/* event timeline */}
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="mono-label">TRAFFIC EVENTS</span>
              {mode === 'simulation' && <span className="sim-badge">SIMULATED EVENTS</span>}
            </div>
            <div className="mt-3 max-h-[190px] space-y-1.5 overflow-y-auto pr-1">
              {events.length === 0 && (
                <div className="rounded-md border border-line bg-deep px-3 py-4 text-center font-mono text-[10px] tracking-[0.16em] text-faint">
                  WAITING FOR AIRFLOW EVENT…
                </div>
              )}
              {events.map((e, i) => (
                <motion.div
                  key={`${e.ts.getTime()}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-md border border-line bg-deep/70 px-3 py-2 font-mono text-[10px]"
                >
                  <span className="text-dim">
                    {e.ts.toLocaleTimeString([], { hour12: false })}
                  </span>
                  <span className="tracking-[0.14em] text-mist">{e.type.toUpperCase()}</span>
                  <span className="text-amberx">+{e.energyWh.toFixed(4)} Wh</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <HowCalculated />
    </section>
  )
}

function hwTelAdapter(f: HardwareFrame | null): SceneTelemetry {
  if (!f) return EMPTY_TEL
  return {
    airflow: f.airflow ?? 0,
    rpm: f.rpm,
    voltage: f.voltage,
    currentMa: f.currentMa,
    powerW: f.powerW,
    passes: f.vehicleCount ?? 0,
    energyWh: f.energyWh,
  }
}

function HowCalculated() {
  const [open, setOpen] = useState(false)
  return (
    <div className="panel mt-8 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-mono text-xs tracking-[0.18em] text-mist">
          HOW IS THIS CALCULATED?
        </span>
        <span className="font-mono text-xs text-accent">{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-line"
          >
            <div className="grid gap-x-10 gap-y-4 px-6 py-5 font-mono text-[11px] leading-relaxed text-mist md:grid-cols-2">
              <div>
                <div className="mb-2 text-accent">1 · WAKE SPEED AT ROTOR</div>
                v_wake = v_vehicle × k_type × k_crosswind × k_guide
                <div className="mt-1 text-dim">
                  k_type: car 0.18 · SUV 0.22 · bus 0.26 · truck 0.31 — calibrated so an 80 km/h
                  car gives ≈ 4 m/s, matching published roadside measurements.
                </div>
              </div>
              <div>
                <div className="mb-2 text-accent">2 · ROTOR SPEED</div>
                RPM = λ · v_wake / R · 60 / 2π
                <div className="mt-1 text-dim">
                  λ ≈ 0.8 (Savonius tip-speed ratio), R = 0.15 m reference node.
                </div>
              </div>
              <div>
                <div className="mb-2 text-accent">3 · AVAILABLE & CAPTURED POWER</div>
                P_air = ½ ρ A v³ → P_out = P_air × C_p × η
                <div className="mt-1 text-dim">
                  ρ = 1.225 kg/m³, A = 0.135 m², C_p = 0.14 baseline / 0.24 guided, η ≈ 0.55
                  (generator + rectifier).
                </div>
              </div>
              <div>
                <div className="mb-2 text-accent">4 · ELECTRICAL MODEL</div>
                V = kₑ · RPM (kₑ = 0.014 V/RPM) · I from resistive load line · E = ∫P dt
                <div className="mt-1 text-dim">
                  One pass stores E_pass = P × dwell, dwell ≈ 18 m ÷ vehicle speed.
                </div>
              </div>
              <div className="md:col-span-2 border-t border-line pt-3 text-[10px] text-faint">
                This is a simplified engineering model — deliberately NOT computational fluid
                dynamics. Its purpose is to show the direction and coupling between traffic,
                airflow, rotor response and energy. Replace inputs with measured values as the
                physical prototype is characterised.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
