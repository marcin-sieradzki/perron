// The component registry, packages/perron/components.json, read and checked (by ./entry.ts), and
// the files it decides (the barrels, the package exports, the Storybook sort order and the spec
// pages in PAGES), built in memory for scripts/build-registry.ts.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { folderOf, isBuilt, parseRegistry, specPage, type Entry, type Layer } from './entry.ts'
import { PACKAGE } from './paths.ts'

export * from './entry.ts'

/** The registry, by path from the repo root. */
export const REGISTRY = `${PACKAGE}/components.json`

export function readRegistry(root: string): Entry[] {
  return parseRegistry(JSON.parse(readFileSync(join(root, REGISTRY), 'utf8')))
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** The built entries of one layer, by category then name. */
function inLayer(entries: Entry[], l: Layer) {
  return entries
    .filter((e) => e.layer === l && isBuilt(e))
    .sort((a, b) => compare(a.category, b.category) || compare(a.name, b.name))
}

const GENERATED = `// Generated from packages/perron/components.json: change the registry, then run
// npm run registry. Its fixed lines live in scripts/lib/registry.ts.`

/** The main barrel's hand-written exports, ahead of the components. */
const HEAD = `// The entry point of @mylder/perron: PerronProvider, the owned-strings hook, the locale types and
// every component past designing.
${GENERATED}
export { PerronProvider, useOwnedStrings } from './PerronProvider.tsx'
export type { PerronProviderProps } from './PerronProvider.tsx'
export type { Locale, OwnedStringKey, OwnedStrings } from './locale/index.ts'`

const reexports = (list: Entry[]) =>
  list.map((e) => `export * from './${folderOf(e.layer)}/${e.name}/${e.name}.tsx'\n`).join('')

/** The package's `exports`, with `"."` and `"./patterns"` first and every other entry as it was. */
function packageJson(text: string) {
  const pkg = JSON.parse(text)
  const dist = (file: string) => ({ types: `./dist/${file}.d.ts`, default: `./dist/${file}.js` })
  const rest = Object.entries(pkg.exports ?? {}).filter(([k]) => k !== '.' && k !== './patterns')
  pkg.exports = { '.': dist('index'), './patterns': dist('patterns'), ...Object.fromEntries(rest) }
  return `${JSON.stringify(pkg, null, 2)}\n`
}

/** Replaces the lines between `// registry:<id> start` and `// registry:<id> end`, at their indent. */
function fill(rel: string, text: string, id: string, lines: string[]) {
  const re = new RegExp(`^( *)// registry:${id} start.*\\n[\\s\\S]*?^ *// registry:${id} end`, 'm')
  const m = re.exec(text)
  if (!m) throw new Error(`${rel} has no "// registry:${id} start" and "end" markers`)
  const indent = m[1]
  const start = m[0].slice(0, m[0].indexOf('\n') + 1)
  const body = lines.map((l) => `${indent}${l}\n`).join('')
  return text.replace(re, () => `${start}${body}${indent}// registry:${id} end`)
}

const PREVIEW = '.storybook/preview.ts'
const PAGES_TS = 'scripts/lib/pages.ts'
const PACKAGE_JSON = `${PACKAGE}/package.json`

/** Every file the registry decides, keyed by path from the repo root; `read` gives a file's text. */
export function buildRegistry(entries: Entry[], read: (rel: string) => string) {
  const components = inLayer(entries, 'component')
  const patterns = inLayer(entries, 'pattern')
  const built = [...components, ...patterns]
  const quoted = (s: string) => `'${s}',`
  // a group written whole, so the sidebar has none until an entry is built
  const group = (name: string, comment: string, list: Entry[]) =>
    list.length
      ? [quoted(name), '[', `  // ${comment}`, ...list.map((e) => `  ${quoted(e.name)}`), '],']
      : []
  let preview = fill(
    PREVIEW,
    read(PREVIEW),
    'components',
    components.map((e) => quoted(e.name)),
  )
  preview = fill(
    PREVIEW,
    preview,
    'patterns',
    group('Patterns', 'each registered pattern', patterns),
  )
  preview = fill(
    PREVIEW,
    preview,
    'specs',
    group('Specs', 'each spec page, as PAGES lists them', built),
  )
  return {
    [`${PACKAGE}/src/index.ts`]: `${HEAD}\n${reexports(components)}`,
    [`${PACKAGE}/src/patterns.ts`]: `// The @mylder/perron/patterns entry: every pattern past designing.\n${GENERATED}\n${
      patterns.length ? reexports(patterns) : 'export {}\n'
    }`,
    [PACKAGE_JSON]: packageJson(read(PACKAGE_JSON)),
    [PREVIEW]: preview,
    [PAGES_TS]: fill(
      PAGES_TS,
      read(PAGES_TS),
      'specs',
      built.map((e) => quoted(specPage(e))),
    ),
  }
}

/** The files the repo's registry decides, as they should be now. */
export function registryFiles(root: string) {
  return buildRegistry(readRegistry(root), (rel) => readFileSync(join(root, rel), 'utf8'))
}
