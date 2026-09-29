import { useEffect, useRef } from 'react'

interface TurbineProps {
  /** rotor speed for animation; 0 = static */
  rpm: number
  guideOn?: boolean
  className?: string
}

/**
 * Front-elevation stylised helical Savonius VAWT.
 * Rotation angle is accumulated on a rAF loop and applied directly to the
 * DOM node — no React re-renders per frame.
 */
export default function Turbine({ rpm, guideOn = false, className }: TurbineProps) {
  const rotorRef = useRef<SVGGElement>(null)
  const rpmRef = useRef(rpm)
  useEffect(() => {
    rpmRef.current = rpm
  })

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let angle = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      angle = (angle + (rpmRef.current / 60) * 360 * dt) % 360
      if (rotorRef.current) {
        rotorRef.current.setAttribute('transform', `rotate(${angle.toFixed(2)} 100 118)`)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const spinning = rpm > 1

  return (
    <svg viewBox="0 0 200 300" className={className} role="img" aria-label="Vertical axis wind turbine">
      <defs>
        <linearGradient id="bladeA" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#155e75" />
          <stop offset="55%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a5f3fc" />
        </linearGradient>
        <linearGradient id="bladeB" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#164e63" />
          <stop offset="60%" stopColor="#0e7490" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
        <linearGradient id="guideG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3352" />
          <stop offset="100%" stopColor="#0d1b30" />
        </linearGradient>
        <radialGradient id="hubGlow">
          <stop offset="0%" stopColor="rgba(34,211,238,0.55)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </radialGradient>
      </defs>

      {/* mast */}
      <rect x="97.5" y="118" width="5" height="130" rx="2" fill="#13233c" />
      <rect x="80" y="244" width="40" height="8" rx="3" fill="#15243c" />

      {/* generator housing */}
      <g>
        <rect x="82" y="254" width="36" height="22" rx="5" fill="#0d1b30" stroke="#22d3ee" strokeOpacity="0.35" />
        <circle cx="100" cy="265" r="4" fill={spinning ? '#22d3ee' : '#1e3352'} className={spinning ? 'animate-pulseglow' : ''} />
        <text x="100" y="290" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="2" fill="#5f7a96">
          GEN
        </text>
      </g>

      {guideOn && (
        <g>
          {/* left guide: curves wake into advancing blade */}
          <path d="M28 52 C18 90 18 150 30 186 L44 182 C34 148 34 92 44 58 Z" fill="url(#guideG)" stroke="#22d3ee" strokeOpacity="0.45" strokeWidth="1.2" />
          {/* right guide: shields returning blade */}
          <path d="M172 52 C182 90 182 150 170 186 L156 182 C166 148 166 92 156 58 Z" fill="url(#guideG)" stroke="#22d3ee" strokeOpacity="0.45" strokeWidth="1.2" />
        </g>
      )}

      {/* end plates */}
      <ellipse cx="100" cy="46" rx="52" ry="10" fill="#0d1b30" stroke="#1e3352" />
      <ellipse cx="100" cy="190" rx="52" ry="10" fill="#0d1b30" stroke="#1e3352" />

      {/* rotating blades */}
      <g ref={rotorRef}>
        <path
          d="M100 50 C64 62 66 100 100 112 C134 124 136 162 100 178 C88 183 78 180 70 172 C86 176 96 170 96 158 C96 140 74 138 68 122 C60 102 72 76 100 62 Z"
          fill="url(#bladeA)"
          opacity="0.95"
        />
        <path
          d="M100 178 C136 166 134 128 100 116 C66 104 64 66 100 50 C112 45 122 48 130 56 C114 52 104 58 104 70 C104 88 126 90 132 106 C140 126 128 152 100 166 Z"
          fill="url(#bladeB)"
          opacity="0.9"
        />
        {/* shaft */}
        <line x1="100" y1="46" x2="100" y2="190" stroke="#22d3ee" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="118" r="26" fill="url(#hubGlow)" />
        <circle cx="100" cy="118" r="5" fill="#22d3ee" />
      </g>

      {spinning && (
        <ellipse cx="100" cy="118" rx="58" ry="86" fill="none" stroke="#22d3ee" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="4 8" className="animate-flowdash" />
      )}
    </svg>
  )
}
