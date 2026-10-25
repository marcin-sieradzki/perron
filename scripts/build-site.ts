// Puts the docs site together for GitHub Pages: the website's static export at the root, the
// Storybook build under storybook/, and the agent-readable files of scripts/lib/site.ts beside
// them. Build both first: `npm run build -w website` and `npm run storybook:build`.
// Usage: node scripts/build-site.ts <site folder>
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE_PATH } from '../website/lib/base-path.ts'
import { buildSite } from './lib/site.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
if (!process.argv[2]) throw new Error('Usage: node scripts/build-site.ts <site folder>')
const out = resolve(process.argv[2])
const website = join(root, 'website/out')
const storybook = join(root, 'dist/storybook')

if (!existsSync(website)) throw new Error('website/out is missing: run npm run build -w website')
if (!existsSync(storybook))
  throw new Error('dist/storybook is missing: run npm run storybook:build')
// an export from before the base path would load no CSS or JS on Pages
if (!readFileSync(join(website, 'index.html'), 'utf8').includes(`"${BASE_PATH}/_next/`))
  throw new Error(`website/out was not built under ${BASE_PATH}: run npm run build -w website`)

// the folder is emptied first, so it may hold neither the repo nor either build
const within = (dir: string, parent: string) => !relative(parent, dir).startsWith('..')
if (
  [root, website, storybook].some((dir) => within(dir, out) || (within(out, dir) && dir !== root))
)
  throw new Error(
    `${out} would hold the repo or a build: pick a folder of its own, such as dist/site`,
  )

rmSync(out, { recursive: true, force: true })
cpSync(website, out, { recursive: true })
if (existsSync(join(out, 'storybook')))
  throw new Error('the website has a storybook/ route, where Storybook goes')
cpSync(storybook, join(out, 'storybook'), { recursive: true })

const files = buildSite(root)
for (const [rel, text] of Object.entries(files)) {
  const file = join(out, rel)
  // the website's routes and these files share the root, so neither may take the other's path
  if (existsSync(file)) throw new Error(`${rel} is both a website file and an agent file`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
}
console.log(`put the website, Storybook and ${Object.keys(files).length} agent files in ${out}`)
