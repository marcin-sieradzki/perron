import { describe, expect, it } from 'vitest'
import { defaultOf, linesUnder, propsOf, readSpec, specProse, tablesIn } from './spec-reader.ts'

/** An example spec in the template's layout, made up for these tests. */
const SPEC = `# Gauge

A gauge shows how full something is.

It reads 0 to 100.

<!-- run notes -->

The design is deferred (ADR 0010).

## When to use

Use Gauge for a share of a whole.

| Use instead            | When                   |
| ---------------------- | ---------------------- |
| [Meter](meter.md)      | The value has a range. |
| A plain number         | It has no whole.       |

## Props

| Name                        | Type                       | Default      | Description               |
| --------------------------- | -------------------------- | ------------ | ------------------------- |
| \`value\`                     | \`number\`                   | (required)   | How full it is.           |
| \`size\`                      | \`'small' \\| 'medium'\`      | \`'medium'\`   | Its height.               |
| \`label\`                     | \`string\`                   | none         | Its name.                 |
| \`className\`, \`style\`, \`ref\` | React's                    |              | Reaches the root.         |

## Keyboard and ARIA

| Key                | Does                       |
| ------------------ | -------------------------- |
| \`Tab\`              | Moves focus to the gauge.  |
| \`Enter\`, \`Space\`   | Reads the value.           |
| Typing             | Nothing.                   |
| \`Escape\`           | Untested: no focus to lose |

## Stories

| Story     | Shows               |
| --------- | ------------------- |
| \`Default\` | A half-full gauge.  |
| \`Sizes\`   | Each size.          |

## Do and don't

| Rule | Level  | Do               | Don't                  | Checked by |
| ---- | ------ | ---------------- | ---------------------- | ---------- |
| DD-1 | must   | Give it a value. | Leave \`value\` out.     | types      |
| DD-2 | should | Name it.         | Leave it without words | review     |

## For agents

- Gave it a percentage string.
  Pass a number.
- Wrapped it in a Meter.
`

/** A compound entry whose Props section gives each part a table of its own. */
const PARTS = `# Tabs

Tabs switch between panels.

## Props

The props of each part.

### Tabs

| Name           | Type     | Default | Description        |
| -------------- | -------- | ------- | ------------------ |
| \`defaultValue\` | \`string\` | none    | The tab shown first |

### Tab

| Name    | Type     | Default    | Description |
| ------- | -------- | ---------- | ----------- |
| \`value\` | \`string\` | (required) | Its value   |
`

