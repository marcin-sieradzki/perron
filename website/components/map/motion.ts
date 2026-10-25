// How each vehicle of the background map moves, worked out at build time: a route measured from
// its path data, a run turned into SVG animateMotion keyTimes and keyPoints (shares of the run's
// time and of the route's length), and the same run sampled at each report for reduced motion.
import type { MovingVehicle, StationId } from './map-data.ts'

type Point = { x: number; y: number }

/** Absolute M, L, C and Z only, which is all map-data.ts uses. */
function segments(d: string) {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? []
  const out: Point[][] = []
  let at: Point = { x: 0, y: 0 }
  let start = at
  let i = 0
  const num = () => Number(tokens[i++])
  const pt = () => ({ x: num(), y: num() })
  while (i < tokens.length) {
    const cmd = tokens[i++]
    if (cmd === 'M') start = at = pt()
    else if (cmd === 'L') out.push([at, (at = pt())])
    else if (cmd === 'C') out.push([at, pt(), pt(), (at = pt())])
    else if (cmd === 'Z') out.push([at, (at = start)])
    else throw new Error(`motion.ts reads M, L, C and Z only, not ${cmd} in ${d}`)
  }
  return out
}

function bezier([p0, p1, p2, p3]: Point[], t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const e = t * t * t
  return {
    x: a * p0.x + b * p1.x + c * p2.x + e * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + e * p3.y,
  }
}

const STEPS = 64

/** Points along a path, each with its distance from the start. */
export function measure(d: string) {
  const points: (Point & { at: number })[] = []
  let length = 0
  for (const seg of segments(d)) {
    const n = STEPS
    for (let s = points.length ? 1 : 0; s <= n; s++) {
      const t = s / n
      const p =
        seg.length === 2
          ? { x: seg[0].x + (seg[1].x - seg[0].x) * t, y: seg[0].y + (seg[1].y - seg[0].y) * t }
          : bezier(seg, t)
      const prev = points.at(-1)
      if (prev) length += Math.hypot(p.x - prev.x, p.y - prev.y)
      points.push({ ...p, at: length })
    }
  }
  return { points, length }
}

/** The share of a route's length at the point of the route nearest `target`. */
export function shareNearest(d: string, target: Point) {
  const { points, length } = measure(d)
  let best = points[0]
  for (const p of points)
    if (
      Math.hypot(p.x - target.x, p.y - target.y) < Math.hypot(best.x - target.x, best.y - target.y)
    )
      best = p
  return best.at / length
}

/** The point at a share of a route's length. */
export function pointAt(d: string, share: number): Point {
  const { points, length } = measure(d)
  const want = share * length
  const i = points.findIndex((p) => p.at >= want)
  if (i <= 0) return i === 0 ? points[0] : points.at(-1)!
  const a = points[i - 1]
  const b = points[i]
  const t = (want - a.at) / (b.at - a.at || 1)
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

export interface Keys {
  /** Shares of the run's time, from 0 to 1 */
  times: number[]
  /** Shares of the route's length at those times */
  points: number[]
}

/**
 * A run as keyTimes and keyPoints: a `loop` or a `through` run goes from start to end, waiting
 * `wait` of the run at each station share in `stops`; a `shuttle` goes to the end, waits `pause`
 * of the run, and comes back. `reverse` runs it the other way, waiting at the same stations.
 */
export function runKeys(
  run: MovingVehicle['run'],
  options: { reverse?: boolean; stops?: number[]; wait: number; pause: number },
): Keys {
  let keys: Keys
  if (run.kind === 'shuttle') {
    const { pause } = options
    const leg = (1 - 2 * pause) / 2
    keys = { times: [0, leg, leg + pause, 1 - pause, 1], points: [0, 1, 1, 0, 0] }
  } else {
    const given = options.stops ?? []
    // run forward to the mirrored stations, then mirror the whole run back below
    const stops = (options.reverse ? given.map((s) => 1 - s) : given).toSorted((a, b) => a - b)
    const moving = 1 - stops.length * options.wait
    keys = { times: [0], points: [0] }
    let t = 0
    for (const s of stops) {
      t += (s - keys.points.at(-1)!) * moving
      keys.times.push(t, t + options.wait)
      keys.points.push(s, s)
      t += options.wait
    }
    keys.times.push(1)
    keys.points.push(1)
  }
  if (options.reverse) keys.points = keys.points.map((p) => 1 - p)
  return keys
}

/** Where a run is at a share of its time, as a share of the route's length. */
export function shareAt(keys: Keys, time: number) {
  const i = keys.times.findIndex((t) => t >= time)
  if (i <= 0) return keys.points[Math.max(i, 0)]
  const t0 = keys.times[i - 1]
  const t1 = keys.times[i]
  const p0 = keys.points[i - 1]
  return p0 + (keys.points[i] - p0) * ((time - t0) / (t1 - t0 || 1))
}

/** The run sampled at each of `reports` evenly spaced reports, for a discrete animateMotion. */
export function reportKeys(keys: Keys, reports: number): Keys {
  const times = Array.from({ length: reports }, (_, k) => k / reports)
  return { times, points: times.map((t) => shareAt(keys, t)) }
}

/** The shares of a route's length at which it passes each station. */
export function stationShares(
  d: string,
  waitsAt: StationId[] | undefined,
  stations: Record<StationId, Point>,
) {
  return (waitsAt ?? []).map((id) => shareNearest(d, stations[id]))
}

/** A list of shares as SVG wants it, rounded so the markup stays short. */
export const svgList = (values: number[]) =>
  values.map((v) => Number(Math.min(1, Math.max(0, v)).toFixed(4))).join(';')
