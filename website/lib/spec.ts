// A spec page's data: the spec's intro and the sections the page shows, its props table in MUI's
// layout (rows from api.json, defaults and descriptions from the spec), the variant and colour
// values its matrix crosses, the state styles the matrix forces from the component's own
// stylesheet, the sizes' tokens, and the lines of its install strip. Server-only: it reads the repo.
import postcss, { type AtRule, type ChildNode, type Container, type Rule } from 'postcss'
import { specProse } from '../../storybook/blocks/component-page.ts'
import { folderOf, kebab, type Layer } from '../../scripts/lib/entry.ts'
import type { ComponentApi } from './api.ts'
import { sections } from './markdown.ts'
import type { RegistryEntry } from './registry.ts'
import { readRepoFile, repoFileExists, REPO_URL } from './repo.ts'
import { readTokenData } from './tokens.ts'

/* The spec's prose */

/** The spec's sections a page shows after its props, as Storybook's `<Name>.mdx` picks them. */
export const PROSE_SECTIONS = ['Keyboard and ARIA', 'Owned strings', "Do and don't"] as const

/**
 * The spec's intro, above its run notes, as markdown: its first paragraph is the page's lead, and
 * any paragraphs after it follow the header.
 */
export function specIntro(markdown: string) {
  const [lead = '', ...rest] = specProse(markdown, 'intro').split(/\n\s*\n/)
  return { lead: lead.trim().replace(/\s*\n\s*/g, ' '), rest: rest.join('\n\n').trim() }
}

const hasSection = (markdown: string, heading: string) =>
  new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(markdown)

/** The `##` sections named, each with its heading, that the spec has, in the order asked. */
export function specSections(markdown: string, headings: readonly string[]) {
  return headings
    .filter((h) => hasSection(markdown, h))
    .map((heading) => ({ heading, markdown: specProse(markdown, [heading]) }))
}

/** Every `##` section of the spec, below its intro and run notes: an entry in design shows them all. */
export function specBody(markdown: string) {
  const [, ...rest] = markdown.split(/^(?=## )/m)
  return rest.join('').trim()
}

/* The spec's props table */

/** One row of a markdown table in the spec's Props section, by its column names. */
export interface SpecPropRow {
  /** The props a row names: `className`, `style` and `ref` share one row */
  names: string[]
  type: string
  default: string
  description: string
}

/** A table row's cells, split on the pipes a cell does not escape. */
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replaceAll('\\|', '|'))

/** The first markdown table in `text`, as rows keyed by the header's lowercased names. */
function firstTable(text: string) {
  const lines = text.split('\n')
  const start = lines.findIndex((l, i) => l.startsWith('|') && /^\|[\s:|-]+\|$/.test(lines[i + 1]))
  if (start < 0) return []
  const head = cells(lines[start]).map((h) => h.toLowerCase())
  const rows: Record<string, string>[] = []
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith('|')) break
    const row = cells(line)
    rows.push(Object.fromEntries(head.map((h, i) => [h, row[i] ?? ''])))
  }
  return rows
}

const unquote = (s: string) => s.replace(/^`|`$/g, '')

/**
 * The spec's props table for the component `name`: the table under `### <name>` in its Props
 * section when the section has one per part, otherwise the section's first table.
 */
export function specPropsTable(markdown: string, name: string): SpecPropRow[] {
  if (!hasSection(markdown, 'Props')) return []
  const section = specProse(markdown, ['Props'])
  const own = sections(section).find((s) => s.level === 3 && s.heading === name)
  return firstTable(own?.text ?? section).map((r) => {
    const named = [...(r.name ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1])
    return {
      names: named.length ? named : (r.name ?? '').split(/,\s*/).filter(Boolean),
      type: unquote(r.type ?? ''),
      default: r.default ?? '',
      description: r.description ?? '',
    }
  })
}

/** One row of the page's props table, in MUI's columns. */
export interface PropRow {
  name: string
  /** A caller must give it: api.json lists it as not optional */
  required: boolean
  /** Its type, with string literals in single quotes, as the spec writes them */
  type: string
  /** Its default as markdown, or empty when it has none */
  default: string
  /** Its description as markdown, from the spec */
  description: string
}

/** A union member as the page writes it: `"solid"` as `'solid'`. */
const shown = (member: string) => member.replace(/^"(.*)"$/, "'$1'")

