// The tiles of the Foundations index, one per foundation page, each drawn from that page's own
// token rows: a colour tile paints its swatches with the tokens' custom properties, the type tile
// sets its specimens in the roles, the spacing tile draws its bars at each step. Every number a
// tile prints is the row's value. A page with no tile of its own gets a plain one.
import NextLink from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { LineBadge, type LineBadgeProps } from '@/components/perron'
import type { FoundationPage } from '@/lib/foundations.ts'
import { firstTable } from '@/lib/markdown.ts'
import { entryByName } from '@/lib/registry.ts'
import { cssVar } from '@/lib/tokens.ts'
import {
  contrastSegments,
  cssValue,
  introOf,
  leafOf,
  plain,
  proseOf,
  quoted,
  rowOf,
  rowsUnder,
  sectionOf,
  sentences,
  shortName,
  spaced,
  tokenRows,
  valueOf,
  words,
  type TokenRow,
} from './data.ts'
import { PULSE_GROWTH } from '../map/map-data.ts'
import { MapFrame } from './MapFrame.tsx'
import { Rich } from './Rich.tsx'

type Style = CSSProperties & Record<`--${string}`, string>

interface TileProps {
  page: FoundationPage
  /** The tile's heading; the page's title when left out */
  title?: string
  /** Where the tile leads; the page when left out */
  href?: string
  /** A short note beside the heading, such as a count */
  meta?: ReactNode
  /** A sentence under the drawing, as markdown */
  caption?: string
  /** Spans the grid's full width */
  wide?: boolean
  /** Glass over the map, as the live-map tiles are */
  glass?: boolean
  className?: string
  children?: ReactNode
}

function Tile({ page, title, href, meta, caption, wide, glass, className, children }: TileProps) {
  const id = `fd-tile-${(href ?? page.route).replace(/\W+/g, '-')}`
  const classes = ['fd-tile', 'lift', glass ? 'glass' : '', className ?? ''].join(' ').trim()
  return (
    <NextLink
      href={href ?? page.route}
      className={classes}
      data-wide={wide || undefined}
      aria-labelledby={id}
    >
      <span className="fd-tile-head">
        <span id={id} className="fd-tile-title">
          {title ?? page.title}
        </span>
        {meta ? <span className="fd-tile-meta">{meta}</span> : null}
      </span>
      {children}
      {caption ? (
        <span className="fd-tile-caption">
          <Rich text={caption} />
        </span>
      ) : null}
    </NextLink>
  )
}

const firstSentence = (text: string) => sentences(plain(text))[0] ?? ''

/** The swatches the colour tile shows, in the order Foundations.dc.html lays them out. */
const SWATCHES = [
  'color.surface.default',
  'color.surface.raised',
  'color.surface.inset',
  'color.surface.inverse',
  'color.text.primary',
  'color.text.secondary',
  'color.surface.brand',
  'color.surface.brand-subtle',
  'color.status.success',
  'color.status.warning',
  'color.status.danger',
  'color.status.info',
]

function SemanticColoursTile({ page }: { page: FoundationPage }) {
  const colours = tokenRows(page).filter((r) => r.type === 'color')
  const lines = rowsUnder(page, 'color.transit.line.')
  return (
    <Tile
      page={page}
      wide
      meta={`${colours.length} colours, ${Object.keys(colours[0].values).join(' and ')}`}
    >
      <span className="fd-swatches">
        {SWATCHES.map((name) => {
          const row = rowOf(page, name)
          return (
            <span key={name} className="fd-swatch">
              <span className="fd-swatch-fill" style={{ '--fd-fill': cssValue(row) } as Style} />
              <span className="fd-swatch-label">{words(leafOf(name))}</span>
              <span className="fd-swatch-name">{shortName(name)}</span>
            </span>
          )
        })}
      </span>
      <span className="fd-badges">
        <span className="fd-badges-label">Line colours, with their names</span>
        {lines.map((row) => {
          const line = leafOf(row.name)
          return (
            <LineBadge key={line} line={line as LineBadgeProps['line']}>
              {line.toUpperCase()}
            </LineBadge>
          )
        })}
      </span>
    </Tile>
  )
}

