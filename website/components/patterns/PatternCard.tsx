// A stable pattern's card: its preview on a stage, then its name, the first paragraph of its spec
// and the components it is built from, as a link to its page. The preview stays out of the link,
// so its own controls work and are not nested in it.
import NextLink from 'next/link'
import { MapBackground } from '@/components/map/MapBackground.tsx'
import { Markdown } from '@/components/site/Markdown.tsx'
import type { RegistryEntry } from '@/lib/registry.ts'
import { getPreview, hasPreview, type PreviewProps } from '@/previews/index.ts'
import { KIOSK, STOG_TRIP } from '@/previews/patterns/samples.ts'

/**
 * The stage a preview stands on: the map under a glass pattern, a panel's raised surface under one
 * that sits on a panel, and the inset surface under the rest.
 */
const STAGES: Record<string, 'map' | 'panel'> = {
  DetailPanel: 'map',
  ScaleBar: 'map',
  KioskBar: 'map',
  DetailHeader: 'panel',
  StopTimeline: 'panel',
}

/** What a card lays over a preview's sample data so it fits the card's stage. */
const CARD_PROPS: Record<string, PreviewProps> = {
  KioskBar: { stats: KIOSK.stats.slice(1, 2) },
  StopTimeline: { stops: STOG_TRIP.stops.slice(0, 4) },
}

/** The components a pattern is built from, as its registry entry lists them. */
const partsOf = (entry: RegistryEntry) =>
  entry.dependsOn.length ? entry.dependsOn.join(' · ') : 'No components; chart tokens only'

export function PatternCard({ entry }: { entry: RegistryEntry }) {
  const stage = STAGES[entry.name] ?? 'inset'
  const body = (
    <>
      <h3 className="patterns-card-name">{entry.name}</h3>
      {entry.description ? (
        <p className="patterns-card-description">
          <Markdown source={entry.description} path={entry.specPath} inline />
        </p>
      ) : null}
      <span className="patterns-card-parts">{partsOf(entry)}</span>
    </>
  )

  return (
    <article id={entry.slug} className="patterns-card">
      {hasPreview(entry.name) ? (
        <div className="patterns-stage" data-stage={stage}>
          {stage === 'map' ? (
            <MapBackground view="framed" idPrefix={`patterns-${entry.slug}`} />
          ) : null}
          <div className="patterns-stage-preview">
            {getPreview(entry.name, CARD_PROPS[entry.name])}
          </div>
        </div>
      ) : null}
      {entry.route ? (
        <NextLink href={entry.route} className="patterns-card-body">
          {body}
        </NextLink>
      ) : (
        <div className="patterns-card-body">{body}</div>
      )}
    </article>
  )
}
