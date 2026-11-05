// A spec's Props table, and the props table a docs page builds from it and api.json: the rows from
// api.json, in the spec's order, with the spec's defaults and descriptions. Node-free: the docs
// site's spec pages and the component data the Perron MCP reads (data.ts) share it.
import { specProse } from '../../storybook/blocks/component-page.ts'
import { sections } from '../../packages/mcp/src/markdown.ts'
import type { ComponentApi } from './api.ts'
import { tablesIn } from './usage.ts'

/** One row of a markdown table in the spec's Props section, by its column names. */
export interface SpecPropRow {
  /** The props a row names: `className`, `style` and `ref` share one row */
  names: string[]
  type: string
  default: string
  description: string
}

/** The first markdown table in `text`, as rows keyed by the header's lowercased names. */
function propTable(text: string): Record<string, string>[] {
  const lines = text.split('\n').map((l, i) => ({ text: l.trim(), line: i + 1 }))
  const [table] = tablesIn(lines)
  if (!table) return []
  const columns = table.columns.map((c) => c.toLowerCase())
  return table.rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, r.cells[i] ?? ''])))
}

/** A cell that is one code span, as its code; any other cell, such as Base UI's `render`, whole. */
const unquote = (s: string) => (/^`[^`]*`$/.test(s) ? s.slice(1, -1) : s)

/**
 * The spec's props table for the component `name`: the table under `### <name>` in its Props
 * section when the section has one per part, otherwise the section's first table.
 */
export function specPropsTable(markdown: string, name: string): SpecPropRow[] {
  if (!/^## Props\s*$/m.test(markdown)) return []
  const section = specProse(markdown, ['Props'])
  const own = sections(section).find((s) => s.level === 3 && s.heading === name)
  return propTable(own?.text ?? section).map((r) => {
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
export function ordered(members: string[], specType?: string) {
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
