// The site's six sections, in the header's order (ADR 0011), and which one a path is in. Shared by
// the header's links, the phone menu and the search.

export interface SiteSection {
  /** The link's words, in sentence case */
  label: string
  /** The section's route */
  href: string
}

export const SECTIONS: readonly SiteSection[] = [
  { label: 'Get started', href: '/get-started' },
  { label: 'Foundations', href: '/foundations' },
  { label: 'Components', href: '/components' },
  { label: 'Patterns', href: '/patterns' },
  { label: 'Agents', href: '/agents' },
  { label: 'Release log', href: '/releases' },
]

/** The section a path is in, such as Components for `/components/button`, or undefined. */
export function sectionOf(pathname: string): SiteSection | undefined {
  return SECTIONS.find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))
}
