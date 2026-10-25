// The places on a page a link can land on, each with the words that name it and the id the page
// gives it, kept in one place so the pages and the docs search (search-index.ts) never disagree.
// Every id made from words goes through `slug`, markdown-to-jsx's own, and a doc's headings take
// their ids from markdown-to-jsx's parser, the one Markdown renders with, so a repeat's `-1` and an
// underscore dropped from `list_tokens` come out as the page writes them. `deadAnchors` checks the
// built pages against the search's links (scripts/check-anchors.ts).
import { parser, RuleType, slugify, type MarkdownToJSX } from 'markdown-to-jsx'
import type { Segment } from './foundations.ts'
import { decodeEntities } from './markdown.ts'

export interface Anchor {
  /** The words a reader sees: a heading or a section's name */
  title: string
  /** The id the page gives it, without the `#` */
  id: string
}

export interface Heading extends Anchor {
  /** 2 for `##` */
  level: number
}

/** Words as an id, as Markdown's headings take them: `Do and don't` as `do-and-dont`. */
export const slug = (words: string) => slugify(words)

/** A leading `#` title line, which Markdown drops, since the page's header shows the title. */
const LEADING_TITLE = /^\s*# [^\n]*\n?/

/** A doc's markdown as Markdown renders it in a block: without its leading `#` title. */
export const withoutLeadingTitle = (source: string) => source.replace(LEADING_TITLE, '')

/** The words of parsed markdown: text and code as written, links and emphasis by their words. */
function textOf(nodes: MarkdownToJSX.ASTNode[]): string {
  return nodes
    .map((n) => {
      if ('children' in n && Array.isArray(n.children)) return textOf(n.children)
      return 'text' in n && typeof n.text === 'string' ? n.text : ''
    })
    .join('')
}

/** Every heading among parsed nodes, in order, nested ones too: in a list item or a quote. */
function headingNodes(nodes: unknown[]): MarkdownToJSX.HeadingNode[] {
  return nodes.flatMap((n): MarkdownToJSX.HeadingNode[] => {
    if (Array.isArray(n)) return headingNodes(n)
    if (!n || typeof n !== 'object') return []
    const node = n as MarkdownToJSX.ASTNode
    if (node.type === RuleType.heading) return [node]
    return headingNodes(Object.values(node).filter(Array.isArray))
  })
}

/**
 * The headings Markdown renders for `source` in one block, in order, each with the id it gives
 * it. A page that renders a doc in pieces reads each piece's headings, since a repeat's suffix
 * counts within one piece.
 */
export function markdownHeadings(source: string): Heading[] {
  return headingNodes(parser(withoutLeadingTitle(source), { forceBlock: true })).map((n) => ({
    level: n.level,
    title: textOf(n.children).trim(),
    id: n.id,
  }))
}

/* Get started and Agents */

/** Get started's steps, in order. */
export const GET_STARTED_STEPS = [
  { id: 'install', title: 'Install and load Perron' },
  { id: 'component', title: 'Use a first component' },
  { id: 'tokens', title: 'Use the tokens' },
  { id: 'mcp', title: 'Add the MCP server' },
] as const satisfies readonly Anchor[]

/** The Agents page's sections. */
export const AGENTS_SECTIONS = {
  setup: { id: 'setup', title: 'Set it up' },
  tools: { id: 'tools', title: 'Tools' },
  sources: { id: 'sources', title: 'Where the answers come from' },
} as const satisfies Record<string, Anchor>

/** A tool's card on the Agents page: `list-tokens` for `list_tokens`. */
export const toolAnchor = (name: string) => name.replaceAll('_', '-')

/** The Agents page's places, in order: its sections, with each tool's card under Tools. */
export function agentsAnchors(tools: readonly string[]): Anchor[] {
  const { setup, tools: section, sources } = AGENTS_SECTIONS
  return [setup, section, ...tools.map((name) => ({ title: name, id: toolAnchor(name) })), sources]
}

/* Foundations */

/** The Foundations index's sections that carry a name of their own. */
export const FOUNDATIONS_SECTIONS = {
  brand: { id: 'the-brand', title: 'The brand' },
  using: { id: 'using-the-tokens', title: 'Using the tokens' },
} as const satisfies Record<string, Anchor>

/** The heading id of the Foundations index's group after the main tiles, by its place. */
export const groupId = (i: number) => `fd-group-${i}`

/**
 * The Foundations index's places, in order: the brand, each group past the main one (the first,
 * which has no heading), and using the tokens.
 */
export function foundationsAnchors(groups: readonly { label?: string }[]): Anchor[] {
  const [, ...more] = groups
  return [
    FOUNDATIONS_SECTIONS.brand,
    ...more.map((g, i) => ({ title: g.label ?? '', id: groupId(i) })),
    FOUNDATIONS_SECTIONS.using,
  ]
}

/** A gallery category's heading id: `fd-icons-public-transport` for Public transport. */
export const galleryId = (kind: 'icons' | 'logos', category: string) =>
  `fd-${kind}-${slug(category)}`

/**
 * The headings a foundation page's body draws, from its segments as the body renders them: each
 * prose segment's, as Markdown renders it, and each gallery's categories.
 */
export function bodyHeadings(segments: readonly Segment[]): Heading[] {
  return segments.flatMap((s): Heading[] => {
    if (s.kind === 'prose') return markdownHeadings(s.markdown)
    if (s.kind === 'icons' || s.kind === 'logos')
      return s.categories.map((c) => ({ level: 3, title: c.name, id: galleryId(s.kind, c.name) }))
    return []
  })
}

/* Release log */

/** The Release log's anchor for a package's version, `perron-mcp-0-1-1`, or its log, with `log`. */
export const releaseAnchor = (name: string, version: string) =>
  `${name.replace(/^@mylder\//, '')}-${version}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase()

/* Checking the built pages */

/** Every `id` in a page's HTML, its character references decoded. */
export function idsIn(html: string) {
  return new Set(
    [...html.matchAll(/\sid="([^"]*)"/g)].map((m) => decodeEntities(m[1], { named: true })),
  )
}

/** A fragment percent-decoded, or as it is when an escape is malformed. */
function percentDecoded(fragment: string) {
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}

/**
 * The links in `hrefs` that land nowhere: a route with no page, or an `#anchor` its page has no
 * id for. A link is read as a browser reads it: parsed as a URL, which escapes what a fragment
 * cannot hold, then matched to an id as written or percent-decoded. `idsOf` gives a route's ids,
 * or undefined when the route has no page.
 */
export function deadAnchors(
  hrefs: readonly string[],
  idsOf: (route: string) => ReadonlySet<string> | undefined,
) {
  return hrefs.filter((href) => {
    const url = new URL(href, 'https://site.invalid')
    const ids = idsOf(url.pathname)
    if (!ids) return true
    const fragment = url.hash.slice(1)
    return Boolean(fragment) && !ids.has(fragment) && !ids.has(percentDecoded(fragment))
  })
}
