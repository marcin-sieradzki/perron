// The list beside a spec page: every entry of its layer with a page, grouped by category, the
// page's own entry marked as the current page.
import NextLink from 'next/link'
import { byCategory, routedEntries, type RegistryEntry } from '../../lib/registry.ts'

export function SpecAside({ entry }: { entry: RegistryEntry }) {
  const label = entry.layer === 'pattern' ? 'Patterns' : 'Components'
  return (
    <nav aria-label={label} className="spec-aside glass">
      {byCategory(routedEntries(entry.layer)).map(({ category, entries }) => (
        <div key={category} className="spec-aside-list">
          <span className="spec-overline spec-aside-group">{category}</span>
          {entries.map((e) => (
            <NextLink
              key={e.slug}
              href={e.route!}
              className="spec-aside-link hover"
              aria-current={e.slug === entry.slug ? 'page' : undefined}
            >
              {e.name}
            </NextLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
