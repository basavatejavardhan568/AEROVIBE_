import { useEffect, useRef } from 'react'
import {
  passEnergy,
  rpmFromAirflow,
  simulateAtWind,
  wakeSpeed,
  type Crosswind,
  type SimConfig,
  type VehicleType,
} from '../lib/simulation'

export interface PassEvent {
  type: VehicleType
  energyWh: number
  ts: Date
}

export interface SceneTelemetry {
  airflow: number
  rpm: number
  voltage: number
  currentMa: number
  powerW: number
  passes: number
  energyWh: number
}

interface TrafficSceneProps {
  speedKmh: number
  vehicleType: VehicleType
  guideOn: boolean
  crosswind?: Crosswind
  autoTraffic?: boolean
  density?: 'low' | 'medium' | 'high'
  /** increment key to fire a burst of n vehicles (SEND TRAFFIC) */
  burst?: { key: number; n: number }
  onPass?: (e: PassEvent) => void
  onFrame?: (t: SceneTelemetry) => void
  className?: string
}

interface VehicleS {
  type: VehicleType
  x: number
  vPx: number // px per second
  emitted: boolean
}
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}
interface Pulse {
  t0: number
}

const SPAWN_MS = { low: 2800, medium: 1500, high: 750 }
const PX_PER_M = 6.5

const TYPE_LEN_PX: Record<VehicleType, number> = { car: 74, suv: 88, bus: 126, truck: 140 }

