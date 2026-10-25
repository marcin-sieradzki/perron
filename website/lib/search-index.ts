// The docs search's index: every route's title and the places its page links to, in the pages'
// own words, built at build time from the loaders. app/search-index.json serves it as one static
// file, which the dialog fetches when it first opens; the matching runs in the browser
// (SiteSearchMatch.ts). Each place's id comes from the same function or data its page renders
// with (lib/anchors.ts and the ones it names), so a result never lands on an id the page lacks; the
// build checks that against the built pages (scripts/check-anchors.ts).
import { SECTIONS } from '../components/site/sections.ts'
import { bodyHeadings, indexAnchors } from '../components/foundations/data.ts'
import {
  agentsAnchors,
  GET_STARTED_STEPS,
  markdownHeadings,
  type Anchor,
  type Heading,
} from './anchors.ts'
import { readChangelogs, releaseAnchor, versionOf } from './changelog.ts'
import { readFoundations } from './foundations.ts'
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

/** The headings every spec has from docs/components/TEMPLATE.md, so none is a search result. */
function templateHeadings() {
  return new Set(markdownHeadings(readRepoFile('docs/components/TEMPLATE.md')).map((h) => h.title))
}

/** Each spec page of a layer, by its name, with the headings it draws that are its own. */
function specEntries(layer: Layer, section: string, skip: ReadonlySet<string>) {
  return routedEntries(layer).flatMap((e) =>
    pageEntries(
      e.name,
      e.route ?? '',
      section,
      scanned(specHeadings(e, readRepoFile(e.specPath))).filter((h) => !skip.has(h.title)),
    ),
  )
}

/** Every route the site has, its title and its places, in the header's order of sections. */
export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const tools = await loadTools()
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
    ...pageEntries(getStarted, '/get-started', getStarted, [...GET_STARTED_STEPS]),
    ...pageEntries(foundations, '/foundations', foundations, indexAnchors()),
    ...readFoundations().flatMap((p) =>
      pageEntries(p.title, p.route, foundations, scanned(bodyHeadings(p))),
    ),
    ...pageEntries(components, '/components', components),
    ...specEntries('component', components, skip),
    ...pageEntries(patterns, '/patterns', patterns),
    ...specEntries('pattern', patterns, skip),
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
