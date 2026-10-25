'use client'
// The map screen with the patterns in their places, as Layout puts them: the overview sheet on the
// left, the detail panel on the right, the scale beside the map controls at the bottom right, and
// in kiosk mode the kiosk bar across the top in place of the panels. The zoom buttons zoom the
// drawing and the scale with it. Under breakpoint.phone the detail panel is a bottom sheet and
// the overview sheet is opaque, so text never sits on the moving map.
import { useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { MapControls, Segment, SegmentedControl } from '@mylder/perron'
import { ScaleBar } from '@mylder/perron/patterns'
import { DetailPanelPreview } from '@/previews/patterns/DetailPanelPreview.tsx'
import { METERS_PER_PIXEL } from '@/previews/patterns/samples.ts'

/** breakpoint.phone, as the site writes it in its media queries */
const PHONE = '(max-width: 759.98px)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PHONE)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Whether the window is under breakpoint.phone; never on the server. */
const usePhone = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE).matches,
    () => false,
  )

/** How far in the map can zoom from where it starts: each step halves the metres a pixel spans. */
const CLOSEST = 2

/** A pattern's number on the screen, which the list under it names. */
const Marker = ({ n }: { n: number }) => (
  <span className="patterns-marker" aria-hidden="true">
    {n}
  </span>
)

export interface MapScreenViewProps {
  /** The map, drawn on the server */
  map: ReactNode
  /** The overview sheet's content */
  overview: ReactNode
  /** The kiosk bar */
  kiosk: ReactNode
}

export function MapScreenView({ map, overview, kiosk }: MapScreenViewProps) {
  const phone = usePhone()
  const [mode, setMode] = useState('screen')
  const [zoom, setZoom] = useState(0)

  return (
    <>
      <div className="patterns-screen-head">
        <h2 id="in-place" className="patterns-heading">
          On the map screen
        </h2>
        <SegmentedControl
          aria-label="Screen"
          value={mode}
          onChange={(_event, value) => setMode(value)}
        >
          <Segment value="screen">Map screen</Segment>
          <Segment value="kiosk">Kiosk mode</Segment>
        </SegmentedControl>
      </div>
      <div className="patterns-screen" data-mode={mode} data-zoom={zoom}>
        <div className="patterns-screen-map">{map}</div>
        {mode === 'kiosk' ? (
          <div className="patterns-screen-kiosk">
            {kiosk}
            <Marker n={4} />
          </div>
        ) : (
          <>
            <div className="patterns-screen-overview glass floating">
              {overview}
              <Marker n={1} />
            </div>
            {/* keyed by the anchor, so a window crossing breakpoint.phone gets a fresh panel */}
            <DetailPanelPreview
              key={phone ? 'bottom' : 'right'}
              frameClassName="patterns-screen-detail"
              anchor={phone ? 'bottom' : 'right'}
            />
            <span className="patterns-screen-detail-marker">
              <Marker n={2} />
            </span>
          </>
        )}
        <div className="patterns-screen-tools">
          <div className="patterns-screen-scale">
            <ScaleBar metersPerPixel={METERS_PER_PIXEL / 2 ** zoom} />
            <Marker n={3} />
          </div>
          <MapControls
            zoomInDisabled={zoom === CLOSEST}
            zoomOutDisabled={zoom === 0}
            onZoomIn={() => setZoom((z) => Math.min(z + 1, CLOSEST))}
            onZoomOut={() => setZoom((z) => Math.max(z - 1, 0))}
            onCenterMap={() => setZoom(0)}
          />
        </div>
      </div>
    </>
  )
}