function PrimitiveColoursTile({ page }: { page: FoundationPage }) {
  const rows = rowsUnder(page, 'palette.')
  const hues = [...new Set(rows.map((r) => r.name.split('.')[1]))]
  return (
    <Tile page={page} wide meta={`${rows.length} steps`} caption={firstSentence(introOf(page))}>
      <span className="fd-ramps">
        {hues.map((hue) => (
          <span key={hue} className="fd-ramp">
            <span className="fd-ramp-name">{hue}</span>
            <span className="fd-ramp-steps">
              {rows
                .filter((r) => r.name.split('.')[1] === hue)
                .map((r) => (
                  <span key={r.name} className="fd-ramp-step">
                    <span className="fd-ramp-fill" style={{ '--fd-fill': cssValue(r) } as Style} />
                    <span className="fd-ramp-label">{leafOf(r.name)}</span>
                  </span>
                ))}
            </span>
          </span>
        ))}
      </span>
    </Tile>
  )
}

/** The roles the type tile sets, each with a line in it. */
const SPECIMENS: [string, string][] = [
  ['typography.display', 'Kongens Nytorv'],
  ['typography.heading-lg', 'Departures'],
  ['typography.heading-md', 'Line M3, Cityringen'],
  ['typography.body', 'Signal fault at Danshøj. Trains run every 10 minutes.'],
  ['typography.label', 'Show departures'],
  ['typography.overline', 'Next departures'],
  ['typography.data', '08:14  +3 min  ~08:21'],
]

/** Each family, set in a role that uses it. */
const FAMILIES: [string, string][] = [
  ['font.family.display', 'typography.heading-md'],
  ['font.family.body', 'typography.label'],
  ['font.family.data', 'typography.data'],
]

const roleClass = (row: TokenRow) => row.typography?.className

function TypographyTile({ page }: { page: FoundationPage }) {
  const roles = tokenRows(page).filter((r) => r.typography)
  return (
    <Tile page={page} wide className="fd-type-tile">
      <span className="fd-type-side">
        <span className="perron-typography-data-xl" aria-hidden="true">
          08:14
        </span>
        <span className="fd-families">
          {FAMILIES.map(([family, role]) => {
            const row = rowOf(page, family)
            return (
              <span key={family} className="fd-family">
                <span className={roleClass(rowOf(page, role))}>{valueOf(row).split(',')[0]}</span>
                <span>{row.description}</span>
              </span>
            )
          })}
        </span>
      </span>
      <span className="fd-specimens">
        {SPECIMENS.map(([name, sample]) => {
          const row = rowOf(page, name)
          return (
            <span key={name} className="fd-specimen">
              <span className="fd-specimen-name">{leafOf(name)}</span>
              <span className={`fd-specimen-sample ${roleClass(row)}`}>{sample}</span>
              <span className="fd-specimen-size">{row.typography!.size}</span>
            </span>
          )
        })}
        <span className="fd-tile-caption">
          {SPECIMENS.length} of the {roles.length} roles. Every piece of text on this site is set
          with one.
        </span>
      </span>
    </Tile>
  )
}

function SpacingTile({ page }: { page: FoundationPage }) {
  const rows = rowsUnder(page, 'space.')
  const first = spaced(valueOf(rows[0]))
  const last = spaced(valueOf(rows[rows.length - 1]))
  return (
    <Tile
      page={page}
      title="Spacing"
      caption={`${rows.length} steps, from ${first} to ${last}. \`space.300\` is ${spaced(valueOf(rowOf(page, 'space.300')))}.`}
    >
      <span className="fd-bars">
        {rows.map((r) => (
          <span key={r.name} className="fd-bar-row">
            <span className="fd-bar-name">{r.name}</span>
            <span className="fd-bar" style={{ inlineSize: cssValue(r) }} />
            <span className="fd-bar-value">{spaced(valueOf(r))}</span>
          </span>
        ))}
      </span>
    </Tile>
  )
}

