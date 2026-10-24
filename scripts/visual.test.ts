// The visual stage against a real browser: builds the Storybook of the made-up Swatch in
// storybook/fixtures/visual, measures it in Chromium against the read-back in
// scripts/checks/fixtures/visual, and expects the variants drawn true to pass and BrandDefault,
// whose read-back is wrong on purpose (a width, a fill and its export's hash), to fail. Run in the
// `fixtures` project of vitest.config.ts, with the other browser fixtures.
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { designProblems } from './checks/penpot.ts'
import type { Report } from './lib/visual.ts'
import { runVisual } from './visual.ts'

const repo = join(import.meta.dirname, '..')
const fixture = 'scripts/checks/fixtures/visual'
let out: string
let report: Report

beforeAll(async () => {
  out = mkdtempSync(join(tmpdir(), 'perron-visual-report-'))
  report = await runVisual({
    root: join(repo, fixture),
    name: 'Swatch',
    storybook: { build: 'storybook/fixtures/visual/.storybook' },
    out,
  })
}, 120_000)

afterAll(() => rmSync(out, { recursive: true }))

const run = (variant: string, theme: string) =>
  report.runs.find((r) => r.variant === variant && r.theme === theme)!

describe('the visual stage', () => {
  it('measures a fixture read-back the penpot check passes', () => {
    expect(designProblems(repo, `${fixture}/penpot`)).toEqual([])
  })

  it('passes each part drawn true, in light and dark, with hover, keyboard focus and a press driven', () => {
    for (const variant of ['PlainDefault', 'PlainHover', 'PlainFocus', 'PlainPressed'])
      for (const theme of ['light', 'dark'])
        expect(run(variant, theme).rows.filter((r) => !r.pass)).toEqual([])
    expect(run('PlainHover', 'dark').rows).toContainEqual({
      part: 'root',
      check: 'fill (color.surface.hover)',
      expected: 'rgba(235, 238, 235, 0.06)',
      measured: 'rgba(235, 238, 235, 0.06)',
      pass: true,
    })
    expect(run('PlainFocus', 'light').rows).toContainEqual({
      part: 'root',
      check: 'fill (color.surface.selected)',
      expected: 'rgba(18, 24, 27, 0.09)',
      measured: 'rgba(18, 24, 27, 0.09)',
      pass: true,
    })
  })

  it('fails a part off its layer size and a token the story does not use', () => {
    expect(run('BrandDefault', 'light').rows.filter((r) => !r.pass)).toEqual([
      { part: 'root', check: 'width', expected: '40px', measured: '34px', pass: false },
      {
        part: 'root',
        check: 'fill (color.surface.inverse)',
        expected: '#12181B',
        measured: 'rgb(217, 154, 0)',
        pass: false,
      },
    ])
    expect(report.pass).toBe(false)
  })

  it('reports the pixel difference against the export, and an export the read-back no longer hashes', () => {
    expect(run('PlainDefault', 'light').pixelDiff).toBeLessThan(1)
    expect(existsSync(join(out, 'PlainDefault.dark.diff.png'))).toBe(true)
    expect(report.stale).toEqual(['BrandDefault'])
  })

  it('writes report.json and a report.md table per variant and theme', () => {
    expect(JSON.parse(readFileSync(join(out, 'report.json'), 'utf8'))).toMatchObject({
      component: 'Swatch',
      pass: false,
    })
    const md = readFileSync(join(out, 'report.md'), 'utf8')
    expect(md).toContain('### BrandDefault, dark: fails')
    expect(md).toMatch(/\| `root` +\| width +\| 40px +\| 34px +\| \*\*no\*\* +\|/)
  })
})
