import { describe, expect, it } from 'vitest'
import type { Entry, Layer, Status } from '../../scripts/lib/entry.ts'
import { createElement } from 'react'
import { callerStrings, subjects } from './subjects.ts'

const entry = (name: string, status: Status = 'building', layer: Layer = 'component'): Entry => ({
  name,
  layer,
  category: 'Actions',
  status,
  baseUiParts: [],
  penpotPath: `Components/${name}`,
  dependsOn: [],
})
const Button = () => null
const DepartureRow = () => null

describe('subjects', () => {
  it('takes each built entry from the barrels, with its Default story args over its meta args', () => {
    const stories = {
      '../../packages/perron/src/components/Button/Button.stories.tsx': {
        default: { args: { variant: 'primary', children: 'Meta' } },
        Default: { args: { children: 'Save' } },
      },
    }
    expect(
      subjects(
        [entry('Button'), entry('DepartureRow', 'stable', 'pattern')],
        { Button, DepartureRow },
        stories,
      ),
    ).toEqual([
      { name: 'Button', Component: Button, args: { variant: 'primary', children: 'Save' } },
      { name: 'DepartureRow', Component: DepartureRow, args: {} },
    ])
  })

  it('takes the first story when there is no Default', () => {
    const stories = {
      '../../packages/perron/src/components/Button/Button.stories.tsx': {
        default: {},
        Primary: { args: { children: 'Save' } },
        Secondary: { args: { children: 'Cancel' } },
      },
    }
    expect(subjects([entry('Button')], { Button }, stories)[0].args).toEqual({ children: 'Save' })
  })

  it('leaves out an entry still designing', () => {
    expect(subjects([entry('Button', 'designing')], {}, {})).toEqual([])
  })

  it('names a built entry the barrels do not export', () => {
    expect(() => subjects([entry('Button')], {}, {})).toThrow(
      'Button is built in packages/perron/components.json but not exported; run npm run registry',
    )
  })
})

describe('callerStrings', () => {
  it('takes every string in the args, through lists, objects and elements', () => {
    const icon = createElement('svg', { 'aria-label': 'Bus' })
    const args = {
      children: ['Departures', createElement('strong', null, ' Line 5A ')],
      closeLabel: 'Shut',
      startIcon: icon,
      slotProps: { popup: { title: 'Upcoming' } },
      size: 'small',
      count: 3,
      onClose: () => 'not a word',
    }
    expect(callerStrings(args).sort()).toEqual(
      ['Bus', 'Departures', 'Line 5A', 'Shut', 'Upcoming', 'small'].sort(),
    )
  })
})
