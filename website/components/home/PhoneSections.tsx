// What Phone-Home.dc.html shows under breakpoint.phone in place of the columns and the tiles:
// "Explore", a list of the sections with a line on each, and "Built with Perron", one stop panel,
// opaque. Hidden on wider screens, where the header's links and the columns do this.
import NextLink from 'next/link'
import { PackageIcon } from '@/components/site/PackageIcon.tsx'
import { siteRoute } from '@/lib/routes.ts'
import type { HomeFigures } from './figures.ts'
import { StopPanel } from './LiveColumns.tsx'

export function PhoneSections({ figures }: { figures: HomeFigures }) {
  const sections = [
    {
      label: 'Foundations',
      hint: 'Colour, type, space, motion and the mark',
      href: '/foundations',
    },
    {
      label: 'Components',
      hint: `${figures.stable.component} stable, ${figures.designing.component} in design`,
      href: '/components',
    },
    {
      label: 'Patterns',
      hint: `${figures.stable.pattern} stable, ${figures.designing.pattern} in design`,
      href: '/patterns',
    },
    {
      label: 'Content design',
      hint: 'Voice, numbers and the words for every state',
      href: siteRoute('docs/content-design.md') ?? '/foundations',
    },
    {
      label: 'Agents',
      hint: `The MCP server and its ${figures.tools.length} tools`,
      href: '/agents',
    },
  ]
  return (
    <>
      <section aria-labelledby="explore" className="home-phone">
        <h2 id="explore" className="home-phone-heading">
          Explore
        </h2>
        <nav aria-labelledby="explore" className="home-explore">
          {sections.map((s) => (
            <NextLink key={s.label} href={s.href} className="home-explore-link hover">
              <span className="home-explore-text">
                <span className="home-explore-label">{s.label}</span>
                <span className="home-explore-hint">{s.hint}</span>
              </span>
              <PackageIcon name="chevron-right" />
            </NextLink>
          ))}
        </nav>
      </section>
      <section aria-labelledby="built-with" className="home-phone">
        <h2 id="built-with" className="home-phone-heading">
          Built with Perron
        </h2>
        <StopPanel className="home-panel home-panel-opaque" />
      </section>
    </>
  )
}
