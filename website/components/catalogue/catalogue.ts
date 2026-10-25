// The components index's groups, read from the registry: each category in the mockup's order, its
// stable components, which get a card and a preview, and the ones still designing, which are only
// named. Server-only: it reads the repo through the registry loader.
import { entriesOf, type RegistryEntry } from '../../lib/registry.ts'

/** Components.dc.html's order; a category the registry adds later follows these, as it appears. */
const ORDER = [
  'Actions',
  'Transit',
  'Inputs',
  'Display',
  'Overlays',
  'Layout',
  'Map',
  'Feedback',
  'Navigation',
]

export interface CatalogueGroup {
  /** The section's anchor: the category in lowercase, `#actions` */
  id: string
  category: string
  /** Stable entries, in the registry's order: a card each */
  stable: RegistryEntry[]
  /** Entries still `designing`: named, never drawn */
  designing: RegistryEntry[]
}

const rank = (category: string) => {
  const at = ORDER.indexOf(category)
  return at < 0 ? ORDER.length : at
}

/** The component layer by category; entries past designing but not yet stable are left out. */
export function catalogueGroups(): CatalogueGroup[] {
  const groups = new Map<string, CatalogueGroup>()
  for (const entry of entriesOf('component')) {
    if (entry.status !== 'stable' && entry.status !== 'designing') continue
    const group = groups.get(entry.category) ?? {
      id: entry.category.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-'),
      category: entry.category,
      stable: [],
      designing: [],
    }
    group[entry.status === 'stable' ? 'stable' : 'designing'].push(entry)
    groups.set(entry.category, group)
  }
  // a stable sort keeps the registry's first-appearance order among categories the mockup lacks
  return [...groups.values()].sort((a, b) => rank(a.category) - rank(b.category))
}
