// A foundation page's body: its prose through Markdown, and each table block drawn from its rows,
// as scripts/lib/pages.ts splits the page. The title and the intro are left out of the first prose
// segment, since the page header shows them (bodySegments, which the docs search reads too).
import { Markdown } from '@/components/site/Markdown.tsx'
import type { FoundationPage, Segment } from '@/lib/foundations.ts'
import { ContrastBlock } from './ContrastBlock.tsx'
import { bodySegments } from './data.ts'
import { IconGallery, LogoGallery } from './Galleries.tsx'
import { TokenBlock } from './TokenBlock.tsx'

function Block({ segment, path }: { segment: Segment; path: string }) {
  switch (segment.kind) {
    case 'prose':
      return segment.markdown.trim() ? <Markdown source={segment.markdown} path={path} /> : null
    case 'tokens':
      return <TokenBlock themes={segment.themes} contexts={segment.contexts} rows={segment.rows} />
    case 'contrast':
      return (
        <ContrastBlock
          minimum={segment.minimum}
          themes={segment.themes}
          backgrounds={segment.backgrounds}
          rows={segment.rows}
        />
      )
    case 'icons':
      return <IconGallery categories={segment.categories} />
    case 'logos':
      return <LogoGallery categories={segment.categories} />
  }
}

export function FoundationBody({ page }: { page: FoundationPage }) {
  return (
    <div className="fd-body">
      {bodySegments(page).map((segment, i) => (
        <Block key={i} path={page.path} segment={segment} />
      ))}
    </div>
  )
}
