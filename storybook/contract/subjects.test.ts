import { describe, expect, it } from 'vitest'
import { subjects } from './subjects.ts'

const entry = (name: string, status = 'building', layer = 'component') => ({
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
