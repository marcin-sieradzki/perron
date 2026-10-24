import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import check, { cssProblems } from './component-css.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
const lint = (fixture: string, layer: 'component' | 'pattern' | 'part' = 'component') =>
  cssProblems(fixture, readFileSync(join(here, 'fixtures/component-css', fixture), 'utf8'), layer)

describe('component-css', () => {
  it.each([
    ['raw-hex.css', /raw colour #12181b/, 1],
    ['raw-colour-function.css', /raw colour (rgb|oklch)\(/, 2],
    ['named-colour.css', /raw colour red/, 1],
    ['raw-length.css', /raw length (4px|0\.5rem)/, 2],
    ['raw-duration.css', /raw duration 200ms/, 1],
    ['var-fallback.css', /var\(--perron-space-200\) has a fallback/, 1],
    ['unknown-token.css', /--perron-space-250 is not a token/, 1],
    ['redefines-token.css', /sets --perron-color-text-primary/, 1],
    ['icon-size.css', /--perron-icon-size takes an icon\.size\.\* token/, 1],
    ['media-query.css', /@media \(min-width: 40rem\)/, 1],
    ['theme.css', /data-theme|prefers-color-scheme/, 2],
    ['system-colour.css', /system colour (ButtonText|LinkText)/, 2],
    ['palette.css', /palette\.neutral\.500 is outside the families component CSS reads/, 1],
    ['pattern-token.css', /color\.transit\.line\.m1 is outside the families/, 1],
    ['z-index.css', /z-index\.dialog/, 1],
    ['raw-font.css', /raw font/, 1],
    ['tracking.css', /letter-spacing: var\(--perron-typography-label-tracking\)/, 1],
    ['loop.css', /prefers-reduced-motion/, 1],
    ['disabled-opacity.css', /never an opacity/, 1],
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

  it('takes a perron-allow exemption', () => {
    expect(lint('allowed.css')).toEqual([])
  })

  it('passes the real tree', async () => {
    expect(await check.run(root)).toEqual([])
  })
})