function RadiusTile({ page }: { page: FoundationPage }) {
  const width = spaced(valueOf(rowOf(page, 'focus.width')))
  const offset = spaced(valueOf(rowOf(page, 'focus.offset')))
  return (
    <Tile page={page} title="Radius and focus" href={`${page.route}#radius`}>
      <span className="fd-corners">
        {rowsUnder(page, 'radius.').map((r) => (
          <span key={r.name} className="fd-corner">
            <span className="fd-corner-shape" style={{ borderRadius: cssValue(r) }} />
            <span className="fd-corner-label">
              {leafOf(r.name)}, {spaced(valueOf(r))}
            </span>
          </span>
        ))}
      </span>
      <span className="fd-focus">
        <span className="fd-focus-sample">Focus</span>
        <span className="fd-tile-caption">
          One ring, {width} wide, {offset} from the element.
        </span>
      </span>
    </Tile>
  )
}

function ElevationTile({ page }: { page: FoundationPage }) {
  const intro = sentences(plain(introOf(page)))
  return (
    <Tile page={page} caption={intro[intro.length - 1]}>
      <MapFrame id="elevation">
        <span className="fd-ground-label">Map, the ground</span>
        <span className="fd-glass-sample glass floating">
          <span>Glass, over the map</span>
          <span className="fd-raised-sample">
            Raised, inside a panel
            <span className="fd-inset-sample" />
          </span>
        </span>
      </MapFrame>
    </Tile>
  )
}

/** The motions the tile plays when it is hovered or focused: a duration with its easing. */
const MOTIONS: [string, string][] = [
  ['duration.sheet', 'easing.sheet'],
  ['duration.camera', 'easing.standard'],
]

function MotionTile({ page }: { page: FoundationPage }) {
  const pulse = rowOf(page, 'duration.report-pulse')
  const reduced = Object.values(rowOf(page, 'duration.sheet').overrides)[0]
  const caption = [
    firstSentence(introOf(page)),
    reduced ? `Under reduced motion, transitions take ${spaced(reduced)}.` : '',
  ]
  return (
    <Tile page={page} caption={caption.join(' ').trim()}>
      <span className="fd-motions">
        {MOTIONS.map(([duration, easing], i) => {
          const d = rowOf(page, duration)
          const e = rowOf(page, easing)
          return (
            <span key={duration} className="fd-motion-row">
              <span className="fd-motion-names">
                <span>{e.name}</span>
                <span>
                  {d.name} {spaced(valueOf(d))}
                </span>
              </span>
              <span
                className="fd-track"
                data-quiet={i > 0 || undefined}
                style={{ '--fd-duration': cssValue(d), '--fd-easing': cssValue(e) } as Style}
              >
                <span className="fd-track-dot" />
              </span>
            </span>
          )
        })}
        <span className="fd-pulse-row">
          <svg viewBox="0 0 26 26" className="fd-pulse" aria-hidden="true">
            <circle cx="13" cy="13" r="5" className="fd-pulse-dot" />
            <circle
              cx="13"
              cy="13"
              r="5"
              className="fd-pulse-ring"
              style={
                { '--fd-duration': cssValue(pulse), '--fd-growth': String(PULSE_GROWTH) } as Style
              }
            />
          </svg>
          <span className="fd-motion-names">
            {pulse.name} {spaced(valueOf(pulse))}
          </span>
        </span>
      </span>
    </Tile>
  )
}

/** How many icons the tile shows. */
const ICONS_SHOWN = 10

