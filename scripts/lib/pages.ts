// The guideline pages as data for Storybook: each page's prose, with every table block of
// docs/foundations/*.md turned into rows a live block can draw (swatches, specimens, galleries)
// instead of markdown. The same token selection and values as the tables, from docs.ts.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readIcons, readLogos, type Icon, type Logo } from './assets.ts'
import { composite, contrastRatio } from './color.ts'
import { CONTRAST, FILES, literal, select, TOKENS, words } from './docs.ts'
import { cssVarName, resolveValue, tokenMap, type ResolvedTokens, type Token } from './tokens.ts'

/** The pages in the order the Contents page lists them, by path from the repo root. */
export const PAGES = [
  'docs/foundations/README.md',
  'docs/foundations/accessibility.md',
  'docs/foundations/elevation.md',
  'docs/foundations/icons.md',
  'docs/foundations/layout.md',
  'docs/foundations/logos.md',
  'docs/foundations/motion.md',
  'docs/foundations/primitive-colours.md',
  'docs/foundations/semantic-colours.md',
  'docs/foundations/semantic-spacing.md',
  'docs/foundations/typography.md',
  'docs/foundations/data-states.md',
  'docs/foundations/map.md',
  'docs/content-design.md',
  'docs/glossary.md',
  'docs/components/README.md',
  'docs/components/TEMPLATE.md',
  // registry:specs start: each spec page, written by npm run registry
  'docs/components/button.md',
  'docs/components/icon-button.md',
  'docs/components/link-button.md',
  'docs/components/toolbar.md',
  'docs/components/brand.md',
  'docs/components/text.md',
  'docs/components/empty-state.md',
  'docs/components/surface.md',
  'docs/components/map-controls.md',
  'docs/components/delay.md',
  'docs/components/line-badge.md',
  'docs/components/severity-label.md',
  'docs/components/station-icon.md',
  'docs/patterns/detail-header.md',
  // registry:specs end
]

export interface TokenValue {
  /** The CSS text with aliases followed, as the tables show it */
  css: string
  /** The token this one points at, if any */
  alias?: string
}

export interface TokenRow {
  name: string
  type: string
  /** `--perron-…`, for a preview that reads the live custom property */
  cssVar: string
  description?: string
  /** One value per theme for a theme token, else one under the default theme */
  values: Record<string, TokenValue>
  /** The value under each modifier context that changes the token, such as reduced motion */
  overrides: Record<string, string>
  /** For a typography role: its CSS class and capitals, if any */
  typography?: {
    className: string
    family: string
    weight: number
    size: string
    lineHeight: number
    tracking: string
    textTransform?: string
  }
}

export interface ContrastRow {
  name: string
  cssVar: string
  /** Ratio by theme, then by background token */
  ratios: Record<string, Record<string, number>>
}

export type Segment =
  | { kind: 'prose'; markdown: string }
  | { kind: 'tokens'; themes: string[]; contexts: string[]; rows: TokenRow[] }
  | {
      kind: 'contrast'
      minimum: number
      themes: string[]
      backgrounds: { name: string; cssVar: string }[]
      rows: ContrastRow[]
    }
  | { kind: 'icons'; categories: { name: string; items: (Icon & { px: string })[] }[] }
  | { kind: 'logos'; categories: { name: string; items: Logo[] }[] }

export interface Page {
  /** Path from the repo root */
  path: string
  /** The page's `#` heading */
  title: string
  /** The sidebar group: Foundations, Components, Specs or Guidelines, as `headingOf` says */
  group: string
  segments: Segment[]
}

const BLOCKS = new RegExp(`${TOKENS.source}|${CONTRAST.source}|${FILES.source}`, 'g')
const REF = /^\{([^{}]+)\}$/
const title = (s: string) => s[0].toUpperCase() + s.slice(1)

function value(tokens: ResolvedTokens, t: Token, theme: string, raw: unknown): TokenValue {
  const css =
    t.type === 'fontFamily'
      ? ([] as unknown[]).concat(resolveValue(raw, tokenMap(tokens, theme))).join(', ')
      : literal(tokens, t.type, raw, theme)
  const alias = typeof raw === 'string' ? REF.exec(raw)?.[1] : undefined
  return alias ? { css, alias } : { css }
}

