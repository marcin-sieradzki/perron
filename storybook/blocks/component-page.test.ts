import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { composeStories } from '@storybook/react-vite'
import { describe, expect, it } from 'vitest'
import { componentDocs } from '../../scripts/lib/docgen.ts'
import { parseRegistry } from '../../scripts/lib/entry.ts'
import { pageNotice, propRows } from './component-page.ts'
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

describe('propRows types', () => {
  it("shows a multi-line signature on one line, and Base UI's namespaces by their public names", () => {
    const rows = propRows({
      onClose: {
        name: 'onClose',
        type: {
          name: 'function',
          raw: '(\n  event: Event,\n  details: BaseTooltip.Root.ChangeEventDetails,\n) => void',
        },
        table: { type: { summary: 'function' } },
      },
    } as never)
    expect(rows[0].type).toBe('(event: Event, details: Tooltip.Root.ChangeEventDetails) => void')
  })
})

describe('pageNotice', () => {
  // Button is deprecated for IconButton; DepartureRow is a building pattern
  const registry = parseRegistry(
    JSON.parse(
      readFileSync(
        join(import.meta.dirname, '../../scripts/lib/fixtures/registry/components.json'),
        'utf8',
      ),
    ),
  )

  it("opens a deprecated entry's page with its successor, linked to the successor's spec", () => {
    expect(pageNotice(registry, 'docs/components/button.md')).toBe(
      'Deprecated: use [IconButton](icon-button.md) instead.',
    )
  })

  it('gives any other entry no notice', () => {
    expect(pageNotice(registry, 'docs/components/icon-button.md')).toBeUndefined()
    expect(pageNotice(registry, 'docs/patterns/departure-row.md')).toBeUndefined()
  })
})
