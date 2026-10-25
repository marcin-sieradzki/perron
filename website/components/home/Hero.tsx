// The hero over the full map: the version, the title and lead, what Perron holds today, Get started
// and Browse components, and the MCP server's command. Get started is a solid LinkButton: a link
// takes no brand colour (docs/components/link-button.md), so the hero has no brand yellow.
import NextLink from 'next/link'
import { LinkButton } from '@/components/perron'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { CopyCommand } from './CopyCommand.tsx'
import type { HomeFigures } from './figures.ts'

interface Count {
  value: number
  label: string
  /** Left out on phones, as Phone-Home.dc.html draws four counts */
  wide?: boolean
}

export function Hero({ figures }: { figures: HomeFigures }) {
  const counts: Count[] = [
    { value: figures.stable.component, label: 'Stable components' },
    { value: figures.stable.pattern, label: 'Stable patterns' },
    { value: figures.tokens, label: 'Tokens' },
    { value: figures.dataStates.length, label: 'Data states', wide: true },
    { value: figures.languages.length, label: 'Languages' },
  ]
  return (
    <section aria-label="About Perron" className="home-hero">
      <PageHeader
        overline={
          <span className="home-overline glass">
            Mylder&apos;s design system, version {figures.version}
          </span>
        }
        title="Everything that floats over the map"
        lead="Perron is the set of tokens, components, patterns and words behind Mylder, a live map of Copenhagen's buses, S-tog, metro and trains, and how sure we are about each of them."
      />

      <ul aria-label="What Perron holds today" className="home-counts">
        {counts.map((c) => (
          <li key={c.label} className="home-count" data-wide={c.wide ? '' : undefined}>
            <span className="home-count-value">{c.value}</span>
            <span className="home-count-label">{c.label}</span>
          </li>
        ))}
      </ul>

      <div className="home-actions">
        <LinkButton render={<NextLink href="/get-started" />}>Get started</LinkButton>
        <LinkButton variant="outline" render={<NextLink href="/components" />}>
          Browse components
        </LinkButton>
      </div>

      <div className="home-mcp">
        <p className="home-mcp-label">Working with a coding agent? Add the Perron MCP server:</p>
        <CopyCommand command={figures.mcpCommand} />
      </div>
    </section>
  )
}
