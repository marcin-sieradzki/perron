import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  allowanceFiles,
  allowanceCheck,
  isAbout,
  loadChecks,
  parseArgs,
  selectChecks,
} from './run.ts'

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

  it('take a PascalCase argument as a component or pattern, and keep only its problems', () => {
    expect(parseArgs(['docs', 'MapControls'])).toEqual({ rules: ['docs'], names: ['MapControls'] })
    expect(parseArgs([])).toEqual({ rules: [], names: [] })
    const about = (file: string, message = 'a problem') => isAbout({ file, message }, 'MapControls')
    expect(about('packages/perron/src/components/MapControls/MapControls.tsx')).toBe(true)
    expect(about('docs/components/map-controls.md')).toBe(true)
    expect(about('storybook/pages/map-controls.mdx')).toBe(true)
    expect(about('penpot/map-controls.json')).toBe(true)
    expect(about('packages/perron/api.json', 'MapControls lost the prop onZoomIn')).toBe(true)
    expect(about('docs/components/map.md')).toBe(false)
    expect(about('packages/perron/src/components/Map/Map.tsx', 'MapControlsLike')).toBe(false)
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
