// The foundation pages, by slug: each one's prose and its table blocks as rows (swatches,
// specimens, galleries), from scripts/lib/pages.ts, the reader Storybook's guideline pages use.
// `/foundations/<slug>` serves each page of docs/foundations/ and Content design; the Contents
// page, docs/foundations/README.md, is the `/foundations` index.
import { PAGES, pageOf, type Page, type Segment } from '../../scripts/lib/pages.ts'
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
