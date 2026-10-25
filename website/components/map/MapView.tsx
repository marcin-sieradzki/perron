'use client'
// The layout's map frame: picks the view from the route when MapBackground is given none, so the
// root layout draws one map that is full on the home page and quiet everywhere else. The drawing
// itself comes in as children, rendered on the server.
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export type MapViewName = 'full' | 'quiet' | 'framed'

/** The view the layout's map takes on a route: full on the home page, quiet everywhere else. */
export const routeView = (pathname: string): MapViewName => (pathname === '/' ? 'full' : 'quiet')

export function MapView({ view, children }: { view?: MapViewName; children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="map" data-view={view ?? routeView(pathname)} aria-hidden="true">
      <div className="map-canvas">
        {children}
        <div className="map-veil" />
      </div>
    </div>
  )
}
