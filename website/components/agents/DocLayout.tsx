// The layout of the Agents page, which Get started and the Release log share: a glass side nav of
// the page's sections beside the page's column, the two stacking when the window is too narrow
// for both, and previous and next sections at the column's foot.
import NextLink from 'next/link'
import type { ReactNode } from 'react'
import { SECTIONS } from '@/components/site/sections.ts'
import './agents.css'

export interface DocNavLink {
  label: ReactNode
  href: string
  /** Set in the data role, for a tool's name or a version */
  code?: boolean
}

export interface DocNavGroup {
  /** The group's heading, set as an overline; none for the page's own links */
  title?: string
  /** Sets the heading as written, in the data role, for a package's name */
  code?: boolean
  links: DocNavLink[]
}

export interface DocLayoutProps {
  /** The page's route: the nav's first link, marked current, and where the pager starts from */
  route: string
  /** The nav's name for screen readers and its first link's words */
  name: string
  nav: DocNavGroup[]
  children: ReactNode
}

function NavLink({ link, current }: { link: DocNavLink; current?: boolean }) {
  return (
    <NextLink
      href={link.href}
      className={current ? 'agents-nav-link' : 'agents-nav-link hover'}
      aria-current={current ? 'page' : undefined}
      data-code={link.code ? '' : undefined}
    >
      {link.label}
    </NextLink>
  )
}

/** The sections before and after this one in the header's order, or home at either end. */
function Pager({ route }: { route: string }) {
  const at = SECTIONS.findIndex((s) => s.href === route)
  const home = { label: 'Home', href: '/' }
  const previous = at > 0 ? SECTIONS[at - 1] : home
  const next = SECTIONS[at + 1]
  return (
    <nav aria-label="Previous and next" className="agents-pager">
      <NextLink href={previous.href} className="agents-pager-link hover">
        <span className="agents-pager-hint">{previous === home ? 'Back to' : 'Previous'}</span>
        <span className="agents-pager-label">{previous.label}</span>
      </NextLink>
      <NextLink href={(next ?? home).href} className="agents-pager-link hover" data-next="">
        <span className="agents-pager-hint">{next ? 'Next' : 'Back to'}</span>
        <span className="agents-pager-label">{(next ?? home).label}</span>
      </NextLink>
    </nav>
  )
}

export function DocLayout({ route, name, nav, children }: DocLayoutProps) {
  return (
    <div className="page agents-layout">
      <nav aria-label={name} className="agents-nav glass">
        <NavLink link={{ label: name, href: route }} current />
        {nav.map((group, i) => (
          <div key={group.title ?? i} className="agents-nav-items">
            {group.title ? (
              <span
                className={group.code ? 'agents-nav-group' : 'agents-nav-group agents-overline'}
                data-code={group.code ? '' : undefined}
              >
                {group.title}
              </span>
            ) : null}
            {group.links.map((link) => (
              <NavLink key={link.href} link={link} />
            ))}
          </div>
        ))}
      </nav>
      <div className="agents-column">
        {children}
        <Pager route={route} />
      </div>
    </div>
  )
}