function IconsTile({ page }: { page: FoundationPage }) {
  const icons = page.segments.flatMap((s) =>
    s.kind === 'icons' ? s.categories.flatMap((c) => c.items) : [],
  )
  return (
    <Tile page={page} meta={`${icons.length} files`} caption={firstSentence(introOf(page))}>
      <span className="fd-icons" aria-hidden="true">
        {icons.slice(0, ICONS_SHOWN).map((icon) => (
          <span
            key={icon.name}
            className="fd-icon"
            style={{ '--perron-icon-size': cssVar(icon.size) } as Style}
            // the repository's own files, which the build checks for style and colour
            dangerouslySetInnerHTML={{
              __html: icon.svg.replace('<svg ', '<svg class="perron-icon" focusable="false" '),
            }}
          />
        ))}
      </span>
    </Tile>
  )
}

function LogosTile({ page }: { page: FoundationPage }) {
  const logos = page.segments.flatMap((s) =>
    s.kind === 'logos' ? s.categories.flatMap((c) => c.items) : [],
  )
  return (
    <Tile page={page} caption={firstSentence(sectionOf(page, 'The mark'))}>
      <span className="fd-logos" aria-hidden="true">
        {logos.map((logo) => (
          <span
            key={logo.name}
            className="fd-logo"
            data-theme={logo.theme}
            // the repository's own files, which the build checks against the tokens
            dangerouslySetInnerHTML={{ __html: logo.svg }}
          />
        ))}
      </span>
    </Tile>
  )
}

function LayoutTile({ page }: { page: FoundationPage }) {
  return (
    <Tile page={page}>
      <span className="fd-screen" aria-hidden="true">
        <span className="fd-screen-bar" />
        <span className="fd-screen-sheet" />
        <span className="fd-screen-detail" />
        <span className="fd-screen-controls" />
      </span>
      <span className="fd-breakpoints">
        {rowsUnder(page, 'breakpoint.').map((r) => (
          <span key={r.name} className="fd-breakpoint">
            <span className="fd-breakpoint-name">{leafOf(r.name)}</span>
            <span className="fd-breakpoint-value">{spaced(valueOf(r))}</span>
            <span className="fd-breakpoint-use">{r.description}</span>
          </span>
        ))}
      </span>
    </Tile>
  )
}

/** A contrast pair as the accessibility tile shows it, with its ratio in each theme. */
interface Pair {
  fg: string
  bg: string
  fgVar: string
  bgVar: string
  ratios: Record<string, number>
  minimum: number
}

function AccessibilityTile({ page }: { page: FoundationPage }) {
  const [text] = contrastSegments(page)
  const pairs: Pair[] = text.rows.flatMap((row) =>
    text.backgrounds.map((b) => ({
      fg: row.name,
      bg: b.name,
      fgVar: row.cssVar,
      bgVar: b.cssVar,
      ratios: Object.fromEntries(text.themes.map((t) => [t, row.ratios[t][b.name]])),
      minimum: text.minimum,
    })),
  )
  const lowest = (p: Pair) => Math.min(...Object.values(p.ratios))
  // the first pair the build measures, and the closest it lets pass
  const passing = pairs.filter((p) => lowest(p) >= p.minimum)
  const shown = [pairs[0], passing.reduce((a, b) => (lowest(b) < lowest(a) ? b : a))]
  const intro = sentences(plain(introOf(page)))
  const target = /(WCAG [\d.]+) level (A+)/.exec(intro[0])
  return (
    <Tile
      page={page}
      meta={target ? `${target[1]} ${target[2]}` : undefined}
      caption={intro.slice(1).join(' ')}
    >
      <span className="fd-pairs">
        {shown.map((p) => (
          <span
            key={p.fg + p.bg}
            className="fd-pair"
            style={{ background: `var(${p.bgVar})`, color: `var(${p.fgVar})` }}
          >
            <span className="fd-pair-name">
              {shortName(p.fg)} on {shortName(p.bg)}
            </span>
            {Object.entries(p.ratios).map(([theme, ratio]) => (
              <span key={theme} className="fd-pair-ratio" data-for-theme={theme}>
                {ratio.toFixed(1)}:1
              </span>
            ))}
          </span>
        ))}
      </span>
    </Tile>
  )
}

