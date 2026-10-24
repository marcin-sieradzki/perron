// The component registry, packages/perron/components.json: every component and pattern, checked
// here, and the files it decides (the barrels, the package exports, the Storybook sort order and
// the spec pages in PAGES), built in memory for scripts/build-registry.ts.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE } from './paths.ts'

export const LAYERS = ['component', 'pattern'] as const
export const STATUSES = ['designing', 'building', 'stable', 'deprecated'] as const

export type Layer = (typeof LAYERS)[number]
export type Status = (typeof STATUSES)[number]

export interface Entry {
  /** PascalCase, the folder and file name of its code */
  name: string
  layer: Layer
  /** Groups entries in the sidebar, the barrels and the spec pages */
  category: string
  status: Status
  /** The Base UI parts it builds on, such as `Select.Root`; always empty for a pattern */
  baseUiParts: string[]
  /** Its board in the Penpot file: `Components/<Name>` or `Patterns/<Name>` */
  penpotPath: string
  /** The names of the entries it is built from, which the factory builds first */
  dependsOn: string[]
}

const FIELDS = [
  'name',
  'layer',
  'category',
  'status',
  'baseUiParts',
  'penpotPath',
  'dependsOn',
] as const
const PASCAL = /^[A-Z][A-Za-z0-9]*$/
const PART = /^[A-Z][A-Za-z0-9]*(\.[A-Z][A-Za-z0-9]*)*$/
const FOLDER: Record<Layer, string> = { component: 'Components', pattern: 'Patterns' }

const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === 'string')

/** Each problem of one entry, by its name (or its place when the name is bad). */
function entryProblems(raw: unknown, at: number): string[] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    return [`entry ${at + 1} is not an object`]
  const e = raw as Record<string, unknown>
  const id = typeof e.name === 'string' && e.name ? e.name : `entry ${at + 1}`
  const out: string[] = []
  for (const key of Object.keys(e))
    if (!(FIELDS as readonly string[]).includes(key))
      out.push(`${id} has an unknown field "${key}"; the fields are ${FIELDS.join(', ')}`)
  const missing = FIELDS.filter((f) => e[f] === undefined)
  for (const f of missing) out.push(`${id} is missing the field "${f}"`)
  if (missing.length) return out

  if (typeof e.name !== 'string' || !PASCAL.test(e.name))
    out.push(`${JSON.stringify(e.name)} is not PascalCase, such as DatePicker`)
  if (!LAYERS.includes(e.layer as Layer))
    out.push(`${id}: layer is ${JSON.stringify(e.layer)}, not one of ${LAYERS.join(', ')}`)
  if (!STATUSES.includes(e.status as Status))
    out.push(`${id}: status is ${JSON.stringify(e.status)}, not one of ${STATUSES.join(', ')}`)
  if (typeof e.category !== 'string' || !e.category.trim()) out.push(`${id}: category is empty`)
  if (!isStrings(e.baseUiParts)) out.push(`${id}: baseUiParts is not a list of names`)
  else
    for (const part of e.baseUiParts.filter((p) => !PART.test(p)))
      out.push(`${id}: "${part}" is not a Base UI part, such as Button or Select.Trigger`)
  if (!isStrings(e.dependsOn)) out.push(`${id}: dependsOn is not a list of names`)
  const folder = FOLDER[e.layer as Layer]
  if (typeof e.penpotPath !== 'string') out.push(`${id}: penpotPath is not a string`)
  else if (
    folder &&
    !(e.penpotPath.startsWith(`${folder}/`) && e.penpotPath.length > folder.length + 1)
  )
    out.push(`${id}: penpotPath must start with ${folder}/, such as ${folder}/${id}`)
  if (e.layer === 'pattern' && isStrings(e.baseUiParts) && e.baseUiParts.length)
    out.push(
      `${id} is a pattern and lists Base UI parts (${e.baseUiParts.join(', ')}); a pattern builds on Perron components only`,
    )
  return out
}

