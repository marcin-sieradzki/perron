// search_docs: the sections of Perron's pages (the foundations, content design and the glossary)
// that best match a query, from the data @mylder/perron ships.
import { sections } from './markdown.ts'

export interface DocPage {
  path: string
  title: string
  group: string
  markdown: string
}

export interface DocHit {
  path: string
  page: string
  heading: string
  text: string
}

/** Words too common to tell one section from another. */
const STOP = new Set(
  'a an and are as at be by can do does for from how i in is it of on or should the to what when where which who why with'.split(
    ' ',
  ),
)

/** A query's words, in any script, lowercased and without the common ones. */
const wordsOf = (query: string) =>
  query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 1 && !STOP.has(w))

/** A page as search units: its opening, under the page title, then each `##` section. */
function units(p: DocPage) {
  const all = sections(p.markdown)
  const first = all.find((s) => s.level === 2)
  const opening = first ? p.markdown.slice(0, p.markdown.indexOf(first.text)) : p.markdown
  return [
    { heading: p.title, text: opening.trim() },
    ...all.filter((s) => s.level === 2).map((s) => ({ heading: s.heading, text: s.text })),
  ].filter((u) => u.text)
}

/**
 * The sections that match the most words of `query`, best first. A word in a heading counts more
 * than one in the text.
 */
export function searchDocs(pages: DocPage[], query: string, limit = 3): DocHit[] {
  const words = wordsOf(query)
  const count = (text: string, w: string) => text.split(w).length - 1
  return pages
    .flatMap((p) =>
      units(p).map((u) => {
        const heading = `${p.title} ${u.heading}`.toLowerCase()
        const text = u.text.toLowerCase()
        const found = words.filter((w) => heading.includes(w) || text.includes(w))
        const score = words.reduce((n, w) => n + 5 * count(heading, w) + count(text, w), 0)
        return { hit: { path: p.path, page: p.title, ...u }, found, score }
      }),
    )
    .filter((r) => r.found.length)
    .sort((a, b) => b.found.length - a.found.length || b.score - a.score)
    .slice(0, limit)
    .map((r) => r.hit)
}
