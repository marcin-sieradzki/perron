// A registry entry of packages/perron/components.json: its shape, its validation, and what follows
// from the entry alone (its folder, whether it is built, its spec page). Node-free, so the contract
// story reads the registry with it in the browser; scripts/lib/registry.ts does the file I/O.

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
/** The Penpot page folder of each layer, which a `penpotPath` starts with. */
const PENPOT_FOLDER: Record<Layer, string> = { component: 'Components', pattern: 'Patterns' }

const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === 'string')

/** Each problem of one entry, by its name (or its place when the name is bad). */
function entryProblems(raw: unknown, index: number): string[] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    return [`entry ${index + 1} is not an object`]
  const e = raw as Record<string, unknown>
  const id = typeof e.name === 'string' && e.name ? e.name : `entry ${index + 1}`
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
  const folder = PENPOT_FOLDER[e.layer as Layer]
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

/** The folder of a layer's code under `packages/perron/src/`, and of its spec pages under `docs/`. */
export const folderOf = (layer: Layer) => (layer === 'component' ? 'components' : 'patterns')

/** Whether an entry is past `designing`: its code exists, so it joins the barrels, sidebar and pages. */
export const isBuilt = (e: Pick<Entry, 'status'>) => e.status !== 'designing'

/** `DatePicker` → `date-picker`, the name of its spec page. */
export function kebab(name: string) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

/** An entry's spec page, by path from the repo root. */
export const specPage = (e: Entry) => `docs/${folderOf(e.layer)}/${kebab(e.name)}.md`
