// The lint bans the imports Perron must not make: MUI at runtime, Base UI's old package name,
// Base UI's internals, and in src/ the generated tokens.ts, outside the package build's rootDir.
// Each fixture is ignored by the real lint run, so here oxlint lints it alone.
import { execFileSync } from 'node:child_process'
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
})
