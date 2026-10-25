import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import check, { importProblems } from './patterns.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
/** A fixture, read as if it were a pattern's own file, whose entry depends on `dependsOn`. */
const lint = (fixture: string, dependsOn: string[] = []) =>
  importProblems(
    'packages/perron/src/patterns/Fixture/Fixture.tsx',
    readFileSync(join(here, 'fixtures/patterns', fixture), 'utf8'),
    { dependsOn },
  )

describe('patterns', () => {
  it.each([
    ['base-ui.tsx', /@base-ui\/react\/button/, 1],
    ['base-ui-type.tsx', /@base-ui\/react\/button/, 1],
    ['runtime-package.tsx', /(react-dom|clsx)/, 2],
    ['outside-perron.tsx', /(DepartureRow|testing)/, 2],
    ['other-forms.tsx', /@base-ui\/react\/(menu|dialog)/, 2],
    ['undeclared.tsx', /(dependsOn does not name|a helper that reads Base UI)/, 2],
  ])('fails %s', (fixture, message, count) => {
    const problems = lint(fixture)
    expect(problems).toHaveLength(count)
    for (const p of problems) {
      expect(p.message).toMatch(message)
      expect(p.line).toBeGreaterThan(0)
    }
  })

  it('passes a pattern built from components and parts', () => {
    expect(lint('passes.tsx')).toEqual([])
  })

  it('passes a pattern composing a pattern its dependsOn names, with the helpers that read no Base UI', () => {
    expect(lint('composes.tsx', ['DetailHeader'])).toEqual([])
  })

  it('takes a perron-allow exemption', () => {
    expect(lint('allowed.tsx')).toEqual([])
  })

  // a CI runner's margin over vitest's 5 s, as shared-parts' and docs' have
  it('passes the real tree', async () => {
    expect(await check.run(root)).toEqual([])
  }, 15_000)
})
