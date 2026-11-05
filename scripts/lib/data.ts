// The data the Perron MCP server reads, shipped in @mylder/perron under data/: every token with its
// value in each theme, every docs page with its tables filled in, and every component and pattern
// past designing with the guidance its spec gives a caller.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { specProse } from '../../storybook/blocks/component-page.ts'
import { PAGES_SITE } from '../../website/lib/base-path.ts'
import type { Api, ComponentApi } from './api.ts'
import { headingOf, PAGES, tokenSegment } from './pages.ts'
import { PACKAGE } from './paths.ts'
import {
  folderOf,
  importLine,
  isBuilt,
  kebab,
  readRegistry,
  specPage,
  type Entry,
  type Layer,
  type Status,
} from './registry.ts'
import { openingSentence } from './site.ts'
import { propRows, specPropsTable } from './spec-props.ts'
import type { ResolvedTokens } from './tokens.ts'
import { LEVELS, CHECKED_BY, readDoAndDont, readForAgents, readWhenToUse } from './usage.ts'

const json = (data: unknown) => `${JSON.stringify(data, null, 2)}\n`

/** One prop of a component, from api.json where it declares the prop, else from its spec. */
export interface ComponentProp {
  name: string
  type: string
  optional: boolean
  /** Its default as code, such as `'solid'`; left out when it has none */
  default?: string
  /** What it is for, as markdown */
  description: string
  /** Its `@deprecated` text, which says what to use instead */
  deprecated?: string
}

/** One rule of the spec's Do and don't. */
export interface ComponentRule {
  /** `DD-<n>`, for a review finding to cite */
  id: string
  /** `must`: the Don't is never right; `should`: breaking it needs a reason */
  level: (typeof LEVELS)[number]
  do: string
  dont: string
  /** What catches the Don't in a caller's code: `types`, the props type, or only `review` */
  checkedBy: (typeof CHECKED_BY)[number]
}

/** A component or pattern as `get_component` answers it. */
export interface ComponentRecord {
  name: string
  layer: Layer
  category: string
  status: Exclude<Status, 'designing'>
  /** The entry to use instead, for a deprecated one */
  replacedBy?: string
  /** The spec's first sentence */
  summary: string
  import: string
  /** When to reach for it, from the spec's When to use; empty until the spec has one */
  whenToUse: string
  /** The entries to use instead, and when */
  alternatives: { name: string; when: string }[]
  props: ComponentProp[]
  rules: ComponentRule[]
  /** The mistakes agents have made with it, each with its fix */
  agentNotes: string[]
  /** Its page on the docs site */
  docs: string
}

/** The props api.json gives, by the file's path from the repo root. */
const API_FILE = `${PACKAGE}/api.json`

/** A Default cell as code: a lone code span's text; nothing for none or for a required prop. */
function defaultOf(cell: string) {
  const plain = /^`[^`]+`$/.test(cell.trim()) ? cell.trim().slice(1, -1) : cell.trim()
  return /^(none|\(required\)|—|-)?$/i.test(plain) ? undefined : plain
}

/**
 * The props of an entry: api.json's members, in the spec's order, with its types and deprecation
 * text, then the props only the spec's Props table names, such as those inherited from Base UI.
 */
function propsOf(name: string, api: ComponentApi | undefined, spec: string): ComponentProp[] {
  const table = specPropsTable(spec, name)
  const own = propRows(api ?? { extends: [], props: {} }, table).map((r) => {
    const deprecated = api?.props[r.name]?.deprecated
    const fallback = defaultOf(r.default)
    return {
      name: r.name,
      type: r.type,
      optional: !r.required,
      ...(fallback !== undefined && { default: fallback }),
      description: r.description,
      ...(deprecated !== undefined && { deprecated }),
    }
  })
  const named = new Set(own.map((p) => p.name))
  const rest = table.flatMap((r) => {
    const fallback = defaultOf(r.default)
    return r.names
      .filter((n) => !named.has(n))
      .map((n) => ({
        name: n,
        type: r.type,
        optional: !/\(required\)/i.test(r.default),
        ...(fallback !== undefined && { default: fallback }),
        description: r.description,
      }))
  })
  return [...own, ...rest]
}

/** An entry's record, from its registry entry, its props in api.json and its spec. */
function recordOf(e: Entry, api: ComponentApi | undefined, spec: string): ComponentRecord {
  const when = readWhenToUse(spec)
  return {
    name: e.name,
    layer: e.layer,
    category: e.category,
    status: e.status as ComponentRecord['status'],
    ...(e.replacedBy && { replacedBy: e.replacedBy }),
    summary: openingSentence(specProse(spec, 'intro')) ?? '',
    import: importLine(e),
    whenToUse: when?.text ?? '',
    alternatives: (when?.alternatives ?? [])
      .filter((a) => a.name)
      .map((a) => ({ name: a.name, when: a.when })),
    props: propsOf(e.name, api, spec),
    rules: (readDoAndDont(spec)?.rules ?? []).map((r) => ({
      id: r.id,
      level: r.level as ComponentRule['level'],
      do: r.do,
      dont: r.dont,
      checkedBy: r.checkedBy as ComponentRule['checkedBy'],
    })),
    agentNotes: readForAgents(spec)?.notes ?? [],
    docs: `${PAGES_SITE}${folderOf(e.layer)}/${kebab(e.name)}/`,
  }
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * Every component and pattern past designing, components first, each layer by category then
 * name. A spec that hasn't moved over to the usage sections gives empty lists; `docs` holds pages
 * the same build rewrites.
 */
export function readComponents(root: string, docs: Record<string, string> = {}) {
  const read = (path: string) =>
    docs[path] ?? (existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : '')
  const api = JSON.parse(read(API_FILE) || '{}') as Api
  return readRegistry(root)
    .filter(isBuilt)
    .sort(
      (a, b) =>
        compare(a.layer, b.layer) || compare(a.category, b.category) || compare(a.name, b.name),
    )
    .map((e) => recordOf(e, api[e.name], read(specPage(e))))
}

/** The data files, keyed by path from the repo root. `docs` holds pages the same build rewrites. */
export function buildData(root: string, tokens: ResolvedTokens, docs: Record<string, string> = {}) {
  const tokenList = tokenSegment(tokens, ['*']).rows.map((r) => ({
    name: r.name,
    type: r.type,
    cssVar: r.cssVar,
    ...(r.description ? { description: r.description } : {}),
    values: r.values,
    ...(Object.keys(r.overrides).length ? { overrides: r.overrides } : {}),
    ...(r.typography ? { typography: r.typography } : {}),
  }))
  const pages = PAGES.map((path) => {
    const markdown = docs[path] ?? readFileSync(join(root, path), 'utf8')
    return { path, ...headingOf(path, markdown), markdown }
  })
  return {
    [`${PACKAGE}/data/tokens.json`]: json(tokenList),
    [`${PACKAGE}/data/docs.json`]: json(pages),
    [`${PACKAGE}/data/components.json`]: json(readComponents(root, docs)),
  }
}