/** The problems between entries: duplicates, unknown or wrong-layer dependencies, cycles. */
function graphProblems(entries: Entry[]): string[] {
  const out: string[] = []
  const byName = new Map<string, Entry>()
  for (const e of entries) {
    if (byName.has(e.name)) out.push(`${e.name} is listed twice`)
    byName.set(e.name, e)
  }
  for (const e of entries)
    for (const d of e.dependsOn) {
      const dep = byName.get(d)
      if (!dep) out.push(`${e.name} depends on ${d}, which the registry does not list`)
      else if (e.layer === 'component' && dep.layer === 'pattern')
        out.push(
          `${e.name} is a component and depends on the pattern ${d}; a component depends on components only`,
        )
    }
  // depth-first, reporting each cycle once from where it was entered
  const done = new Set<string>()
  const visit = (name: string, path: string[]) => {
    const loop = path.indexOf(name)
    if (loop >= 0)
      return void out.push(`dependency cycle: ${[...path.slice(loop), name].join(' → ')}`)
    if (done.has(name)) return
    for (const d of byName.get(name)?.dependsOn ?? []) visit(d, [...path, name])
    done.add(name)
  }
  for (const e of entries) visit(e.name, [])
  return out
}

/** The registry's entries, or an error naming every problem in it. */
export function parseRegistry(json: unknown): Entry[] {
  if (!Array.isArray(json)) throw new Error('components.json must hold a list of entries')
  const problems = json.flatMap(entryProblems)
  if (!problems.length) problems.push(...graphProblems(json as Entry[]))
  if (problems.length)
    throw new Error(`components.json is not valid:\n${problems.map((p) => `- ${p}`).join('\n')}`)
  return json as Entry[]
}

/** The registry, by path from the repo root. */
export const REGISTRY = `${PACKAGE}/components.json`

export function readRegistry(root: string): Entry[] {
  return parseRegistry(JSON.parse(readFileSync(join(root, REGISTRY), 'utf8')))
}

/** An entry's code exists from `building` on, so only those join the barrels, sidebar and pages. */
const built = (e: Entry) => e.status !== 'designing'

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** The built entries of one layer, by category then name. */
function inLayer(entries: Entry[], l: Layer) {
  return entries
    .filter((e) => e.layer === l && built(e))
    .sort((a, b) => compare(a.category, b.category) || compare(a.name, b.name))
}

/** `DatePicker` → `date-picker`, the name of its spec page. */
export function kebab(name: string) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

/** An entry's spec page, by path from the repo root. */
export const specPage = (e: Entry) =>
  `docs/${e.layer === 'component' ? 'components' : 'patterns'}/${kebab(e.name)}.md`

const GENERATED = `// Generated from packages/perron/components.json: change the registry, then run
// npm run registry. Its fixed lines live in scripts/lib/registry.ts.`

/** The main barrel's hand-written exports, ahead of the components. */
const HEAD = `// The entry point of @mylder/perron: PerronProvider, the owned-strings hook, the locale types and
// every component past designing.
${GENERATED}
export { PerronProvider, useOwnedStrings } from './PerronProvider.tsx'
export type { PerronProviderProps } from './PerronProvider.tsx'
export type { Locale, OwnedStringKey, OwnedStrings } from './locale/index.ts'`

const reexports = (list: Entry[], dir: string) =>
  list.map((e) => `export * from './${dir}/${e.name}/${e.name}.tsx'\n`).join('')

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
  const quoted = (s: string) => `'${s}',`
  // the Patterns group is written whole, so the sidebar has none until a pattern is built
  const patternGroup = patterns.length
    ? [
        "'Patterns',",
        '[',
        '  // each registered pattern',
        ...patterns.map((e) => `  ${quoted(e.name)}`),
        '],',
      ]
    : []
  const preview = fill(
    PREVIEW,
    read(PREVIEW),
    'components',
    components.map((e) => quoted(e.name)),
  )
  const specs = [...components, ...patterns].map((e) => quoted(specPage(e)))
  return {
    [`${PACKAGE}/src/index.ts`]: `${HEAD}\n${reexports(components, 'components')}`,
    [`${PACKAGE}/src/patterns.ts`]: `// The @mylder/perron/patterns entry: every pattern past designing.\n${GENERATED}\n${
      patterns.length ? reexports(patterns, 'patterns') : 'export {}\n'
    }`,
    [PACKAGE_JSON]: packageJson(read(PACKAGE_JSON)),
    [PREVIEW]: fill(PREVIEW, preview, 'patterns', patternGroup),
    [PAGES_TS]: fill(PAGES_TS, read(PAGES_TS), 'specs', specs),
  }
}

/** The files the repo's registry decides, as they should be now. */
export function registryFiles(root: string) {
  return buildRegistry(readRegistry(root), (rel) => readFileSync(join(root, rel), 'utf8'))
}
