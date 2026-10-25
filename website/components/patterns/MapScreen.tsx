// "On the map screen": a framed map of its own, drawn on the server, with the patterns over it in
// their places (MapScreenView) and the list that names each numbered one. Every pattern is drawn
// through the previews registry, with the same sample data as its card.
import { MapBackground } from '@/components/map/MapBackground.tsx'
import { getPreview } from '@/previews/index.ts'
import { MapScreenView } from './MapScreenView.tsx'

/** The numbered patterns, as the list under the screen names them. */
const PLACES = [
  'DisruptionCard, and DayProfileChart in a DataStatePanel, in the overview sheet',
  'DetailPanel, with DetailHeader and StopTimeline',
  'ScaleBar beside MapControls',
  'KioskBar across the top, in kiosk mode',
]

export function MapScreen() {
  return (
    <section aria-labelledby="in-place" className="patterns-section">
      <MapScreenView
        map={<MapBackground view="quiet" idPrefix="patterns" />}
        overview={
          <>
            <span className="patterns-overline">Disruptions</span>
            {getPreview('DisruptionCard')}
            {getPreview('DataStatePanel', {
              status: 'ready',
              children: getPreview('DayProfileChart'),
            })}
          </>
        }
        kiosk={getPreview('KioskBar')}
      />
      <ol className="patterns-places">
        {PLACES.map((place, i) => (
          <li key={place}>
            <span className="patterns-places-number">{i + 1}</span> {place}
          </li>
        ))}
      </ol>
    </section>
  )
}
