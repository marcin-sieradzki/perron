// Foundations, the index of Foundations.dc.html: the sidebar of every foundation page, the brand's
// values, one tile per page drawn from its own tokens, the pages only a live map needs, and how to
// use the tokens. Everything is read from docs/foundations/ and the token data at build time.
import type { Metadata } from 'next'
import {
  foundationGroups,
  groupId,
  introOf,
  plain,
  sentences,
} from '@/components/foundations/data.ts'
import { BrandValues, TokenMeta, UsingTheTokens } from '@/components/foundations/IndexParts.tsx'
import { Crumbs, FoundationsNav, PageNav } from '@/components/foundations/Navigation.tsx'
import { FoundationTile } from '@/components/foundations/Tiles.tsx'
import '@/components/foundations/foundations.css'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { readContents } from '@/lib/foundations.ts'

export const metadata: Metadata = {
  title: 'Foundations',
  description:
    'The values every Mylder screen is built from: colour, type, space, motion, the map and the words.',
}

export default function FoundationsPage() {
  const [main, ...more] = foundationGroups()
  // the Contents page opens on what Perron is; the page's lead starts at what the map is
  const intro = sentences(plain(introOf(readContents()))).slice(1)
  return (
    <div className="page fd-layout">
      <FoundationsNav />
      <div className="fd-main">
        <div className="fd-head">
          <Crumbs />
          <PageHeader
            title="Foundations"
            actions={<TokenMeta />}
            lead={`${intro.join(' ')} Each tile below is drawn from the tokens themselves: switch the theme and every one of them follows.`}
          />
        </div>
        <BrandValues />
        <section aria-label="Foundation pages" className="fd-tiles">
          {main.pages.map((page) => (
            <FoundationTile key={page.slug} page={page} />
          ))}
        </section>
        {more.map((group, i) => (
          <section key={group.label} aria-labelledby={groupId(i)} className="fd-group">
            <h2 id={groupId(i)} className="fd-section-title">
              {group.label}
            </h2>
            <div className="fd-tiles">
              {group.pages.map((page) => (
                <FoundationTile key={page.slug} page={page} />
              ))}
            </div>
          </section>
        ))}
        <UsingTheTokens />
        <PageNav />
      </div>
    </div>
  )
}
