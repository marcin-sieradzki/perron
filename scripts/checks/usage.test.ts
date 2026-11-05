import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import usage from './usage.ts'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => join(here, 'fixtures/usage', name)

describe('usage', () => {
  it('passes specs with every part, and one in design whatever it holds', () => {
    // Button has a types row its stories cite and a note for agents; IconButton and DepartureRow
    // say nothing else does what they do, and no agent has erred with them; Dialog is in design, so
    // its broken parts are not read
    expect(usage.run(fixture('complete'))).toEqual([])
  })

  it("names a spec from building on without When to use, the five-column Do and don't table or For agents", () => {
    // Badge is in design, so its spec needs none of them yet
    expect(usage.run(fixture('missing'))).toEqual([
      {
        file: 'docs/components/flag.md',
        message:
          'docs/components/flag.md has no When to use: write it as the first section, right after the intro and its run notes (docs/components/TEMPLATE.md)',
      },
      {
        file: 'docs/components/flag.md',
        message:
          'docs/components/flag.md has no For agents: write it as the last section, with "None known yet." until an agent makes a mistake with the entry (docs/components/TEMPLATE.md)',
      },
      {
        file: 'docs/components/flag.md',
        line: 11,
        message:
          "docs/components/flag.md's Do and don't table has the columns Do, Don't: give it Rule, Level, Do, Don't and Checked by, in that order (docs/components/TEMPLATE.md)",
      },
      {
        file: 'docs/components/pin.md',
        message:
          "docs/components/pin.md has no Do and don't table: give it one, with the columns Rule, Level, Do, Don't and Checked by (docs/components/TEMPLATE.md)",
      },
    ])
  })

  it("names a Do and don't table without the five columns, and a malformed, repeated or unknown cell", () => {
    expect(usage.run(fixture('table'))).toEqual([
      {
        file: 'docs/components/flag.md',
        line: 16,
        message:
          '"DD-0" is no rule id: write DD- and the rule\'s number, counted from 1 within the spec, as DD-1',
      },
      {
        file: 'docs/components/flag.md',
        line: 17,
        message:
          '"D-3" is no rule id: write DD- and the rule\'s number, counted from 1 within the spec, as DD-1',
      },
      {
        file: 'docs/components/flag.md',
        line: 18,
        message:
          "DD-1 is the id of line 15's rule too: give each rule a number of its own, and keep the numbers a review may have cited",
      },
      {
        file: 'docs/components/flag.md',
        line: 18,
        message:
          'DD-1\'s level is "may", not must or should: must when its Don\'t is never right, should when a caller may break it with a reason',
      },
      {
        file: 'docs/components/flag.md',
        line: 18,
        message:
          'DD-1 is checked by "tests", not types or review: types when FlagProps rejects its Don\'t, review when only a review of the caller\'s code can catch it',
      },
      {
        file: 'docs/components/pin.md',
        line: 13,
        message:
          "docs/components/pin.md's Do and don't table has the columns Rule, Do, Don't, Level, Checked by: give it Rule, Level, Do, Don't and Checked by, in that order (docs/components/TEMPLATE.md)",
      },
    ])
  })

  it("names a types rule no @ts-expect-error in the entry's folder cites, and a citation of no types rule", () => {
    // DD-1 is cited in JSX; DD-2 by a directive with no id, and in Pin's folder for Pin's own DD-2
    const cites = (id: string) =>
      `\`@ts-expect-error ${id}\` cites no types rule of docs/components/flag.md's Do and don't: cite the rule the line below breaks, one whose Checked by is types`
    expect(usage.run(fixture('types'))).toEqual([
      {
        file: 'docs/components/flag.md',
        line: 16,
        message:
          'DD-2 is checked by types, but no `@ts-expect-error DD-2` in a test or story of packages/perron/src/components/Flag/ proves it: write a line FlagProps rejects under `// @ts-expect-error DD-2: <what it breaks>`, or check the rule by review',
      },
      {
        file: 'packages/perron/src/components/Flag/Flag.test.tsx',
        line: 15,
        message: cites('DD-3'),
      },
      {
        file: 'packages/perron/src/components/Flag/Flag.test.tsx',
        line: 18,
        message: cites('DD-9'),
      },
    ])
  })

  it("names a Do and don't row that names WCAG with no success criterion, in five columns or two", () => {
    const message =
      'This row names WCAG but no success criterion: name the one it rests on by its number, such as 2.5.8 Target size (minimum), so a review knows what to test'
    expect(usage.run(fixture('wcag'))).toEqual([
      { file: 'docs/components/flag.md', line: 15, message },
      { file: 'docs/components/flag.md', line: 17, message },
      {
        file: 'docs/patterns/stop-row.md',
        line: 13,
        message:
          "docs/patterns/stop-row.md's Do and don't table has the columns Do, Don't: give it Rule, Level, Do, Don't and Checked by, in that order (docs/components/TEMPLATE.md)",
      },
      { file: 'docs/patterns/stop-row.md', line: 15, message },
    ])
  })

  it('names an alternative that is no registered entry, the entry itself or no link to its spec', () => {
    // Pin, StopRow, a pattern, and Badge, in design, are registered; StopRow has no alternative
    const flag = (line: number, message: string) => ({
      file: 'docs/components/flag.md',
      line,
      message,
    })
    expect(usage.run(fixture('alternatives'))).toEqual([
      flag(
        14,
        'Chip is no registered entry: name an entry of packages/perron/components.json, or take the row out',
      ),
      flag(15, 'Flag names itself: When to use names the entries to use in its place'),
      flag(16, "The link to Tag goes to tag-old.md, not to Tag's spec page: link tag.md"),
      flag(
        17,
        "This row names no entry by a link: write the entry's name as a link to its spec page, such as [Pin](pin.md)",
      ),
      flag(18, "Pin's row says nothing under When: say when to use Pin in Flag's place"),
      {
        file: 'docs/components/pin.md',
        line: 5,
        message:
          'docs/components/pin.md\'s When to use has no table of the entries to use instead: give it one, with the columns Use instead and When, or the line "Nothing else in Perron does this." (docs/components/TEMPLATE.md)',
      },
      {
        file: 'docs/components/tag.md',
        line: 9,
        message:
          "docs/components/tag.md's When to use table has the columns Component, Use when: give it Use instead and When (docs/components/TEMPLATE.md)",
      },
    ])
  })

  it('names When to use out of first place, For agents out of last, and For agents that is no list', () => {
    // Tag's For agents is a list whose first item runs onto a second line
    expect(usage.run(fixture('sections'))).toEqual([
      {
        file: 'docs/components/flag.md',
        line: 9,
        message:
          "docs/components/flag.md's When to use is not its first section: move it above Anatomy, right after the intro and its run notes (docs/components/TEMPLATE.md)",
      },
      {
        file: 'docs/components/flag.md',
        line: 15,
        message:
          "docs/components/flag.md's For agents is not its last section: move it below Do and don't (docs/components/TEMPLATE.md)",
      },
      {
        file: 'docs/components/pin.md',
        line: 17,
        message:
          'docs/components/pin.md\'s For agents is neither "None known yet." nor a bulleted list: write each mistake an agent has made as a bullet, the mistake and then its fix',
      },
    ])
  })

  it('passes on the repo', () => {
    expect(usage.run(join(here, '../..'))).toEqual([])
  })
})
