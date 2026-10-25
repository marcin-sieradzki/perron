import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { composeStories } from '@storybook/react-vite'
import { describe, expect, it } from 'vitest'
import { componentDocs } from '../../scripts/lib/docgen.ts'
import { propRows, specProse } from './component-page.ts'
import { Gauge } from './fixtures/Gauge.tsx'

/** The fixture's argTypes as a docs page gets them: Perron's docgen, then Storybook's enhancers. */
function gaugeArgTypes() {
  const file = join(import.meta.dirname, 'fixtures/Gauge.tsx')
  const [docgen] = componentDocs(readFileSync(file, 'utf8'), file)
  Object.assign(Gauge, { __docgenInfo: docgen })
  const { Default } = composeStories({
    default: { component: Gauge, args: { label: 'Battery' } },
    Default: {},
  })
  return Default.argTypes
}

/** The members GaugeProps declares itself. */
const OWN = ['variant', 'label', 'loadingLabel', 'className', 'ref', 'disabled']

describe('propRows', () => {
  it('gives each prop in MUI layout, in the order the props type declares, slots last', () => {
    const rows = propRows(gaugeArgTypes())
    const declared = rows.filter((r) => OWN.includes(r.name) || r.name.startsWith('slotProps.'))
    expect(declared).toEqual([
      {
        name: 'variant',
        required: false,
        type: "'bar' | 'ring'",
        default: "'bar'",
        description: 'How the gauge is drawn.',
      },
      {
        name: 'label',
        required: true,
        type: 'ReactNode',
        default: '',
        description: 'The label read with the value.',
      },
      {
        name: 'loadingLabel',
        required: false,
        type: 'string',
        default: '',
        description: 'Overrides "Loading".',
      },
      {
        name: 'className',
        required: false,
        type: 'string',
        default: '',
        description: 'A class for the root, merged after `pn-Gauge`.',
      },
      {
        name: 'ref',
        required: false,
        type: 'Ref<HTMLDivElement>',
        default: '',
        description: '',
      },
      {
        name: 'disabled',
        required: false,
        type: 'boolean',
        default: 'false',
        description: 'Whether the gauge is greyed out.',
      },
      {
        name: 'slotProps.track',
        required: false,
        type: 'Meter.Track.Props',
        default: '',
        description: 'Props for the `track` part.',
      },
      {
        name: 'slotProps.indicator',
        required: false,
        type: "Omit<Meter.Indicator.Props, 'children'>",
        default: '',
        description: 'Props for the `indicator` part.',
      },
    ])
  })

  it("adds the members the props type inherits from Base UI, with Base UI's JSDoc and default", () => {
    const rows = propRows(gaugeArgTypes())
    expect(rows.map((r) => r.name)).toEqual([
      ...OWN,
      'style',
      'aria-valuetext',
      'format',
      'getAriaValueText',
      'locale',
      'max',
      'min',
      'value',
      'render',
      'slotProps.track',
      'slotProps.indicator',
    ])
    expect(rows.find((r) => r.name === 'max')).toEqual({
      name: 'max',
      required: false,
      type: 'number',
      default: '100',
      description: 'The maximum value',
    })
    expect(rows.find((r) => r.name === 'value')?.required).toBe(true)
  })
})

const SPEC = `# Gauge

A gauge shows how full something is.

## Anatomy

| Part | What it is |
| ---- | ---------- |

## Keyboard and ARIA

| Key | Does | From |
| --- | ---- | ---- |

## Owned strings

No owned strings: every word comes from the caller.

## Do and don't

| Do | Don't |
| -- | ----- |
`

describe('specProse', () => {
  it("gives the spec's opening sentence for the intro", () => {
    expect(specProse(SPEC, 'intro')).toBe('A gauge shows how full something is.')
  })

  it('gives the sections named, each with its heading, in the order asked', () => {
    expect(specProse(SPEC, ["Do and don't", 'Owned strings'])).toBe(
      [
        "## Do and don't\n\n| Do | Don't |\n| -- | ----- |",
        '## Owned strings\n\nNo owned strings: every word comes from the caller.',
      ].join('\n\n'),
    )
  })

  it('fails on a section the spec does not have', () => {
    expect(() => specProse(SPEC, ['Usage'])).toThrow('The spec has no "## Usage" section')
  })
})
