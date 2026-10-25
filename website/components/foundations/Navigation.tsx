// The ways around the Foundations section: the sidebar of every foundation page in its groups, the
// breadcrumb back to the index, and the links to the page before and after, which run from the
// index through each page in the sidebar's order and on to the next section.
import NextLink from 'next/link'
import { Fragment } from 'react'
import { SECTIONS } from '@/components/site/sections.ts'
import { CurrentIntoView } from './CurrentIntoView.tsx'
import { foundationGroups, orderedFoundations } from './data.ts'

const INDEX = { label: 'Overview', href: '/foundations' }

/** The sidebar: the index, then each page; `current` is the shown page's slug, empty for the index. */
export function FoundationsNav({ current = '' }: { current?: string }) {
  return (
    <nav aria-label="Foundations" className="fd-nav glass scroll-x">
      <NextLink
        href={INDEX.href}
        className="fd-nav-link hover"
        aria-current={current ? undefined : 'page'}
      >
        {INDEX.label}
      </NextLink>
      {foundationGroups().map((group) => (
        <Fragment key={group.label ?? 'main'}>
          {group.label ? <span className="fd-nav-group">{group.label}</span> : null}
          {group.pages.map((p) => (
            <NextLink
              key={p.slug}
              href={p.route}
              className="fd-nav-link hover"
              aria-current={p.slug === current ? 'page' : undefined}
            >
              {p.title}
            </NextLink>
          ))}
        </Fragment>
      ))}
      <CurrentIntoView />
    </nav>
  )
}

/** The breadcrumb: the site, the section, and the shown page when it is not the index. */
export function Crumbs({ title }: { title?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="fd-crumbs">
      <NextLink href="/" className="link fd-crumb">
        Perron
      </NextLink>
      <span aria-hidden="true">/</span>
      {title ? (
        <>
          <NextLink href={INDEX.href} className="link fd-crumb">
            Foundations
          </NextLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </>
      ) : (
        <span aria-current="page">Foundations</span>
      )}
    </nav>
  )
}

interface Stop {
  label: string
  href: string
}

/** The stops before and after a foundation page, or the index when `slug` is empty. */
function neighbours(slug: string): [Stop | undefined, Stop | undefined] {
  const section = SECTIONS.findIndex((s) => s.href === INDEX.href)
  const stops: Stop[] = [
    ...(section > 0 ? [SECTIONS[section - 1]] : []),
    INDEX,
    ...orderedFoundations().map((p) => ({ label: p.title, href: p.route })),
    ...(SECTIONS[section + 1] ? [SECTIONS[section + 1]] : []),
  ]
  const at = stops.findIndex((s) => s.href === (slug ? `${INDEX.href}/${slug}` : INDEX.href))
  // the index leads on to the next section, as the header orders them, past its own pages
  if (!slug) return [stops[at - 1], SECTIONS[section + 1]]
  return [stops[at - 1], stops[at + 1]]
}

/** Previous and next, at the foot of a page. */
export function PageNav({ slug = '' }: { slug?: string }) {
  const [previous, next] = neighbours(slug)
  return (
    <nav aria-label="Pages" className="fd-pages">
      {previous ? (
        <NextLink href={previous.href} className="fd-page-link hover">
          <span className="fd-page-dir">Previous</span>
          <span className="fd-page-name">{previous.label}</span>
        </NextLink>
      ) : (
        <span />
      )}
      {next ? (
        <NextLink href={next.href} className="fd-page-link fd-page-next hover">
          <span className="fd-page-dir">Next</span>
          <span className="fd-page-name">{next.label}</span>
        </NextLink>
      ) : null}
    </nav>
  )
}
