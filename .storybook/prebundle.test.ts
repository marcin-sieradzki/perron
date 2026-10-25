// Holds prebundle.ts to every package a story loads in the browser: a value import of a package
// that Vite would not pre-bundle fails here, before it reloads a page mid-run in test:stories.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { prebundled } from './prebundle.ts'

const root = join(import.meta.dirname, '..')

/** Every `.stories.tsx` of the stories and fixtures projects, and preview.ts: what the stories project loads first. */
function entries(): string[] {
  const out = [join(root, '.storybook/preview.ts')]
  const walk = (dir: string) => {
    for (const name of readdirSync(dir, { withFileTypes: true }))
      if (name.isDirectory()) walk(join(dir, name.name))
      else if (name.name.endsWith('.stories.tsx')) out.push(join(dir, name.name))
  }
  for (const dir of ['packages/perron/src', 'storybook/contract', 'storybook/fixtures'])
    walk(join(root, dir))
  return out
}

/** The specifiers a file imports for its values: `import type` and `export type` left out. */
export function valueImports(source: string): string[] {
  const out: string[] = []
  const statement = /^\s*(?:import|export)\s+(type\s+)?(?:[\w*{}\s,$]+?\s+from\s+)?'([^']+)'/gm
  for (const m of source.matchAll(statement)) if (!m[1]) out.push(m[2])
  return out
}

/** A relative specifier's file, or nothing for one that is not code (CSS, JSON). */
function resolveFile(from: string, spec: string) {
  const base = resolve(dirname(from), spec)
  return [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].find(
    (f) => /\.tsx?$/.test(f) && existsSync(f),
  )
}

/** The packages the stories load, from each entry through the relative imports it follows. */
function packagesLoaded() {
  const seen = new Set<string>()
  const packages = new Map<string, string>()
  const visit = (file: string) => {
    if (seen.has(file)) return
    seen.add(file)
    for (const spec of valueImports(readFileSync(file, 'utf8'))) {
      if (spec.startsWith('.')) {
        const next = resolveFile(file, spec)
        if (next) visit(next)
      } else if (!/^(node:|virtual:|@mylder\/perron)/.test(spec) && !packages.has(spec))
        packages.set(spec, relative(root, file))
    }
  }
  entries().forEach(visit)
  return packages
}

describe('prebundle', () => {
  it('reads value imports, across lines, and leaves type-only ones out', () => {
    expect(
      valueImports(
        "import { a } from 'x'\nimport type { B } from 'y'\nimport {\n  c,\n  type D,\n} from 'z'\nimport 'side.css'\nexport { e } from './e.ts'\nexport type { F } from 'f'\n",
      ),
    ).toEqual(['x', 'z', 'side.css', './e.ts'])
  })

  it('pre-bundles every package a story loads', () => {
    const included = new Set(prebundled())
    const missing = [...packagesLoaded()]
      .filter(([spec]) => !included.has(spec))
      .map(([spec, file]) => `${spec} (imported by ${file}): add it to STORY_DEPS`)
    expect(missing).toEqual([])
  })
})
