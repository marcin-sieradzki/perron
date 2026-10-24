// One guideline page in Storybook: the prose of its markdown file, with each table block drawn
// live from the token custom properties, in Perron's own type and colours.
import { Unstyled } from '@storybook/addon-docs/blocks'
import Markdown from 'markdown-to-jsx/react'
import { useEffect, useState, type AnchorHTMLAttributes } from 'react'
import pages from 'virtual:perron/pages'
import type { Page, Segment } from '../../scripts/lib/pages.ts'
import { ContrastTable } from './ContrastTable.tsx'
import { IconGallery, LogoGallery } from './Gallery.tsx'
import { TokenTable } from './TokenTable.tsx'
import './perron-docs.css'
import '@mylder/perron/perron.css'

type Theme = 'light' | 'dark'
const STORE = 'perron-docs-theme'

/** The Storybook docs id of a page, from the title its MDX file gives it. */
export const docsId = (page: Page) =>
  `${page.group}-${page.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '--docs'

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORE)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // storage blocked: follow the system
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** A link to another page's markdown file opens that page in Storybook. */
export function Link({ href = '', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const m = /^(?:\.\.\/)?([\w/-]+\.md)(#[\w-]+)?$/.exec(href)
  if (!m) {
    const external = /^https?:/.test(href)
    return (
      <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...props} />
    )
  }
  const target = pages.find((p) => p.path.endsWith(`/${m[1]}`))
  if (!target) return <a href={href} {...props} />
  return <a href={`./?path=/docs/${docsId(target)}`} target="_top" {...props} />
}

function Block({ segment }: { segment: Segment }) {
  switch (segment.kind) {
    case 'prose':
      return (
        <Markdown options={{ overrides: { a: Link }, disableParsingRawHTML: false }}>
          {segment.markdown}
        </Markdown>
      )
    case 'tokens':
      return <TokenTable {...segment} />
    case 'contrast':
      return <ContrastTable {...segment} />
    case 'icons':
      return <IconGallery categories={segment.categories} />
    case 'logos':
      return <LogoGallery categories={segment.categories} />
  }
}

export function FoundationPage({ path }: { path: string }) {
  const page = pages.find((p) => p.path === path)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORE, theme)
    } catch {
      // the choice lasts this visit only
    }
  }, [theme])
  if (!page) throw new Error(`No guideline page at ${path}`)
  return (
    <Unstyled>
      <div className="pd-page">
        <div className="pd-theme" role="group" aria-label="Theme">
          {(['light', 'dark'] as const).map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>
              {t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
        {page.segments.map((s, i) => (
          <Block key={i} segment={s} />
        ))}
      </div>
    </Unstyled>
  )
}
