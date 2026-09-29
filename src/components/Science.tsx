import { ExternalLink } from 'lucide-react'
import { POSITIONING, SOURCES } from '../lib/sources'

const PROVEN = [
  'Vehicle wakes produce usable gusts at the roadside — measured 2.7–5.6 m/s at highway speeds.',
  'Trucks and buses carry significantly more wake energy than cars.',
  'Helical Savonius rotors self-start and survive turbulence where Darrieus rotors stall.',
  'Passive guides/curtains reliably raise Savonius output (+30%…+242% in published tests).',
  'Roadside VAWTs have been demonstrated on live public roads (Alpha 311, A4444 Telford).',
]

const PROJECTED = [
  'Exact Wh/day for our node geometry — depends on final rotor and placement.',
  'Corridor-scale economics — needs a real deployment campaign.',
  'Durability under monsoon dust, rain and vibration.',
  'Grid-operator acceptance of roadside micro-generation.',
]

export default function Science() {
  return (
    <section id="science" className="section-pad mx-auto max-w-[1400px] pb-20 md:pb-28">
      <div className="mono-label">SECTION 07 — SCIENCE & REALITY CHECK</div>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-mega md:text-5xl">
        Research foundation
      </h2>

      {/* positioning chips */}
      <div className="mt-8 flex flex-wrap gap-2">
        {POSITIONING.map((p) => (
          <div
            key={p.k}
            className="group relative rounded-lg border border-edge bg-deep/70 px-4 py-3"
            title={p.d}
          >
            <span className="font-mono text-[11px] tracking-[0.18em] text-accent">{p.k}</span>
            <span className="ml-3 hidden text-[11px] text-mist md:inline">{p.d}</span>
          </div>
        ))}
      </div>

      {/* reality check */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="panel p-6 !border-emeraldx/30">
          <div className="live-badge">PROVEN BY PUBLISHED RESEARCH</div>
          <ul className="mt-4 space-y-2.5">
            {PROVEN.map((p) => (
              <li key={p} className="flex gap-3 text-xs leading-relaxed text-mist">
                <span className="mt-0.5 font-mono text-emeraldx">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-6 !border-amberx/30">
          <div className="sim-badge">HONESTLY STILL PROJECTED</div>
          <ul className="mt-4 space-y-2.5">
            {PROJECTED.map((p) => (
              <li key={p} className="flex gap-3 text-xs leading-relaxed text-mist">
                <span className="mt-0.5 font-mono text-amberx">△</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* sources */}
      <h3 className="mt-14 font-display text-xl font-bold tracking-wide2">
        Key sources behind the model
      </h3>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SOURCES.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="panel group flex flex-col p-5 transition-colors hover:border-accent/50"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-display text-sm font-bold leading-snug text-ink group-hover:text-accent">
                {s.title}
              </span>
              <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-faint group-hover:text-accent" />
            </div>
            <div className="mt-2 font-mono text-[10px] tracking-[0.14em] text-dim">
              {s.org.toUpperCase()} · {s.year}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-mist">{s.finding}</p>
          </a>
        ))}
      </div>
    </section>
  )
}
