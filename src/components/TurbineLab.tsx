import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import Turbine from './Turbine'
import { simulateAtWind } from '../lib/simulation'

const VAWT_REASONS = [
  { t: 'Direction tolerance', d: 'No yaw system needed — gusts arrive from either lane and any angle.' },
  { t: 'Compact footprint', d: 'A vertical rotor packages into a roadside node beside a barrier.' },
  { t: 'Self-starting potential', d: 'Drag-based designs start in gusts where lift rotors cannot.' },
  { t: 'Gust-friendly mechanics', d: 'Low inertia rotor responds to short, turbulent events.' },
  { t: 'Mechanical simplicity', d: 'One shaft, direct-drive generator, no gearbox.' },
]

const TYPES = [
  {
    name: 'SAVONIUS',
    tag: 'SELECTED',
    rows: [
      ['Self-starting', true],
      ['Low-speed torque', true],
      ['Turbulence tolerance', true],
      ['Peak efficiency', false],
      ['Build complexity', true],
    ],
    note: 'Drag-driven · Cp ≈ 0.15–0.25 · cut-in ≈ 1.4–3 m/s',
  },
  {
    name: 'DARRIEUS',
    tag: 'REJECTED',
    rows: [
      ['Self-starting', false],
      ['Low-speed torque', false],
      ['Turbulence tolerance', false],
      ['Peak efficiency', true],
      ['Build complexity', false],
    ],
    note: 'Lift-driven · fails to self-start below ~6 m/s in vehicle-wind tests',
  },
  {
    name: 'H-ROTOR',
    tag: 'PARKED',
    rows: [
      ['Self-starting', false],
      ['Low-speed torque', false],
      ['Turbulence tolerance', false],
      ['Peak efficiency', true],
      ['Build complexity', false],
    ],
    note: 'Lift-driven · needs starting torque or pitch control',
  },
] as const

