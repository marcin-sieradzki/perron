// list_components and get_component: Perron's components and patterns from the data
// @mylder/perron ships, found by words, layer and category, or by name.
import { wordsOf } from './docs.ts'

/** A component or pattern as the data holds it: what get_component answers. */
export interface ComponentRecord {
  name: string
  layer: 'component' | 'pattern'
  category: string
  status: 'building' | 'stable' | 'deprecated'
  replacedBy?: string
  summary: string
  import: string
  whenToUse: string
  alternatives: { name: string; when: string }[]
  props: {
    name: string
    type: string
    optional: boolean
    default?: string
    description: string
    deprecated?: string
  }[]
  rules: {
    id: string
    level: 'must' | 'should'
    do: string
    dont: string
    checkedBy: 'types' | 'review'
  }[]
  agentNotes: string[]
  docs: string
}

/** A record as list_components answers it: what it is, and its successor when deprecated. */
export const listed = (r: ComponentRecord) => ({
  name: r.name,
  layer: r.layer,
  category: r.category,
  status: r.status,
  ...(r.replacedBy && { replacedBy: r.replacedBy }),
  summary: r.summary,
})

/** A word as it is compared: `settings` and `setting` are one word. */
const stem = (w: string) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w)

/** `LinkButton` → `link button`, so a query for "button" finds it. */
const spaced = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')

/**
 * The records of `layer` and `category`, if given, that hold a word of `query` in their name,
 * category, summary or when to use them, best first: a word few records hold counts for more than
 * one most of them do, a word of the name breaks a tie, then the registry's order. With no query,
 * all of them in that order.
 */
export function listComponents(
  records: ComponentRecord[],
  query = '',
  layer?: string,
  category?: string,
) {
  const kept = records.filter(
    (r) =>
      (!layer || r.layer === layer) &&
      (!category || r.category.toLowerCase() === category.trim().toLowerCase()),
  )
  const words = [...new Set(wordsOf(query).map(stem))]
  if (!words.length) return kept
  const read = kept.map((r, i) => ({
    r,
    i,
    name: new Set(wordsOf(spaced(r.name)).map(stem)),
    text: new Set(wordsOf(`${spaced(r.name)} ${r.category} ${r.summary} ${r.whenToUse}`).map(stem)),
  }))
  const weight = new Map(
    words.map((w) => {
      const holding = read.filter((x) => x.text.has(w)).length
      return [w, Math.log((read.length + 1) / (holding + 0.5))]
    }),
  )
  return read
    .map((x) => ({
      ...x,
      score: words.filter((w) => x.text.has(w)).reduce((n, w) => n + weight.get(w)!, 0),
      named: words.filter((w) => x.name.has(w)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.named - a.named || a.i - b.i)
    .map((x) => x.r)
}

/** A name as it is compared: `link-button`, `linkbutton` and `LinkButton` are one name. */
const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

/** The record named `name`, in any case, or in kebab case as its spec page is. */
export const findComponent = (records: ComponentRecord[], name: string) =>
  records.find((r) => key(r.name) === key(name))

/** The edits between two words: insertions, deletions and substitutions. */
function distance(a: string, b: string) {
  let row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const next = [i]
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    row = next
  }
  return row[b.length]
}

/**
 * The names nearest `name`, nearest first: those that hold it or that it holds, such as
 * `IconButton` for `Icon`, then those fewest edits away.
 */
export function nearestNames(records: ComponentRecord[], name: string, count = 5) {
  const k = key(name)
  return records
    .map((r) => {
      const other = key(r.name)
      const holds = k && (other.includes(k) || k.includes(other))
      return { name: r.name, holds, far: distance(k, other) }
    })
    .sort((a, b) => Number(b.holds) - Number(a.holds) || a.far - b.far)
    .slice(0, count)
    .map((x) => x.name)
}
