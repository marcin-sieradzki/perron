// Runs every check in this folder over the repo, the gates of `npm run check`. Each check is one
// rule of the component contract (docs/components/README.md, "Checks"), in `<rule>.ts`, whose
// default export is a `Check`. Every run also reads each `perron-allow(<rule>)` in the repo's text
// and fails one that names no rule or gives no reason.
// Usage: node scripts/checks/run.ts [rule…] (npm run gates [-- rule…])
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PACKAGE } from '../lib/paths.ts'
import { allowanceProblems, byFileLine, format, VENDORED, type Check, type Problem } from './lib.ts'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '../..')

/** The checks in this folder: every `.ts` file but this one, `lib.ts` and the tests. */
export async function loadChecks(): Promise<Check[]> {
  const files = readdirSync(here).filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'run.ts' && f !== 'lib.ts',
  )
  return Promise.all(files.map(async (f) => (await import(join(here, f))).default as Check))
}

/** The checks whose rules `only` names, or all of them when it names none. */
export function selectChecks(checks: Check[], only: string[]) {
  const rules = checks.map((c) => c.rule).sort()
  const unknown = only.filter((r) => !rules.includes(r))
  if (unknown.length)
    throw new Error(
      `no check has the rule ${unknown.map((r) => `"${r}"`).join(', ')}; the rules are ${rules.join(', ')}`,
    )
  return only.length ? checks.filter((c) => only.includes(c.rule)) : checks
}

const TEXT = /\.(tsx?|jsx?|mjs|css|mdx?|json|ya?ml|html)$/
/** Files that hold allowances as data, or that no one writes by hand. */
const SKIPPED = [
  /(^|\/)fixtures\//,
  /\.test\.tsx?$/,
  new RegExp(`^${PACKAGE}/(data|tokens/generated)/`),
  /(^|\/)package-lock\.json$/,
]

/**
 * The files an allowance can sit in: the repo's text files that git tracks or would track, less
 * fixtures, tests, the vendored skills and generated data.
 */
export function allowanceFiles(root: string) {
  const listed = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    {
      cwd: root,
      encoding: 'utf8',
    },
  )
  return [...new Set(listed.split('\0'))]
    .filter((f) => TEXT.test(f) && existsSync(join(root, f)))
    .filter((f) => !SKIPPED.some((s) => s.test(f)) && !VENDORED.some((v) => f.startsWith(v)))
    .sort()
}

/** Each allowance in the repo that names no rule of `rules` or gives no reason. */
export function allowanceCheck(root: string, rules: string[]): Problem[] {
  return allowanceFiles(root)
    .flatMap((f) => allowanceProblems(readFileSync(join(root, f), 'utf8'), f, rules))
    .sort(byFileLine)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const checks = await loadChecks()
  let selected: Check[]
  try {
    selected = selectChecks(checks, process.argv.slice(2))
  } catch (e) {
    console.error((e as Error).message)
    process.exit(1)
  }
  let failed = 0
  const report = (rule: string, problems: Problem[]) => {
    for (const line of format(rule, problems)) console.error(line)
    failed += problems.length
  }
  for (const check of selected) report(check.rule, await check.run(repoRoot))
  const rules = checks.map((c) => c.rule)
  report('perron-allow', allowanceCheck(repoRoot, rules))
  if (failed) process.exit(1)
}
