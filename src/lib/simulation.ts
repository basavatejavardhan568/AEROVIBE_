/**
 * VAYU-GRID deterministic simulation engine.
 *
 * A simplified engineering model (NOT CFD) calibrated against published
 * field/wind-tunnel research on vehicle-induced airflow and Savonius VAWTs:
 *
 *  - Roadside wake gusts of ~2.7–5.6 m/s from passing vehicles at highway
 *    speed (Bani-Hani et al. 2018; Cyprus in-road LED study 2025).
 *  - Truck/SUV wakes stronger than cars (~1.6–2.5x TKE, Madrid field study).
 *  - Guide vanes/curtains improving Savonius output +30%…+150%
 *    (Altan & Atilgan, Renewable Energy 2008/2010; Ogawa deflector studies).
 *  - Savonius Cp typically 0.12–0.25 (wind tunnel data, Sandia/Salleh).
 *  - Brushed DC generator: V = ke × RPM, efficiency ~0.5–0.6 incl. rectifier.
 *
 * All values are reproducible from the inputs — no randomness.
 */

export type VehicleType = 'car' | 'suv' | 'bus' | 'truck'
export type Crosswind = 'low' | 'medium' | 'high'

export interface SimConfig {
  vehicleSpeedKmh: number
  vehicleType: VehicleType
  guideOn: boolean
  crosswind: Crosswind
}

export interface SimResult {
  /** airflow speed reaching the rotor plane, m/s */
  airflow: number
  /** rotor rotational speed, RPM */
  rpm: number
  /** generator open-circuit-ish terminal voltage, V */
  voltage: number
  /** load current, mA */
  currentMa: number
  /** electrical power, W */
  powerW: number
}

/** Rotor geometry of the reference prototype node */
const ROTOR_DIAMETER_M = 0.3
const ROTOR_HEIGHT_M = 0.45
export const ROTOR_SWEPT_AREA_M2 = ROTOR_DIAMETER_M * ROTOR_HEIGHT_M
const ROTOR_RADIUS_M = ROTOR_DIAMETER_M / 2

const AIR_DENSITY = 1.225 // kg/m3 at sea level, 15 C

/** Tip-speed ratio of a drag-driven Savonius at operating point */
const TIP_SPEED_RATIO = 0.8

/** Generator back-EMF constant for the N20-class motor, V per RPM */
const GENERATOR_KE = 0.014

/** Rectifier + wiring losses */
const ELECTRICAL_EFFICIENCY = 0.55

interface TypeProfile {
  label: string
  /** fraction of vehicle speed measurable as near-road gust at rotor offset */
  wakeFactor: number
  icon: string
}
export const TYPE_PROFILES: Record<VehicleType, TypeProfile> = {
  car: { label: 'Car', wakeFactor: 0.18, icon: 'car' },
  suv: { label: 'SUV', wakeFactor: 0.22, icon: 'suv' },
  bus: { label: 'Bus', wakeFactor: 0.26, icon: 'bus' },
  truck: { label: 'Truck', wakeFactor: 0.31, icon: 'truck' },
}

/** Power coefficient Cp — guide redirects flow onto advancing blade & shields returning blade */
const CP_BASELINE = 0.14
const CP_GUIDED = 0.24

/** Effective velocity gain from flow guidance (conservative vs literature +50…+240%) */
const GUIDE_VELOCITY_GAIN = 1.25

const CROSSWIND_FACTOR: Record<Crosswind, number> = {
  low: 1.0,
  medium: 0.85,
  high: 0.65,
}

export function wakeSpeed(cfg: SimConfig): number {
  if (cfg.vehicleSpeedKmh <= 0) return 0
  const vMs = cfg.vehicleSpeedKmh / 3.6
  const base =
    vMs * TYPE_PROFILES[cfg.vehicleType].wakeFactor * CROSSWIND_FACTOR[cfg.crosswind]
  return base * (cfg.guideOn ? GUIDE_VELOCITY_GAIN : 1)
}

export function simulate(cfg: SimConfig): SimResult {
  const v = wakeSpeed(cfg)
  return simulateAtWind(v, cfg.guideOn)
}

/** Core conversion chain from a given wind speed at the rotor plane. */
export function simulateAtWind(windMs: number, guided: boolean): SimResult {
  // cut-in behaviour: drag rotor needs ~0.4 m/s to overcome static friction
  const effectiveV = windMs < 0.4 ? 0 : windMs

  const omega = (TIP_SPEED_RATIO * effectiveV) / ROTOR_RADIUS_M // rad/s
  const rpm = (omega * 60) / (2 * Math.PI)

  const pAir = 0.5 * AIR_DENSITY * ROTOR_SWEPT_AREA_M2 * Math.pow(effectiveV, 3)
  const cp = guided ? CP_GUIDED : CP_BASELINE
  const pElec = pAir * cp * ELECTRICAL_EFFICIENCY

  const voltage = GENERATOR_KE * rpm
  // load line: simple resistive model, clamp to avoid unrealistic currents
  const currentA = Math.min(0.45, voltage > 0 ? pElec / Math.max(voltage, 0.05) : 0)
  // keep P consistent with V*I under the clamp
  const powerW = voltage * currentA

  return {
    airflow: round(windMs, 2),
    rpm: round(rpm, 0),
    voltage: round(voltage, 2),
    currentMa: round(currentA * 1000, 0),
    powerW: round(powerW, 3),
  }
}

