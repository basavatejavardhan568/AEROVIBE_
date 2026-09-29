import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Wrench } from 'lucide-react'

const BOM = [
  { item: 'ESP32 DevKit v1', qty: '1', cost: 450, role: 'MCU · Wi-Fi telemetry' },
  { item: 'N20 geared DC motor (as generator)', qty: '1', cost: 120, role: '3–12 V output' },
  { item: 'Helical Savonius rotor (3D-print / sheet)', qty: '1', cost: 250, role: 'Ø30 × 45 cm' },
  { item: 'VAYU-GUIDE vanes (acrylic)', qty: '3', cost: 80, role: '+25% model gain' },
  { item: 'INA219 current/voltage sensor', qty: '1', cost: 150, role: 'I²C power meter' },
  { item: 'Hall sensor A3144 + magnet', qty: '1 set', cost: 40, role: 'RPM verification' },
  { item: 'Bridge rectifier (SS34 ×4)', qty: '1', cost: 30, role: 'AC→DC from motor' },
  { item: 'TP4056 + 18650 cell holder', qty: '1', cost: 90, role: 'Storage + LED load' },
  { item: 'Acrylic base, standoffs, wiring', qty: 'set', cost: 180, role: 'Chassis' },
]

const STEPS = [
  {
    t: 'POWER THE NODE',
    d: 'Connect the 18650 pack. ESP32 boots and starts streaming INA219 + Hall readings to this dashboard over Wi-Fi.',
  },
  {
    t: 'SHOW THE IDLE STATE',
    d: 'With no traffic, RPM ≈ 0 and POWER ≈ 0 W on the live readout — the turbine waits for airflow.',
  },
  {
    t: 'SEND A VEHICLE',
    d: 'Slide a model car past the rotor at highway speed. Watch RPM spike, voltage rise and Wh tick up in the event log.',
  },
  {
    t: 'TOGGLE THE GUIDE',
    d: 'Remove the VAYU-GUIDE vanes and repeat the same pass — measurably less energy per event.',
  },
  {
    t: 'SWITCH TRUCK VS CAR',
    d: 'Repeat with a heavier vehicle profile — larger wake factor, more harvested energy per pass.',
  },
]

export default function Prototype() {
  const [step, setStep] = useState(0)

  return (
    <section id="prototype" className="section-pad mx-auto max-w-[1400px] pb-20 md:pb-28">
      <div className="mono-label">SECTION 08 — PHYSICAL PROTOTYPE</div>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-mega md:text-5xl">
        Built to be measured
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist">
        The website is the twin of a real benchtop node. Every number it shows can be replaced by
        hardware truth through the HARDWARE mode in Section 04.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* BOM */}
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-mist">
              <Wrench className="h-4 w-4 text-accent" /> BILL OF MATERIALS
            </span>
            <span className="font-mono text-xs text-emeraldx">≈ ₹{BOM.reduce((a, b) => a + b.cost, 0)} TOTAL</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line font-mono text-[10px] tracking-[0.16em] text-faint">
                <th className="px-6 py-2.5 font-normal">COMPONENT</th>
                <th className="px-2 py-2.5 font-normal">QTY</th>
                <th className="px-2 py-2.5 font-normal">₹</th>
                <th className="px-6 py-2.5 text-right font-normal">ROLE</th>
              </tr>
            </thead>
            <tbody>
              {BOM.map((b) => (
                <tr key={b.item} className="border-b border-line/60 last:border-0">
                  <td className="px-6 py-3 text-xs font-medium text-ink">{b.item}</td>
                  <td className="px-2 py-3 font-mono text-xs text-dim">{b.qty}</td>
                  <td className="px-2 py-3 font-mono text-xs text-mist">{b.cost}</td>
                  <td className="px-6 py-3 text-right font-mono text-[10px] text-faint">{b.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid-bg px-6 py-4 font-mono text-[10px] leading-relaxed text-faint">
            SIGNAL CHAIN: ROTOR → N20 GENERATOR → BRIDGE RECTIFIER → INA219 → ESP32 → THIS DASHBOARD
            · STORAGE BRANCH: TP4056 → 18650 → LED LOAD
          </div>
        </div>

        {/* presentation mode */}
        <div className="panel relative flex flex-col p-6">
          <div className="flex items-center justify-between">
            <span className="mono-label">JUDGES’ DEMO SCRIPT — PRESENTATION MODE</span>
            <span className="font-mono text-xs text-dim">
              {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
            </span>
          </div>

          {/* progress rail */}
          <div className="mt-5 flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1 flex-1 rounded transition-colors ${
                  i <= step ? 'bg-accent' : 'bg-line hover:bg-edge'
                }`}
              />
            ))}
          </div>

          <div className="relative mt-8 min-h-[170px] flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                <div className="font-display text-6xl font-bold text-panel">{`0${step + 1}`}</div>
                <h4 className="-mt-4 font-display text-xl font-bold tracking-wide2 text-accent">
                  {STEPS[step].t}
                </h4>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-mist">{STEPS[step].d}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              aria-label="Previous step"
              className="rounded-md border border-line p-2 text-mist transition-colors hover:border-accent hover:text-accent disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={step === STEPS.length - 1}
              aria-label="Next step"
              className="rounded-md border border-line p-2 text-mist transition-colors hover:border-accent hover:text-accent disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={() => setStep(0)} className="ml-auto font-mono text-[11px] text-dim underline-offset-4 hover:text-accent hover:underline">
              RESTART SCRIPT
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
