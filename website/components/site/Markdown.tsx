// A doc's markdown on the site: every element in a type role (site.css, under .markdown), code in
// the data family, tables in a sideways-scrolling frame, task lists as plain lists, a repo image
// inlined, and every link rewritten by website/lib/routes.ts: a doc the site shows to its route,
// any other repo file to GitHub. A leading `#` heading is dropped, since the page's PageHeader
// shows the title. Its headings' ids are markdown-to-jsx's, which lib/anchors.ts reads for the docs
// search. A server component: it compiles the markdown at build time.
import { compiler, type MarkdownToJSX } from 'markdown-to-jsx/react'
import NextLink from 'next/link'
import type { ComponentProps } from 'react'
import { Link } from '@/components/perron'
import { withoutLeadingTitle } from '../../lib/anchors.ts'
import { assetSrc, siteHref } from '../../lib/routes.ts'

export interface MarkdownProps {
  /** The markdown, such as a Doc's `body` or one prose segment of a foundation page */
  source: string
  /** The file it comes from, by path from the repo root, which its relative links start from */
  path: string
  /** Renders phrasing content only, with no paragraph around it: for a lead or a table cell */
  inline?: boolean
}

function MarkdownLink({ href = '', from, ...rest }: ComponentProps<'a'> & { from: string }) {
  const to = siteHref(href, from)
  const { children } = rest
  if (to.startsWith('/')) return <Link render={<NextLink href={to} />}>{children}</Link>
  return <Link href={to}>{children}</Link>
}

function MarkdownImage({ src, alt = '', from }: ComponentProps<'img'> & { from: string }) {
  // a repo file inlined as a data URL: next/image adds nothing to it
  return <img src={typeof src === 'string' ? assetSrc(src, from) : undefined} alt={alt} />
}

function Table(props: ComponentProps<'table'>) {
  return (
    <div className="scroll-x markdown-table">
      <table {...props} />
    </div>
  )
}

/**
 * A task list's box, `- [ ]`, drawn as nothing, so the item reads as a plain list item. The specs'
 * checklists say how each rule is met, so a box would show a stable component's list unticked, and
 * a page is no form: a checkbox there would be a focusable, unlabelled control.
 */
function TaskBox() {
  return null
}

export function Markdown({ source, path, inline = false }: MarkdownProps) {
  const options: MarkdownToJSX.Options = {
    overrides: {
      a: { component: MarkdownLink, props: { from: path } },
      img: { component: MarkdownImage, props: { from: path } },
      table: Table,
      input: TaskBox,
    },
    wrapper: null,
    ...(inline ? { forceInline: true } : { forceBlock: true }),
  }
  const content = compiler(inline ? source : withoutLeadingTitle(source), options)
  return inline ? <>{content}</> : <div className="markdown">{content}</div>
}
