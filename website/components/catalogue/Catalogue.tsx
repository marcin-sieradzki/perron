'use client'
// The components index's body, from Components.dc.html: a glass sidebar over the map with the
// filter and the categories, then each category's cards and the components still in design. The
// filter is the only state: it narrows the cards by name, and the sidebar with them, so each
// category it lists has a section to land on and counts what that section shows. The cards come
// drawn from the server.
import { Fragment, useState, type ReactNode } from 'react'
import { EmptyState, Separator, TextField } from '@mylder/perron'
import './catalogue.css'

export interface CatalogueSection {
  /** The section's anchor, `actions` */
  id: string
  category: string
  /** One card per stable component, by name, already drawn */
  cards: { name: string; card: ReactNode }[]
  /** The names of the components still designing */
  designing: string[]
}

export interface CatalogueLink {
  label: string
  href: string
  count?: number
}

export interface CatalogueProps {
  /** The page's header, above the sections */
  intro: ReactNode
  sections: CatalogueSection[]
  /** How many stable components the index shows */
  total: number
  /** Links to the rest of the system, under the categories */
  more: CatalogueLink[]
  /** The search icon, for the empty result */
  searchIcon: ReactNode
}

const list = new Intl.ListFormat('en-GB', { type: 'conjunction' })

/** The components a category still has in design, named but never drawn. */
function InDesign({ names, after }: { names: string[]; after: boolean }) {
  const one = names.length === 1
  return (
    <div className="catalogue-designing">
      <span className="catalogue-designing-title">
        {names.length} {after ? 'more ' : ''}in design
      </span>
      <span className="catalogue-designing-text">
        {list.format(names)} {one ? 'joins' : 'join'} this list once {one ? 'it’s' : 'they’re'}{' '}
        built.
      </span>
    </div>
  )
}

export function Catalogue({ intro, sections, total, more, searchIcon }: CatalogueProps) {
  const [query, setQuery] = useState('')
  const words = query.trim().toLocaleLowerCase('en')
  const matches = (name: string) => name.toLocaleLowerCase('en').includes(words)
  const shown = sections
    .map((s) => ({
      ...s,
      cards: words ? s.cards.filter((c) => matches(c.name)) : s.cards,
      designing: words ? s.designing.filter(matches) : s.designing,
    }))
    .filter((s) => s.cards.length > 0 || s.designing.length > 0)
  const count = words ? shown.reduce((n, s) => n + s.cards.length, 0) : total

  return (
    <div className="catalogue">
      <aside aria-label="Components" className="catalogue-sidebar glass">
        <TextField
          label="Filter components"
          hiddenLabel
          placeholder="Filter components"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <nav aria-label="Categories" className="catalogue-nav">
          <a href="#main" aria-current="page" className="catalogue-nav-link">
            Overview <span className="catalogue-nav-count">{count}</span>
          </a>
          {shown.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="catalogue-nav-link hover">
              {s.category} <span className="catalogue-nav-count">{s.cards.length}</span>
            </a>
          ))}
        </nav>
        <Separator />
        <nav aria-label="More" className="catalogue-nav">
          {more.map((link) => (
            <a key={link.href} href={link.href} className="catalogue-nav-link hover">
              {link.label}
              {link.count === undefined ? null : (
                <span className="catalogue-nav-count">{link.count}</span>
              )}
            </a>
          ))}
        </nav>
      </aside>

      <div className="catalogue-main">
        {intro}
        {shown.map((s) => (
          <section
            key={s.id}
            id={s.id}
            aria-labelledby={`${s.id}-title`}
            className="catalogue-group"
          >
            <h2 id={`${s.id}-title`} className="catalogue-group-title">
              {s.category} <span className="catalogue-group-count">{s.cards.length}</span>
            </h2>
            <div className="catalogue-grid">
              {s.cards.map((c) => (
                <Fragment key={c.name}>{c.card}</Fragment>
              ))}
              {s.designing.length > 0 ? (
                <InDesign names={s.designing} after={s.cards.length > 0} />
              ) : null}
            </div>
          </section>
        ))}
        {shown.length === 0 ? (
          <EmptyState icon={searchIcon} title={`No components match “${query.trim()}”`}>
            Try a name such as Button.
          </EmptyState>
        ) : null}
      </div>
    </div>
  )
}
