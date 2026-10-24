// The published tarball of @mylder/perron, as `npm pack` would build it: every export resolves to
// a file inside it, and it carries the stylesheets and every icon and logo.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--workspace', pkg.name], {
    cwd: join(dir, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }),
) as [{ name: string; files: { path: string }[] }]
const files = packed.files.map((f) => f.path)

describe('the @mylder/perron tarball', () => {
  it('is published as @mylder/perron', () => {
    expect(packed.name).toBe('@mylder/perron')
  })

  it.each(['styles/perron.css', 'tokens/generated/tokens.css', 'tokens/generated/tokens.ts'])(
    'carries %s',
    (file) => expect(files).toContain(file),
  )

  it.each(['icons', 'logos'])('carries every file in %s/ and its manifest', (name) => {
    const manifest = JSON.parse(readFileSync(join(dir, name, `${name}.json`), 'utf8'))
    const svgs = Object.values(manifest).flatMap((group) =>
      Object.keys(group as object).map((n) => `${name}/${n}.svg`),
    )
    expect(svgs.length).toBeGreaterThan(0)
    expect(files).toEqual(expect.arrayContaining([...svgs, `${name}/${name}.json`]))
  })

  it.each(Object.entries(pkg.exports as Record<string, string>))(
    'resolves the export %s inside the tarball',
    (_, target) => {
      const pattern = new RegExp(`^${target.slice(2).replace('*', '.+')}$`)
      expect(files.some((f) => pattern.test(f))).toBe(true)
    },
  )

  it('leaves out the tests', () => {
    expect(files.filter((f) => f.endsWith('.test.ts'))).toEqual([])
  })
})
