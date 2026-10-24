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

/**
 * The `##` sections that match the most words of `query`, best first. A word in a heading counts
 * more than one in the text.
 */
export function searchDocs(pages: DocPage[], query: string, limit = 3): DocHit[] {
  const words = query
    .toLowerCase()
    .split(/\W+/u)
    .filter((w) => w.length > 1)
  const count = (text: string, w: string) => text.split(w).length - 1
  return pages
    .flatMap((p) =>
      sections(p.markdown)
        .filter((s) => s.level === 2)
        .map((s) => {
          const heading = `${p.title} ${s.heading}`.toLowerCase()
          const text = s.text.toLowerCase()
          const found = words.filter((w) => heading.includes(w) || text.includes(w))
          const score = words.reduce((n, w) => n + 5 * count(heading, w) + count(text, w), 0)
          return {
            hit: { path: p.path, page: p.title, heading: s.heading, text: s.text },
            found,
            score,
          }
        }),
    )
    .filter((r) => r.found.length)
    .sort((a, b) => b.found.length - a.found.length || b.score - a.score)
    .slice(0, limit)
    .map((r) => r.hit)
}
