// Puts the docs site together for GitHub Pages: the website's static export at the root, the
// Storybook build under storybook/, and the agent-readable files of scripts/lib/site.ts beside
// them. Build both first: `npm run build -w website` and `npm run storybook:build`.
// Usage: node scripts/build-site.ts <site folder>
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSite } from './lib/site.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = process.argv[2]
if (!outDir) throw new Error('Usage: node scripts/build-site.ts <site folder>')

const parts = [
  { from: join(root, 'website/out'), to: outDir, build: 'npm run build -w website' },
  {
    from: join(root, 'dist/storybook'),
    to: join(outDir, 'storybook'),
    build: 'npm run storybook:build',
  },
]
for (const part of parts)
  if (!existsSync(part.from)) throw new Error(`${part.from} is missing: run ${part.build} first`)

rmSync(outDir, { recursive: true, force: true })
for (const part of parts) cpSync(part.from, part.to, { recursive: true })

const files = buildSite(root)
for (const [rel, text] of Object.entries(files)) {
  const file = join(outDir, rel)
  // the website's routes and these files share the root, so neither may take the other's path
  if (existsSync(file)) throw new Error(`${rel} is both a website file and an agent file`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
}
console.log(`put the website, Storybook and ${Object.keys(files).length} agent files in ${outDir}`)
