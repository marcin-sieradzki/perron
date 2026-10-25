// The lint bans the imports Perron must not make: MUI at runtime, Base UI's old package name,
// Base UI's internals, and in src/ the generated tokens.ts, outside the package build's rootDir.
// Each fixture is ignored by the real lint run, so here oxlint lints it alone. An override's rule
// options replace the base's, never merge, so src's override repeats the base's patterns, and a
// test holds the copy to the base.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')
const fixtures = 'packages/perron/fixtures/restricted-imports'

/** Lints one fixture with the repository's own config; the exit code and the rules it broke. */
const lint = (file: string) => {
  try {
    execFileSync('npx', ['oxlint', '--no-ignore', '-f', 'json', join(fixtures, file)], {
      cwd: root,
      encoding: 'utf8',
    })
    return { failed: false, rules: [] }
  } catch (error) {
    const { diagnostics } = JSON.parse((error as { stdout: string }).stdout)
    return { failed: true, rules: diagnostics.map((d: { code: string }) => d.code) }
  }
}

describe('the restricted imports lint', () => {
  it.each(['mui-runtime.ts', 'base-ui-components.ts', 'base-ui-internals.ts'])(
    'fails %s',
    (file) => {
      expect(lint(file)).toEqual({ failed: true, rules: ['eslint(no-restricted-imports)'] })
    },
  )

  it('fails an import of tokens.ts in src/, by its path or by the package export', () => {
    const file = '../../src/fixtures/restricted-imports/generated-tokens.ts'
    expect(lint(file)).toEqual({
      failed: true,
      rules: ['eslint(no-restricted-imports)', 'eslint(no-restricted-imports)'],
    })
  })

  it('lets a type-only import from MUI through', () => {
    expect(lint('mui-type-only.ts')).toEqual({ failed: false, rules: [] })
  })

  it("keeps every base pattern in src's override, whose options replace the base's", () => {
    type Rule = [string, { patterns: unknown[] }]
    const config = JSON.parse(readFileSync(join(root, '.oxlintrc.json'), 'utf8')) as {
      rules: Record<string, Rule>
      overrides: { files: string[]; rules: Record<string, Rule> }[]
    }
    const base = config.rules['no-restricted-imports'][1].patterns
    const src = config.overrides.find((o) => o.files.includes('packages/perron/src/**'))!
    expect(src.rules['no-restricted-imports'][1].patterns.slice(0, base.length)).toEqual(base)
  })
})
