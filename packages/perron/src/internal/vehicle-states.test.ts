import { describe, expect, it } from 'vitest'
import { delayKnown, VEHICLE_STATES } from './vehicle-states.ts'

describe('vehicle states', () => {
  it('lists the five states in the order Data states gives them', () => {
    expect(VEHICLE_STATES).toEqual(['live', 'ageing', 'estimated', 'timetable-only', 'no-signal'])
  })

  // written out here, so the stories that read delayKnown still test the rule, not themselves
  it('knows the delay of every state but timetable only and no signal', () => {
    expect(VEHICLE_STATES.filter(delayKnown)).toEqual(['live', 'ageing', 'estimated'])
  })
})
