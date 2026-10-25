// The foundation pages, by slug: each one's prose and its table blocks as rows (swatches,
// specimens, galleries), from scripts/lib/pages.ts, the reader Storybook's guideline pages use.
// `/foundations/<slug>` serves each page of docs/foundations/ and Content design; the Contents
// page, docs/foundations/README.md, is the `/foundations` index. The pages' groups and each body as
// the page draws it live here too, so the docs search reads them as the pages do.
import { PAGES, pageOf, type Page, type Segment } from '../../scripts/lib/pages.ts'
import { firstParagraph, sectionBody, stripTitle, tables } from './markdown.ts'
import { once, readRepoFile, repoRoot } from './repo.ts'
import { readResolvedTokens } from './tokens.ts'

export type { Page, Segment }

/** The Contents page, served at `/foundations`. */
export const CONTENTS = 'docs/foundations/README.md'

/** Content design, a foundation page that lives beside the foundations folder. */
export const CONTENT_DESIGN = 'docs/content-design.md'

/** Every page with a `/foundations/<slug>` route, in the order the Contents page lists them. */
export const FOUNDATION_PATHS = PAGES.filter(
  (p) => (p.startsWith('docs/foundations/') && p !== CONTENTS) || p === CONTENT_DESIGN,
)

export interface FoundationPage extends Page {
  /** `motion` for docs/foundations/motion.md, `content-design` for Content design */
  slug: string
  /** `/foundations/<slug>`, or `/foundations` for the Contents page */
  route: string
}

/** A foundation page's slug, from its path: the file name without `.md`. */
export const foundationSlug = (path: string) => path.slice(path.lastIndexOf('/') + 1, -3)

function read(path: string): FoundationPage {
  const page = pageOf(path, readRepoFile(path), readResolvedTokens(), repoRoot())
  const slug = path === CONTENTS ? '' : foundationSlug(path)
  return { ...page, slug, route: slug ? `/foundations/${slug}` : '/foundations' }
}

/** Every foundation page with a route, Content design among them, in the Contents page's order. */
export const readFoundations = once(() => FOUNDATION_PATHS.map(read))

/** One foundation page by its slug, or undefined. */
export const readFoundation = (slug: string) => readFoundations().find((p) => p.slug === slug)

/** The Contents page, docs/foundations/README.md: the brand, the page list, using the tokens. */
export const readContents = once(() => read(CONTENTS))

/* The pages as the Foundations section draws them */

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

/** A page's prose segments joined, with its token and file tables taken out. */
export const proseOf = (page: Pick<FoundationPage, 'segments'>) =>
  page.segments.flatMap((s) => (s.kind === 'prose' ? [s.markdown] : [])).join('\n\n')

/** The first paragraph under a page's title, as markdown: its lead. */
export const introOf = (page: FoundationPage) => firstParagraph(proseOf(page))

/** The first prose segment's markdown without the title and the intro the page header shows. */
export function withoutIntro(markdown: string, intro: string) {
  const body = stripTitle(markdown)
  const [first, ...rest] = body.split(/\n\s*\n/)
  return first?.trim().replace(/\s*\n\s*/g, ' ') === intro ? rest.join('\n\n') : body
}

/** A page's segments as its body draws them: the first prose without the title and the intro. */
export function bodySegments(page: FoundationPage): Segment[] {
  const intro = introOf(page)
  return page.segments.map((segment, i) =>
    i === 0 && segment.kind === 'prose'
      ? { kind: 'prose', markdown: withoutIntro(segment.markdown, intro) }
      : segment,
  )
}
