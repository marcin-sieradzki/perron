// Run by `npm run build -w website` after `next build`: every link the docs search holds must land
// on its page, at an id the page's prerendered HTML has. It reads the index and the pages as the
// build wrote them under .next/server/app, and fails the build with each link that lands nowhere.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deadAnchors, idsIn } from '../lib/anchors.ts'
import type { SearchEntry } from '../lib/search-index.ts'

const app = join(import.meta.dirname, '..', '.next', 'server', 'app')
const read = (file: string) => {
  const path = join(app, file)
  return existsSync(path) ? readFileSync(path, 'utf8') : undefined
}

const body = read('search-index.json.body')
if (body === undefined) {
  console.error('check-anchors: the build wrote no search-index.json; run next build first')
  process.exit(1)
}
const index = JSON.parse(body) as SearchEntry[]

const pages = new Map<string, ReadonlySet<string> | undefined>()
const idsOf = (route: string) => {
  if (!pages.has(route)) {
    const html = read(`${route === '/' ? 'index' : route.slice(1)}.html`)
    pages.set(route, html === undefined ? undefined : idsIn(html))
  }
  return pages.get(route)
}

const hrefs = index.map((e) => e.href)
const dead = deadAnchors(hrefs, idsOf)
const anchors = hrefs.filter((h) => h.includes('#')).length
if (dead.length) {
  console.error(`check-anchors: ${dead.length} of the search's links land nowhere:`)
  for (const href of dead) console.error(`  ${href}`)
  process.exit(1)
}
console.log(`check-anchors: all ${hrefs.length} search links land, ${anchors} of them on an anchor`)
