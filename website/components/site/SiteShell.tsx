'use client'
// The box around every page, marked with the view the layout's map takes on this route, full on
// the home page and quiet elsewhere, so the shell's CSS follows the route: under breakpoint.phone
// the page's sheet sits lower under the home page's full map (phone.css). The page itself comes in
// as children, rendered on the server.
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { routeView } from '../map/MapView.tsx'

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell" data-view={routeView(usePathname())}>
      {children}
    </div>
  )
}
