'use client'
// The map's frame: picks the view from the route when MapBackground is given none, so the root
// layout draws one map that is full on the home page and quiet everywhere else. The drawing itself
// comes in as children, rendered on the server.
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export type MapViewName = 'full' | 'quiet'

export function MapView({ view, children }: { view?: MapViewName; children: ReactNode }) {
  const pathname = usePathname()
  const shown = view ?? (pathname === '/' ? 'full' : 'quiet')
  return (
    <div className="map" data-view={shown} aria-hidden="true">
      <div className="map-canvas">
        {children}
        <div className="map-veil" />
      </div>
    </div>
  )
}
