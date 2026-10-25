// The five data states of a vehicle, written once here (docs/components/README.md, "Shared
// helpers"). Internal: no barrel exports it, and a pattern may import this file, which reads no
// Base UI.
import type { OwnedStringKey } from '../locale/index.ts'

/** How fresh a vehicle's data is, as Data states names the five states. */
export type VehicleState = 'live' | 'ageing' | 'estimated' | 'timetable-only' | 'no-signal'

/**
 * Each data state's key, in the order Data states lists them: the owned string that names the
 * state, and the field ReportStrip's `counts` gives its number in.
 */
export const STATE_KEY = {
  live: 'live',
  ageing: 'ageing',
  estimated: 'estimated',
  'timetable-only': 'timetableOnly',
  'no-signal': 'noSignal',
} as const satisfies Record<VehicleState, OwnedStringKey>

/** The five data states, in the order Data states lists them. */
export const VEHICLE_STATES = Object.keys(STATE_KEY) as VehicleState[]

/**
 * Whether a vehicle in `state` can know its delay: a timetable-only or no-signal vehicle reports
 * no position, so its delay is unknown whatever a caller gives (DepartureRow's CR-5, VehicleTable's
 * CR-4).
 */
export const delayKnown = (state: VehicleState) =>
  state !== 'timetable-only' && state !== 'no-signal'
