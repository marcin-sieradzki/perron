// The registry, packages/perron/components.json, as the site uses it: each entry with its slug,
// its spec page, its route and the description its spec opens with. Read and checked by the repo's
// own reader, so the site lists exactly what the build and Storybook list.
import {
  folderOf,
  isBuilt,
  kebab,
  readRegistry,
  specPage,
  type Entry,
  type Layer,
} from '../../scripts/lib/registry.ts'
import { firstParagraph } from './markdown.ts'
import { once, readRepoFile, repoFileExists, repoRoot } from './repo.ts'

export type { Entry, Layer }

export interface RegistryEntry extends Entry {
  /** The spec file's name, `button` for `docs/components/button.md` */
  slug: string
  /** The spec page, by path from the repo root */
  specPath: string
  /** Whether the spec page exists; an entry without one gets no page and no link */
  hasSpec: boolean
  /** `/components/<slug>` or `/patterns/<slug>`, or null without a spec page */
  route: string | null
  /** The spec's first paragraph, as markdown; empty without a spec page */
  description: string
  /** Past `designing`: its code ships in `@mylder/perron`, so it can be drawn */
  built: boolean
}

function toEntry(e: Entry): RegistryEntry {
  const specPath = specPage(e)
  const hasSpec = repoFileExists(specPath)
  return {
    ...e,
    slug: kebab(e.name),
    specPath,
    hasSpec,
    route: hasSpec ? `/${folderOf(e.layer)}/${kebab(e.name)}` : null,
    description: hasSpec ? firstParagraph(readRepoFile(specPath)) : '',
    built: isBuilt(e),
  }
}

/** Every registry entry, in the registry's order. */
export const readEntries = once(() => readRegistry(repoRoot()).map(toEntry))

/** The entries of one layer, `component` or `pattern`, in the registry's order. */
export const entriesOf = (layer: Layer) => readEntries().filter((e) => e.layer === layer)

/** The entries of one layer that have a spec page: one route each. */
export const routedEntries = (layer: Layer) => entriesOf(layer).filter((e) => e.hasSpec)

/** One entry by its layer and slug, or undefined. */
export const entryBySlug = (layer: Layer, slug: string) =>
  entriesOf(layer).find((e) => e.slug === slug)

/** One entry by its PascalCase name, or undefined. */
export const entryByName = (name: string) => readEntries().find((e) => e.name === name)

/** The entries of one layer grouped by `category`, in the order each category first appears. */
export function byCategory(entries: RegistryEntry[]) {
  const groups = new Map<string, RegistryEntry[]>()
  for (const e of entries) groups.set(e.category, [...(groups.get(e.category) ?? []), e])
  return [...groups].map(([category, items]) => ({ category, entries: items }))
}

/** How many entries of each layer have each status, for the home page's counts. */
export function statusCounts() {
  const counts = { component: {}, pattern: {} } as Record<Layer, Record<string, number>>
  for (const e of readEntries()) counts[e.layer][e.status] = (counts[e.layer][e.status] ?? 0) + 1
  return counts
}
