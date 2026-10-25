// Release log. A placeholder until ticket T7 builds it from the two changelogs.
import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/PageHeader.tsx'

export const metadata: Metadata = { title: 'Release log' }

export default function ReleasesPage() {
  return (
    <div className="page">
      <PageHeader
        title="Release log"
        lead="What changed in each version of @mylder/perron and @mylder/perron-mcp, newest first."
      />
    </div>
  )
}