/** The rows of a `tokens` block: each token's values per theme and its overrides. */
export function tokenSegment(
  tokens: ResolvedTokens,
  patterns: string[],
): Extract<Segment, { kind: 'tokens' }> {
  const list = select(tokens, patterns)
  if (!list.length) throw new Error(`No token matches <!-- tokens: ${patterns.join(' ')} -->`)
  const themed = new Set(tokens.themes[tokens.defaultTheme].map((t) => t.name))
  const themes = list.some((t) => themed.has(t.name))
    ? Object.keys(tokens.themes)
    : [tokens.defaultTheme]
  const contexts = Object.entries(tokens.overrides).flatMap(([name, m]) =>
    Object.entries(m.contexts).map(([ctx, ts]) => ({ head: `${title(ctx)} ${name}`, ts })),
  )
  const rows = list.map((t): TokenRow => {
    const overrides: Record<string, string> = {}
    for (const c of contexts) {
      const o = c.ts.find((x) => x.name === t.name)
      if (o) overrides[c.head] = literal(tokens, t.type, o.value, tokens.defaultTheme)
    }
    const row: TokenRow = {
      name: t.name,
      type: t.type,
      cssVar: cssVarName(t.name),
      description: t.description,
      values: Object.fromEntries(
        themes.map((th) => [th, value(tokens, t, th, tokenMap(tokens, th).get(t.name)!.value)]),
      ),
      overrides,
    }
    if (t.type === 'typography') {
      const v = resolveValue(t.value, tokenMap(tokens, tokens.defaultTheme)) as {
        fontFamily: string[]
        fontWeight: number
        fontSize: { value: number }
        lineHeight: number
        letterSpacing: { value: number }
      }
      const transform = (t.extensions?.['org.perron'] as { textTransform?: string } | undefined)
        ?.textTransform
      row.typography = {
        className: `perron-${t.name.replaceAll('.', '-')}`,
        family: v.fontFamily[0],
        weight: v.fontWeight,
        size: `${v.fontSize.value} px`,
        lineHeight: v.lineHeight,
        tracking: `${v.letterSpacing.value} px`,
        ...(transform ? { textTransform: transform } : {}),
      }
    }
    return row
  })
  return {
    kind: 'tokens',
    themes,
    contexts: contexts.map((c) => c.head).filter((h) => rows.some((r) => h in r.overrides)),
    rows,
  }
}

function contrastSegment(
  tokens: ResolvedTokens,
  minimum: number,
  patterns: string[],
  backs: string[],
): Segment {
  const list = select(tokens, patterns)
  const themes = Object.keys(tokens.themes)
  const color = (name: string, th: string) =>
    literal(tokens, 'color', tokenMap(tokens, th).get(name)!.value, th)
  return {
    kind: 'contrast',
    minimum,
    themes,
    backgrounds: backs.map((name) => ({ name, cssVar: cssVarName(name) })),
    rows: list.map((t) => ({
      name: t.name,
      cssVar: cssVarName(t.name),
      ratios: Object.fromEntries(
        themes.map((th) => [
          th,
          Object.fromEntries(
            backs.map((b) => {
              const bg = color(b, th)
              return [b, contrastRatio(composite(color(t.name, th), bg), bg)]
            }),
          ),
        ]),
      ),
    })),
  }
}

function byCategory<T extends { category: string }>(list: T[]) {
  return [...new Set(list.map((a) => a.category))].map((name) => ({
    name,
    items: list.filter((a) => a.category === name),
  }))
}

function filesSegment(tokens: ResolvedTokens, root: string, dir: string): Segment {
  if (dir === 'logos') return { kind: 'logos', categories: byCategory(readLogos(root)) }
  const map = tokenMap(tokens, tokens.defaultTheme)
  const icons = readIcons(root).map((i) => ({
    ...i,
    px: literal(tokens, 'dimension', map.get(i.size)!.value, tokens.defaultTheme),
  }))
  return { kind: 'icons', categories: byCategory(icons) }
}

/** The contract's own pages, the top of the Components group. */
const CONTRACT_PAGES = ['docs/components/README.md', 'docs/components/TEMPLATE.md']

/**
 * A page's sidebar group: Foundations for docs/foundations/, Components for the contract's pages,
 * Specs for every other page in docs/components/ or docs/patterns/ (each registered entry's spec,
 * titled by its PascalCase name, so it never takes the id of the entry's own `Components/<Name>`
 * docs), and Guidelines for the rest.
 */
function groupOf(path: string) {
  if (path.startsWith('docs/foundations/')) return 'Foundations'
  if (CONTRACT_PAGES.includes(path)) return 'Components'
  if (path.startsWith('docs/components/') || path.startsWith('docs/patterns/')) return 'Specs'
  return 'Guidelines'
}

/** A page's title and sidebar group, from its path and its `#` heading. */
export function headingOf(path: string, markdown: string): Pick<Page, 'title' | 'group'> {
  const heading = /^# (.+)$/m.exec(markdown)
  if (!heading) throw new Error(`${path} has no # heading`)
  return { title: heading[1], group: groupOf(path) }
}

/** One page: its prose between the blocks, and each block as rows. */
export function pageOf(path: string, markdown: string, tokens: ResolvedTokens, root: string): Page {
  const segments: Segment[] = []
  const prose = (text: string) => {
    if (text.trim()) segments.push({ kind: 'prose', markdown: text.trim() })
  }
  let at = 0
  for (const m of markdown.matchAll(BLOCKS)) {
    prose(markdown.slice(at, m.index))
    at = m.index + m[0].length
    // groups: tokens 1-3, contrast 4-8, files 9-11
    if (m[2] !== undefined) segments.push(tokenSegment(tokens, words(m[2])))
    else if (m[5] !== undefined)
      segments.push(contrastSegment(tokens, Number(m[5]), words(m[6]), words(m[7])))
    else segments.push(filesSegment(tokens, root, m[10]))
  }
  prose(markdown.slice(at))
  return { path, ...headingOf(path, markdown), segments }
}

export function readPages(root: string, tokens: ResolvedTokens) {
  return PAGES.map((p) => pageOf(p, readFileSync(join(root, p), 'utf8'), tokens, root))
}
