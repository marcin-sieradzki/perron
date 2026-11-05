// The component data the Perron MCP serves: one record per entry past designing, from the
// registry, api.json and the entry's spec. Button's comes from the repo, so its tests check the
// record's shape, never its spec's words; the fixture, checked exactly, holds a deprecated entry,
// one whose spec hasn't moved, and a pattern with neither a Props table nor api.json.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readComponents } from './data.ts'
import { CHECKED_BY, LEVELS, RULE_ID } from './usage.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
const fixture = join(here, 'fixtures/data')

describe('the component data', () => {
  const button = readComponents(root).find((r) => r.name === 'Button')!

  it("gives Button's summary, import line, docs page and when to use it, LinkButton among the alternatives", () => {
    expect(button).toMatchObject({
      name: 'Button',
      layer: 'component',
      category: 'Actions',
      status: 'stable',
      summary: expect.stringMatching(/\S/),
      import: "import { Button } from '@mylder/perron'",
      whenToUse: expect.stringMatching(/\S/),
      docs: 'https://marcin-sieradzki.github.io/perron/components/button/',
    })
    expect(button).not.toHaveProperty('replacedBy')
    expect(button.alternatives).toContainEqual({
      name: 'LinkButton',
      when: expect.stringMatching(/\S/),
    })
  })

  it("gives Button's rules with their ids, levels and what checks them, one checked by types", () => {
    expect(button.rules.length).toBeGreaterThan(0)
    for (const rule of button.rules)
      expect(rule).toEqual({
        id: expect.stringMatching(RULE_ID),
        level: expect.toBeOneOf([...LEVELS]),
        do: expect.stringMatching(/\S/),
        dont: expect.stringMatching(/\S/),
        checkedBy: expect.toBeOneOf([...CHECKED_BY]),
      })
    expect(button.rules.map((r) => r.checkedBy)).toContain('types')
  })

  it("gives Button's props with their types and descriptions, inherited ones too", () => {
    expect(button.props.length).toBeGreaterThan(0)
    for (const prop of button.props)
      expect(prop).toMatchObject({
        name: expect.any(String),
        type: expect.any(String),
        optional: expect.any(Boolean),
        description: expect.any(String),
      })
    // Base UI's, which api.json leaves out and the spec's Props table gives
    expect(button.props.map((p) => p.name)).toContain('nativeButton')
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
        {
          name: 'nativeButton',
          type: 'boolean',
          optional: true,
          default: 'false',
          description: 'Whether `render` gives a native button.',
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