export default function TurbineLab() {
  const [airflow, setAirflow] = useState(3.5)
  const [guideOn, setGuideOn] = useState(true)

  const sim = useMemo(() => simulateAtWind(airflow, guideOn), [airflow, guideOn])
  const simAlt = useMemo(() => simulateAtWind(airflow, !guideOn), [airflow, guideOn])

  return (
    <section id="turbine" className="section-pad mx-auto max-w-[1400px] pb-20 md:pb-28">
      <div className="mono-label">SECTION 03 — THE MACHINE</div>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-mega md:text-5xl">
        Why a Savonius VAWT
      </h2>

      {/* why vertical axis */}
      <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
        {VAWT_REASONS.map((r) => (
          <div key={r.t} className="bg-deep/80 p-5">
            <div className="font-mono text-[10px] tracking-[0.2em] text-accent">{r.t.toUpperCase()}</div>
            <p className="mt-2 text-xs leading-relaxed text-mist">{r.d}</p>
          </div>
        ))}
      </div>

      {/* comparison table */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {TYPES.map((t) => (
          <div
            key={t.name}
            className={`panel relative p-6 ${t.tag === 'SELECTED' ? '!border-accent/60 shadow-glow-sm' : ''}`}
          >
            {t.tag === 'SELECTED' && (
              <span className="live-badge absolute right-4 top-4">SELECTED</span>
            )}
            <h3 className="font-display text-lg font-bold tracking-wide2">{t.name}</h3>
            <ul className="mt-4 space-y-2.5">
              {t.rows.map(([k, good]) => (
                <li key={k as string} className="flex items-center justify-between text-xs text-mist">
                  <span>{k}</span>
                  {good ? (
                    <CheckCircle2 className="h-4 w-4 text-emeraldx" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rosex" />
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 font-mono text-[10px] leading-relaxed text-dim">
              {t.note}
            </p>
          </div>
        ))}
      </div>

      {/* interactive turbine */}
      <div className="mt-14 grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="panel relative overflow-hidden p-6">
          <div className="sim-badge absolute left-4 top-4 z-10">SIMULATION</div>
          <div className="grid-bg absolute inset-0 opacity-60" aria-hidden="true" />
          <motion.div
            key={guideOn ? 'g' : 'n'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative mx-auto h-[340px] w-[240px]"
          >
            <Turbine rpm={sim.rpm} guideOn={guideOn} className="h-full w-full" />
          </motion.div>

          <div className="relative mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line font-mono text-center">
            {[
              ['AIRFLOW', `${sim.airflow.toFixed(1)} m/s`],
              ['RPM', `${Math.round(sim.rpm)}`],
              ['POWER', `${sim.powerW.toFixed(2)} W`],
            ].map(([k, v]) => (
              <div key={k} className="bg-deep px-2 py-3">
                <div className="text-[9px] tracking-[0.22em] text-dim">{k}</div>
                <div className="mt-1 text-sm font-semibold text-accent">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6">
          <div className="panel-flat p-6">
            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="mono-label">YOU CONTROL — AIRFLOW AT ROTOR</span>
                <span className="font-mono text-sm text-accent">{airflow.toFixed(1)} m/s</span>
              </div>
              <input
                type="range"
                min={0}
                max={7}
                step={0.1}
                value={airflow}
                onChange={(e) => setAirflow(parseFloat(e.target.value))}
                className="mt-3 w-full"
                aria-label="Airflow at rotor in metres per second"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
                <span>0 — CALM</span>
                <span>7 — TRUCK GUST</span>
              </div>
            </label>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <div className="mono-label">SYSTEM RESPONDS</div>
                <p className="mt-1 text-xs text-mist">
                  Airflow ↑ → rotor torque ↑ → RPM ↑ → generator voltage ↑
                </p>
              </div>
              <div className="flex rounded-lg border border-edge p-1">
                <button
                  onClick={() => setGuideOn(false)}
                  className={`rounded-md px-4 py-2 font-mono text-[11px] tracking-[0.14em] transition-colors ${
                    !guideOn ? 'bg-panel text-accent shadow-glow-sm' : 'text-dim hover:text-mist'
                  }`}
                >
                  GUIDE OFF
                </button>
                <button
                  onClick={() => setGuideOn(true)}
                  className={`rounded-md px-4 py-2 font-mono text-[11px] tracking-[0.14em] transition-colors ${
                    guideOn ? 'bg-accent text-void font-semibold' : 'text-dim hover:text-mist'
                  }`}
                >
                  VAYU-GUIDE ON
                </button>
              </div>
            </div>

            {airflow < 0.4 && (
              <div className="mt-5 rounded-lg border border-rosex/30 bg-rosex/5 px-4 py-3 font-mono text-[11px] tracking-wide2 text-rosex">
                TURBINE IDLE — below cut-in (~0.4 m/s at prototype scale)
              </div>
            )}
          </div>

          <div className="panel-flat p-6">
            <div className="mono-label">GUIDE EFFECT AT CURRENT AIRFLOW</div>
            <div className="mt-4 grid grid-cols-2 gap-6">
              {[
                { label: guideOn ? 'WITHOUT GUIDE' : 'WITH GUIDE', v: simAlt },
                { label: guideOn ? 'WITH VAYU-GUIDE' : 'WITHOUT GUIDE', v: sim, hot: true },
              ].map((c) => (
                <div key={c.label}>
                  <div className={`font-mono text-[10px] tracking-[0.18em] ${c.hot ? 'text-emeraldx' : 'text-dim'}`}>
                    {c.label}
                  </div>
                  <div className={`mt-1 font-display text-2xl font-bold ${c.hot ? 'text-emeraldx' : 'text-mist'}`}>
                    ×{(c.v.powerW / Math.max(sim.powerW, simAlt.powerW) * (c.hot ? (sim.powerW / Math.max(sim.powerW, simAlt.powerW) || 1) : 1)).toFixed(2)}
                    <span className="ml-1 text-xs font-normal text-dim">rel. power</span>
                  </div>
                  <div className="mt-1 h-1 w-full rounded bg-line">
                    <div
                      className={`h-full rounded ${c.hot ? 'bg-emeraldx' : 'bg-faint'}`}
                      style={{ width: `${Math.min(100, c.v.rpm)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-[10px] leading-relaxed text-faint">
              MODEL BASIS: curtain/guide studies report +30%…+150% output; highway CFD with three
              vanes reports up to ~+242%. This model applies a conservative gain.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
