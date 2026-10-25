// Previous and next at a spec page's foot, on phones: the entries in the components list's order,
// the layer's index before the first.
import NextLink from 'next/link'
import { byCategory, routedEntries, type RegistryEntry } from '../../lib/registry.ts'

export function PageLinks({ entry }: { entry: RegistryEntry }) {
  const layer = entry.layer === 'pattern' ? 'Patterns' : 'Components'
  const list = byCategory(routedEntries(entry.layer)).flatMap((g) => g.entries)
  const at = list.findIndex((e) => e.slug === entry.slug)
  const prev = at > 0 ? { href: list[at - 1].route!, name: list[at - 1].name } : undefined
  const next = list[at + 1]
  return (
    <nav aria-label="Pages" className="spec-pages">
      <NextLink href={prev?.href ?? `/${layer.toLowerCase()}`} className="spec-page-link hover">
        <span className="spec-page-link-dir">Previous</span>
        <span className="spec-page-link-name">{prev?.name ?? layer}</span>
      </NextLink>
      {next ? (
        <NextLink href={next.route!} className="spec-page-link hover">
          <span className="spec-page-link-dir">Next</span>
          <span className="spec-page-link-name">{next.name}</span>
        </NextLink>
      ) : null}
    </nav>
  )
}
