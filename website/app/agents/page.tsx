// Agents, from Agents.dc.html: the MCP server's setup from its readme, then every tool the server
// registers with one real call and the server's answer, made at build time through the SDK's
// in-memory transport (lib/mcp.ts), and where those answers come from.
import type { Metadata } from 'next'
import { Fragment } from 'react'
import { DocLayout } from '@/components/agents/DocLayout.tsx'
import { SetupSteps } from '@/components/agents/SetupSteps.tsx'
import { ToolCard } from '@/components/agents/ToolCard.tsx'
import { Markdown } from '@/components/site/Markdown.tsx'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { AGENTS_SECTIONS as SECTIONS, toolAnchor } from '../../lib/anchors.ts'
import { loadTools, MCP_README, readSetup, readSources } from '../../lib/mcp.ts'
import { PACKAGES, readPackage } from '../../lib/repo.ts'
import { siteHref } from '../../lib/routes.ts'

export const metadata: Metadata = { title: 'Agents' }

/** The component contract, which an agent building a component reads beside the server. */
const CONTRACT = '/docs/components/README.md'

export default async function AgentsPage() {
  const [tools, sources] = await Promise.all([loadTools(), readSources()])
  const readme = readSetup()
  const mcp = readPackage(PACKAGES.mcp)
  const [data, ...libraries] = sources

  return (
    <DocLayout
      route="/agents"
      name="The MCP server"
      nav={[
        { links: [{ label: SECTIONS.setup.title, href: `#${SECTIONS.setup.id}` }] },
        {
          title: SECTIONS.tools.title,
          links: tools.map((t) => ({ label: t.name, href: `#${toolAnchor(t.name)}`, code: true })),
        },
        {
          title: 'More',
          links: [
            { label: SECTIONS.sources.title, href: `#${SECTIONS.sources.id}` },
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
          <Markdown source={readme.intro} path={MCP_README} inline />
        </p>
      </div>

      <section
        id={SECTIONS.setup.id}
        aria-labelledby={`${SECTIONS.setup.id}-h`}
        className="agents-section"
      >
        <h2 id={`${SECTIONS.setup.id}-h`}>{SECTIONS.setup.title}</h2>
        <SetupSteps
          steps={readme.steps}
          headings={['Run the server', "Or add it to the project's .mcp.json"]}
        />
      </section>

      <section
        id={SECTIONS.tools.id}
        aria-labelledby={`${SECTIONS.tools.id}-h`}
        className="agents-section"
      >
        <h2 id={`${SECTIONS.tools.id}-h`}>
          {SECTIONS.tools.title} <span className="agents-count">{tools.length}</span>
        </h2>
        <p className="agents-note">
          <Markdown source={readme.toolsIntro} path={MCP_README} inline />
        </p>
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </section>

      <section
        id={SECTIONS.sources.id}
        aria-labelledby={`${SECTIONS.sources.id}-h`}
        className="agents-section agents-panel glass"
      >
        <h2 id={`${SECTIONS.sources.id}-h`}>{SECTIONS.sources.title}</h2>
        {readme.notes ? (
          <p className="agents-note">
            <Markdown source={readme.notes} path={MCP_README} inline />
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
