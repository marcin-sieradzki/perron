// A foundation page's body: its prose through Markdown, and each table block drawn from its rows,
// as scripts/lib/pages.ts splits the page. The title and the intro are left out of the first prose
// segment, since the page header shows them.
import { Markdown } from '@/components/site/Markdown.tsx'
import type { FoundationPage, Segment } from '@/lib/foundations.ts'
import { ContrastBlock } from './ContrastBlock.tsx'
import { introOf, withoutIntro } from './data.ts'
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
  const intro = introOf(page)
  return (
    <div className="fd-body">
      {page.segments.map((segment, i) => (
        <Block
          key={i}
          path={page.path}
          segment={
            i === 0 && segment.kind === 'prose'
              ? { kind: 'prose', markdown: withoutIntro(segment.markdown, intro) }
              : segment
          }
        />
      ))}
    </div>
  )
}
