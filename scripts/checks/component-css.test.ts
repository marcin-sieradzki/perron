import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import check, {
  cssProblems,
  patternMediaProblems,
  phoneQuery,
  readCssRules,
} from './component-css.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
const lint = (fixture: string, layer: 'component' | 'pattern' | 'part' = 'component') =>
  cssProblems(fixture, readFileSync(join(here, 'fixtures/component-css', fixture), 'utf8'), layer)

describe('component-css', () => {
  it("reads the families, queries and system colours from the contract's tables", () => {
    const rules = readCssRules(readFileSync(join(root, 'docs/components/README.md'), 'utf8'))
    const component = [
      'color.text.*',
      'color.surface.*',
      'color.border.*',
      'color.status.*',
      'color.scrim',
      'typography.*',
      'font.*',
      'space.*',
      'size.*',
      'radius.*',
      'border.width.*',
      'focus.*',
      'icon.size.*',
      'shadow.*',
      'effect.*',
      'duration.*',
      'easing.*',
      'z-index.dialog',
      'color.transit.*',
      'color.data-state.*',
      'vehicle-dot.*',
    ]
    expect(rules.families).toEqual({
      component,
      part: component,
      pattern: [...component, 'color.map.*', 'map.*', 'color.chart.*', 'opacity.*', 'z-index.*'],
    })
    expect(rules.media).toEqual([
      '(hover: hover)',
      '(prefers-reduced-motion: reduce)',
      '(forced-colors: active)',
    ])
    expect(rules.patternMedia).toEqual(['(max-width: 759.98px)'])
    expect([...rules.forcedColours]).toEqual([
      'canvas',
      'canvastext',
      'highlight',
      'highlighttext',
      'buttontext',
      'graytext',
    ])
  })

  it.each([
    ['raw-hex.css', /raw colour #12181b/, 1],
    ['raw-colour-function.css', /raw colour (rgb|oklch)\(/, 2],
    ['named-colour.css', /raw colour red/, 1],
    ['raw-length.css', /raw length (4px|0\.5rem|0\.5lh)/, 3],
    ['raw-duration.css', /raw duration 200ms/, 1],
    ['var-fallback.css', /var\(--perron-space-200\) has a fallback/, 1],
    ['unknown-token.css', /--perron-space-250 is not a token/, 1],
    ['redefines-token.css', /sets --perron-color-text-primary/, 1],
    ['icon-size.css', /--perron-icon-size takes an icon\.size\.\* token/, 1],
    ['media-query.css', /@media \(min-width: 40rem\)/, 1],
    ['theme.css', /data-theme|prefers-color-scheme/, 2],
    ['system-colour.css', /system colour (ButtonText|LinkText)/, 2],
    ['palette.css', /palette\.neutral\.500 is outside the families component CSS reads/, 1],
    ['pattern-token.css', /color\.map\.land is outside the families/, 1],
    ['z-index.css', /z-index\.sheet is outside the families component CSS reads/, 1],
    ['raw-font.css', /raw font/, 1],
    ['tracking.css', /letter-spacing: var\(--perron-typography-label-tracking\)/, 1],
    ['loop.css', /prefers-reduced-motion/, 1],
    ['loop-elsewhere.css', /in a rule for \.pn-Fixture that sets its animation/, 1],
    ['disabled-opacity.css', /never an opacity/, 1],
    [
      'long-word.css',
      /^\.pn-(Card-title|Note) sets a typography role but not what a long word does/,
      2,
    ],
  ])('fails %s', (fixture, message, count) => {
    const problems = lint(fixture)
    expect(problems).toHaveLength(count)
    for (const p of problems) expect(p.message).toMatch(message)
    expect(problems.every((p) => p.line)).toBe(true)
  })

  it('passes CSS written to the contract', () => {
    expect(lint('passes.css')).toEqual([])
    expect(lint('passes.css', 'part')).toEqual([])
  })

  it('lets a pattern read its own families', () => {
    expect(lint('pattern-passes.css', 'pattern')).toEqual([])
    expect(lint('pattern-passes.css')).toHaveLength(3)
  })

  it('lets only a pattern query breakpoint.phone', () => {
    expect(lint('phone-query.css', 'pattern')).toEqual([])
    const problems = lint('phone-query.css')
    expect(problems).toHaveLength(1)
    expect(problems[0].message).toMatch(
      /@media \(max-width: 759\.98px\) is not one of the queries components use/,
    )
  })

  it("fails a rule inside the phone query that doesn't select size='responsive'", () => {
    const problems = lint('phone-query-other-size.css', 'pattern')
    expect(problems.map((p) => p.message.split(' is inside')[0])).toEqual([
      ".pn-Fixture[data-size='small']",
      '.pn-Fixture-part',
      ".pn-Fixture:not([data-size='responsive']) .pn-Fixture-part",
    ])
    for (const p of problems) expect(p.message).toMatch(/select \[data-size='responsive'\]/)
    expect(problems.every((p) => p.line)).toBe(true)
  })

  it("holds the contract's pattern query to breakpoint.phone, less 0.02 px", () => {
    const contract = readFileSync(join(root, 'docs/components/README.md'), 'utf8')
    const rules = readCssRules(contract)
    expect(phoneQuery(760)).toBe('(max-width: 759.98px)')
    expect(patternMediaProblems(contract, rules, 760)).toEqual([])
    // the token moved and the contract didn't: the query is named at its line of the contract
    const moved = patternMediaProblems(contract, rules, 780)
    expect(moved).toHaveLength(1)
    expect(moved[0].message).toMatch(
      /breakpoint\.phone is 780px, so its query is \(max-width: 779\.98px\)/,
    )
    expect(contract.split('\n')[moved[0].line! - 1]).toContain('`(max-width: 759.98px)`')
    // the contract moved and the token didn't
    const edited = contract.replace('`(max-width: 759.98px)`', '`(max-width: 760px)`')
    expect(patternMediaProblems(edited, readCssRules(edited), 760)).toHaveLength(1)
  })

  it('takes a perron-allow exemption', () => {
    expect(lint('allowed.css')).toEqual([])
  })

  // a CI runner's margin over vitest's 5 s, as shared-parts' and docs' have
  it('passes the real tree', async () => {
    expect(await check.run(root)).toEqual([])
  }, 15_000)
})
