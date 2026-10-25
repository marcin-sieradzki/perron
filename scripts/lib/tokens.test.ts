import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { composite, contrastRatio } from './color.ts'
import { buildDocs, documentedTokens } from './docs.ts'
import { PACKAGE } from './paths.ts'
import { base, theme } from '../../packages/perron/tokens/generated/tokens.ts'
import { readSources } from './token-sources.ts'
import { buildAll, loadTokens, resolveValue, tokenMap, type TokenSources } from './tokens.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const sources = readSources(root)
const tokens = loadTokens(sources)

describe('token sources', () => {
  it('generated files and doc tables match the sources', async () => {
    const out = { ...buildAll(sources), ...(await buildDocs(root, tokens)) }
    for (const [rel, text] of Object.entries(out))
      expect(readFileSync(join(root, rel), 'utf8'), `${rel} is stale: run npm run tokens`).toBe(
        text,
      )
  })

  it('lists every token in a table on some foundation page', () => {
    const dir = join(root, 'docs/foundations')
    const documented = new Set(
      readdirSync(dir).flatMap((f) => documentedTokens(readFileSync(join(dir, f), 'utf8'), tokens)),
    )
    const all = [...tokens.base, ...tokens.themes[tokens.defaultTheme]].map((t) => t.name)
    expect(all.filter((name) => !documented.has(name))).toEqual([])
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

  it('rejects a modifier context that overrides a token base does not have', () => {
    const s = clone()
    const reduced = s.files['motion-reduced.tokens.json'] as { duration: Record<string, unknown> }
    reduced.duration.nope = { $value: { value: 1, unit: 'ms' } }
    expect(() => loadTokens(s)).toThrow(/not a base duration token/)
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
 * WCAG AA contrast for text tokens, measured against the opaque surfaces. Pairs below 4.5:1 are
 * listed here so the list stays honest: the test fails when a new pair drops below the bar, and
 * also when a listed pair is fixed and should leave the list. Tertiary text is the one deliberate
 * miss; docs/foundations/colour.md says where it may be used.
 */
const KNOWN_TEXT_FAILURES = new Set(
  ['light', 'dark'].flatMap((th) =>
    ['color.text.tertiary', 'color.transit.delay.unknown'].flatMap((fg) =>
      ['default', 'raised', 'inset'].map((bg) => `${th} ${fg} on color.surface.${bg}`),
    ),
  ),
)

/** Line badges whose label colour falls below 4.5:1 on the line colour (same in both themes). */
const KNOWN_BADGE_FAILURES = new Set(['m1', 'm4', 'a', 'b', 'c'])

describe('contrast', () => {
  const surfaces = ['color.surface.default', 'color.surface.raised', 'color.surface.inset']
  const text =
    /^color\.(text\.(primary|secondary|tertiary|success|warning|danger|info|brand)$|transit\.(delay|severity)\.)/

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

  it('status and brand text reach 4.5:1 on their own tint, and text on the brand fill too', () => {
    for (const th of ['light', 'dark'] as const) {
      const t = { ...base, ...theme[th] }
      for (const s of ['success', 'warning', 'danger', 'info'] as const) {
        expect(contrastRatio(t[`color.text.${s}`], t[`color.surface.${s}`])).toBeGreaterThan(4.5)
        expect(contrastRatio(t['color.text.primary'], t[`color.surface.${s}`])).toBeGreaterThan(7)
      }
      expect(contrastRatio(t['color.text.brand'], t['color.surface.brand-subtle'])).toBeGreaterThan(
        4.5,
      )
      for (const fill of [
        'color.surface.brand',
        'color.surface.brand-hover',
        'color.surface.brand-pressed',
      ] as const)
        expect(contrastRatio(t['color.text.on-color.dark'], t[fill])).toBeGreaterThan(4.5)
      for (const fill of [
        'color.surface.inverse',
        'color.surface.inverse-hover',
        'color.surface.inverse-pressed',
      ] as const)
        expect(contrastRatio(t['color.text.inverse'], t[fill])).toBeGreaterThan(4.5)
    }
  })

  it('steps a solid fill 1.2:1 or more from rest to hover and from hover to pressed', () => {
    for (const th of ['light', 'dark'] as const) {
      const t = { ...base, ...theme[th] }
      for (const fill of ['inverse', 'brand'] as const) {
        const rest = t[`color.surface.${fill}`]
        const hover = t[`color.surface.${fill}-hover`]
        const pressed = t[`color.surface.${fill}-pressed`]
        expect(contrastRatio(rest, hover), `${th} ${fill} hover`).toBeGreaterThanOrEqual(1.2)
        expect(contrastRatio(hover, pressed), `${th} ${fill} pressed`).toBeGreaterThanOrEqual(1.2)
        expect(contrastRatio(rest, pressed), `${th} ${fill} pressed`).toBeGreaterThan(
          contrastRatio(rest, hover),
        )
      }
    }
  })

  it('lays a pressed layer over a quiet control that is denser than its hover layer', () => {
    for (const th of ['light', 'dark'] as const) {
      const t = theme[th]
      // a brand outline button sits on default or raised: on inset its light label misses
      // (docs/foundations/accessibility.md)
      for (const surface of ['color.surface.default', 'color.surface.raised'] as const) {
        const ground = t[surface]
        const hover = composite(t['color.surface.hover'], ground)
        const pressed = composite(t['color.surface.selected'], ground)
        expect(contrastRatio(pressed, ground)).toBeGreaterThan(contrastRatio(hover, ground))
        // the label of a pressed outline button, brand or ink, still reads
        for (const label of ['color.text.brand', 'color.text.primary'] as const)
          expect(
            contrastRatio(t[label], pressed),
            `${th} ${label} on ${surface}`,
          ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('control edges, status fills and the focus ring reach 3:1 against what they sit on', () => {
    const failures: string[] = []
    for (const th of ['light', 'dark'] as const) {
      const t: Record<string, string> = { ...base, ...theme[th] }
      const grounds = [...surfaces, 'color.map.land', 'color.map.water', 'color.map.park']
      const marks = [
        'color.border.control',
        'color.border.brand',
        'color.border.focus',
        ...['success', 'warning', 'danger', 'info'].map((s) => `color.status.${s}`),
      ]
      for (const mark of marks)
        for (const ground of mark === 'color.border.focus' ? grounds : surfaces)
          if (contrastRatio(composite(t[mark], t[ground]), t[ground]) < 3)
            failures.push(`${th} ${mark} on ${ground}`)
    }
    expect(failures).toEqual([])
  })

  it('sets inset surfaces apart from raised ones in both themes', () => {
    for (const th of ['light', 'dark'] as const) {
      const t = theme[th]
      expect(
        contrastRatio(t['color.surface.inset'], t['color.surface.raised']),
      ).toBeGreaterThanOrEqual(1.15)
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

describe('palette', () => {
  const palette = tokens.base.filter((t) => t.name.startsWith('palette.'))
  const paletteHex = new Set(palette.map((t) => (t.value as { hex: string }).hex))
  const all = [...tokens.base, ...Object.values(tokens.themes).flat()]

  it('gives every interface colour a palette step, translucent ones by their RGB', () => {
    const loose = all
      .filter((t) => /^color\.(text|surface|border|status|scrim)\b/.test(t.name))
      .filter((t) => typeof t.value !== 'string')
      .filter((t) => {
        const c = t.value as { hex: string; alpha?: number }
        return c.alpha === undefined || c.alpha === 1 || !paletteHex.has(c.hex)
      })
      .map((t) => t.name)
    expect(loose).toEqual([])
  })

  it('is read only by color tokens', () => {
    const readers = all
      .filter((t) => JSON.stringify(t.value).includes('{palette.'))
      .filter((t) => !t.name.startsWith('color.'))
      .map((t) => t.name)
    expect(readers).toEqual([])
  })
})

describe('typography', () => {
  it('loads exactly the font weights the roles use', () => {
    const map = tokenMap(tokens, tokens.defaultTheme)
    const used = new Set(
      tokens.base
        .filter((t) => t.type === 'typography')
        .map((t) => {
          const v = resolveValue(t.value, map) as { fontFamily: string[]; fontWeight: number }
          return `${v.fontFamily[0].toLowerCase().replaceAll(' ', '-')}/${v.fontWeight}`
        }),
    )
    const css = readFileSync(join(root, PACKAGE, 'styles/fonts.css'), 'utf8')
    const loaded = new Set([...css.matchAll(/@fontsource\/([\w-]+\/\d+)\.css/g)].map((m) => m[1]))
    expect([...loaded].sort()).toEqual([...used].sort())
  })
})