function ContentDesignTile({ page }: { page: FoundationPage }) {
  const rules = proseBullets(page)
  const example = quoted(rules[0] ?? '')[0]
  const numbers = quoted(rules.find((r) => r.startsWith('Numbers')) ?? '')
  return (
    <Tile page={page} wide caption={firstSentence(introOf(page))} className="fd-words-tile">
      {example ? <span className="fd-quote">{example}</span> : null}
      {numbers.length ? (
        <span className="fd-chips">
          {numbers.map((n) => (
            <span key={n} className="fd-chip">
              {n}
            </span>
          ))}
        </span>
      ) : null}
    </Tile>
  )
}

/** The page's top-level bullets, as text. */
const proseBullets = (page: FoundationPage) =>
  [
    ...page.segments
      .flatMap((s) => (s.kind === 'prose' ? [s.markdown] : []))
      .join('\n')
      .matchAll(/^- (.+)$/gm),
  ].map((m) => m[1])

/** The entry that draws each state's dot. Until it is stable, the tile names the states in words. */
const DOT = 'VehicleDot'

function DataStatesTile({ page }: { page: FoundationPage }) {
  const { rows } = firstTable(proseOf(page))
  const dot = entryByName(DOT)
  // with no dots drawn, the page's rule about writing the words beside them would read oddly here
  const caption =
    dot && dot.status !== 'stable'
      ? `Each state's dot shape comes with \`${DOT}\`, still in design.`
      : firstSentence(proseBullets(page)[0] ?? '')
  return (
    <Tile page={page} glass caption={caption}>
      <span className="fd-states">
        {rows.map((r) => (
          <span key={r.State} className="fd-state">
            <span className="fd-state-name">{r.State}</span>
            <span className="fd-state-means">{r.Means}</span>
          </span>
        ))}
      </span>
    </Tile>
  )
}

function MapTile({ page }: { page: FoundationPage }) {
  const v = (name: string) => spaced(valueOf(rowOf(page, name)))
  const caption = [
    firstSentence(introOf(page)),
    `Metro lines ${v('map.line-width.metro')}, S-tog ${v('map.line-width.stog')}, regional ${v('map.line-width.regional')}; dot radius from ${v('map.dot-radius.bus')} for a bus to ${v('map.dot-radius.regional')} for a regional train.`,
  ].join(' ')
  return (
    <Tile page={page} className="fd-map-tile">
      <MapFrame id="map" />
      <span className="fd-map-text">
        <span className="fd-tile-caption">
          <Rich text={caption} />
        </span>
      </span>
    </Tile>
  )
}

function PlainTile({ page }: { page: FoundationPage }) {
  return <Tile page={page} caption={firstSentence(introOf(page))} />
}

const TILES: Record<string, (props: { page: FoundationPage }) => ReactNode> = {
  'semantic-colours': SemanticColoursTile,
  'primitive-colours': PrimitiveColoursTile,
  typography: TypographyTile,
  'semantic-spacing': ({ page }) => (
    <>
      <SpacingTile page={page} />
      <RadiusTile page={page} />
    </>
  ),
  elevation: ElevationTile,
  motion: MotionTile,
  icons: IconsTile,
  logos: LogosTile,
  layout: LayoutTile,
  accessibility: AccessibilityTile,
  'content-design': ContentDesignTile,
  'data-states': DataStatesTile,
  map: MapTile,
}

/** A foundation page's tile, or its two for Semantic spacing, or a plain one for a new page. */
export function FoundationTile({ page }: { page: FoundationPage }) {
  const Draw = TILES[page.slug] ?? PlainTile
  return <Draw page={page} />
}
