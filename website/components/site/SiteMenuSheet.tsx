'use client'
// The phone menu's sheet, as Phone-Home.dc.html draws it: Perron's Sheet from the bottom, modal
// over the scrim, as tall as its content, holding the six sections with the current one marked,
// the theme switch and GitHub. It closes on Esc, on a press outside, on the close button and on
// any navigation. It opens with focus on the current section's link, or the first, rather than on
// the sheet itself, and Base UI gives focus back to the menu button.
import { Button, Kbd, Sheet } from '@mylder/perron'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useSyncExternalStore } from 'react'
import { MenuIcon, MoonIcon, SunIcon } from './icons.tsx'
import { sectionOf, type SiteSection } from './sections.ts'
import { applyTheme, currentTheme, DEFAULT_THEME, subscribeTheme } from './theme.ts'

export interface SiteMenuSheetProps {
  /** The sections the menu lists, in the header's order */
  sections: readonly SiteSection[]
  /** The repository on GitHub */
  repoUrl: string
}

/** Full height alone, which phone.css makes the content's height: the menu has no peek. */
const SNAP_POINTS = [1]

export function SiteMenuSheet({ sections, repoUrl }: SiteMenuSheetProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [seenPath, setSeenPath] = useState(pathname)
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => DEFAULT_THEME)
  const active = sectionOf(pathname)
  const focusFirst = useRef<HTMLAnchorElement>(null)
  const firstHref = active?.href ?? sections[0]?.href

  // a navigation the menu didn't make, such as Back, closes it too
  if (seenPath !== pathname) {
    setSeenPath(pathname)
    setOpen(false)
  }

  const close = () => setOpen(false)
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <Sheet
      anchor="bottom"
      modal
      title="Menu"
      closeLabel="Close the menu"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={close}
      snapPoints={SNAP_POINTS}
      initialFocus={focusFirst}
      className="site-menu"
      trigger={
        <Button variant="outline" className="site-menu-button" startIcon={<MenuIcon />}>
          Menu
        </Button>
      }
    >
      <nav aria-label="Sections" className="site-menu-group">
        {sections.map((s) => (
          <NextLink
            key={s.href}
            ref={s.href === firstHref ? focusFirst : undefined}
            href={s.href}
            className="site-menu-item hover"
            aria-current={s.href === active?.href ? 'page' : undefined}
            onClick={close}
          >
            {s.label}
          </NextLink>
        ))}
      </nav>
      <div className="site-menu-group">
        <button type="button" className="site-menu-item hover" onClick={() => applyTheme(next)}>
          {next === 'light' ? <SunIcon /> : <MoonIcon />}
          {next === 'light' ? 'Switch to the light theme' : 'Switch to the dark theme'}
        </button>
        <a href={repoUrl} className="site-menu-item hover">
          GitHub
        </a>
      </div>
      <p className="site-menu-keys">
        Keys: <Kbd>Esc</Kbd> closes the menu.
      </p>
    </Sheet>
  )
}
