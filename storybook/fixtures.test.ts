// Runs the stories in storybook/fixtures as the stories project runs the real ones (same addons,
// same preview, headless Chromium) and expects each to fail: proof that axe in error mode and the
// contract story catch what they promise to.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

interface Result {
  title: string
  status: string
  failureMessages: string[]
}

let results: Result[] = []

beforeAll(() => {
  const dir = mkdtempSync(join(tmpdir(), 'perron-fixtures-'))
  const out = join(dir, 'results.json')
  const run = spawnSync(
    process.execPath,
    [
      'node_modules/vitest/vitest.mjs',
      'run',
      '--config',
      'storybook/fixtures/vitest.config.ts',
      '--reporter=json',
      `--outputFile=${out}`,
    ],
    { cwd: join(import.meta.dirname, '..'), encoding: 'utf8' },
  )
  if (!existsSync(out))
    throw new Error(`the fixture run wrote no report:\n${run.stdout}${run.stderr}`)
  const report = JSON.parse(readFileSync(out, 'utf8')) as {
    testResults: { assertionResults: Result[] }[]
  }
  results = report.testResults.flatMap((file) => file.assertionResults)
  rmSync(dir, { recursive: true })
}, 120_000)

const result = (title: string) => results.find((r) => r.title === title)

describe('the fixture stories', () => {
  it('fail on an unlabelled button, because axe runs in error mode', () => {
    expect(result('Unlabelled Button')?.status).toBe('failed')
    expect(result('Unlabelled Button')?.failureMessages.join('\n')).toContain('(button-name)')
  })

  it('fail on a component whose ref and data-testid land on different elements', () => {
    expect(result('Root')?.status).toBe('failed')
    expect(result('Root')?.failureMessages.join('\n')).toContain("Split's ref")
  })
})