/** Energy of one pass event, Wh — gust duration scales inversely with speed */
export function passEnergy(cfg: SimConfig): number {
  const r = simulate(cfg)
  const vMs = cfg.vehicleSpeedKmh / 3.6
  // vehicle influence zone ~ 18 m; dwell time = zone / vehicle speed
  const dwellS = Math.min(6, Math.max(0.35, 18 / Math.max(vMs, 1)))
  return round((r.powerW * dwellS) / 3600, 5)
}

/** Rotor RPM for a given airflow speed (used by the animation loop). */
export function rpmFromAirflow(windMs: number): number {
  const effectiveV = windMs < 0.4 ? 0 : windMs
  const omega = (TIP_SPEED_RATIO * effectiveV) / ROTOR_RADIUS_M
  return Math.round((omega * 60) / (2 * Math.PI))
}

export function round(x: number, d: number): number {
  const f = Math.pow(10, d)
  return Math.round(x * f) / f
}

/* ------------------------------------------------------------------ */
/* Traffic scenario model (Section: traffic → energy)                  */
/* ------------------------------------------------------------------ */

export interface TrafficScenario {
  key: 'low' | 'medium' | 'high'
  label: string
  vehiclesPerHourPerLane: number
  truckShare: number
  avgSpeedKmh: number
}

export const TRAFFIC_SCENARIOS: TrafficScenario[] = [
  { key: 'low', label: 'Light', vehiclesPerHourPerLane: 250, truckShare: 0.12, avgSpeedKmh: 70 },
  { key: 'medium', label: 'Moderate', vehiclesPerHourPerLane: 900, truckShare: 0.2, avgSpeedKmh: 80 },
  { key: 'high', label: 'Heavy', vehiclesPerHourPerLane: 2200, truckShare: 0.28, avgSpeedKmh: 85 },
]

export interface TrafficEstimate {
  eventsPerHour: number
  eventsPerDay: number
  meanPowerW: number
  wattHoursPerDay: number
}

/**
 * Estimate daily harvest for one roadside node.
 * Duty factor = fraction of time a wake is present at the rotor,
 * derived from traffic rate and the ~18 m influence zone per lane.
 */
export function estimateTraffic(
  s: TrafficScenario,
  lanes = 2,
  guided = true
): TrafficEstimate {
  const cfgBase: SimConfig = {
    vehicleSpeedKmh: s.avgSpeedKmh,
    vehicleType: 'car',
    guideOn: guided,
    crosswind: 'low',
  }
  const carPass = simulate(cfgBase).powerW
  const truckPass = simulate({ ...cfgBase, vehicleType: 'truck' }).powerW
  const meanPassPower = carPass * (1 - s.truckShare) + truckPass * s.truckShare

  const vMs = s.avgSpeedKmh / 3.6
  const dwellS = Math.min(6, Math.max(0.35, 18 / vMs))
  const eventsPerHour = s.vehiclesPerHourPerLane * lanes
  const duty = Math.min(0.9, (eventsPerHour * dwellS) / 3600)

  const eventsPerDay = eventsPerHour * 24
  const wattHoursPerDay = meanPassPower * duty * 24
  return {
    eventsPerHour: round(eventsPerHour, 0),
    eventsPerDay: round(eventsPerDay, 0),
    meanPowerW: round(meanPassPower * (duty > 0 ? 1 : 0), 2),
    wattHoursPerDay: round(wattHoursPerDay, 1),
  }
}

/** Curve data for charts: relative energy vs vehicle speed (deterministic) */
export function energyVsSpeedCurve(guideOn: boolean) {
  const pts = []
  for (let kmh = 20; kmh <= 100; kmh += 10) {
    const r = simulate({
      vehicleSpeedKmh: kmh,
      vehicleType: 'car',
      guideOn,
      crosswind: 'low',
    })
    pts.push({ speed: kmh, power: round(r.powerW, 3), rpm: r.rpm })
  }
  return pts
}

/** JSON contract shared with the ESP32 hardware adapter */
export interface HardwareFrame {
  source: 'hardware'
  ts: number
  vehicleDetected: boolean
  vehicleCount?: number
  airflow?: number
  rpm: number
  voltage: number
  currentMa: number
  powerW: number
  energyWh: number
}
