import type { VehicleType } from '../lib/simulation'

const STYLES: Record<VehicleType, { body: string; w: number; h: number; label: string }> = {
  car: { body: '#8aa5c2', w: 46, h: 16, label: 'CAR' },
  suv: { body: '#7d93ad', w: 54, h: 20, label: 'SUV' },
  bus: { body: '#c2914f', w: 78, h: 22, label: 'BUS' },
  truck: { body: '#9a7fb8', w: 88, h: 24, label: 'TRUCK' },
}

interface VehicleProps {
  type: VehicleType
  className?: string
}

/** Simple top-view vehicle silhouette used inside the highway scene. */
export default function Vehicle({ type, className }: VehicleProps) {
  const s = STYLES[type]
  return (
    <svg
      viewBox="0 0 100 34"
      width={s.w * 1.6}
      height={s.h * 1.6}
      className={className}
      role="img"
      aria-label={`${s.label} vehicle`}
    >
      <rect x="4" y="4" width="92" height="26" rx="10" fill={s.body} opacity="0.92" />
      {/* windshield */}
      <rect x="58" y="8" width="14" height="18" rx="4" fill="#0b1523" opacity="0.85" />
      {type === 'bus' || type === 'truck' ? (
        <>
          <rect x="12" y="8" width="30" height="18" rx="3" fill="#0b1523" opacity="0.55" />
          <rect x="76" y="8" width="14" height="18" rx="3" fill="#0b1523" opacity="0.75" />
        </>
      ) : (
        <rect x="30" y="8" width="16" height="18" rx="4" fill="#0b1523" opacity="0.55" />
      )}
      {/* headlight beam edge + taillights */}
      <rect x="94" y="9" width="3" height="6" rx="1.5" fill="#fef3c7" />
      <rect x="94" y="19" width="3" height="6" rx="1.5" fill="#fef3c7" />
      <rect x="4" y="9" width="2.5" height="6" rx="1" fill="#fb7185" />
      <rect x="4" y="19" width="2.5" height="6" rx="1" fill="#fb7185" />
    </svg>
  )
}
