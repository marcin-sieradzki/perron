// Components. A placeholder until ticket T5 builds the index of Components.dc.html: every stable
// component as a card holding the component, grouped by category.
import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/PageHeader.tsx'

export const metadata: Metadata = { title: 'Components' }

export default function ComponentsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Components"
        lead="Every part of the interface around the map, with behaviour and accessibility from Base UI."
      />
    </div>
  )
}
