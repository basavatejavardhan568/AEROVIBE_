import { lazy, Suspense } from 'react'
import { ArrowDown, Play } from 'lucide-react'

const TrafficScene = lazy(() => import('./TrafficScene'))

const STRIP = [
  { k: '01', t: 'TRAFFIC AIRFLOW', d: 'RECOVERY' },
  { k: '02', t: 'VERTICAL-AXIS', d: 'TURBINE' },
  { k: '03', t: 'REAL-TIME', d: 'MEASUREMENT' },
  { k: '04', t: 'LOW-POWER', d: 'APPLICATIONS' },
]

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-14">
      <div className="grid-bg hero-vignette absolute inset-0" aria-hidden="true" />

      <div className="section-pad relative mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-4xl pb-10 pt-16 text-center md:pt-24">
          <div className="chip mx-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-glow-sm" />
            HACKATHON DEMONSTRATION · TRAFFIC AIRFLOW ENERGY
          </div>

          <h1 className="mt-6 font-display text-[42px] font-bold leading-[0.98] tracking-mega md:text-[84px]">
            Every Vehicle Moves Air.
            <br />
            <span className="bg-gradient-to-r from-accent via-accent-soft to-emeraldx bg-clip-text text-transparent">
              We Turn It Into Energy.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-mist md:text-base">
            VAYU-GRID explores a new way to recover localized vehicle-induced airflow using
            compact vertical-axis turbines — converting intermittent traffic turbulence into
            measurable roadside energy for low-power applications.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#concept" className="btn-primary">
              EXPLORE THE SYSTEM <ArrowDown className="h-4 w-4" />
            </a>
            <a href="#demo" className="btn-ghost">
              <Play className="h-4 w-4" /> LAUNCH LIVE DEMO
            </a>
          </div>
        </div>
      </div>

      {/* animated highway */}
      <div className="section-pad relative mx-auto max-w-[1400px] pb-6">
        <div className="panel relative h-[380px] overflow-hidden shadow-panel md:h-[480px]">
          <Suspense fallback={<div className="grid-bg absolute inset-0" />}>
            <TrafficScene speedKmh={80} vehicleType="car" guideOn autoTraffic density="medium" />
          </Suspense>
          <div className="sim-badge absolute left-4 top-4">MODEL / SIMULATION</div>
          <div className="pointer-events-none absolute bottom-4 left-4 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-dim md:block">
            VEHICLE → WAKE → GUIDE → ROTOR → GENERATOR → STORED ENERGY
          </div>
        </div>
      </div>

      {/* info strip */}
      <div className="section-pad relative mx-auto max-w-[1400px] pb-16">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
          {STRIP.map((s) => (
            <div key={s.k} className="bg-deep/80 px-5 py-5">
              <div className="font-mono text-[10px] tracking-[0.3em] text-faint">{s.k}</div>
              <div className="mt-2 font-display text-sm font-semibold tracking-wide2 text-ink">
                {s.t}
              </div>
              <div className="font-display text-sm font-semibold tracking-wide2 text-accent">
                {s.d}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
