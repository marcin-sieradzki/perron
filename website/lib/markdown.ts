// A doc's markdown in the pieces a page shows: its title, its intro paragraph, the body under the
// title, and its sections by heading. The headings come from the MCP server's own reader, so the
// site and `search_docs` split a page the same way.
import { sections, type Section } from '../../packages/mcp/src/markdown.ts'
import { readRepoFile } from './repo.ts'

export { sections, type Section }

export interface Doc {
  /** Path from the repo root, such as `docs/foundations/motion.md` */
  path: string
  /** The page's `#` heading */
  title: string
  /** The first paragraph under the title, as markdown: the page's lead */
  intro: string
  /** Everything under the title, as markdown */
  body: string
  /** The whole file */
  markdown: string
}

const TITLE = /^# (.+)$/m

/** The page's `#` heading, or an error naming the file without one. */
export function docTitle(markdown: string, path = 'the page') {
  const m = TITLE.exec(markdown)
  if (!m) throw new Error(`${path} has no # heading`)
  return m[1].trim()
}

/** The markdown with its `#` heading line removed, as a page shows it under its own title. */
export function stripTitle(markdown: string) {
  return markdown.replace(TITLE, '').trim()
}

/**
 * The first paragraph of the markdown, past the `#` heading: the first run of lines that is not a
 * heading, a list, a table, a quote, a fence or an HTML comment, joined into one line.
 */
export function firstParagraph(markdown: string) {
  const blocks = stripTitle(markdown).split(/\n\s*\n/)
  const prose = blocks.find((b) => {
    const t = b.trim()
    return t && !/^(#|[-*+] |\d+\. |\||>|```|~~~|<!--)/.test(t)
  })
  return (prose ?? '').trim().replace(/\s*\n\s*/g, ' ')
}

/**
 * The text of the section headed `heading` (at any level), without its heading line, or undefined
 * when the page has no such heading.
 */
export function sectionBody(markdown: string, heading: string) {
  const s = sections(markdown).find((x) => x.heading === heading)
  return s?.text.replace(/^#{1,6} .*\n?/, '').trim()
}

/** A markdown table: its header's names, as written, and its body rows keyed by them. */
export interface Table {
  head: string[]
  rows: Record<string, string>[]
}

/** A table row's cells, split on the pipes a cell does not escape. */
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replaceAll('\\|', '|'))

const SEPARATOR = /^\|[\s:|-]+\|$/

/** Every table in the markdown, in order: a header row, its separator, then the rows under it. */
export function tables(markdown: string): Table[] {
  const lines = markdown.split('\n').map((l) => l.trim())
  const out: Table[] = []
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].startsWith('|') || !SEPARATOR.test(lines[i + 1])) continue
    const head = cells(lines[i])
    const rows: Record<string, string>[] = []
    for (i += 2; i < lines.length && lines[i].startsWith('|'); i++) {
      const row = cells(lines[i])
      rows.push(Object.fromEntries(head.map((h, c) => [h, row[c] ?? ''])))
    }
    out.push({ head, rows })
  }
  return out
}

/** The first table in the markdown, or an empty one when it has none. */
export const firstTable = (markdown: string): Table => tables(markdown)[0] ?? { head: [], rows: [] }

/** A doc read from the repo, in the pieces above. */
export function readDoc(path: string): Doc {
  const markdown = readRepoFile(path)
  return {
    path,
    title: docTitle(markdown, path),
    intro: firstParagraph(markdown),
    body: stripTitle(markdown),
    markdown,
  }
}

/* Fenced code */

/** A fence's opening line: up to three spaces, three or more backticks or tildes, an info string. */
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/
/** A fence's closing line: the same run, as long or longer, and nothing after it. */
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})\s*$/

/** A run of whole lines of markdown, inside a fenced code block or outside every one. */
export interface Span {
  text: string
  fenced: boolean
}

/**
 * The markdown as runs of lines, each fenced code block a span of its own, fences included, as
 * CommonMark reads them: a backtick fence's info string has no backtick (```` ```js``` ```` is
 * inline code), and an unclosed fence runs to the end. Joined with line breaks, the spans are the
 * markdown again.
 */
export function fenceSpans(markdown: string): Span[] {
  const spans: Span[] = []
  let lines: string[] = []
  let fence = ''
  const end = (fenced: boolean) => {
    if (lines.length) spans.push({ text: lines.join('\n'), fenced })
    lines = []
  }
  for (const line of markdown.split('\n')) {
    if (!fence) {
      const m = FENCE_OPEN.exec(line)
      if (m && !(m[1][0] === '`' && m[2].includes('`'))) {
        end(false)
        fence = m[1]
      }
      lines.push(line)
    } else {
      lines.push(line)
      const m = FENCE_CLOSE.exec(line)
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) {
        end(true)
        fence = ''
      }
    }
  }
  end(Boolean(fence))
  return spans
}

/** The markdown with `edit` applied to each span outside fenced code, the code left as it is. */
export const outsideFences = (markdown: string, edit: (prose: string) => string) =>
  fenceSpans(markdown)
    .map((s) => (s.fenced ? s.text : edit(s.text)))
    .join('\n')

/* Character references */

const NAMED: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' }

/**
 * Text with its numeric character references decoded, `&#x27;` and `&#39;` as `'`, each character
 * through `as`; with `named`, also the named ones HTML escapes with: `&amp;`, `&quot;`, `&apos;`,
 * `&lt;` and `&gt;`.
 */
export function decodeEntities(
  text: string,
  { named = false, as = (c: string) => c }: { named?: boolean; as?: (c: string) => string } = {},
) {
  // one pass, so `&#38;amp;` reads `&amp;`, not `&`
  return text.replace(
    /&#x([0-9a-f]+);|&#(\d+);|&(amp|quot|apos|lt|gt);/gi,
    (ref, hex?: string, dec?: string, name?: string) => {
      if (name) return named ? NAMED[name.toLowerCase()] : ref
      return as(String.fromCodePoint(hex ? Number.parseInt(hex, 16) : Number(dec)))
    },
  )
}
