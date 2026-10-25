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
