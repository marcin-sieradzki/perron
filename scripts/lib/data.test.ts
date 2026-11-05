// The component data the Perron MCP serves: one record per entry past designing, from the
// registry, api.json and the entry's spec. Button's comes from the repo, whose spec has moved over
// to the usage sections; the fixture holds a deprecated entry, one whose spec hasn't moved, and a
// pattern with neither a Props table nor api.json.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readComponents } from './data.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
const fixture = join(here, 'fixtures/data')

describe('the component data', () => {
  const button = readComponents(root).find((r) => r.name === 'Button')!

  it("gives Button's summary, import line, docs page and when to use it", () => {
    expect(button).toMatchObject({
      name: 'Button',
      layer: 'component',
      category: 'Actions',
      status: 'stable',
      summary: expect.stringMatching(
        /^A button that runs one action on the screen it sits on, .*\(`brand`\)\.$/,
      ),
      import: "import { Button } from '@mylder/perron'",
      whenToUse: expect.stringMatching(/^Use Button for an action that runs on the screen/),
      docs: 'https://marcin-sieradzki.github.io/perron/components/button/',
    })
    expect(button).not.toHaveProperty('replacedBy')
    expect(button.alternatives[0]).toEqual({
      name: 'LinkButton',
      when: 'The action takes the reader to another page or place, such as "Back to the map"',
    })
    expect(button.alternatives.map((a) => a.name)).toContain('SegmentedControl')
  })

  it("gives Button's rules with their ids, levels and what checks them", () => {
    expect(button.rules.map((r) => `${r.id} ${r.level} ${r.checkedBy}`).slice(0, 5)).toEqual([
      'DD-1 must review',
      'DD-2 must review',
      'DD-3 must review',
      'DD-4 should review',
      'DD-5 must types',
    ])
    expect(button.rules[4]).toMatchObject({
      do: expect.stringMatching(/^Take `variant` from `solid` and `outline`/),
      dont: expect.stringMatching(/^Write MUI's `variant="contained"`/),
    })
    expect(button.agentNotes).toEqual([])
  })

  it("gives Button's props with their types, defaults and descriptions, inherited ones too", () => {
    const prop = (name: string) => button.props.find((p) => p.name === name)
    expect(button.props[0]).toEqual({
      name: 'variant',
      type: "'solid' | 'outline'",
      optional: true,
      default: "'solid'",
      description: expect.stringMatching(/^How much the button stands out/),
    })
    expect(prop('startIcon')).not.toHaveProperty('default')
    // Base UI's, which api.json leaves out and the spec's Props table gives
    expect(prop('nativeButton')).toMatchObject({ type: 'boolean', optional: true, default: 'true' })
  })

  it("names a deprecated entry's successor and the text of a deprecated prop", () => {
    const chip = readComponents(fixture).find((r) => r.name === 'Chip')
    expect(chip).toEqual({
      name: 'Chip',
      layer: 'component',
      category: 'Display',
      status: 'deprecated',
      replacedBy: 'Tag',
      summary: 'A short label in a pill, such as "Night bus".',
      import: "import { Chip } from '@mylder/perron'",
      whenToUse: 'Use Chip for a label that says what a thing is.',
      alternatives: [
        { name: 'Tag', when: 'Always: Tag replaces Chip' },
        { name: 'TagRow', when: 'Several labels sit in one row' },
      ],
      props: [
        {
          name: 'variant',
          type: "'solid' | 'outline'",
          optional: true,
          default: "'solid'",
          description: 'How much the chip stands out.',
        },
        {
          name: 'outlined',
          type: 'boolean',
          optional: true,
          default: 'false',
          description: 'Draws an edge only. Use `variant` instead.',
          deprecated: 'Use `variant="outline"` instead.',
        },
        { name: 'children', type: 'ReactNode', optional: false, description: 'The label.' },
        {
          name: 'render',
          type: "Base UI's `render`",
          optional: true,
          description: 'Swaps the root element.',
        },
      ],
      rules: [
        {
          id: 'DD-1',
          level: 'must',
          do: 'Name the thing in a word',
          dont: 'Write a sentence in a chip',
          checkedBy: 'review',
        },
        {
          id: 'DD-2',
          level: 'should',
          do: 'Take `variant` from its two',
          dont: 'Write `variant="contained"`',
          checkedBy: 'types',
        },
      ],
      agentNotes: ['Wrote `outlined`, which is deprecated. Write `variant="outline"`.'],
      docs: 'https://marcin-sieradzki.github.io/perron/components/chip/',
    })
  })

  it("gives empty lists for a spec that hasn't moved, and leaves out an entry in design", () => {
    const records = readComponents(fixture)
    expect(records.map((r) => r.name)).toEqual(['Chip', 'Tag', 'TagRow'])
    expect(records.find((r) => r.name === 'Tag')).toMatchObject({
      summary: 'A label that names a thing.',
      whenToUse: '',
      alternatives: [],
      rules: [],
      agentNotes: [],
      props: [{ name: 'children', type: 'ReactNode', optional: true, description: 'The label.' }],
    })
  })

  it('imports a pattern from the patterns entry and links its page, with no props yet', () => {
    const row = readComponents(fixture).find((r) => r.name === 'TagRow')
    expect(row).toMatchObject({
      layer: 'pattern',
      status: 'building',
      import: "import { TagRow } from '@mylder/perron/patterns'",
      docs: 'https://marcin-sieradzki.github.io/perron/patterns/tag-row/',
      props: [],
    })
  })
})
