// Builds CSS, TypeScript and Penpot files from the DTCG token files in packages/perron/tokens/, and
// rebuilds the token tables in docs/foundations/. Usage: node scripts/build-tokens.ts [--check]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDocs } from './lib/docs.ts'
import { PACKAGE } from './lib/paths.ts'
import { buildAll, loadTokens, type TokenSources } from './lib/tokens.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokenDir = join(root, PACKAGE, 'tokens')

export function readSources(): TokenSources {
  const read = (f: string) => JSON.parse(readFileSync(join(tokenDir, f), 'utf8'))
  const resolver = read('perron.resolver.json')
  const refs = JSON.stringify(resolver).match(/[\w.-]+\.tokens\.json/g) ?? []
  return { resolver, files: Object.fromEntries([...new Set(refs)].map((f) => [f, read(f)])) }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check')
  const sources = readSources()
  const out = { ...buildAll(sources), ...(await buildDocs(root, loadTokens(sources))) }
  let stale = 0
  for (const [rel, text] of Object.entries(out)) {
    const file = join(root, rel)
    let current = ''
    try {
      current = readFileSync(file, 'utf8')
    } catch {
      // first build
    }
    if (current === text) continue
    if (check) {
      console.error(`${rel} is out of date. Run npm run tokens.`)
      stale++
    } else {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, text)
      console.log(`wrote ${rel}`)
    }
  }
  if (stale) process.exit(1)
}
