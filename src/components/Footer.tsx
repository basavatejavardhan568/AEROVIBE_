import { ArrowDown } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      {/* final CTA */}
      <div className="section-pad mx-auto max-w-[1400px] text-center">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" aria-hidden="true" />

        <div className="relative">
          <div className="mono-label justify-center">THE CLOSING ARGUMENT</div>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-bold leading-tight tracking-mega md:text-5xl">
            Traffic never stops.
            <br />
            Neither does the data.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-mist">
            VAYU-GRID turns wasted wake energy into measured, honest electricity — one node,
            one gust, one datapoint at a time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="#demo" className="btn-primary">
              EXPLORE THE DEMO <ArrowDown className="h-4 w-4" />
            </a>
            <a href="#science" className="btn-ghost">
              VIEW RESEARCH
            </a>
          </div>
        </div>
      </div>

      {/* footer bar */}
      <div className="border-t border-line bg-deep/60">
        <div className="section-pad mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 py-6 md:flex-row md:!py-6">
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded bg-accent font-display text-sm font-bold text-void">V</span>
            <span className="font-display text-sm font-bold tracking-wide2">VAYU-GRID</span>
            <span className="font-mono text-[10px] tracking-[0.16em] text-faint">© 2026</span>
          </div>
          <p className="text-center font-mono text-[10px] leading-relaxed tracking-[0.08em] text-faint">
            HACKATHON PROTOTYPE · SIMPLIFIED ENGINEERING MODEL — NOT CFD, NOT FIELD DATA · ALL
            SOURCES LINKED IN SECTION 07
          </p>
          <a href="#top" className="font-mono text-[10px] tracking-[0.16em] text-dim hover:text-accent">
            BACK TO TOP ↑
          </a>
        </div>
      </div>
    </footer>
  )
}
