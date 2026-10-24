// Reads the DTCG token files of packages/perron/tokens/: the resolver and every token file it
// names. The file I/O beside tokens.ts, which stays pure because Storybook's browser code imports it.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE } from './paths.ts'
import type { TokenSources } from './tokens.ts'

/** The token sources of the repo at `root`. */
export function readSources(root: string): TokenSources {
  const tokenDir = join(root, PACKAGE, 'tokens')
  const read = (f: string) => JSON.parse(readFileSync(join(tokenDir, f), 'utf8'))
  const resolver = read('perron.resolver.json')
  const refs = JSON.stringify(resolver).match(/[\w.-]+\.tokens\.json/g) ?? []
  return { resolver, files: Object.fromEntries([...new Set(refs)].map((f) => [f, read(f)])) }
}
