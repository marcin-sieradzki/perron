// Patterns. A placeholder until ticket T6 builds the index of Patterns.dc.html.
import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/PageHeader.tsx'

export const metadata: Metadata = { title: 'Patterns' }

export default function PatternsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Patterns"
        lead="Pieces of a Mylder screen, built only from Perron components."
      />
    </div>
  )
}
