// Agents. A placeholder until ticket T7 builds the page of Agents.dc.html: the MCP server's setup
// and a real call and answer for each tool.
import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/PageHeader.tsx'

export const metadata: Metadata = { title: 'Agents' }

export default function AgentsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Agents"
        lead="The Perron MCP server gives a coding agent small, exact answers about Perron's tokens, its docs and the libraries it pins."
      />
    </div>
  )
}