/** The members of a spec type cell such as `'solid' | 'outline'`, with double quotes. */
const specMembers = (type: string) =>
  type
    .replace(/`/g, '')
    .split('|')
    .map((m) => m.trim().replace(/^'(.*)'$/, '"$1"'))

/** The api's members, in the spec's order when the spec's type lists the same ones. */
function ordered(members: string[], specType?: string) {
  if (!specType) return members
  const spec = specMembers(specType)
  const same = spec.length === members.length && spec.every((m) => members.includes(m))
  return same ? spec : members
}

/** The longest type the table shows from api.json before it prefers the spec's shorter text. */
const LONG_TYPE = 60

/**
 * The props table: one row per prop api.json gives the component, in the spec's order, then the
 * props the spec leaves out in api.json's order. The type is api.json's, its union in the spec's
 * order; a type too long to read is the spec's own text where it has one. Default and description
 * come from the spec.
 */
export function propRows(api: ComponentApi, spec: SpecPropRow[]): PropRow[] {
  const bySpec = new Map(spec.flatMap((r) => r.names.map((n) => [n, r] as const)))
  const names = Object.keys(api.props)
  const order = [
    ...spec.flatMap((r) => r.names).filter((n) => names.includes(n)),
    ...names.filter((n) => !bySpec.has(n)),
  ]
  return [...new Set(order)].map((name) => {
    const prop = api.props[name]
    const row = bySpec.get(name)
    const ownType = row && row.names.length === 1 ? row.type : undefined
    let type = ordered(prop.type, ownType).map(shown).join(' | ')
    if (type.length > LONG_TYPE && ownType) type = ownType
    const parts = spec.flatMap((r) => r.names).filter((n) => n.startsWith(`${name}.`))
    const defaultText = row?.default.trim() ?? ''
    return {
      name,
      required: !prop.optional,
      type,
      default: /^(none|)$/i.test(defaultText) ? '' : defaultText,
      description:
        row?.description ??
        (parts.length
          ? `Props for each part: ${parts.map((p) => `\`${p.slice(name.length + 1)}\``).join(', ')}.`
          : ''),
    }
  })
}

/* The matrix: the variant and colour values, by the states the stylesheet can force */

/** The props the matrix crosses, in its rows' order. */
export const MATRIX_AXES = ['variant', 'color'] as const

/** The states a matrix column can show, in order. */
export const STATES = ['rest', 'hover', 'pressed', 'focus', 'disabled'] as const
export type State = (typeof STATES)[number]

/** The pseudo-class each forced state stands for. */
const PSEUDO = { hover: ':hover', pressed: ':active', focus: ':focus-visible' } as const
type Forced = keyof typeof PSEUDO

/** The attribute a matrix cell's component carries to show a state: `data-site-state`. */
export const STATE_ATTRIBUTE = 'data-site-state'

/**
 * The string-literal members of the prop's union, such as `['solid', 'outline']` for Button's
 * `variant`, in the spec's order; empty for a prop that is not such a union.
 */
export function unionValues(api: ComponentApi, prop: string, spec: SpecPropRow[] = []) {
  const members = api.props[prop]?.type ?? []
  if (members.length < 2 || !members.every((m) => /^"[^"]*"$/.test(m))) return []
  const row = spec.find((r) => r.names.length === 1 && r.names[0] === prop)
  return ordered(members, row?.type).map((m) => m.slice(1, -1))
}

/** A row of the matrix: its words and the props that draw it. */
export interface MatrixRow {
  key: string
  label: string
  props: Record<string, string>
}

export interface Matrix {
  /** The props crossed, each with its values */
  axes: { prop: string; values: string[] }[]
  rows: MatrixRow[]
  /** Its columns */
  states: State[]
  /** Every value of each axis meets every value of the others, so a phone can pick one row */
  crossed: boolean
}

/** A value as a row's words: `solid` as `Solid`, `body-sm` as `Body sm`. */
export const valueLabel = (value: string, first = true) => {
  const words = value.replaceAll('-', ' ')
  return first ? words.charAt(0).toUpperCase() + words.slice(1) : words
}

/** The most rows the matrix crosses in full; past it, each value shows once beside the defaults. */
const MAX_CROSSED = 12

/**
 * The matrix of the entry's variant and colour values by its states: rest, then hover, pressed and
 * focus when its stylesheet can force them, then disabled when it takes `disabled`. Undefined when
 * there is only one cell to draw.
 */
export function stateMatrix(
  api: ComponentApi,
  spec: SpecPropRow[],
  styles: Pick<StateStyles, 'forceable'>,
): Matrix | undefined {
  const axes = MATRIX_AXES.map((prop) => ({ prop, values: unionValues(api, prop, spec) })).filter(
    (a) => a.values.length,
  )
  const states: State[] = [
    'rest',
    ...(styles.forceable ? (['hover', 'pressed', 'focus'] as const) : []),
    ...('disabled' in api.props ? (['disabled'] as const) : []),
  ]
  const size = axes.reduce((n, a) => n * a.values.length, 1)
  const crossed = size <= MAX_CROSSED
  const combos: Record<string, string>[] = crossed
    ? axes.reduce<Record<string, string>[]>(
        (acc, a) => acc.flatMap((c) => a.values.map((v) => ({ ...c, [a.prop]: v }))),
        [{}],
      )
    : axes.flatMap((a) => a.values.map((v) => ({ [a.prop]: v })))
  const rows = combos.map((props) => {
    const values = Object.values(props)
    return {
      key: values.join('-') || 'default',
      label: values.map((v, i) => valueLabel(v, i === 0)).join(' · ') || 'Default',
      props,
    }
  })
  if (rows.length < 2 && states.length < 2) return undefined
  return { axes, rows, states, crossed }
}

/** The props that draw one matrix cell: the row's, and the state's attribute or `disabled`. */
export function cellProps(row: MatrixRow, state: State): Record<string, unknown> {
  if (state === 'rest') return row.props
  if (state === 'disabled') return { ...row.props, disabled: true }
  return { ...row.props, [STATE_ATTRIBUTE]: state }
}

/* State styles, from the component's own stylesheet */

export interface StateStyles {
  /** The rules that draw hover, pressed and focus, scoped to `scope` and keyed by the attribute */
  css: string
  /** The stylesheet styles hover or pressed on the root, where a cell's attribute lands */
  forceable: boolean
  /** Its own stylesheet styles a state somewhere: on the root, or only on its inner parts */
  styled: boolean
}

const STATE_PSEUDO = /:(hover|active|focus-visible)(?![\w-])/g
const HAS_STATE = new RegExp(STATE_PSEUDO.source)
const STATE_OF: Record<string, Forced> = {
  ':hover': 'hover',
  ':active': 'pressed',
  ':focus-visible': 'focus',
}

/**
 * The compound selector a pseudo-class at `at` belongs to: back to the nearest combinator, comma
 * or opening paren outside brackets and parens.
 */
function compoundBefore(selector: string, at: number) {
  let depth = 0
  for (let i = at - 1; i >= 0; i--) {
    const c = selector[i]
    if (c === ')' || c === ']') depth++
    else if (c === '(' || c === '[') {
      if (depth === 0) return selector.slice(i + 1, at)
      depth--
    } else if (depth === 0 && /[\s>+~,]/.test(c)) return selector.slice(i + 1, at)
  }
  return selector.slice(0, at)
}

/** The at-rules around a node, innermost first. */
function atRulesAround(node: ChildNode) {
  const out: AtRule[] = []
  for (let p: Container | undefined = node.parent as Container; p; p = p.parent as Container)
    if (p.type === 'atrule') out.push(p as AtRule)
  return out
}

/**
 * The state rules of the component's stylesheet, `own`, and of the page's, `shared`, rewritten for a still preview: each style rule whose selector holds
 * `:hover`, `:active` or `:focus-visible` gets that pseudo-class as `[data-site-state="hover"]`,
 * `"pressed"` or `"focus"`, inside `scope`. A hover rule leaves its `(hover: hover)` query, so a
 * touch screen shows it too, and a forced-colours reset is left out, as a story's browser leaves it.
 * `root` is the component's root class, `pn-Button`: a state set there is one a cell can force.
 */
export function stateStyles(
  own: string,
  shared: string[],
  root: string,
  scope: string,
): StateStyles {
  const out = postcss.root()
  const rootClass = new RegExp(`\\.${root}(?![\\w-])`)
  let forceable = false
  let styled = false
  for (const sheet of [own, ...shared]) {
    postcss.parse(sheet).walkRules((rule: Rule) => {
      const around = atRulesAround(rule)
      if (around.some((a) => a.name === 'media' && a.params.includes('forced-colors'))) return
      const selectors = rule.selectors.filter((s) => HAS_STATE.test(s))
      if (!selectors.length) return
      if (sheet === own) styled = true
      for (const s of selectors)
        for (const m of s.matchAll(STATE_PSEUDO))
          if (STATE_OF[m[0]] !== 'focus' && rootClass.test(compoundBefore(s, m.index)))
            forceable = true
      let node: Container | Rule = rule.clone({
        selectors: selectors.map(
          (s) =>
            `${scope} ${s.replace(STATE_PSEUDO, (p) => `[${STATE_ATTRIBUTE}="${STATE_OF[p]}"]`)}`,
        ),
      })
      for (const a of around) {
        if (a.name === 'media' && /\(hover:\s*hover\)/.test(a.params)) continue
        node = a.clone({ nodes: [] }).append(node)
      }
      out.append(node)
    })
  }
  return { css: out.toString(), forceable, styled }
}

/** The stylesheet that draws the focus ring on every page, as the package ships it. */
const BASE_CSS = 'packages/perron/styles/base.css'

/** The entry's stylesheet as the package ships it, beside its built code in `dist`. */
export const shippedCss = (name: string, layer: Layer) =>
  `packages/perron/dist/${folderOf(layer)}/${name}/${name}.css`

/** The entry's stylesheet as the package ships it, or empty for an entry with none. */
export function readShippedCss(entry: Pick<RegistryEntry, 'name' | 'layer'>) {
  const path = shippedCss(entry.name, entry.layer)
  return repoFileExists(path) ? readRepoFile(path) : ''
}

/**
 * The entry's state styles for its matrix, from its stylesheet in the built package and the focus
 * ring in base.css. The site's build builds the package first.
 */
export const entryStateStyles = (entry: Pick<RegistryEntry, 'name' | 'layer'>, scope: string) =>
  stateStyles(readShippedCss(entry), [readRepoFile(BASE_CSS)], `pn-${entry.name}`, scope)

/* Sizes */

export interface SizeSpec {
  value: string
  /** The size token the stylesheet sets the root's height to, such as `size.button` */
  token?: string
  /** That token's value, as the page writes it: `36 px` */
  measure?: string
}

/**
 * Each size value with the token its stylesheet gives the root's block size: the
 * `[data-size='<value>']` rule's, or the root rule's for the default size.
 */
export function sizeSpecs(css: string, name: string, values: string[], fallback?: string) {
  const heights = new Map<string, string>()
  postcss.parse(css).walkDecls(/^(block-size|height)$/, (decl) => {
    const rule = decl.parent as Rule
    if (rule.type !== 'rule') return
    const token = /var\((--perron-[\w-]+)\)/.exec(decl.value)?.[1]
    if (!token) return
    for (const s of rule.selectors) {
      const sized = new RegExp(`^\\.pn-${name}\\[data-size=['"]?([\\w-]+)['"]?\\]$`).exec(s)
      if (sized) heights.set(sized[1], token)
      else if (s === `.pn-${name}` && fallback) heights.set(`default:${fallback}`, token)
    }
  })
  const tokens = readTokenData()
  return values.map((value): SizeSpec => {
    const cssVar = heights.get(value) ?? heights.get(`default:${value}`)
    const token = tokens.find((t) => t.cssVar === cssVar)
    const px = token ? Object.values(token.values)[0].css : undefined
    return { value, token: token?.name, measure: px?.replace(/^([\d.]+)px$/, '$1 px') }
  })
}

