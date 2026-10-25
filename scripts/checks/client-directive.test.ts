import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import check, { clientFiles, hasDirective } from './client-directive.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
const fixture = (name: string) =>
  hasDirective(name, readFileSync(join(here, 'fixtures/client-directive', name), 'utf8'))

describe('client-directive', () => {
  it.each(['directive.tsx', 'below-comment.tsx'])('passes %s', (name) => {
    expect(fixture(name)).toBe(true)
  })

  it.each(['missing.tsx', 'after-import.tsx'])('fails %s', (name) => {
    expect(fixture(name)).toBe(false)
  })

  it('reads the provider and every built entry, not the barrels', () => {
    const files = clientFiles(root)
    expect(files).toContain('packages/perron/src/PerronProvider.tsx')
    expect(files).toContain('packages/perron/src/components/Button/Button.tsx')
    expect(files).toContain('packages/perron/src/patterns/DepartureRow/DepartureRow.tsx')
    expect(files.some((f) => /src\/(index|patterns)\.ts$/.test(f))).toBe(false)
  })

  it('names an entry whose directive is removed', () => {
    const tree = mkdtempSync(join(tmpdir(), 'client-directive-'))
    try {
      cpSync(
        join(root, 'packages/perron/components.json'),
        join(tree, 'packages/perron/components.json'),
      )
      for (const file of clientFiles(root)) cpSync(join(root, file), join(tree, file))
      const button = join(tree, 'packages/perron/src/components/Button/Button.tsx')
      writeFileSync(button, readFileSync(button, 'utf8').replace("'use client'\n", ''))
      expect(check.run(tree)).toEqual([
        {
          file: 'packages/perron/src/components/Button/Button.tsx',
          line: 1,
          message: expect.stringMatching(/does not open with 'use client'/),
        },
      ])
    } finally {
      rmSync(tree, { recursive: true, force: true })
    }
  })

  it('passes the real tree', () => {
    expect(check.run(root)).toEqual([])
  })
})
