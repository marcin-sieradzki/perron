// The docs search's matching, run in the browser on the index website/lib/search-index.ts builds:
// which entries the typed words find, best first. Plain functions, with no React, so the index's
// unit test covers them too.
import type { SearchEntry } from '../../lib/search-index.ts'

/** Words compared without case or accents, with runs of space as one: "Nørreport  St." reads "nørreport st.". */
export function fold(words: string) {
  return words.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * How well an entry matches, lower first, or undefined when it doesn't: the whole query as the
 * title, then at its start, then anywhere in it, then every word somewhere in the title, then every
 * word in the title or the page or section around it, with at least one in the title.
 */
function rank(entry: SearchEntry, query: string, words: string[]) {
  const title = fold(entry.title)
  if (title === query) return 0
  if (title.startsWith(query)) return 1
  if (title.includes(query)) return 2
  if (words.every((w) => title.includes(w))) return 3
  const around = fold(entry.page ?? entry.section)
  if (
    words.some((w) => title.includes(w)) &&
    words.every((w) => title.includes(w) || around.includes(w))
  )
    return 4
  return undefined
}

/**
 * The entries the query finds, best first: by how well each matches, a page before a heading that
 * matches as well, then in the index's order, which is the header's order of sections. An empty
 * query finds nothing.
 */
export function searchEntries(index: readonly SearchEntry[], query: string): SearchEntry[] {
  const q = fold(query)
  if (!q) return []
  const words = q.split(' ')
  const found: { entry: SearchEntry; score: number; at: number }[] = []
  index.forEach((entry, at) => {
    const r = rank(entry, q, words)
    if (r !== undefined) found.push({ entry, score: r * 2 + (entry.page ? 1 : 0), at })
  })
  return found.sort((a, b) => a.score - b.score || a.at - b.at).map((f) => f.entry)
}
