// The docs search's index: every route's title and the headings its page holds, in the pages' own
// words, built at build time from the loaders. SiteSearch reads it in a server component and hands
// it to the dialog as plain props; the matching runs in the browser (SiteSearchMatch.ts). A heading
// links to its anchor, made the way Markdown's headings make their ids.
import { slugify } from 'markdown-to-jsx'
import { SECTIONS } from '../components/site/sections.ts'
import { readChangelogs } from './changelog.ts'
import { CONTENTS, readFoundations } from './foundations.ts'
import { sections } from './markdown.ts'
import { routedEntries, type Layer } from './registry.ts'
import { once, readRepoFile } from './repo.ts'

export interface SearchEntry {
  /** The words the result shows: a page's title or one of its headings, as the page writes them */
  title: string
  /** The route, with the heading's `#anchor` for a heading */
  href: string
  /** The title of the page a heading is on; absent for a page itself */
  page?: string
  /** The label of the section the route is in, such as "Components" */
  section: string
}

/** The headings a page's search entries take: `##` and `###`, the ones a reader scans for. */
const LEVELS = new Set([2, 3])

/** The label of the section a route opens: "Get started" for `/get-started`. */
function sectionLabel(href: string) {
  const section = SECTIONS.find((s) => s.href === href)
  if (!section) throw new Error(`search-index: no section at ${href}`)
  return section.label
}

/**
 * A heading's words without its inline markdown: a link's text, code without backticks, emphasis
 * without its marks. `## The \`size\` prop` reads "The size prop".
 */
export function plainHeading(markdown: string) {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|\*)(\S(?:.*?\S)?)\1/g, '$2')
    .replace(/(^|\W)_(\S(?:.*?\S)?)_(?=\W|$)/g, '$1$2')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * The headings of a page, in order, each with its anchor as Markdown renders it: the heading's
 * words slugified, a repeat taking `-1`, `-2` and on. The page's `#` title is not rendered, so it
 * takes none.
 */
function headingsOf(markdown: string) {
  const seen = new Map<string, number>()
  return sections(markdown)
    .filter((s) => s.level > 1)
    .map((s) => {
      const title = plainHeading(s.heading)
      const base = slugify(title)
      const n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      return { level: s.level, title, anchor: n ? `${base}-${n}` : base }
    })
}

interface Headings {
  /** The markdown whose headings the page shows */
  markdown: string
  /** Headings left out, such as the spec template's, which every spec page repeats */
  skip?: ReadonlySet<string>
  /** The only headings kept, for a page that shows one section of a doc */
  only?: ReadonlySet<string>
}

/** A page's entry, then one for each of its headings, from each doc it shows. */
function pageEntries(title: string, href: string, section: string, ...docs: Headings[]) {
  const headings = docs.flatMap(({ markdown, skip, only }) =>
    headingsOf(markdown).filter(
      (h) => LEVELS.has(h.level) && !skip?.has(h.title) && (!only || only.has(h.title)),
    ),
  )
  return [
    { title, href, section },
    ...headings.map((h) => ({ title: h.title, href: `${href}#${h.anchor}`, page: title, section })),
  ] satisfies SearchEntry[]
}

/** The headings every spec page has from docs/components/TEMPLATE.md, so none is a search result. */
function templateHeadings() {
  return new Set(headingsOf(readRepoFile('docs/components/TEMPLATE.md')).map((h) => h.title))
}

/** Each spec page of a layer, by its name, with the headings of its own: its parts' props. */
function specEntries(layer: Layer, section: string, skip: ReadonlySet<string>) {
  return routedEntries(layer).flatMap((e) =>
    pageEntries(e.name, e.route ?? '', section, { markdown: readRepoFile(e.specPath), skip }),
  )
}

/** The section of the Contents page that Get started shows. */
const USING_THE_TOKENS = new Set(['Using the tokens'])

/** Every route the site has, its title and its headings, in the header's order of sections. */
export function buildSearchIndex(): SearchEntry[] {
  const contents = readRepoFile(CONTENTS)
  const skip = templateHeadings()
  const [getStarted, foundations, components, patterns, agents, releases] = [
    '/get-started',
    '/foundations',
    '/components',
    '/patterns',
    '/agents',
    '/releases',
  ].map(sectionLabel)
  return [
    ...pageEntries(
      getStarted,
      '/get-started',
      getStarted,
      { markdown: readRepoFile('packages/perron/README.md') },
      { markdown: contents, only: USING_THE_TOKENS },
    ),
    ...pageEntries(foundations, '/foundations', foundations, { markdown: contents }),
    ...readFoundations().flatMap((p) =>
      pageEntries(p.title, p.route, foundations, { markdown: readRepoFile(p.path) }),
    ),
    ...pageEntries(components, '/components', components),
    ...specEntries('component', components, skip),
    ...pageEntries(patterns, '/patterns', patterns),
    ...specEntries('pattern', patterns, skip),
    ...pageEntries(agents, '/agents', agents, { markdown: readRepoFile('packages/mcp/README.md') }),
    ...pageEntries(releases, '/releases', releases),
    // each version by its package's name and number, all on the one Release log page
    ...readChangelogs().flatMap((log) =>
      log.releases.map((r) => ({
        title: `${log.name} ${r.version}`,
        href: '/releases',
        page: releases,
        section: releases,
      })),
    ),
  ]
}

/** The index, built once per build. */
export const readSearchIndex = once(buildSearchIndex)
