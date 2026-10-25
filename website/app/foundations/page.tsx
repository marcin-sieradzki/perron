// Foundations. A placeholder until ticket T4 builds the index of Foundations.dc.html: one tile per
// foundation page, drawn from its tokens.
import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/PageHeader.tsx'

export const metadata: Metadata = { title: 'Foundations' }

export default function FoundationsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Foundations"
        lead="The values every screen is built from: colour, type, space, motion, the map and the words."
      />
    </div>
  )
}
