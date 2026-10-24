// Runs every check in this folder over the repo, the gates of `npm run check`. Each check is one
// rule of the component contract (docs/components/README.md, "Checks"), in `<rule>.ts`, whose
// default export is a `Check`. Usage: node scripts/checks/run.ts [rule…]
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, type Check } from './lib.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')

/** The checks in this folder: every `.ts` file but this one, `lib.ts` and the tests. */
export async function loadChecks(): Promise<Check[]> {
  const files = readdirSync(here).filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'run.ts' && f !== 'lib.ts',
  )
  return Promise.all(files.map(async (f) => (await import(join(here, f))).default as Check))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv.slice(2)
  let failed = 0
  for (const check of await loadChecks()) {
    if (only.length && !only.includes(check.rule)) continue
    const problems = await check.run(root)
    for (const line of format(check.rule, problems)) console.error(line)
    failed += problems.length
  }
  if (failed) process.exit(1)
}
