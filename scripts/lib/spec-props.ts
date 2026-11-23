// The props table a docs page builds from a spec's Props table and api.json: the rows from
// api.json, in the spec's order, with the spec's defaults and descriptions. The spec's table is
// read by scripts/lib/spec-reader.ts. Node-free: the docs site's spec pages and the component data
// the Perron MCP reads (data.ts) share it.
import type { ComponentApi } from './api.ts'
import type { SpecProp } from './spec-reader.ts'

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
export function propRows(api: ComponentApi, spec: SpecProp[]): PropRow[] {
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
