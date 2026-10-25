import { describe, expect, it } from 'vitest'
import { MOVING, ROUTES, SHUTTLE_PAUSE, STATIONS, STILL, WAIT } from './map-data.ts'
import { measure, pointAt, reportKeys, runKeys, shareAt, shareNearest } from './motion.ts'

const straight = 'M0 0 L100 0'

describe('measure, pointAt and shareNearest', () => {
  it('measures lines and curves', () => {
    expect(measure(straight).length).toBe(100)
    expect(pointAt(straight, 0.25)).toEqual({ x: 25, y: 0 })
    expect(shareNearest(straight, { x: 70, y: 5 })).toBeCloseTo(0.7)
    const curve = 'M0 0 C0 50 100 50 100 0'
    expect(measure(curve).length).toBeGreaterThan(100)
  })

  it('reads every route of the drawing', () => {
    expect(ROUTES.filter((r) => !(measure(r.d).length > 0))).toEqual([])
  })
})

describe('runKeys', () => {
  it('waits at each station, forwards and in reverse', () => {
    const keys = runKeys({ kind: 'through' }, { stops: [0.3, 0.6], wait: WAIT, pause: 0 })
    expect(keys.points).toEqual([0, 0.3, 0.3, 0.6, 0.6, 1])
    expect(keys.times.at(-1)).toBe(1)
    expect(keys.times[2] - keys.times[1]).toBeCloseTo(WAIT)
    const back = runKeys(
      { kind: 'through' },
      { stops: [0.3, 0.6], wait: WAIT, pause: 0, reverse: true },
    )
    expect(back.points[0]).toBe(1)
    const waits = back.points.filter((p, i) => back.points[i + 1] === p)
    expect(waits).toHaveLength(2)
    expect(waits[0]).toBeCloseTo(0.6)
    expect(waits[1]).toBeCloseTo(0.3)
  })

  it('takes a shuttle there and back with a pause at each end', () => {
    const keys = runKeys({ kind: 'shuttle' }, { wait: WAIT, pause: SHUTTLE_PAUSE })
    expect(keys.points).toEqual([0, 1, 1, 0, 0])
    expect(1 - keys.times[3]).toBeCloseTo(SHUTTLE_PAUSE)
  })
})

describe('reportKeys', () => {
  it('samples the run at each report, for the jumps of reduced motion', () => {
    const keys = runKeys({ kind: 'loop' }, { wait: WAIT, pause: 0 })
    const reports = reportKeys(keys, 10)
    expect(reports.times).toHaveLength(10)
    expect(reports.points[5]).toBeCloseTo(shareAt(keys, 0.5))
  })
})

describe('map-data', () => {
  it('names a real route for every vehicle, and a station for every wait', () => {
    const ids = new Set(ROUTES.map((r) => r.id))
    expect([...MOVING, ...STILL].filter((v) => !ids.has(v.route))).toEqual([])
    const waits = MOVING.flatMap((v) => (v.run.kind === 'through' ? (v.run.waitsAt ?? []) : []))
    expect(waits.length).toBeGreaterThan(0)
    expect(waits.filter((s) => !(s in STATIONS))).toEqual([])
  })

  it('pulses only live vehicles, and draws every data state', () => {
    expect(MOVING.filter((v) => v.pulses).every((v) => v.state === 'live')).toBe(true)
    const states = new Set([...MOVING, ...STILL].map((v) => v.state))
    expect([...states].sort()).toEqual(['ageing', 'estimated', 'live', 'no-signal', 'timetable'])
  })
})
