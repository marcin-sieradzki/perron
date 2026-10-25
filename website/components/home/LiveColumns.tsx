// Three still columns of glass panels over the map, each holding shipped components at work, with
// links to their pages. Sample data reads as Mylder writes it (docs/content-design.md); figures
// about Perron itself come from the loaders. Each data state's VehicleDot sits beside its words;
// DepartureRow is still designing, so the stop shows no departures.
import NextLink from 'next/link'
import type { ReactNode } from 'react'
import {
  Button,
  FactList,
  FilterChip,
  Kbd,
  LineBadge,
  MapControls,
  Meter,
  NormalService,
  PerronProvider,
  SearchField,
  Segment,
  SegmentedControl,
  Stat,
  StationIcon,
  Tag,
  Text,
} from '@mylder/perron'
import { DetailHeader, DisruptionCard, StopTimeline } from '@mylder/perron/patterns'
import { PackageIcon } from '@/components/site/PackageIcon.tsx'
import { dotsDrawn, StateDot, stateVariant } from '@/components/site/StateDot.tsx'
import { siteRoute } from '@/lib/routes.ts'
import { DATA_STATES_PAGE, routeOf, type HomeFigures } from './figures.ts'

/** Where a footer name links when it is not a registry entry. */
const OTHER_PAGES: Record<string, string | undefined> = {
  PerronProvider: siteRoute('packages/perron/README.md'),
  'Data states foundation': siteRoute(DATA_STATES_PAGE),
}

/** A panel's footer: the components it shows, each linking to its page. */
function Shows({ names }: { names: string[] }) {
  return (
    <footer className="home-panel-links">
      {names.map((name) => {
        const href = routeOf(name) ?? OTHER_PAGES[name]
        return href ? (
          <NextLink key={name} href={href} className="link">
            {name}
          </NextLink>
        ) : (
          <span key={name}>{name}</span>
        )
      })}
    </footer>
  )
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <article aria-label={label} className="home-panel glass floating">
      {children}
    </article>
  )
}

/** A stop's panel: its header, the mode filter and its facts. Also the phone's "Built with Perron". */
export function StopPanel({ className = 'home-panel glass floating' }: { className?: string }) {
  return (
    <article aria-label="A stop" className={className}>
      <DetailHeader variant="stop" title="Nørreport St." subheader="Metro, S-tog and bus" />
      <SegmentedControl aria-label="Show departures by mode" defaultValue="all">
        <Segment value="all">All</Segment>
        <Segment value="metro">Metro</Segment>
        <Segment value="s-tog">S-tog</Segment>
        <Segment value="bus">Bus</Segment>
      </SegmentedControl>
      <FactList
        items={[
          {
            label: 'Metro and S-tog',
            value: (
              <span className="home-badges">
                <LineBadge line="m1">M1</LineBadge>
                <LineBadge line="m2">M2</LineBadge>
                <LineBadge line="a">A</LineBadge>
                <LineBadge line="b">B</LineBadge>
                <LineBadge line="c">C</LineBadge>
                <LineBadge line="e">E</LineBadge>
                <LineBadge line="h">H</LineBadge>
              </span>
            ),
          },
        ]}
      />
      <Text variant="caption" emphasis="secondary">
        Run by Metroselskabet, DSB and Movia.
      </Text>
      <Shows names={['DetailHeader', 'SegmentedControl', 'FactList', 'LineBadge']} />
    </article>
  )
}

const STOPS = [
  { value: 'norreport', label: 'Nørreport St.', description: 'Metro, S-tog and bus' },
  { value: 'norrebro', label: 'Nørrebro St.', description: 'Metro, S-tog and bus' },
  { value: 'nordhavn', label: 'Nordhavn St.', description: 'Metro and S-tog' },
].map((s) => ({ ...s, startIcon: <StationIcon /> }))

const TRIP = [
  { name: 'Kongens Nytorv', time: '08:12' },
  { name: 'Marmorkirken', time: '08:13' },
  { name: 'Østerport', time: '08:15', delay: 1 },
  { name: 'Trianglen', time: '08:17', delay: 1 },
  { name: 'Poul Henningsens Plads', time: '08:19', delay: 1 },
]

