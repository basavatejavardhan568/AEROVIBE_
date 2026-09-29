import { useMemo, useState } from 'react'
import { BatteryCharging, Lightbulb, Route, Sun } from 'lucide-react'
import { estimateTraffic, TRAFFIC_SCENARIOS } from '../lib/simulation'

const PHONE_CHARGE_WH = 15 // full smartphone charge
const ROAD_STUD_NIGHT_WH = 5 // 0.5 W LED × 10 h
const STREETLIGHT_HOUR_WH = 60 // 60 W LED lamp, one hour

export default function ScaleHighway() {
  const [nodes, setNodes] = useState(100)

  const perNode = useMemo(
    () => estimateTraffic(TRAFFIC_SCENARIOS[1], 2, true),
    []
  )
  const total = useMemo(() => {
    const wh = nodes * perNode.wattHoursPerDay
    return {
      wh,
      kwh: wh / 1000,
      phones: wh / PHONE_CHARGE_WH,
      studs: wh / ROAD_STUD_NIGHT_WH,
      lightHours: wh / STREETLIGHT_HOUR_WH,
    }
  }, [nodes, perNode])

  const fmt = (n: number) =>
    n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n.toFixed(n < 10 ? 1 : 0)

  return (
    <section id="scale" className="section-pad mx-auto max-w-[1400px] pb-20 md:pb-28">
      <div className="mono-label">SECTION 06 — SCALE-UP PROJECTION</div>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-mega md:text-5xl">
        From one node to a corridor
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist">
        A single node harvests modest energy — the idea scales by repetition along traffic
        corridors. Move the slider to project a deployment of{' '}
        <span className="font-mono text-accent">{nodes}</span> roadside nodes under moderate
        highway traffic ({TRAFFIC_SCENARIOS[1].vehiclesPerHourPerLane} veh/h/lane).
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* control */}
        <div className="panel flex flex-col justify-between p-6">
          <div>
            <div className="mono-label">DEPLOYMENT SIZE</div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-5xl font-bold text-accent">{nodes}</span>
              <span className="font-mono text-xs tracking-[0.18em] text-dim">NODES</span>
            </div>
            <input
              type="range"
              min={1}
              max={500}
              step={1}
              value={nodes}
              onChange={(e) => setNodes(parseInt(e.target.value))}
              className="mt-5 w-full"
              aria-label="Number of deployed nodes"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
              <span>1</span>
              <span>250</span>
              <span>500</span>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-line bg-deep/70 p-4 font-mono text-[11px] leading-relaxed text-dim">
            <span className="text-emeraldx">HONEST MATH</span> — linear scaling assumes every node
            sees similar wake exposure. Real corridors have gaps, ramps and congestion, so treat
            these as optimistic planning ceilings, not promises.
          </div>
        </div>

        {/* results */}
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <div className="panel p-6 sm:col-span-2">
            <div className="flex items-baseline justify-between">
              <span className="mono-label">DAILY HARVEST AT THIS DEPLOYMENT</span>
              <span className="sim-badge">MODEL ESTIMATE</span>
            </div>
            <div className="mt-3 flex items-baseline gap-4">
              <span className="font-display text-5xl font-bold tracking-mega text-amberx">
                {total.kwh.toFixed(2)}
                <span className="ml-2 text-base font-normal text-dim">kWh / day</span>
              </span>
              <span className="hidden font-mono text-xs text-faint sm:block">
                = {fmt(total.wh)} Wh · {perNode.wattHoursPerDay.toFixed(1)} Wh × {nodes} nodes
              </span>
            </div>
          </div>

          <ComparisonCard
            icon={<BatteryCharging className="h-5 w-5" />}
            label="SMARTPHONE CHARGES / DAY"
            value={total.phones}
            unit=""
            note={`≈ ${PHONE_CHARGE_WH} Wh each`}
            pct={(PHONE_CHARGE_WH * Math.max(total.phones, 1)) / Math.max(total.wh, 1)}
          />
          <ComparisonCard
            icon={<Route className="h-5 w-5" />}
            label="SOLAR ROAD STUDS POWERED / NIGHT"
            value={total.studs}
            unit=""
            note={`≈ ${ROAD_STUD_NIGHT_WH} Wh per stud-night`}
            pct={(ROAD_STUD_NIGHT_WH * Math.max(total.studs, 1)) / Math.max(total.wh, 1)}
          />
          <div className="panel p-6 sm:col-span-2">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-amberx" />
              <span className="font-mono text-[11px] tracking-[0.16em] text-dim">
                EQUIVALENT STREETLIGHT HOURS / DAY
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <Lightbulb className="h-4 w-4 text-amberx" />
              <span className="font-display text-3xl font-bold text-ink">
                {total.lightHours.toFixed(1)} h
              </span>
              <span className="font-mono text-[11px] text-faint">(60 W LED)</span>
            </div>
            <div className="mt-3 h-1.5 w-full rounded bg-line">
              <div
                className="h-full rounded bg-gradient-to-r from-accent to-amberx transition-all duration-300"
                style={{ width: `${Math.min(100, (total.lightHours / 40) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* positioning */}
      <div className="panel-flat mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line p-0 md:grid-cols-3">
        {[
          {
            t: 'NOT A REPLACEMENT',
            d: 'VAYU-GRID does not compete with solar or grid power. It targets the niche between them where wind is free, local and continuous.',
          },
          {
            t: 'A SENSOR-FIRST GRID',
            d: 'Every harvested milliwatt also proves a measurement chain: flow sensing, rotor response, energy accounting — data infrastructure first.',
          },
          {
            t: 'DEMAND-SIDE FIT',
            d: 'Roadside loads are small, distributed and autonomous: studs, signage, air-quality sensors, emergency beacons.',
          },
        ].map((c) => (
          <div key={c.t} className="bg-deep/80 p-6">
            <div className="font-mono text-[10px] tracking-[0.2em] text-rosex">{c.t}</div>
            <p className="mt-2 text-xs leading-relaxed text-mist">{c.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ComparisonCard({
  icon,
  label,
  value,
  unit,
  note,
  pct,
}: {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  note: string
  pct: number
}) {
  return (
    <div className="panel p-6">
      <div className="flex items-center gap-3">
        <span className="text-accent">{icon}</span>
        <span className="font-mono text-[11px] tracking-[0.16em] text-dim">{label}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold text-ink">
        {value >= 100 ? value.toFixed(0) : value.toFixed(1)}
        <span className="ml-1 text-sm font-normal text-faint">{unit}</span>
      </div>
      <div className="mt-1 font-mono text-[10px] text-faint">{note}</div>
      <div className="mt-3 h-1 w-full rounded bg-line">
        <div
          className="h-full rounded bg-accent/70 transition-all duration-300"
          style={{ width: `${Math.max(4, Math.min(100, pct * 100))}%` }}
        />
      </div>
    </div>
  )
}
