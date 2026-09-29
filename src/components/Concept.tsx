import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Car, Wind, Shuffle, RotateCw, Gauge, BatteryCharging } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Hidden energy stream — interactive vehicle wake diagram             */
/* ------------------------------------------------------------------ */

const ZONES = [
  {
    id: 'front',
    label: 'FRONT',
    title: 'Stagnation / high pressure',
    body: 'Air piles up at the fascia, creating a high-pressure region that pushes over and around the body.',
  },
  {
    id: 'side',
    label: 'SIDES',
    title: 'Accelerated flow',
    body: 'Air squeezes around the flanks and speeds up — this is the strongest steady flow a roadside rotor can see as the vehicle approaches.',
  },
  {
    id: 'rear',
    label: 'REAR WAKE',
    title: 'Turbulent momentum wake',
    body: 'A low-pressure wake trails behind at a fraction of road speed, decaying with distance following a power law. Field studies measure 2.7–5.6 m/s gusts beside highways.',
  },
] as const

type ZoneId = (typeof ZONES)[number]['id']

function WakeDiagram() {
  const [zone, setZone] = useState<ZoneId>('rear')
  const active = ZONES.find((z) => z.id === zone)!

  return (
    <div className="panel overflow-hidden">
      <svg viewBox="0 0 640 260" className="block w-full" role="img" aria-label="Vehicle airflow zones diagram">
        <defs>
          <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#22d3ee" />
          </marker>
          <linearGradient id="wakeG" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.5)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>

        {/* ground */}
        <line x1="20" y1="215" x2="620" y2="215" stroke="#1e3352" strokeDasharray="10 12" />

        {/* free-stream flow lines */}
        {[70, 95].map((y, i) => (
          <path
            key={i}
            d={`M20 ${y} C 160 ${y - 14}, 240 ${y - 16}, 330 ${y} S 520 ${y + 10}, 620 ${y}`}
            fill="none"
            stroke="#22d3ee"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            markerEnd="url(#arr)"
            className="animate-flowdash"
            strokeDasharray="6 18"
            style={{ animationDuration: `${1.2 + i * 0.3}s` }}
          />
        ))}

        {/* car silhouette */}
        <g>
          <path
            d="M180 190 L188 158 Q192 146 210 144 L268 142 Q292 118 322 116 L372 114 Q404 114 420 132 L452 140 Q472 144 476 160 L480 190 Z"
            fill="#12233c"
            stroke="#2a4568"
            strokeWidth="1.5"
          />
          <rect x="300" y="124" width="52" height="16" rx="5" fill="#0b1523" opacity="0.85" />
          <circle cx="238" cy="192" r="13" fill="#0d1b30" stroke="#2a4568" />
          <circle cx="420" cy="192" r="13" fill="#0d1b30" stroke="#2a4568" />
        </g>

        {/* hover zones */}
        <g className="cursor-pointer">
          <rect x="176" y="112" width="60" height="100" fill={zone === 'front' ? 'rgba(34,211,238,0.14)' : 'transparent'} onClick={() => setZone('front')} onMouseEnter={() => setZone('front')} />
          <text x="206" y="106" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill={zone === 'front' ? '#22d3ee' : '#5f7a96'}>FRONT</text>

          <rect x="250" y="108" width="130" height="104" fill={zone === 'side' ? 'rgba(34,211,238,0.14)' : 'transparent'} onClick={() => setZone('side')} onMouseEnter={() => setZone('side')} />
          <text x="315" y="102" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill={zone === 'side' ? '#22d3ee' : '#5f7a96'}>SIDES</text>

          {/* wake cone */}
          <path
            d="M484 150 L620 128 L620 208 L484 196 Z"
            fill="url(#wakeG)"
            opacity={zone === 'rear' ? 0.9 : 0.45}
            onClick={() => setZone('rear')}
            onMouseEnter={() => setZone('rear')}
            style={{ cursor: 'pointer' }}
          />
          {[150, 165, 180].map((y, i) => (
            <path
              key={i}
              d={`M492 ${y} q 30 ${i % 2 ? 8 : -8} 60 0 t 60 0`}
              fill="none"
              stroke="#67e8f9"
              strokeOpacity={zone === 'rear' ? 0.7 : 0.3}
              strokeWidth="1.3"
              strokeDasharray="4 10"
              className="animate-flowdash"
              style={{ animationDuration: `${0.9 + i * 0.25}s` }}
            />
          ))}
          <text x="556" y="120" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill={zone === 'rear' ? '#22d3ee' : '#5f7a96'}>WAKE</text>
        </g>
      </svg>

      <div className="border-t border-line bg-deep/60 px-6 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <div className="font-mono text-[10px] tracking-[0.24em] text-accent">{active.label}</div>
            <div className="mt-1 font-display text-base font-semibold">{active.title}</div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-mist">{active.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Core chain — six clickable stages                                   */
/* ------------------------------------------------------------------ */

const CHAIN = [
  {
    icon: Car,
    k: '01',
    t: 'VEHICLE',
    d: 'Any passing vehicle displaces its own body-volume of air every second it is in motion.',
    tech: 'At 80 km/h a passenger car moves through ~22 m of air each second. The energy we target is already spent on pushing that air — VAYU-GRID only intercepts what would otherwise dissipate.',
  },
  {
    icon: Wind,
    k: '02',
    t: 'AIRFLOW',
    d: 'Pressure differences accelerate flow around the body and leave a trailing wake.',
    tech: 'Roadside measurements report gusts of roughly 2.7–5.6 m/s at highway speeds, strongest near the vehicle flank and upper shear layer, decaying with distance.',
  },
  {
    icon: Shuffle,
    k: '03',
    t: 'FLOW GUIDE',
    d: 'Passive curved walls redirect the gust onto the advancing blade.',
    tech: 'Wind-tunnel studies of curtain/deflector plates improve Savonius output by ~30–150%; recent highway-specific CFD reports up to ~242% more captured energy with three guide vanes.',
  },
  {
    icon: RotateCw,
    k: '04',
    t: 'VAWT',
    d: 'A helical Savonius rotor turns regardless of gust direction and self-starts easily.',
    tech: 'Drag-driven rotors cut in around 1.4–3 m/s and tolerate turbulence where lift-type Darrieus rotors fail to start below ~6 m/s.',
  },
  {
    icon: Gauge,
    k: '05',
    t: 'GENERATOR',
    d: 'The shaft spins a small DC generator — voltage proportional to RPM.',
    tech: 'A brushed DC motor works as a generator: V = kₑ·RPM. An N20-class motor gives measurable volts below 500 RPM, ideal for gust duty.',
  },
  {
    icon: BatteryCharging,
    k: '06',
    t: 'ENERGY',
    d: 'Rectified output charges a buffer cell — measured, logged, visualized live.',
    tech: 'An INA219 measures voltage/current while a Hall sensor counts RPM; an ESP32 streams everything to this dashboard over WebSocket.',
  },
]

function CoreChain() {
  const [openIdx, setOpenIdx] = useState(2)
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3 lg:grid-cols-6">
      {CHAIN.map((c, i) => {
        const Icon = c.icon
        const active = openIdx === i
        return (
          <button
            key={c.k}
            onClick={() => setOpenIdx(i)}
            aria-expanded={active}
            className={`group relative flex min-h-[168px] flex-col items-start p-5 text-left transition-colors ${
              active ? 'bg-raise' : 'bg-deep/80 hover:bg-panel'
            }`}
          >
            <span className="font-mono text-[10px] tracking-[0.3em] text-faint">{c.k}</span>
            <Icon className={`mt-4 h-6 w-6 transition-colors ${active ? 'text-accent' : 'text-mist group-hover:text-accent-soft'}`} />
            <span className="mt-auto pt-4 font-display text-sm font-bold tracking-wide2">{c.t}</span>
            <span className="mt-1 block text-[11px] leading-snug text-dim">{c.d}</span>
            {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent shadow-glow-sm" />}
          </button>
        )
      })}
      <div className="md:col-span-3 lg:col-span-6 border-t border-line bg-abyss px-6 py-5">
        <AnimatePresence mode="wait">
          <motion.p
            key={openIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mx-auto max-w-4xl text-center font-mono text-xs leading-relaxed text-mist"
          >
            <span className="mr-2 text-accent">{CHAIN[openIdx].k}/{CHAIN[openIdx].t} —</span>
            {CHAIN[openIdx].tech}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export default function Concept() {
  return (
    <>
      {/* THE HIDDEN RESOURCE */}
      <section id="concept" className="section-pad mx-auto max-w-[1400px] py-20 md:py-28">
        <div className="mono-label">SECTION 01 — THE HIDDEN RESOURCE</div>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-mega md:text-5xl">
          A Hidden Energy Stream
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist md:text-base">
          Every moving vehicle does work on the air around it — compressing it at the front,
          accelerating it along the flanks, and leaving a turbulent wake behind. Almost all of
          that induced airflow simply disperses.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
          <WakeDiagram />
          <div className="flex flex-col justify-between gap-4">
            <div className="panel-flat p-5">
              <div className="mono-label">MEASURED BESIDE ROADS</div>
              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-mist">
                <li className="flex justify-between gap-4 border-b border-line pb-3">
                  <span>Avg wake speed @ 1.5 m height</span>
                  <span className="font-mono text-accent">4.4–5.6 m/s</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-line pb-3">
                  <span>Peak gust near expressway</span>
                  <span className="font-mono text-accent">≤ 9 m/s</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-line pb-3">
                  <span>Truck vs car turbulence</span>
                  <span className="font-mono text-accent">≈ 2.5×</span>
                </li>
                <li className="flex justify-between">
                  <span>Wake decay with distance</span>
                  <span className="font-mono text-accent">power law</span>
                </li>
              </ul>
            </div>
            <p className="font-mono text-[10px] leading-relaxed tracking-wide2 text-faint">
              SOURCES: KUWAIT HIGHWAY FIELD CAMPAIGN (2018) · MADRID M-12 TURBULENCE STUDY · EPA
              SCALED WIND-TUNNEL WAKE MODELING · FULL LIST IN RESEARCH SECTION ↓
            </p>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section-pad mx-auto max-w-[1400px] pb-20 md:pb-28">
        <div className="rounded-2xl border border-line bg-gradient-to-br from-deep via-abyss to-void p-8 md:p-14">
          <h2 className="max-w-3xl font-display text-3xl font-bold tracking-mega md:text-5xl">
            Traffic creates more than movement.
          </h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <p className="max-w-xl text-sm leading-relaxed text-mist md:text-base">
              Most vehicle-induced airflow dissipates within metres of the roadway. The question
              VAYU-GRID explores is not how to make energy — it is whether a small fraction of
              this dispersed stream can be recovered locally for useful low-power work.
            </p>
            <div className="flex items-end justify-start md:justify-end">
              <div className="chip !text-[11px] !py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emeraldx" />
                VAYU-GRID captures a portion — honestly measured, never exaggerated.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section-pad mx-auto max-w-[1400px] pb-20 md:pb-28">
        <div className="mono-label">SECTION 02 — SYSTEM CHAIN</div>
        <h2 className="mb-10 mt-3 font-display text-3xl font-bold tracking-mega md:text-5xl">
          Six Stages. One Energy Event.
        </h2>
        <CoreChain />
      </section>
    </>
  )
}
