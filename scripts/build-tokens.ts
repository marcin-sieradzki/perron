// Builds CSS, TypeScript and Penpot files from the DTCG token files in packages/perron/tokens/,
// rebuilds the token tables in docs/foundations/, and writes the MCP server's data files. Usage: node scripts/build-tokens.ts [--check]
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildData } from './lib/data.ts'
import { buildDocs } from './lib/docs.ts'
import { syncCli } from './lib/sync.ts'
import { readSources } from './lib/token-sources.ts'
import { buildAll, loadTokens } from './lib/tokens.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

if (import.meta.url === `file://${process.argv[1]}`) {
  const sources = readSources(root)
  const tokens = loadTokens(sources)
  const docs = await buildDocs(root, tokens)
  const out = { ...buildAll(sources), ...docs, ...buildData(root, tokens, docs) }
  syncCli(root, out, 'npm run tokens')
}
