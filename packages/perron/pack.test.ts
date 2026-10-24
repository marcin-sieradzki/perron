// The published tarball of @mylder/perron, as `npm pack` would build it: every export and every
// stylesheet import resolves to a file inside it, and it carries every icon and logo.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
const escape = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

let packed: { name: string; files: { path: string }[] }
let files: string[]
beforeAll(() => {
  ;[packed] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts', '-w', pkg.name], {
      cwd: join(dir, '../..'),
      encoding: 'utf8',
    }),
  )
  files = packed.files.map((f) => f.path)
})

describe('the @mylder/perron tarball', () => {
  it('is published as @mylder/perron with its licence and readme', () => {
    expect(packed.name).toBe('@mylder/perron')
    expect(files).toEqual(expect.arrayContaining(['LICENSE', 'README.md']))
  })

  it.each(Object.entries(pkg.exports as Record<string, string>))(
    'resolves the export %s inside the tarball',
    (_, target) => {
      const pattern = new RegExp(`^${escape(target.slice(2)).replace('*', '[^/]+')}$`)
      expect(files.some((f) => pattern.test(f))).toBe(true)
    },
  )

  it('carries every file perron.css imports, and theirs', () => {
    const local = (css: string) => [...css.matchAll(/@import '(\.[^']+)'/g)].map((m) => m[1])
    const seen: string[] = []
    const walk = (file: string) => {
      seen.push(file)
      for (const ref of local(readFileSync(join(dir, file), 'utf8')))
        walk(posix.join(posix.dirname(file), ref))
    }
    walk('styles/perron.css')
    expect(seen.length).toBeGreaterThan(1)
    expect(files).toEqual(expect.arrayContaining(seen))
  })

  it.each(['icons', 'logos'])('carries every file in %s/ and its manifest', (name) => {
    const manifest = JSON.parse(readFileSync(join(dir, name, `${name}.json`), 'utf8'))
    const svgs = Object.values(manifest).flatMap((group) =>
      Object.keys(group as object).map((n) => `${name}/${n}.svg`),
    )
    expect(svgs.length).toBeGreaterThan(0)
    expect(files).toEqual(expect.arrayContaining([...svgs, `${name}/${name}.json`]))
  })

  it('leaves out the tests', () => {
    expect(files.filter((f) => f.endsWith('.test.ts'))).toEqual([])
  })
})
