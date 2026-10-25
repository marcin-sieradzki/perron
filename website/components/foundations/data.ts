// The foundation pages as the site's Foundations section draws them: the pages in the sidebar's
// order and groups, each page's prose, its intro and sections, and its token rows looked up by name.
// Every value a tile or a block shows comes from these rows, which scripts/lib/pages.ts builds from
// the token files; the names picked here say which tokens a tile draws, never what they are.
import {
  CONTENTS,
  readContents,
  readFoundations,
  type FoundationPage,
  type Segment,
} from '../../lib/foundations.ts'
import { firstParagraph, sectionBody, stripTitle, tables } from '../../lib/markdown.ts'

export type TokenSegment = Extract<Segment, { kind: 'tokens' }>
export type ContrastSegment = Extract<Segment, { kind: 'contrast' }>
export type TokenRow = TokenSegment['rows'][number]

/** The order the sidebar, the tiles and the page-to-page links follow, as Foundations.dc.html does. */
const ORDER = [
  'semantic-colours',
  'primitive-colours',
  'typography',
  'semantic-spacing',
  'elevation',
  'motion',
  'icons',
  'logos',
  'layout',
  'accessibility',
]

export interface FoundationGroup {
  /** The group's heading, or undefined for the main list */
  label?: string
  pages: FoundationPage[]
}

/** The `[Page](page.md)` links of each table in the Contents page's "Pages" section, as slugs. */
function contentsTables() {
  const body = sectionBody(proseOf(readContents()), 'Pages') ?? ''
  return tables(body).map((table) =>
    table.rows.flatMap((row) =>
      Object.values(row).flatMap((cell) =>
        [...cell.matchAll(/\]\(([\w-]+)\.md\)/g)].map((m) => m[1]),
      ),
    ),
  )
}

/**
 * The foundation pages in two groups: the main list, then the pages only a live map needs, which
 * the Contents page lists in a table of their own. A page neither table lists, such as Content
 * design, joins the main list at its end.
 */
export function foundationGroups(): FoundationGroup[] {
  const pages = readFoundations()
  const live = contentsTables().slice(1).flat()
  const rank = (p: FoundationPage) => {
    const at = ORDER.indexOf(p.slug)
    return at < 0 ? ORDER.length : at
  }
  const main = pages.filter((p) => !live.includes(p.slug)).sort((a, b) => rank(a) - rank(b))
  const onMap = live.flatMap((slug) => pages.filter((p) => p.slug === slug))
  return [{ pages: main }, ...(onMap.length ? [{ label: 'Only on a live map', pages: onMap }] : [])]
}

/** Every foundation page in the sidebar's order. */
export const orderedFoundations = () => foundationGroups().flatMap((g) => g.pages)

/** A page's prose segments joined, with its token and file tables taken out. */
export const proseOf = (page: Pick<FoundationPage, 'segments'>) =>
  page.segments.flatMap((s) => (s.kind === 'prose' ? [s.markdown] : [])).join('\n\n')

/** The first paragraph under a page's title, as markdown: its lead. */
export const introOf = (page: FoundationPage) => firstParagraph(proseOf(page))

/** The text of the section headed `heading`, without the heading, or an empty string. */
export const sectionOf = (page: FoundationPage, heading: string) =>
  sectionBody(proseOf(page), heading) ?? ''

/** The Contents page's "Using the tokens" section, as markdown. */
export const usingTheTokens = () => sectionBody(proseOf(readContents()), 'Using the tokens') ?? ''

/** The Contents page's brand values: each bullet of "The brand", as its bold name and its text. */
export function brandValues() {
  const body = sectionBody(proseOf(readContents()), 'The brand') ?? ''
  return [...body.matchAll(/^- \*\*(.+?)\.?\*\*\s*(.+)$/gm)].map((m) => ({
    name: m[1],
    text: m[2].trim(),
  }))
}

/** The Contents page's path, which its relative links start from. */
export { CONTENTS }

/** The first prose segment's markdown without the title and the intro the page header shows. */
export function withoutIntro(markdown: string, intro: string) {
  const body = stripTitle(markdown)
  const [first, ...rest] = body.split(/\n\s*\n/)
  return first?.trim().replace(/\s*\n\s*/g, ' ') === intro ? rest.join('\n\n') : body
}

// Token rows

/** Every token row a page's blocks show. */
export const tokenRows = (page: FoundationPage) =>
  page.segments.flatMap((s) => (s.kind === 'tokens' ? s.rows : []))

/** One token row of a page, by name. Throws when the page no longer shows it, so a rename shows. */
export function rowOf(page: FoundationPage, name: string): TokenRow {
  const row = tokenRows(page).find((r) => r.name === name)
  if (!row) throw new Error(`${page.path} shows no token ${name}`)
  return row
}

/** A page's rows whose names start with `prefix`, such as `space.`. */
export const rowsUnder = (page: FoundationPage, prefix: string) =>
  tokenRows(page).filter((r) => r.name.startsWith(prefix))

/** A page's contrast blocks. */
export const contrastSegments = (page: FoundationPage) =>
  page.segments.filter((s): s is ContrastSegment => s.kind === 'contrast')

/** The row's custom property as a CSS value. */
export const cssValue = (row: Pick<TokenRow, 'cssVar'>) => `var(${row.cssVar})`

/** The row's value in a theme, or in its one theme, as the tables show it. */
export const valueOf = (row: TokenRow, theme?: string) =>
  (theme ? row.values[theme] : Object.values(row.values)[0]).css

/** A value with a space before its unit, as the content design asks: `12px` reads `12 px`. */
export const spaced = (css: string) => css.replace(/^(-?[\d.]+)(px|ms|s|%)$/, '$1 $2')

/** The last part of a token's name: `sheet` for `duration.sheet`. */
export const leafOf = (name: string) => name.slice(name.lastIndexOf('.') + 1)

/** A name without its first part, as a short label: `surface.default` for `color.surface.default`. */
export const shortName = (name: string) => name.slice(name.indexOf('.') + 1)

/** A token leaf as words in sentence case: `brand-subtle` reads `Brand subtle`. */
export function words(leaf: string) {
  const s = leaf.replaceAll('-', ' ')
  return s[0].toUpperCase() + s.slice(1)
}

// Prose

/** Markdown reduced to text with code spans kept: links lose their target, bold its stars. */
export const plain = (markdown: string) =>
  markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .trim()

/** The sentences of a paragraph. */
export const sentences = (text: string) =>
  (text.replace(/\s+/g, ' ').match(/(?:[^.]|\.(?!\s|$))+\.?/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean)

/** The quoted examples of a paragraph: `"08:14"` and `"4 min"` from the numbers rule. */
export const quoted = (text: string) => [...text.matchAll(/"([^"]+)"/g)].map((m) => m[1])