export default function TrafficScene({
  speedKmh,
  vehicleType,
  guideOn,
  crosswind = 'low',
  autoTraffic = true,
  density = 'medium',
  burst,
  onPass,
  onFrame,
  className,
}: TrafficSceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const cfgRef = useRef<SimConfig>({ vehicleSpeedKmh: speedKmh, vehicleType, guideOn, crosswind })
  const cbRef = useRef({ onPass, onFrame })
  useEffect(() => {
    cfgRef.current = { vehicleSpeedKmh: speedKmh, vehicleType, guideOn, crosswind }
    cbRef.current = { onPass, onFrame }
  })
  const burstQueue = useRef(0)
  const firstBurst = useRef(true)

  useEffect(() => {
    if (!burst || firstBurst.current) {
      firstBurst.current = false
      return
    }
    burstQueue.current += burst.n
  }, [burst])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let W = 0
    let H = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = Math.max(320, rect.width)
      H = Math.max(240, rect.height)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    // ---- scene state -------------------------------------------------
    const vehicles: VehicleS[] = []
    const particles: Particle[] = []
    const pulses: Pulse[] = []
    let bladeAngle = 0
    let rpmSmoothed = 0
    let storedWh = 0
    let passes = 0
    let lastSpawn = performance.now()
    let lastBurstSpawn = 0
    let lastFrameCb = 0
    let spawnIdx = 0
    const cycle: VehicleType[] = ['car', 'car', 'suv', 'car', 'bus', 'car', 'truck']

    const layout = () => ({
      laneY: H * 0.4,
      turbineX: W * 0.76,
      hubY: H * 0.62,
      rotorR: Math.min(64, H * 0.16),
      nodeX: W * 0.76 + 8,
      nodeY: H - 34,
      infPx: 260,
    })

    const proximity = (dx: number, inf: number) =>
      dx >= -30 ? Math.max(0, 1 - Math.abs(dx) / inf) ** 1.5 : 0

    let lastT = performance.now()

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000)
      lastT = now
      const L = layout()
      const cfg = cfgRef.current
      const vMs = cfg.vehicleSpeedKmh / 3.6

      // --- spawning ---------------------------------------------------
      const wantAuto =
        autoTraffic && now - lastSpawn > SPAWN_MS[density] && vehicles.length < 10
      let spawnedThisFrame = false
      if (wantAuto) {
        lastSpawn = now
        spawnedThisFrame = true
        spawnIdx++
      }
      if (burstQueue.current > 0 && now - lastBurstSpawn > 420) {
        lastBurstSpawn = now
        burstQueue.current--
        spawnedThisFrame = true
        spawnIdx++
      }
      if (spawnedThisFrame) {
        vehicles.push({
          type: cycle[spawnIdx % cycle.length],
          x: -TYPE_LEN_PX[cycle[spawnIdx % cycle.length]] - 20,
          vPx: Math.max(60, vMs * PX_PER_M),
          emitted: false,
        })
      }

      // --- update vehicles ---------------------------------------------
      for (let i = vehicles.length - 1; i >= 0; i--) {
        const veh = vehicles[i]
        veh.x += veh.vPx * dt
        const dxToHub = L.turbineX - veh.x
        // emit wake while approaching/past turbine
        if (Math.abs(dxToHub) < L.infPx) {
          const gust = wakeSpeed(cfg) * proximity(dxToHub, L.infPx)
          const nEm = gust > 0.3 ? 2 : 1
          for (let p = 0; p < nEm; p++) {
            if (particles.length > 160) break
            const jitter = (spawnIdx * 37 + p * 91 + Math.floor(now / 16)) % 21 - 10
            const cw = cfg.crosswind === 'high' ? 26 : cfg.crosswind === 'medium' ? 12 : 4
            particles.push({
              x: veh.x - 24 - p * 14,
              y: L.laneY + jitter * 0.9,
              vx: Math.max(40, veh.vPx * 0.42),
              vy: (L.hubY - L.laneY) * 0.55 + jitter + cw * (jitter > 0 ? 0.5 : -0.5),
              life: 0,
              maxLife: 0.85 + (p % 3) * 0.12,
            })
          }
        }
        // pass event when crossing hub x
        if (!veh.emitted && veh.x >= L.turbineX) {
          veh.emitted = true
          passes++
          const eWh = passEnergy(cfg)
          storedWh += eWh
          pulses.push({ t0: now }, { t0: now + 180 }, { t0: now + 360 })
          cbRef.current.onPass?.({ type: veh.type, energyWh: eWh, ts: new Date() })
        }
        if (veh.x > W + 200) vehicles.splice(i, 1)
      }

      // --- instantaneous airflow at rotor (deterministic) ---------------
      let airflowInst = 0
      for (const veh of vehicles) {
        const dx = L.turbineX - veh.x
        airflowInst = Math.max(
          airflowInst,
          wakeSpeed(cfg) * proximity(dx, L.infPx)
        )
      }

      const targetRpm = rpmFromAirflow(airflowInst)
      rpmSmoothed += (targetRpm - rpmSmoothed) * Math.min(1, dt * 4)
      bladeAngle =
        (bladeAngle + (Math.min(rpmSmoothed, 500) / 60) * 360 * dt * 0.35) % 360

      // --- telemetry callback (~12 Hz) -----------------------------------
      if (now - lastFrameCb > 80 && cbRef.current.onFrame) {
        lastFrameCb = now
        const sim = simulateAtWind(airflowInst, cfg.guideOn)
        cbRef.current.onFrame({
          airflow: sim.airflow,
          rpm: sim.rpm,
          voltage: sim.voltage,
          currentMa: sim.currentMa,
          powerW: sim.powerW,
          passes,
          energyWh: Math.round(storedWh * 100000) / 100000,
        })
      }

      /* ------------------------------ draw ---------------------------- */
      ctx.clearRect(0, 0, W, H)

      // road band
      const roadTop = L.laneY - H * 0.09
      const roadBot = L.laneY + H * 0.11
      ctx.fillStyle = '#081120'
      ctx.fillRect(0, roadTop, W, roadBot - roadTop)
      ctx.strokeStyle = '#15243c'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, roadTop)
      ctx.lineTo(W, roadTop)
      ctx.moveTo(0, roadBot)
      ctx.lineTo(W, roadBot)
      ctx.stroke()
      // lane dashes
      ctx.strokeStyle = 'rgba(157,180,204,0.28)'
      ctx.setLineDash([26, 22])
      ctx.beginPath()
      ctx.moveTo(0, L.laneY)
      ctx.lineTo(W, L.laneY)
      ctx.stroke()
      ctx.setLineDash([])

      // roadside LEDs glow with stored energy
      const brightness = Math.min(1, storedWh / 0.02)
      for (let i = 0; i < 3; i++) {
        const lx = W * (0.18 + i * 0.22)
        ctx.fillStyle = `rgba(251,191,36,${0.15 + brightness * 0.75})`
        ctx.beginPath()
        ctx.arc(lx, roadTop - 26, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#15243c'
        ctx.beginPath()
        ctx.moveTo(lx, roadTop - 22)
        ctx.lineTo(lx, roadTop)
        ctx.stroke()
        if (brightness > 0.05) {
          const g = ctx.createRadialGradient(lx, roadTop - 26, 0, lx, roadTop - 26, 46)
          g.addColorStop(0, `rgba(251,191,36,${brightness * 0.28})`)
          g.addColorStop(1, 'rgba(251,191,36,0)')
          ctx.fillStyle = g
          ctx.fillRect(lx - 48, roadTop - 76, 96, 100)
        }
      }

      // wake particles → streaks toward hub
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life += dt
        const dxc = L.turbineX - p.x
        const pull = cfg.guideOn ? 5.2 : 3.2
        p.vx += (dxc / L.infPx) * pull * 60 * dt
        p.vy += ((L.hubY - p.y) / (H * 0.25)) * (cfg.guideOn ? 130 : 70) * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.life > p.maxLife || p.x > W + 40) {
          particles.splice(i, 1)
          continue
        }
        const a = Math.max(0, 1 - p.life / p.maxLife) * 0.65
        ctx.strokeStyle = `rgba(103,232,249,${a})`
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05)
        ctx.stroke()
      }

      // guide walls
      if (cfg.guideOn) {
        ctx.save()
        ctx.translate(L.turbineX, L.hubY)
        ctx.strokeStyle = 'rgba(34,211,238,0.55)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(0, 0, L.rotorR + 26, Math.PI * 0.62, Math.PI * 1.06)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(0, 0, L.rotorR + 26, Math.PI * 1.45, Math.PI * 1.92)
        ctx.stroke()
        ctx.restore()
      }

      // turbine pole + node
      ctx.strokeStyle = '#13233c'
      ctx.lineWidth = 7
      ctx.beginPath()
      ctx.moveTo(L.turbineX, L.hubY + 8)
      ctx.lineTo(L.nodeX, L.nodeY - 20)
      ctx.stroke()

      // rotating blades (side view of helical Savonius)
      const blades = [0, 1, 2]
      for (const i of blades) {
        const th = ((bladeAngle + i * 120) * Math.PI) / 180
        const off = Math.sin(th) * L.rotorR * 0.72
        const depth = (Math.cos(th) + 1) / 2 // 0 back → 1 front
        const bw = 10 + depth * 8
        const alpha = 0.35 + depth * 0.6
        ctx.fillStyle =
          i % 2 === 0
            ? `rgba(34,211,238,${alpha})`
            : `rgba(14,116,144,${alpha})`
        const bx = L.turbineX + off
        const by = L.hubY - L.rotorR * 0.78
        const bh = L.rotorR * 1.56
        ctx.beginPath()
        ctx.roundRect(bx - bw / 2, by, bw, bh, bw / 2)
        ctx.fill()
      }
      // end plates
      ctx.fillStyle = '#0d1b30'
      ctx.strokeStyle = '#1e3352'
      ctx.lineWidth = 1
      ;[L.hubY - L.rotorR * 0.86, L.hubY + L.rotorR * 0.86].forEach((ey) => {
        ctx.beginPath()
        ctx.ellipse(L.turbineX, ey, L.rotorR * 0.95, 6, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      })
      // hub dot
      ctx.fillStyle = rpmSmoothed > 2 ? '#22d3ee' : '#1e3352'
      ctx.beginPath()
      ctx.arc(L.turbineX, L.hubY, 4.5, 0, Math.PI * 2)
      ctx.fill()
      if (rpmSmoothed > 2) {
        const gg = ctx.createRadialGradient(L.turbineX, L.hubY, 0, L.turbineX, L.hubY, 60)
        gg.addColorStop(0, 'rgba(34,211,238,0.25)')
        gg.addColorStop(1, 'rgba(34,211,238,0)')
        ctx.fillStyle = gg
        ctx.fillRect(L.turbineX - 62, L.hubY - 62, 124, 124)
      }

      // energy pulses along wire to node box
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pu = pulses[i]
        const prog = (now - pu.t0) / 700
        if (prog < 0) continue
        if (prog > 1) {
          pulses.splice(i, 1)
          continue
        }
        const px = L.turbineX + (L.nodeX - L.turbineX) * prog
        const py = L.hubY + 10 + (L.nodeY - 24 - L.hubY) * prog
        ctx.fillStyle = 'rgba(251,191,36,0.95)'
        ctx.shadowColor = 'rgba(251,191,36,0.9)'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(px, py, 3.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // energy node box
      const nw = 84
      const nh = 30
      ctx.fillStyle = '#0d1b30'
      ctx.strokeStyle = 'rgba(251,191,36,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(L.nodeX - nw / 2, L.nodeY - nh / 2, nw, nh, 6)
      ctx.fill()
      ctx.stroke()
      // fill level
      const fillFrac = Math.min(1, storedWh / 0.04)
      if (fillFrac > 0.01) {
        ctx.fillStyle = 'rgba(251,191,36,0.55)'
        ctx.beginPath()
        ctx.roundRect(
          L.nodeX - nw / 2 + 4,
          L.nodeY + nh / 2 - 8,
          (nw - 8) * fillFrac,
          4,
          2
        )
        ctx.fill()
      }
      ctx.font = '600 8px "JetBrains Mono", monospace'
      ctx.fillStyle = '#9db4cc'
      ctx.textAlign = 'center'
      ctx.fillText('ENERGY NODE', L.nodeX, L.nodeY - 4)

      // vehicles (top-view silhouettes above lane line)
      for (const veh of vehicles) {
        const len = TYPE_LEN_PX[veh.type]
        const wid = veh.type === 'car' ? 22 : veh.type === 'suv' ? 25 : 27
        const vy = L.laneY - wid - 4
        ctx.fillStyle =
          veh.type === 'truck'
            ? 'rgba(154,127,184,0.92)'
            : veh.type === 'bus'
              ? 'rgba(194,145,79,0.92)'
              : veh.type === 'suv'
                ? 'rgba(125,147,173,0.92)'
                : 'rgba(138,165,194,0.92)'
        ctx.beginPath()
        ctx.roundRect(veh.x - len / 2, vy, len, wid, wid * 0.42)
        ctx.fill()
        // windshield hint
        ctx.fillStyle = 'rgba(11,21,35,0.8)'
        ctx.beginPath()
        ctx.roundRect(veh.x + len * 0.12, vy + 3, len * 0.16, wid - 6, 4)
        ctx.fill()
        // headlight glow
        ctx.fillStyle = 'rgba(254,243,199,0.85)'
        ctx.fillRect(veh.x + len / 2 - 2, vy + 4, 3, 4)
        ctx.fillRect(veh.x + len / 2 - 2, vy + wid - 8, 3, 4)
      }

      // labels
      ctx.font = '600 9px "JetBrains Mono", monospace'
      ctx.fillStyle = '#5f7a96'
      ctx.textAlign = 'center'
      ctx.fillText('VAWT NODE', L.turbineX, L.hubY + L.rotorR + 26)
      ctx.textAlign = 'left'

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [autoTraffic, density])

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative' }}>
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
    </div>
  )
}