describe('readSpec', () => {
  it('reads the title, and the intro above the run notes without When to use', () => {
    const spec = readSpec(SPEC)
    expect(spec.title).toBe('Gauge')
    expect(spec.intro).toBe('A gauge shows how full something is.\n\nIt reads 0 to 100.')
  })

  it('splits the spec at its ## headings, each with its line', () => {
    const { sections } = readSpec(SPEC)
    expect(sections.map((s) => [s.heading, s.line])).toEqual([
      ['When to use', 11],
      ['Props', 20],
      ['Keyboard and ARIA', 29],
      ['Stories', 38],
      ["Do and don't", 45],
      ['For agents', 52],
    ])
  })

  it('reads no heading or table inside fenced code', () => {
    const fenced = SPEC.replace(
      '## Stories\n',
      '## Stories\n\n```sh\n## not a heading\n| `Fake` | x |\n| --- | --- |\n| `Fake` | x |\n```\n',
    )
    const spec = readSpec(fenced)
    expect(spec.sections.map((s) => s.heading)).not.toContain('not a heading')
    expect(spec.stories?.map((s) => s.name)).toEqual(['Default', 'Sizes'])
  })

  it("reads each prop's names, type, default and line", () => {
    const rows = propsOf(readSpec(SPEC), 'Gauge')?.rows ?? []
    expect(rows.map((r) => r.names)).toEqual([
      ['value'],
      ['size'],
      ['label'],
      ['className', 'style', 'ref'],
    ])
    expect(rows[0]).toMatchObject({ type: 'number', required: true, line: 24 })
    expect(rows[0].defaultValue).toBeUndefined()
    expect(rows[1]).toMatchObject({
      type: "'small' | 'medium'",
      default: "`'medium'`",
      defaultValue: "'medium'",
      required: false,
    })
    expect(rows[2].defaultValue).toBeUndefined()
    expect(rows[3]).toMatchObject({ type: "React's", description: 'Reaches the root.' })
  })

  it("gives a part the table under its own ### heading, and any other the section's first", () => {
    const spec = readSpec(PARTS)
    expect(spec.props?.map((t) => t.part)).toEqual(['Tabs', 'Tab'])
    expect(propsOf(spec, 'Tab')?.rows.map((r) => r.names[0])).toEqual(['value'])
    expect(propsOf(spec, 'Tabs')?.rows.map((r) => r.names[0])).toEqual(['defaultValue'])
    expect(propsOf(spec, 'TabsPanel')?.rows.map((r) => r.names[0])).toEqual(['defaultValue'])
    expect(propsOf(readSpec('# Kbd\n\nA key.\n'), 'Kbd')).toBeUndefined()
  })

  it('reads the stories of the Stories table, each with its line', () => {
    expect(readSpec(SPEC).stories).toEqual([
      { name: 'Default', line: 42 },
      { name: 'Sizes', line: 43 },
    ])
    expect(readSpec(PARTS).stories).toBeUndefined()
  })

  it('reads the keys of the keyboard table, less rows of words and untested rows', () => {
    expect(readSpec(SPEC).keys).toEqual([
      { key: 'Tab', line: 33 },
      { key: 'Enter', line: 34 },
      { key: 'Space', line: 34 },
    ])
  })

  it('reads When to use: its prose, and each entry to use instead with its link', () => {
    const when = readSpec(SPEC).whenToUse
    expect(when?.text).toBe('Use Gauge for a share of a whole.')
    expect(when?.none).toBe(false)
    expect(when?.alternatives).toEqual([
      {
        name: 'Meter',
        href: 'meter.md',
        cell: '[Meter](meter.md)',
        when: 'The value has a range.',
        line: 17,
      },
      { name: '', href: '', cell: 'A plain number', when: 'It has no whole.', line: 18 },
    ])
    const none = readSpec(
      SPEC.replace(/\| Use instead[\s\S]*?whole\. +\|\n/, 'Nothing else in Perron does this.\n'),
    ).whenToUse
    expect(none).toMatchObject({
      none: true,
      alternatives: [],
      text: 'Use Gauge for a share of a whole.',
    })
  })

  it("reads the Do and don't rules by their five columns", () => {
    const table = readSpec(SPEC).doAndDont
    expect(table?.line).toBe(47)
    expect(table?.rules[1]).toEqual({
      id: 'DD-2',
      level: 'should',
      do: 'Name it.',
      dont: 'Leave it without words',
      checkedBy: 'review',
      line: 50,
    })
    const two = readSpec("# X\n\n## Do and don't\n\n| Do | Don't |\n| -- | ----- |\n| a | b |\n")
    expect(two.doAndDont).toMatchObject({
      columns: ['Do', "Don't"],
      rules: [],
      rows: [{ text: 'a | b', line: 7 }],
    })
  })

  it('reads For agents as notes, a wrapped line joined to its bullet', () => {
    expect(readSpec(SPEC).forAgents).toEqual({
      line: 52,
      notes: ['Gave it a percentage string. Pass a number.', 'Wrapped it in a Meter.'],
      wellFormed: true,
    })
    const none = SPEC.replace(/## For agents\n[\s\S]*$/, '## For agents\n\nNone known yet.\n')
    expect(readSpec(none).forAgents).toEqual({ line: 52, notes: [], wellFormed: true })
    const prose = SPEC.replace(/## For agents\n[\s\S]*$/, '## For agents\n\nAgents do fine.\n')
    expect(readSpec(prose).forAgents?.wellFormed).toBe(false)
  })

  it('reads a spec in design, with none of the sections, as empty', () => {
    expect(readSpec('# Pin\n\nA pin.\n')).toEqual({
      title: 'Pin',
      intro: 'A pin.',
      sections: [],
      keys: [],
    })
  })
})

describe('defaultOf', () => {
  it("reads a Default cell's code, and nothing for none, a dash or a required prop", () => {
    expect(defaultOf("`'solid'`")).toBe("'solid'")
    expect(defaultOf("The locale's")).toBe("The locale's")
    for (const cell of ['', 'none', 'None', '—', '-', '(required)', '`none`'])
      expect(defaultOf(cell)).toBeUndefined()
  })
})

describe('specProse', () => {
  it('gives the intro, then When to use with its heading, as the page opens', () => {
    expect(specProse(SPEC, 'intro')).toMatch(
      /^A gauge shows how full something is\.\n\nIt reads 0 to 100\.\n\n## When to use\n\nUse Gauge/,
    )
    expect(specProse(SPEC, 'intro')).not.toMatch(/ADR 0010/)
  })

  it('gives the sections named, each with its heading, in the order asked', () => {
    expect(specProse(SPEC, ['For agents', 'Stories'])).toMatch(
      /^## For agents\n\n- Gave[\s\S]*\n\n## Stories\n\n\| Story/,
    )
  })

  it('fails on a section the spec does not have', () => {
    expect(() => specProse(SPEC, ['Usage'])).toThrow('The spec has no "## Usage" section')
  })
})

describe('linesUnder and tablesIn', () => {
  it('read a ## or ### section up to the next heading of its level, outside fenced code', () => {
    const md =
      '## Props\n\n| A | B |\n| - | - |\n| `x` | y \\| z |\n\n```md\n## Fake\n```\n\n### Intents\n\nText.\n\n## CSS\n'
    expect(linesUnder(md, 'Props')?.map((l) => l.text)).toContain('### Intents')
    expect(
      linesUnder(md, 'Intents')
        ?.map((l) => l.text)
        .join('\n')
        .trim(),
    ).toBe('Text.')
    expect(linesUnder(md, 'Fake')).toBeUndefined()
    const [table] = tablesIn(linesUnder(md, 'Props') ?? [])
    expect(table).toEqual({
      line: 3,
      columns: ['A', 'B'],
      rows: [{ cells: ['`x`', 'y | z'], line: 5 }],
    })
  })
})
