import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { allowanceFiles, allowanceCheck, loadChecks, selectChecks } from './run.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

describe('the gates', () => {
  it('load one check per rule of the contract', async () => {
    expect((await loadChecks()).map((c) => c.rule).sort()).toEqual([
      'api-compatibility',
      'component-css',
      'docs',
      'paths',
      'patterns',
      'penpot',
      'props',
      'shared-parts',
    ])
  })

  it('run the rules named on the command line, and fail on a rule no check has', async () => {
    const checks = await loadChecks()
    expect(selectChecks(checks, []).length).toBe(checks.length)
    expect(selectChecks(checks, ['props']).map((c) => c.rule)).toEqual(['props'])
    expect(() => selectChecks(checks, ['props', 'prop'])).toThrow(
      /^no check has the rule "prop"; the rules are api-compatibility, component-css/,
    )
  })

  it('read allowances in the repo text, not in fixtures, tests, vendored skills or generated data', () => {
    const files = allowanceFiles(root)
    expect(files).toEqual(
      expect.arrayContaining(['docs/components/README.md', 'scripts/checks/paths.ts']),
    )
    expect(
      files.filter((f) =>
        /(^|\/)fixtures\/|\.test\.|^\.claude\/skills\/writing-for-agents\/|^packages\/perron\/data\/|\.svg$/.test(
          f,
        ),
      ),
    ).toEqual([])
  })

  it('find no allowance in the repo without a rule or a reason', async () => {
    const rules = (await loadChecks()).map((c) => c.rule)
    expect(allowanceCheck(root, rules)).toEqual([])
  })
})
