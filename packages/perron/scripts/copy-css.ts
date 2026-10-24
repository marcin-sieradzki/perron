// The second half of the package build: tsc compiles src/ to dist/, and this copies each stylesheet
// in src/ to the same place in dist/, beside the built JS that imports it. It leaves out what the
// build leaves out: fixtures and the test helpers in src/testing.
// Usage: node scripts/copy-css.ts (from packages/perron)
import { cpSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The stylesheets under `src`, by path from it, that ship. */
function shippedCss(src: string) {
  return readdirSync(src, { recursive: true, encoding: 'utf8' })
    .filter((rel) => rel.endsWith('.css'))
    .filter((rel) => {
      const dirs = rel.split(sep).slice(0, -1)
      return dirs[0] !== 'testing' && !dirs.includes('fixtures')
    })
}

for (const rel of shippedCss(join(pkg, 'src'))) {
  mkdirSync(dirname(join(pkg, 'dist', rel)), { recursive: true })
  cpSync(join(pkg, 'src', rel), join(pkg, 'dist', rel))
}
