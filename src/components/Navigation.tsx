import { useEffect, useState } from 'react'
import { Menu, X, Zap } from 'lucide-react'

const LINKS = [
  { href: '#concept', label: 'Concept' },
  { href: '#how', label: 'How It Works' },
  { href: '#turbine', label: 'Turbine' },
  { href: '#demo', label: 'Live Demo' },
  { href: '#data', label: 'Data' },
  { href: '#deployment', label: 'Deployment' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${
        scrolled ? 'border-line bg-void/85 backdrop-blur-xl' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="section-pad mx-auto flex h-14 max-w-[1400px] items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5" aria-label="VAYU-GRID home">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-edge bg-deep shadow-glow-sm">
            <Zap className="h-4 w-4 text-accent" />
          </span>
          <span className="font-display text-lg font-bold tracking-wide2">
            VAYU<span className="text-accent">-</span>GRID
          </span>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist transition-colors hover:text-accent"
            >
              {l.label}
            </a>
          ))}
          <a href="#demo" className="btn-primary !px-4 !py-2 text-xs">
            LIVE DEMO →
          </a>
        </div>

        <button
          className="grid h-9 w-9 place-items-center rounded-md border border-line text-mist lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-void/95 px-5 pb-5 pt-3 backdrop-blur-xl lg:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-mist hover:text-accent"
            >
              {l.label}
            </a>
          ))}
          <a href="#demo" onClick={() => setOpen(false)} className="btn-primary mt-3 w-full justify-center">
            LIVE DEMO →
          </a>
        </div>
      )}
    </header>
  )
}
