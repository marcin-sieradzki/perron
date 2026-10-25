// Agents, from Agents.dc.html: the MCP server's setup from its readme, then every tool the server
// registers with one real call and the server's answer, made at build time through the SDK's
// in-memory transport (lib/mcp.ts), and where those answers come from.
import type { Metadata } from 'next'
import { Fragment } from 'react'
import { DocLayout } from '@/components/agents/DocLayout.tsx'
import { SetupSteps } from '@/components/agents/SetupSteps.tsx'
import { ToolCard, toolAnchor } from '@/components/agents/ToolCard.tsx'
import { Markdown } from '@/components/site/Markdown.tsx'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { loadTools, MCP_README, readSetup, readSources } from '../../lib/mcp.ts'
import { PACKAGES, readPackage } from '../../lib/repo.ts'
import { siteHref } from '../../lib/routes.ts'

export const metadata: Metadata = { title: 'Agents' }

/** The component contract, which an agent building a component reads beside the server. */
const CONTRACT = '/docs/components/README.md'

export default async function AgentsPage() {
  const [tools, sources] = await Promise.all([loadTools(), readSources()])
  const setup = readSetup()
  const mcp = readPackage(PACKAGES.mcp)
  const [data, ...libraries] = sources

  return (
    <DocLayout
      route="/agents"
      name="The MCP server"
      nav={[
        { links: [{ label: 'Set it up', href: '#setup' }] },
        {
          title: 'Tools',
          links: tools.map((t) => ({ label: t.name, href: `#${toolAnchor(t.name)}`, code: true })),
        },
        {
          title: 'More',
          links: [
            { label: 'Where the answers come from', href: '#sources' },
            { label: 'The component contract', href: siteHref(CONTRACT, MCP_README) },
          ],
        },
      ]}
    >
      <div className="agents-intro">
        <PageHeader
          title="Agents"
          actions={<span className="agents-version">{`${mcp.name} ${mcp.version}`}</span>}
        />
        <p className="agents-tagline">Small, exact answers for your coding agent</p>
        <p className="lead">
          <Markdown source={setup.intro} path={MCP_README} inline />
        </p>
      </div>

      <section id="setup" aria-labelledby="setup-h" className="agents-section">
        <h2 id="setup-h">Set it up</h2>
        <SetupSteps
          steps={setup.steps}
          headings={['Run the server', "Or add it to the project's .mcp.json"]}
        />
      </section>

      <section aria-labelledby="tools-h" className="agents-section">
        <h2 id="tools-h">
          Tools <span className="agents-count">{tools.length}</span>
        </h2>
        <p className="agents-note">
          <Markdown source={setup.toolsIntro} path={MCP_README} inline />
        </p>
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </section>

      <section
        id="sources"
        aria-labelledby="sources-h"
        className="agents-section agents-panel glass"
      >
        <h2 id="sources-h">Where the answers come from</h2>
        {setup.notes ? (
          <p className="agents-note">
            <Markdown source={setup.notes} path={MCP_README} inline />
          </p>
        ) : null}
        <div className="agents-cards">
          <div className="agents-source">
            <span className="agents-source-path">{data.path}</span>
            <p className="agents-note">
              {data.files.map((f, i) => (
                <Fragment key={f}>
                  {i ? ' and ' : null}
                  <code>{f}</code>
                </Fragment>
              ))}
              , built with each release of {data.name}
              {data.version ? ` (${data.version} here)` : ''}, so they never drift from it.
            </p>
          </div>
          {libraries.map((l) => (
            <div key={l.name} className="agents-source">
              <span className="agents-source-path">{l.path}</span>
              <p className="agents-note">
                The docs bundled in {l.name}
                {l.version ? ` ${l.version}` : ''}: the version the project&apos;s lockfile holds,
                not the latest release.
              </p>
            </div>
          ))}
        </div>
      </section>
    </DocLayout>
  )
}
