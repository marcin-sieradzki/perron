import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from './color.ts'
import { base, theme } from '../../tokens/generated/tokens.ts'
import { readSources } from '../build-tokens.ts'
import { buildAll, loadTokens, resolveValue, tokenMap, type TokenSources } from './tokens.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const sources = readSources()
const tokens = loadTokens(sources)

describe('token sources', () => {
  it('generated files match the sources', () => {
    for (const [rel, text] of Object.entries(buildAll(sources)))
      expect(readFileSync(join(root, rel), 'utf8'), `${rel} is stale: run npm run tokens`).toBe(
        text,
      )
  })

  it('has light and dark themes with light as the default', () => {
    expect(Object.keys(tokens.themes).sort()).toEqual(['dark', 'light'])
    expect(tokens.defaultTheme).toBe('light')
  })

  it('resolves every alias in every theme', () => {
    for (const th of Object.keys(tokens.themes)) {
      const map = tokenMap(tokens, th)
      for (const t of map.values()) expect(() => resolveValue(t.value, map)).not.toThrow()
    }
  })

  it('gives every token a $type, including inherited group types', () => {
    const all = [...tokens.base, ...Object.values(tokens.themes).flat()]
    expect(all.filter((t) => !t.type).map((t) => t.name)).toEqual([])
  })

  const clone = (): TokenSources => structuredClone(sources)

  it('rejects a theme that is missing a token', () => {
    const s = clone()
    const dark = s.files['dark.tokens.json'] as { color: { text: Record<string, unknown> } }
    delete dark.color.text.tertiary
    expect(() => loadTokens(s)).toThrow(/same tokens/)
  })

  it('rejects a base token that refers to a theme token', () => {
    const s = clone()
    const b = s.files['base.tokens.json'] as { color: Record<string, unknown> }
    b.color.scrim = { $type: 'color', $value: '{color.text.primary}' }
    expect(() => loadTokens(s)).toThrow(/not a base token/)
  })

  it('reports unknown references and cycles', () => {
    const map = tokenMap(tokens, 'light')
    expect(() => resolveValue('{color.nope}', map)).toThrow(/Unknown reference/)
    const looped = new Map(map)
    looped.set('a', { name: 'a', type: 'color', value: '{b}' })
    looped.set('b', { name: 'b', type: 'color', value: '{a}' })
    expect(() => resolveValue('{a}', looped)).toThrow(/cycle/)
  })
})

/**
 * WCAG AA contrast for text tokens, measured against the opaque surfaces. Pairs below 4.5:1 that
 * the prototype ships today are listed here so the list stays honest: the test fails when a new
 * pair drops below the bar, and also when a listed pair is fixed and should leave the list.
 * docs/foundations.md says how each is used; the token naming research proposes fixes.
 */
const KNOWN_TEXT_FAILURES = new Set([
  'light color.text.tertiary on color.surface.default',
  'light color.text.tertiary on color.surface.raised',
  'light color.text.tertiary on color.surface.inset',
  'light color.transit.delay.unknown on color.surface.default',
  'light color.transit.delay.unknown on color.surface.raised',
  'light color.transit.delay.unknown on color.surface.inset',
  'light color.status.success on color.surface.default',
  'light color.status.success on color.surface.raised',
  'light color.status.success on color.surface.inset',
  'light color.transit.delay.on-time on color.surface.default',
  'light color.transit.delay.on-time on color.surface.raised',
  'light color.transit.delay.on-time on color.surface.inset',
  'light color.status.warning on color.surface.default',
  'light color.status.warning on color.surface.raised',
  'light color.status.warning on color.surface.inset',
  'light color.status.danger on color.surface.inset',
  'light color.transit.delay.late on color.surface.inset',
  'light color.transit.severity.delay on color.surface.inset',
  'dark color.text.tertiary on color.surface.default',
  'dark color.text.tertiary on color.surface.raised',
  'dark color.text.tertiary on color.surface.inset',
  'dark color.transit.delay.unknown on color.surface.default',
  'dark color.transit.delay.unknown on color.surface.raised',
  'dark color.transit.delay.unknown on color.surface.inset',
])

/** Line badges whose label colour falls below 4.5:1 on the line colour (same in both themes). */
const KNOWN_BADGE_FAILURES = new Set(['m1', 'm4', 'a', 'b', 'c'])

describe('contrast', () => {
  const surfaces = ['color.surface.default', 'color.surface.raised', 'color.surface.inset']
  const text = /^color\.(text\.(primary|secondary|tertiary)$|status\.|transit\.(delay|severity)\.)/

  it('text tokens reach 4.5:1 on every opaque surface, apart from the known list', () => {
    const failures: string[] = []
    for (const th of ['light', 'dark'] as const) {
      const t: Record<string, string> = { ...base, ...theme[th] }
      for (const fg of Object.keys(t).filter((k) => text.test(k)))
        for (const bg of surfaces)
          if (contrastRatio(t[fg], t[bg]) < 4.5) failures.push(`${th} ${fg} on ${bg}`)
    }
    expect(failures.sort()).toEqual([...KNOWN_TEXT_FAILURES].sort())
  })

  it('line badge labels reach 4.5:1, apart from the known list', () => {
    const failures = ['m1', 'm2', 'm3', 'm4', 'a', 'b', 'c', 'e', 'f', 'h'].filter(
      (id) =>
        contrastRatio(
          base[`color.transit.line.${id}` as keyof typeof base],
          base[`color.transit.line-on.${id}` as keyof typeof base],
        ) < 4.5,
    )
    expect(failures).toEqual([...KNOWN_BADGE_FAILURES])
  })

  it('bus and regional badges reach 4.5:1 in both themes', () => {
    for (const th of ['light', 'dark'] as const) {
      const t = theme[th]
      expect(
        contrastRatio(t['color.transit.mode.bus'], t['color.transit.mode.on-bus']),
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(t['color.transit.mode.regional'], t['color.transit.mode.on-regional']),
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('primary and secondary ink reach 7:1 and 4.5:1 on the solid surface in both themes', () => {
    for (const th of ['light', 'dark'] as const) {
      const t = theme[th]
      expect(contrastRatio(t['color.text.primary'], t['color.surface.default'])).toBeGreaterThan(7)
      expect(contrastRatio(t['color.text.secondary'], t['color.surface.default'])).toBeGreaterThan(
        4.5,
      )
    }
  })
})
