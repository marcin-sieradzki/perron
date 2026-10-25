// Get started. A placeholder until ticket T7 builds it from packages/perron/README.md, the "Using
// the tokens" section of docs/foundations/README.md and the setup in packages/mcp/README.md.
import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/PageHeader.tsx'

export const metadata: Metadata = { title: 'Get started' }

export default function GetStartedPage() {
  return (
    <div className="page">
      <PageHeader
        title="Get started"
        lead="Install @mylder/perron, load its stylesheet once at the app root, and build with its tokens and components."
      />
    </div>
  )
}
