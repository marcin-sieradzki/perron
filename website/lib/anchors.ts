// The places on a page a link can land on, each with the words that name it and the id the page
// gives it, kept in one place so the page and the docs search (search-index.ts) never disagree. A
// doc's headings take their ids from markdown-to-jsx's own parser, the one Markdown renders with,
// so a repeat's `-1` and an underscore dropped from `list_tokens` come out as the page writes them.
// `deadAnchors` checks the built pages against the search's links (scripts/check-anchors.ts).
import { parser, RuleType, type MarkdownToJSX } from 'markdown-to-jsx'

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

/**
 * The headings Markdown renders for `source` in one block, in order, each with the id it gives
 * it. A page that renders a doc in pieces reads each piece's headings, since a repeat's suffix
 * counts within one piece.
 */
export function markdownHeadings(source: string): Heading[] {
  return parser(withoutLeadingTitle(source), { forceBlock: true }).flatMap((n) =>
    n.type === RuleType.heading
      ? [{ level: n.level, title: textOf(n.children).trim(), id: n.id }]
      : [],
  )
}

/* The pages that name their own sections */

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

/* Checking the built pages */

/** Every `id` in a page's HTML, its character references decoded. */
export function idsIn(html: string) {
  const decode = (s: string) =>
    s
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
      .replaceAll('&quot;', '"')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&amp;', '&')
  return new Set([...html.matchAll(/\sid="([^"]*)"/g)].map((m) => decode(m[1])))
}

/**
 * The links in `hrefs` that land nowhere: a route with no page, or an `#anchor` its page has no
 * id for. `idsOf` gives a route's ids, or undefined when the route has no page.
 */
export function deadAnchors(
  hrefs: readonly string[],
  idsOf: (route: string) => ReadonlySet<string> | undefined,
) {
  return hrefs.filter((href) => {
    const at = href.indexOf('#')
    const ids = idsOf(at < 0 ? href : href.slice(0, at))
    if (!ids) return true
    if (at < 0) return false
    let id = href.slice(at + 1)
    try {
      id = decodeURIComponent(id)
    } catch {
      // a malformed escape is matched as written
    }
    return !ids.has(id)
  })
}
