import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import check, {
  copiedStoryHelpers,
  copiedTables,
  helperProblems,
  partProblems,
  readHelpers,
  readParts,
} from './shared-parts.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
const lint = (fixture: string) =>
  partProblems(root, `scripts/checks/fixtures/shared-parts/${fixture}`)

describe('shared-parts', () => {
  it("reads a part's classes, icons and declarations from its row", () => {
    const contract = [
      '## Shared parts',
      '',
      '| Part | Draws | Composed in | Only its folder holds |',
      '| ---- | ----- | ----------- | --------------------- |',
      '| `VisuallyHidden` | Text | Any | `pn-VisuallyHidden`, and `clip-path: inset(50%)` or `clip:` |',
      '| `CheckboxIndicator` | A box | `Checkbox.Indicator` | `pn-CheckboxIndicator`, and the tick and the `dash` icon |',
      '| `IntentIcon` | An intent | Alert | `pn-IntentIcon`, and the `info-circle` and `exclamation-circle` icons |',
      '| `Marks` | Marks | Any | `pn-Marks`, the `a`, `b` or `c` icons |',
      '',
    ].join('\n')
    expect(readParts(contract)).toEqual([
      {
        name: 'VisuallyHidden',
        classes: ['pn-VisuallyHidden'],
        icons: [],
        declarations: ['clip-path: inset(50%)', 'clip:'],
      },
      {
        name: 'CheckboxIndicator',
        classes: ['pn-CheckboxIndicator'],
        icons: ['dash'],
        declarations: [],
      },
      // a plural list names each of its icons, none of them a class or a declaration
      {
        name: 'IntentIcon',
        classes: ['pn-IntentIcon'],
        icons: ['info-circle', 'exclamation-circle'],
        declarations: [],
      },
      { name: 'Marks', classes: ['pn-Marks'], icons: ['a', 'b', 'c'], declarations: [] },
    ])
  })

  // the table's shape, not its words, so a component may add a row, an icon or a declaration
  it("reads every row of the contract's table as a part with its own class and real icons", () => {
    const parts = readParts(readFileSync(join(root, 'docs/components/README.md'), 'utf8'))
    const manifest = JSON.parse(
      readFileSync(join(root, 'packages/perron/icons/icons.json'), 'utf8'),
    )
    const icons = Object.values(manifest).flatMap((group) => Object.keys(group as object))
    expect(parts.map((p) => p.name)).toEqual(
      expect.arrayContaining([
        'VisuallyHidden',
        'CheckboxIndicator',
        'SelectedMark',
        'CloseButton',
      ]),
    )
    for (const part of parts) {
      expect(part.classes).toContain(`pn-${part.name}`)
      for (const icon of part.icons) expect(icons).toContain(icon)
    }
    expect(parts.find((p) => p.name === 'VisuallyHidden')?.declarations.length).toBeGreaterThan(0)
  })

  it.each([
    ['class', /(pn-CloseButton|pn-VisuallyHidden) belongs to (CloseButton|VisuallyHidden)/, 2],
    ['declarations', /(clip-path: inset\(50%\)|clip:) belongs to VisuallyHidden/, 3],
    ['icon', /the (close|tick) icon belongs to (CloseButton|CheckboxIndicator, SelectedMark)/, 3],
  ])('fails a part drawn outside its folder: %s', (fixture, message, count) => {
    const problems = lint(fixture)
    expect(problems).toHaveLength(count)
    for (const p of problems) {
      expect(p.message).toMatch(message)
      expect(p.line).toBeGreaterThan(0)
    }
  })

  it('passes parts drawn in their folders and composed elsewhere', () => {
    expect(lint('passes')).toEqual([])
  })

  it('takes a perron-allow exemption', () => {
    expect(lint('allowed')).toEqual([])
  })

  it("reads the helpers from the contract's table", () => {
    const helpers = readHelpers(readFileSync(join(root, 'docs/components/README.md'), 'utf8'))
    expect(helpers).toContainEqual({ name: 'given', aliases: [], file: 'internal/nodes.ts' })
    expect(helpers).toContainEqual({ name: 'usePart', aliases: [], file: 'internal/use-part.ts' })
    expect(helpers).toContainEqual({
      name: 'heard',
      aliases: ['exposedText', 'textOf'],
      file: 'testing/stories.ts',
    })
  })

  it('fails a shared helper declared outside its file, at the top level only', () => {
    const problems = helperProblems(root, 'scripts/checks/fixtures/shared-parts/helpers', [
      { name: 'given', aliases: [], file: 'internal/nodes.ts' },
      { name: 'known', aliases: [], file: 'internal/nodes.ts' },
      { name: 'usePart', aliases: [], file: 'internal/use-part.ts' },
    ])
    expect(problems.map((p) => [p.line, p.message.split(';')[0]])).toEqual([
      [4, 'declares given, a shared helper'],
      [6, 'declares usePart, a shared helper'],
    ])
  })

  it('fails a copy of a shared helper under a new name, and one under an alias the table lists, in a unit test too, and inline in a map', () => {
    const problems = helperProblems(root, 'scripts/checks/fixtures/shared-parts/copies', [
      { name: 'classes', aliases: [], file: 'internal/nodes.ts' },
      { name: 'heard', aliases: ['exposedText'], file: 'internal/nodes.ts' },
    ])
    expect(problems.map((p) => [p.line, p.message.split(';')[0]])).toEqual([
      [4, 'declares heardIn, a copy of the shared helper heard'],
      [4, 'declares join, a copy of the shared helper classes'],
      [7, 'declares spoken, a copy of the shared helper heard'],
      [14, 'declares exposedText, the shared helper heard under another name'],
      [3, 'holds a copy of the shared helper heard inline, such as in a map'],
    ])
    expect(problems[0].file).toMatch(/Card\.test\.tsx$/)
  })

  it('fails a helper two story files declare with one body, but not a query or one reading its own file', () => {
    const problems = copiedStoryHelpers(root, 'scripts/checks/fixtures/shared-parts/stories')
    expect(
      problems.map((p) => [p.file.split('/').at(-1), p.line, p.message.split(';')[0]]),
    ).toEqual([
      [
        'Card.stories.tsx',
        6,
        'declares noFocusIn, a helper expectNoFocus in scripts/checks/fixtures/shared-parts/stories/components/Chip/Chip.stories.tsx and leaves in scripts/checks/fixtures/shared-parts/stories/components/Tag/Tag.stories.tsx declares too',
      ],
      [
        'Chip.stories.tsx',
        6,
        'declares expectNoFocus, a helper noFocusIn in scripts/checks/fixtures/shared-parts/stories/components/Card/Card.stories.tsx and leaves in scripts/checks/fixtures/shared-parts/stories/components/Tag/Tag.stories.tsx declares too',
      ],
      // a copy inside a story's play function is a copy all the same
      [
        'Tag.stories.tsx',
        6,
        'declares leaves inside a story, a helper noFocusIn in scripts/checks/fixtures/shared-parts/stories/components/Card/Card.stories.tsx and expectNoFocus in scripts/checks/fixtures/shared-parts/stories/components/Chip/Chip.stories.tsx declares too',
      ],
    ])
  })

  it('fails a helper two unit tests declare with one body', () => {
    const problems = copiedStoryHelpers(root, 'scripts/checks/fixtures/shared-parts/tests')
    expect(problems.map((p) => [p.file.split('/').at(-1), p.line])).toEqual([
      ['Gauge.test.tsx', 4],
      ['Meter.test.tsx', 4],
    ])
    expect(problems[0].message).toMatch(/^declares tagOf, a helper part in .*Meter\.test\.tsx/)
    expect(problems[0].message).toContain('testing/markup.ts')
  })

  const tables = 'scripts/checks/fixtures/shared-parts/tables'
  const stateHelpers = [
    { name: 'STATE_KEY', aliases: [], file: 'internal/states.ts' },
    // `Object.keys(STATE_KEY)`: a list of its keys
    { name: 'STATES', aliases: [], file: 'internal/states.ts' },
  ]

  it('fails a copy of a shared table in another shape, or read from one, in code and stories alike', () => {
    const copies = helperProblems(root, tables, stateHelpers)
    expect(copies.map((p) => [p.file.split('/').at(-1), p.line, p.message.split(';')[0]])).toEqual([
      ['Dot.stories.tsx', 1, 'declares VARIANTS, a copy of the shared helper STATES'],
      ['Dot.tsx', 3, 'declares LABELS, a copy of the shared helper STATE_KEY'],
    ])
  })

  it("fails a table two files declare, a story or a unit test as much as code, but not a story file's exports", () => {
    // a story file's exports (Planned), one holding more than literals, and one under four strings
    // are no table, and a copy of a shared one is helperProblems'
    const found = copiedTables(root, tables, stateHelpers)
    expect(found.map((p) => [p.file.split('/').at(-1), p.line])).toEqual([
      ['Row.test.tsx', 1],
      ['Row.tsx', 3],
      ['Strip.stories.tsx', 1],
      ['Strip.tsx', 1],
    ])
    const home = (file: string) => found.find((p) => p.file.endsWith(file))!.message
    expect(home('Row.tsx')).toMatch(
      /^declares KINDS, a table of the strings EXPECTED in .*Row\.test\.tsx and KINDS in .*Strip\.stories\.tsx and ORDER in .*Strip\.tsx holds too; write it once in packages\/perron\/src\/internal\//,
    )
    expect(home('Strip.stories.tsx')).toContain(
      'write it once in packages/perron/src/testing/stories.ts',
    )
    expect(home('Row.test.tsx')).toContain('write it once in packages/perron/src/testing/markup.ts')
  })

  it('passes the real tree', async () => {
    expect(await check.run(root)).toEqual([])
  }, 15_000)
})
