// The published tarball of @mylder/perron, as `npm pack` would build it after its prepack build:
// every export, every relative import of the built code (its CSS included) and every stylesheet
// import resolves to a file inside it, and it carries every icon and logo.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
const escape = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

/** Each export with its target files: one, or one per condition such as `types`. */
const targets = Object.entries(pkg.exports as Record<string, string | Record<string, string>>).map(
  ([entry, target]) => [entry, typeof target === 'string' ? [target] : Object.values(target)],
)

let packed: { name: string; files: { path: string }[] }
let files: string[]
beforeAll(() => {
  // The pack skips scripts to keep its output JSON, so build the way prepack would first. This is
  // the package build in npm run check: a failure shows tsc's own errors, which it prints to stdout.
  try {
    execFileSync('npm', ['run', 'build', '-w', pkg.name], {
      cwd: join(dir, '../..'),
      encoding: 'utf8',
    })
  } catch (error) {
    const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string }
    throw new Error(`npm run build -w ${pkg.name} failed:\n${stdout}${stderr}`, { cause: error })
  }
  ;[packed] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts', '-w', pkg.name], {
      cwd: join(dir, '../..'),
      encoding: 'utf8',
    }),
  )
  files = packed.files.map((f) => f.path)
}, 60_000)

describe('the @mylder/perron tarball', () => {
  it('is published as @mylder/perron with its licence and readme', () => {
    expect(packed.name).toBe('@mylder/perron')
    expect(files).toEqual(expect.arrayContaining(['LICENSE', 'README.md']))
  })

  it.each(targets)('resolves the export %s inside the tarball', (_, paths) => {
    for (const target of paths) {
      const pattern = new RegExp(`^${escape(target.slice(2)).replace('*', '[^/]+')}$`)
      expect(files.some((f) => pattern.test(f))).toBe(true)
    }
  })

  it('carries every file the built code imports by a relative path, its CSS included', () => {
    const relative = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g
    const code = files.filter((f) => f.startsWith('dist/') && f.endsWith('.js'))
    expect(code.length).toBeGreaterThan(0)
    const missing = code.flatMap((file) =>
      [...readFileSync(join(dir, file), 'utf8').matchAll(relative)]
        .map((m) => posix.join(posix.dirname(file), m[1]))
        .filter((target) => !files.includes(target))
        .map((target) => `${file} imports ${target}`),
    )
    expect(missing).toEqual([])
  })

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

  it('leaves out the source, the tests and the test helpers', () => {
    expect(files.filter((f) => /^src\/|\.test\.|^dist\/testing\//.test(f))).toEqual([])
  })
})
