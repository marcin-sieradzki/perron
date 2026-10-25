// A framed piece of the live map inside a tile: the shell's MapBackground, drawn again with its own
// id prefix, clipped to the frame, with whatever the tile lays over it.
import type { ReactNode } from 'react'
import { MapBackground } from '../map/MapBackground.tsx'

export interface MapFrameProps {
  /** Unique on the page: prefixes the ids of the map's paths */
  id: string
  /** Panels or labels laid over the map */
  children?: ReactNode
}

export function MapFrame({ id, children }: MapFrameProps) {
  return (
    <div className="fd-map" aria-hidden="true">
      <MapBackground view="quiet" idPrefix={`fd-${id}`} />
      {children}
    </div>
  )
}
