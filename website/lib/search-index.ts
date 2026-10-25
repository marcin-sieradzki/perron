// The docs search's index: every route's title and the places its page links to, in the pages'
// own words, built at build time from the loaders. app/search-index.json serves it as one static
// file, which the dialog fetches when it first opens; the matching runs in the browser
// (SiteSearchMatch.ts). Each place's id comes from the same function or data its page renders
// with (lib/anchors.ts and the ones it names), so a result never lands on an id the page lacks; the
// build checks that against the built pages (scripts/check-anchors.ts).
import { SECTIONS } from './sections.ts'
import {
  agentsAnchors,
  bodyHeadings,
  foundationsAnchors,
  GET_STARTED_STEPS,
  markdownHeadings,
  releaseAnchor,
  type Anchor,
  type Heading,
} from './anchors.ts'
import { readChangelogs, versionOf } from './changelog.ts'
import { bodySegments, foundationGroups, readFoundations } from './foundations.ts'
import { loadTools } from './mcp.ts'
import { routedEntries, type Layer } from './registry.ts'
import { once, readRepoFile } from './repo.ts'
import { specHeadings } from './spec.ts'

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

/** The label of the section a route opens: "Get started" for `/get-started`. */
function sectionLabel(href: string) {
  const section = SECTIONS.find((s) => s.href === href)
  if (!section) throw new Error(`search-index: no section at ${href}`)
  return section.label
}

/** A doc's headings that take a search entry: `##` and `###`, the ones a reader scans for. */
const scanned = (headings: Heading[]) => headings.filter((h) => h.level === 2 || h.level === 3)

/** A page's entry, then one for each place on it. */
function pageEntries(title: string, href: string, section: string, anchors: Anchor[] = []) {
  return [
    { title, href, section },
    ...anchors.map((a) => ({ title: a.title, href: `${href}#${a.id}`, page: title, section })),
  ] satisfies SearchEntry[]
}

/** The headings every spec has from docs/components/TEMPLATE.md. */
function templateHeadings() {
  return new Set(markdownHeadings(readRepoFile('docs/components/TEMPLATE.md')).map((h) => h.title))
}

/**
 * Each spec page of a layer, by its name, with the sections it draws: a built entry's prose
 * sections, such as Keyboard and ARIA, and an entry in design's own headings, without the
 * template's that its whole spec repeats.
 */
function specEntries(layer: Layer, section: string, template: ReadonlySet<string>) {
  return routedEntries(layer).flatMap((e) => {
    const headings = scanned(specHeadings(e, readRepoFile(e.specPath)))
    return pageEntries(
      e.name,
      e.route ?? '',
      section,
      e.built ? headings : headings.filter((h) => !template.has(h.title)),
    )
  })
}

/** Every route the site has, its title and its places, in the header's order of sections. */
export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const tools = await loadTools()
  const template = templateHeadings()
  const [getStarted, foundations, components, patterns, agents, releases] = [
    '/get-started',
    '/foundations',
    '/components',
    '/patterns',
    '/agents',
    '/releases',
  ].map(sectionLabel)
  return [
    ...pageEntries(getStarted, '/get-started', getStarted, [...GET_STARTED_STEPS]),
    ...pageEntries(
      foundations,
      '/foundations',
      foundations,
      foundationsAnchors(foundationGroups()),
    ),
    ...readFoundations().flatMap((p) =>
      pageEntries(p.title, p.route, foundations, scanned(bodyHeadings(bodySegments(p)))),
    ),
    ...pageEntries(components, '/components', components),
    ...specEntries('component', components, template),
    ...pageEntries(patterns, '/patterns', patterns),
    ...specEntries('pattern', patterns, template),
    ...pageEntries(agents, '/agents', agents, agentsAnchors(tools.map((t) => t.name))),
    ...pageEntries(releases, '/releases', releases),
    // each version by its package's name and number, at its place on the one Release log page
    ...readChangelogs().flatMap((log) =>
      log.releases.map((r) => {
        const { version } = versionOf(r.version)
        return {
          title: `${log.name} ${version}`,
          href: `/releases#${releaseAnchor(log.name, version)}`,
          page: releases,
          section: releases,
        }
      }),
    ),
  ]
}

/** The index, built once per build. */
export const readSearchIndex = once(buildSearchIndex)