/** The default of a prop as the spec writes it, `'medium'`, as a bare value, `medium`. */
export const bareDefault = (spec: SpecPropRow[], prop: string) =>
  spec
    .find((r) => r.names.includes(prop))
    ?.default.replace(/`/g, '')
    .replace(/^'(.*)'$/, '$1') || undefined

/* Links and the install strip */

/** The import line of an entry: from `@mylder/perron`, or `@mylder/perron/patterns`. */
export const importLine = (entry: Pick<RegistryEntry, 'name' | 'layer'>) =>
  `import { ${entry.name} } from '@mylder/perron${entry.layer === 'pattern' ? '/patterns' : ''}'`

/**
 * The page of Base UI's bundled docs that `get_reference` reads for a component, as
 * packages/mcp/src/reference.ts finds it. Checked here rather than by calling it, whose folder
 * listing the site's bundler would trace; the unit test holds the two to the same answer.
 */
export const baseUiDoc = (component: string) =>
  `node_modules/@base-ui/react/docs/react/components/${kebab(component)}.md`

/**
 * What to ask the Perron MCP about the entry: `get_reference` for each Base UI component its parts
 * come from that the bundled docs have a page for, or `search_docs` for its name when none.
 */
export function agentCalls(entry: Pick<RegistryEntry, 'name' | 'baseUiParts'>) {
  const components = [...new Set(entry.baseUiParts.map((p) => p.split('.')[0]))].filter((c) =>
    repoFileExists(baseUiDoc(c)),
  )
  return components.length
    ? components.map((c) => `get_reference({ library: "base-ui", component: "${c}" })`)
    : [`search_docs({ query: "${entry.name}" })`]
}

/** The published Storybook: the repository's GitHub Pages site. */
const STORYBOOK_URL = REPO_URL.replace(
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)$/,
  'https://$1.github.io/$2/',
)

/** The entry's docs page in the published Storybook, from its stories' title, or undefined. */
export function storybookUrl(entry: Pick<RegistryEntry, 'name' | 'layer'>) {
  const path = `packages/perron/src/${folderOf(entry.layer)}/${entry.name}/${entry.name}.stories.tsx`
  if (!repoFileExists(path)) return undefined
  const title = /\btitle:\s*'([^']+)'/.exec(readRepoFile(path))?.[1]
  if (!title) return undefined
  const id = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${STORYBOOK_URL}?path=/docs/${id}--docs`
}

/** The words of each status, in sentence case. */
export const STATUS_LABEL: Record<RegistryEntry['status'], string> = {
  designing: 'In design',
  building: 'Building',
  stable: 'Stable',
  deprecated: 'Deprecated',
}
