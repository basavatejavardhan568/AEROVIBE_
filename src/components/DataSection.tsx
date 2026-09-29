import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  energyVsSpeedCurve,
  estimateTraffic,
  simulate,
  TRAFFIC_SCENARIOS,
} from '../lib/simulation'

export default function DataSection() {
  const [scenarioIdx, setScenarioIdx] = useState(1)
  const [guideOn, setGuideOn] = useState(true)
  const [speedKmh, setSpeedKmh] = useState(80)

  const estimates = useMemo(
    () => TRAFFIC_SCENARIOS.map((s) => estimateTraffic(s, 2, guideOn)),
    [guideOn]
  )
  const curve = useMemo(() => energyVsSpeedCurve(guideOn), [guideOn])
  const pt = useMemo(
    () =>
      simulate({
        vehicleSpeedKmh: speedKmh,
        vehicleType: 'car',
        guideOn,
        crosswind: 'low',
      }),
    [speedKmh, guideOn]
  )

  return (
    <section id="data" className="section-pad mx-auto max-w-[1400px] pb-20 md:pb-28">
      <div className="mono-label">SECTION 05 — TRAFFIC → ENERGY DATA</div>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-mega md:text-5xl">
        Traffic density becomes harvest
      </h2>

      {/* scenario cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {TRAFFIC_SCENARIOS.map((s, i) => {
          const card = estimates[i]
          return (
            <button key={s.key} onClick={() => setScenarioIdx(i)} aria-pressed={i === scenarioIdx}>
              <div
                className={`panel h-full p-6 text-left transition-colors ${
                  i === scenarioIdx ? '!border-accent/60 shadow-glow-sm' : 'hover:border-edge'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-bold tracking-wide2">
                    {s.label.toUpperCase()}
                  </span>
                  <span className="font-mono text-[10px] text-dim">{s.avgSpeedKmh} km/h AVG</span>
                </div>
                <div className="mt-1 font-mono text-[10px] tracking-[0.16em] text-faint">
                  {s.vehiclesPerHourPerLane.toLocaleString()} VEH/H/LANE ·{' '}
                  {Math.round(s.truckShare * 100)}% TRUCKS
                </div>
                <div className="mt-5 space-y-2 font-mono text-xs">
                  <Row k="PASS EVENTS / DAY" v={card.eventsPerDay.toLocaleString()} />
                  <Row k="MEAN PASS POWER" v={`${card.meanPowerW.toFixed(2)} W`} />
                  <Row
                    k="ENERGY / NODE / DAY"
                    v={`${card.wattHoursPerDay.toFixed(1)} Wh`}
                    hot={i === scenarioIdx}
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* correlation */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="mono-label">VEHICLE SPEED → POWER (INTERACTIVE)</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setGuideOn(false)}
                aria-pressed={!guideOn}
                className={`rounded-md border px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] ${
                  !guideOn ? 'border-rosex/60 bg-rosex/10 text-rosex' : 'border-line text-dim hover:text-mist'
                }`}
              >
                GUIDE OFF
              </button>
              <button
                onClick={() => setGuideOn(true)}
                aria-pressed={guideOn}
                className={`rounded-md border px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] ${
                  guideOn ? 'border-accent bg-accent/10 text-accent' : 'border-line text-dim hover:text-mist'
                }`}
              >
                GUIDE ON
              </button>
            </div>
          </div>

          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
                <CartesianGrid stroke="#15243c" strokeDasharray="3 6" />
                <XAxis
                  dataKey="speed"
                  tick={{ fill: '#5f7a96', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: '#15243c' }}
                  unit=" km/h"
                />
                <YAxis
                  tick={{ fill: '#5f7a96', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  unit=" W"
                  width={62}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0a1524',
                    border: '1px solid #15243c',
                    borderRadius: 8,
                    fontFamily: 'JetBrains Mono',
                    fontSize: 11,
                  }}
                  formatter={(v, n) => [Number(v).toFixed(3), String(n).toUpperCase()]}
                />
                <Line
                  type="monotone"
                  dataKey="power"
                  stroke={guideOn ? '#22d3ee' : '#fb7185'}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <ReferenceDot x={speedKmh} y={pt.powerW} r={6} fill="#22d3ee" stroke="#04070d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <label className="mt-2 block">
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={speedKmh}
              onChange={(e) => setSpeedKmh(parseInt(e.target.value))}
              className="w-full"
              aria-label="Vehicle speed for correlation point"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100 km/h</span>
            </div>
          </label>
        </div>

        {/* readout + honest math */}
        <div className="flex flex-col gap-6">
          <div className="panel p-6">
            <div className="sim-badge mb-4 inline-flex">AT {speedKmh} KM/H · CAR · LOW CROSSWIND</div>
            <div className="space-y-3 font-mono text-sm">
              <KV k="AIRFLOW AT ROTOR" v={`${pt.airflow.toFixed(2)} m/s`} />
              <KV k="ROTOR RPM" v={`${Math.round(pt.rpm)}`} />
              <KV k="VOLTAGE" v={`${pt.voltage.toFixed(2)} V`} />
              <KV k="POWER" v={`${pt.powerW.toFixed(3)} W`} accent />
            </div>
          </div>

          <div className="panel-flat p-6">
            <div className="mono-label">HOW THE DAILY ESTIMATE WORKS</div>
            <ol className="mt-4 space-y-3 font-mono text-[11px] leading-relaxed text-mist">
              <li>
                <span className="text-accent">1.</span> Each passing vehicle creates a gust of
                ~18 m influence length → dwell time t ≈ 18 / v.
              </li>
              <li>
                <span className="text-accent">2.</span> Events/day = vehicles/hour × 2 lanes × 24 h.
              </li>
              <li>
                <span className="text-accent">3.</span> Duty factor D = events × t ÷ 3600 s,
                capped at 0.9 — the rotor is never busy more than ~90% of the time.
              </li>
              <li>
                <span className="text-accent">4.</span> Energy/day = mean pass power × D × 24 h.
              </li>
            </ol>
            <p className="mt-4 border-t border-line pt-3 font-mono text-[10px] leading-relaxed text-faint">
              Planning-grade estimates from a simplified model — not CFD, not measured field data.
              Wake overlap between consecutive vehicles, battery round-trip loss and seasonal
              effects are intentionally excluded.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({ k, v, hot }: { k: string; v: string; hot?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between border-b border-line pb-2 ${hot ? '' : ''}`}>
      <span className="text-[10px] tracking-[0.16em] text-dim">{k}</span>
      <span className={`font-semibold ${hot ? 'text-emeraldx' : 'text-ink'}`}>{v}</span>
    </div>
  )
}

function KV({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line pb-2.5">
      <span className="text-[10px] tracking-[0.18em] text-dim">{k}</span>
      <span className={`text-lg font-semibold ${accent ? 'text-accent' : 'text-ink'}`}>{v}</span>
    </div>
  )
}
