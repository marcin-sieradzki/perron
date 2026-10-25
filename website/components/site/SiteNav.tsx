'use client'
// The header's section links, with aria-current="page" on the section the page is in. Site-only,
// as ADR 0011 settles: Mylder has no top navigation for a package component to serve.
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { sectionOf, type SiteSection } from '../../lib/sections.ts'

export function SiteNav({ sections }: { sections: readonly SiteSection[] }) {
  const active = sectionOf(usePathname())
  return (
    <nav aria-label="Sections" className="site-nav">
      {sections.map((s) => (
        <NextLink
          key={s.href}
          href={s.href}
          className="site-nav-link hover"
          aria-current={s.href === active?.href ? 'page' : undefined}
        >
          {s.label}
        </NextLink>
      ))}
    </nav>
  )
}