export function LiveColumns({ figures }: { figures: HomeFigures }) {
  const stable = figures.stable.component + figures.stable.pattern
  const designing = figures.designing.component + figures.designing.pattern
  return (
    <section aria-label="Components at work" className="home-columns">
      <div className="home-column">
        <StopPanel />

        <Panel label="Data states">
          <Text variant="overline" emphasis="secondary">
            Data states
          </Text>
          <ul className="home-facts">
            {figures.dataStates.map((s) => (
              <li key={s.name} className="home-fact">
                <span className="home-fact-name">
                  <StateDot variant={stateVariant(s.name)} line="m3" size="small" />
                  {s.name}
                </span>
                <span className="home-fact-text">{s.means}</span>
              </li>
            ))}
          </ul>
          <Shows
            names={
              dotsDrawn() ? ['VehicleDot', 'Data states foundation'] : ['Data states foundation']
            }
          />
        </Panel>

        <Panel label="The registry">
          <div className="home-row home-row-wide">
            <Stat label="Stable">{stable}</Stat>
            <Stat label="In design">{designing}</Stat>
          </div>
          <Meter label="Built and stable" value={stable} max={stable + designing} />
          <Shows names={['Stat', 'Meter']} />
        </Panel>
      </div>

      <div className="home-column">
        <Panel label="A disruption">
          <Text variant="overline" emphasis="secondary">
            Disruptions
          </Text>
          <DisruptionCard
            severity="delay"
            lines={[{ line: 'f', name: 'F' }]}
            title="Signal fault at Danshøj"
          >
            Trains between Flintholm and Ny Ellebjerg run slower than planned.
          </DisruptionCard>
          <Shows names={['DisruptionCard', 'SeverityLabel']} />
        </Panel>

        <Panel label="Search and filters">
          <SearchField
            label="Search lines and stops"
            hiddenLabel
            placeholder="Try a line number such as 5C"
            items={STOPS}
          />
          <div className="home-row">
            <FilterChip defaultSelected count={3}>
              Delays
            </FilterChip>
            <FilterChip count={1}>Diversions</FilterChip>
            <FilterChip>Planned works</FilterChip>
          </div>
          <Shows names={['SearchField', 'FilterChip', 'Count']} />
        </Panel>

        <Panel label="A trip">
          <div className="home-row">
            <LineBadge line="m3">M3</LineBadge>
            <Text variant="heading-sm">Cityringen, clockwise</Text>
          </div>
          <StopTimeline line="m3" stops={TRIP} nextStopIndex={2} />
          <Shows names={['StopTimeline', 'LineBadge']} />
        </Panel>
      </div>

      <div className="home-column">
        <Panel label="A line's service">
          <div className="home-row">
            <LineBadge line="m4">M4</LineBadge>
            <NormalService />
          </div>
          <Shows names={['NormalService']} />
        </Panel>

        <Panel label="Actions and map controls">
          <div className="home-row">
            <Button startIcon={<PackageIcon name="locate" />}>Show on map</Button>
            <Button variant="outline">Show whole line</Button>
          </div>
          <div className="home-row home-row-wide">
            <MapControls />
            <Text variant="caption" emphasis="secondary">
              Keys: <Kbd>+</Kbd> and <Kbd>−</Kbd> zoom, <Kbd>Esc</Kbd> closes panels.
            </Text>
          </div>
          <Shows names={['Button', 'MapControls', 'Kbd']} />
        </Panel>

        <Panel label="Languages">
          <Text variant="overline" emphasis="secondary">
            One word, {figures.languages.length} languages
          </Text>
          <dl className="home-languages">
            {figures.languages.map((locale) => (
              <div key={locale} className="home-language">
                <dt>
                  <Tag>{locale}</Tag>
                </dt>
                <dd lang={locale}>
                  <PerronProvider locale={locale}>
                    <NormalService />
                  </PerronProvider>
                </dd>
              </div>
            ))}
          </dl>
          <Shows names={['PerronProvider', 'NormalService']} />
        </Panel>

        <Panel label="Tags">
          <div className="home-row">
            <Tag>Night bus</Tag>
            <Tag color="warning">Replacement bus</Tag>
            <Tag color="danger">Cancelled</Tag>
          </div>
          <Shows names={['Tag']} />
        </Panel>
      </div>
    </section>
  )
}
