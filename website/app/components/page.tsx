// Components: the index of Components.dc.html. Every stable component of the registry as a card
// holding its preview, grouped by category in the mockup's order with a count per group, and the
// components still designing named as in design, never drawn.
import type { Metadata } from 'next'
import { Catalogue } from '@/components/catalogue/Catalogue.tsx'
import { CatalogueCard } from '@/components/catalogue/CatalogueCard.tsx'
import { catalogueGroups } from '@/components/catalogue/catalogue.ts'
import { PackageIcon } from '@/components/site/PackageIcon.tsx'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { entriesOf } from '@/lib/registry.ts'
import { githubUrl } from '@/lib/repo.ts'

export const metadata: Metadata = { title: 'Components' }

export default function ComponentsPage() {
  const groups = catalogueGroups()
  const sections = groups.map((g) => ({
    id: g.id,
    category: g.category,
    cards: g.stable.map((entry) => ({ name: entry.name, card: <CatalogueCard entry={entry} /> })),
    designing: g.designing.map((entry) => entry.name),
  }))
  const total = sections.reduce((sum, s) => sum + s.cards.length, 0)
  const patterns = entriesOf('pattern').filter((e) => e.status === 'stable').length

  return (
    <div className="page">
      <Catalogue
        intro={
          <PageHeader
            title="Components"
            lead="Every part of the interface around the map. Built on Base UI, with props shaped like MUI's and styles from Perron's tokens, so each one draws itself in both themes and in every language Mylder speaks. Each card below is the component itself, not a picture of it."
          />
        }
        sections={sections}
        total={total}
        more={[
          { label: 'Patterns', href: '/patterns', count: patterns },
          { label: 'The contract', href: githubUrl('docs/components/README.md') },
        ]}
        searchIcon={<PackageIcon name="search" />}
      />
    </div>
  )
}
