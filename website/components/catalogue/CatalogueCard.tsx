// One stable component's card on the components index: its previews, drawn by the shipped
// component, over its name, which links to its spec page. The whole card is the link, as in
// Components.dc.html: the name's link stretches over the card, and the previews are inert, so a
// card is one tab stop and a click never lands on a control or opens a layer.
import { Fragment } from 'react'
import NextLink from 'next/link'
import type { RegistryEntry } from '../../lib/registry.ts'
import { getPreview, hasPreview } from '@/previews/index.ts'
import { cardLayout, cardSamples } from './samples.tsx'

export function CatalogueCard({ entry }: { entry: RegistryEntry }) {
  const drawings = hasPreview(entry.name)
    ? cardSamples(entry.name).map((props, i) => (
        <Fragment key={i}>{getPreview(entry.name, props)}</Fragment>
      ))
    : null
  return (
    <article className="catalogue-card lift">
      <div className="catalogue-preview" data-layout={cardLayout(entry.name)} inert>
        {drawings}
      </div>
      <h3 className="catalogue-card-title">
        {entry.route ? (
          <NextLink href={entry.route} className="catalogue-card-link">
            {entry.name}
          </NextLink>
        ) : (
          entry.name
        )}
      </h3>
    </article>
  )
}
