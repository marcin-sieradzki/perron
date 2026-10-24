// Prose from a component's spec on its docs page, drawn live from `docs/components/<name>.md` (or
// `docs/patterns/<name>.md`), so the page follows the spec without a copy: its intro, or the
// sections named, each under its heading.
import { Unstyled } from '@storybook/addon-docs/blocks'
import Markdown from 'markdown-to-jsx/react'
import pages from 'virtual:perron/pages'
import { specProse } from './component-page.ts'
import { Link } from './FoundationPage.tsx'
import './perron-docs.css'

export function SpecProse({
  path,
  intro,
  sections = [],
}: {
  path: string
  intro?: boolean
  sections?: string[]
}) {
  const page = pages.find((p) => p.path === path)
  if (!page) throw new Error(`No spec page at ${path}; is its entry past designing?`)
  const markdown = page.segments
    .flatMap((s) => (s.kind === 'prose' ? [s.markdown] : []))
    .join('\n\n')
  return (
    <Unstyled>
      <div className="pd-page">
        <Markdown options={{ overrides: { a: Link }, disableParsingRawHTML: false }}>
          {specProse(markdown, intro ? 'intro' : sections)}
        </Markdown>
      </div>
    </Unstyled>
  )
}
