// "What the system is made of": one tile per part of Perron, each drawn from the repo's data and
// linking to its section. The data states tile draws each state's VehicleDot beside its word.
import NextLink from 'next/link'
import type { ReactNode } from 'react'
import { LineBadge, type LineBadgeProps, Tag } from '@mylder/perron'
import { dotsDrawn, StateDot, stateVariant } from '@/components/site/StateDot.tsx'
import { siteRoute } from '@/lib/routes.ts'
import { DATA_STATES_PAGE, type HomeFigures } from './figures.ts'

const SAMPLE = `<SegmentedControl defaultValue="all">
  <Segment value="all">All</Segment>
  <Segment value="bus">Bus</Segment>
</SegmentedControl>`

/** A tile: a link named by its heading alone, as the foundation tiles are, not by all its text. */
function Tile(props: {
  href: string
  title: string
  body: string
  wide?: boolean
  children: ReactNode
}) {
  const id = `home-tile-${props.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <NextLink
      href={props.href}
      className="home-tile lift"
      data-wide={props.wide ? '' : undefined}
      aria-labelledby={id}
    >
      <div className="home-tile-figure">{props.children}</div>
      <div className="home-tile-text">
        <h3 id={id} className="home-tile-title">
          {props.title}
        </h3>
        <p className="home-tile-body">{props.body}</p>
      </div>
    </NextLink>
  )
}

export function MadeOf({ figures }: { figures: HomeFigures }) {
  const states = figures.dataStates
  return (
    <section aria-labelledby="made-of" className="home-made-of">
      <h2 id="made-of" className="home-heading">
        What the system is made of
      </h2>
      <div className="home-tiles">
        <Tile
          wide
          href={siteRoute(DATA_STATES_PAGE) ?? '/foundations'}
          title="Honest about every vehicle"
          body={`Every vehicle shows one of ${states.length} data states, each with its own shape, so none is drawn without how sure we are about where it is. The words for each state are the same on every screen.`}
        >
          {dotsDrawn() ? (
            <span className="home-row home-row-wide">
              {states.map((s) => (
                <span key={s.name} className="home-state">
                  <StateDot variant={stateVariant(s.name)} line="a" size="large" />
                  {s.name}
                </span>
              ))}
            </span>
          ) : (
            <span className="home-row">
              {states.map((s) => (
                <Tag key={s.name}>{s.name}</Tag>
              ))}
            </span>
          )}
        </Tile>
        <Tile
          href={`${siteRoute('docs/foundations/semantic-colours.md') ?? '/foundations'}#line-colours`}
          title="Of Copenhagen"
          body="The operators' own line colours, the city's names and the 24-hour clock, as tokens."
        >
          <span className="home-badges home-badges-large">
            {figures.lines.map((id) => (
              <LineBadge key={id} line={id as LineBadgeProps['line']} size="large">
                {id.toUpperCase()}
              </LineBadge>
            ))}
          </span>
        </Tile>
        <Tile
          href="/components"
          title="Base UI underneath"
          body={`Behaviour and accessibility from Base UI ${figures.baseUi}, props shaped like MUI's, styles in plain CSS.`}
        >
          <pre className="home-code">
            <code>{SAMPLE}</code>
          </pre>
        </Tile>
        <Tile
          href="/agents"
          title="Ready for agents"
          body="An MCP server that reads the docs of the exact versions Perron pins."
        >
          <ul className="home-tools">
            {figures.tools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Tile>
        <Tile
          href="/foundations"
          title={`${figures.tokens} tokens, ${figures.themes.length} themes`}
          body={`Written to the DTCG ${figures.specVersion} spec and built to CSS, TypeScript and Penpot.`}
        >
          <span className="home-themes">
            {figures.themes.map((theme) => (
              <span key={theme} data-theme={theme} className="home-theme" />
            ))}
            <span className="home-themes-names">{figures.themes.join(' · ')}</span>
          </span>
        </Tile>
      </div>
    </section>
  )
}
