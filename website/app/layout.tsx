// The root layout: Perron's stylesheet, the locale, the theme applied before first paint, the map
// behind everything, the header, the page's <main> and the footer.
import '@mylder/perron/perron.css'
import './site.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { MapBackground } from '@/components/map/MapBackground.tsx'
import { PerronProvider } from '@/components/perron'
import { SiteFooter } from '@/components/site/SiteFooter.tsx'
import { SiteHeader } from '@/components/site/SiteHeader.tsx'
import { SiteShell } from '@/components/site/SiteShell.tsx'
import { DEFAULT_THEME, THEME_SCRIPT } from '@/components/site/theme.ts'

export const metadata: Metadata = {
  title: { default: 'Perron', template: '%s · Perron' },
  description:
    "Perron is Mylder's design system: the tokens, components, patterns and words behind a live map of Copenhagen's public transport.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // the head script may change data-theme before React hydrates
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <PerronProvider locale="en">
          <SiteShell>
            <MapBackground />
            <a className="site-skip" href="#main">
              Skip to the content
            </a>
            <SiteHeader />
            <main id="main" className="site-main">
              {children}
            </main>
            <SiteFooter />
          </SiteShell>
        </PerronProvider>
      </body>
    </html>
  )
}
