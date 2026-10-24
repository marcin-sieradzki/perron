// Writes the agent-readable files of the docs site (scripts/lib/site.ts) into a Storybook build.
// Usage: node scripts/build-site.ts <storybook build folder>
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSite } from './lib/site.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = process.argv[2]
if (!outDir) throw new Error('Usage: node scripts/build-site.ts <storybook build folder>')

const files = buildSite(root)
for (const [rel, text] of Object.entries(files)) {
  const file = join(outDir, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
}
console.log(`wrote ${Object.keys(files).length} files to ${outDir}`)
