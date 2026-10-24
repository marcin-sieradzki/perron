// The `penpot` rule: each design read back from Penpot into `penpot/<name>.json` binds only tokens
// that exist and leaves no fill, stroke, radius, padding or gap unbound, and its code map,
// `penpot/<name>.code-map.json`, covers every variant value and named layer (penpot/README.md,
// "Read-back"). The files are JSON, which has no comments, so this rule takes no perron-allow.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE } from '../lib/paths.ts'
import { loadTokens, type TokenSources } from '../lib/tokens.ts'
import type { Check, Problem } from './lib.ts'

const RULE = 'penpot'
const DIR = 'penpot'

/** Top, right, bottom and left; for a radius, top-left, top-right, bottom-right and bottom-left. */
type Sides = [number, number, number, number]

/** One layer of a design, as `readBack` in penpot/helpers.js writes it. */
export interface Layer {
  /** The part name; a variant's top layer is always `root` */
  name: string
  type: string
  id: string
  size: { width: number; height: number; horizontal?: string; vertical?: string }
  layout?: {
    type: 'flex' | 'grid'
    dir?: string
    wrap?: string
    alignItems?: string
    justifyContent?: string
    rowGap: number
    columnGap: number
    padding: Sides
    horizontal?: string
    vertical?: string
  }
  /** Solid fill colours, `#rrggbb` or `#rrggbbaa`; a gradient or image fill is `null` */
  fills: (string | null)[]
  strokes: { color: string | null; width: number }[]
  radius?: Sides
  /** Bound tokens, from Penpot property to token name */
  tokens: Record<string, string>
  /** A text layer's characters */
  text?: string
  children?: Layer[]
}

/** A design read back from Penpot: `penpot/<name>.json`. */
export interface ReadBack {
  component: string
  page: string
  fileId: string
  /** The variant container, or the main instance of a component without variants */
  containerId: string
  /** Each variant property with its values, in Penpot's order */
  properties: Record<string, string[]>
  variants: {
    componentId: string
    props: Record<string, string>
    /** SHA-256 of each export, hex */
    exports: { png: string; svg: string }
    root: Layer
  }[]
}

/** Where a Penpot variant property lands in code: a React prop, or CSS states. */
export type PropertyMap =
  | { prop: string; values: Record<string, string | number | boolean> }
  | { state: Record<string, string | null> }

/** A design's code map: `penpot/<name>.code-map.json`. */
export interface CodeMap {
  component: string
  properties: Record<string, PropertyMap>
  /** Penpot layer name to part name */
  layers: Record<string, string>
}

/** The Penpot token properties that bind each kind of value, side by side with `Sides`. */
const PADDING = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']
const RADIUS = [
  'borderRadiusTopLeft',
  'borderRadiusTopRight',
  'borderRadiusBottomRight',
  'borderRadiusBottomLeft',
]

/** Every layer under and including `root`, with its path for messages. */
function layers(root: Layer, at: string): { layer: Layer; path: string }[] {
  const path = `${at} › ${root.name}`
  return [{ layer: root, path }, ...(root.children ?? []).flatMap((c) => layers(c, path))]
}

const variantLabel = (props: Record<string, string>) =>
  Object.entries(props)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ') || 'default'

/** Each value a layer sets that no token binds, by kind. */
function unbound(layer: Layer): string[] {
  const t = layer.tokens
  const out: string[] = []
  if (layer.fills.length && !t.fill) out.push('fill')
  if (layer.strokes.length) {
    if (!t.strokeColor) out.push('stroke colour')
    if (layer.strokes.some((s) => s.width) && !t.strokeWidth) out.push('stroke width')
  }
  layer.radius?.forEach((r, i) => {
    if (r && !t[RADIUS[i]]) out.push(RADIUS[i])
  })
  if (layer.layout) {
    layer.layout.padding.forEach((p, i) => {
      if (p && !t[PADDING[i]]) out.push(PADDING[i])
    })
    if (layer.layout.rowGap && !t.rowGap) out.push('rowGap')
    if (layer.layout.columnGap && !t.columnGap) out.push('columnGap')
  }
  return out
}

/** The problems of one read-back: tokens that don't exist and values no token binds. */
export function readBackProblems(file: string, design: ReadBack, tokens: Set<string>): Problem[] {
  const problems: Problem[] = []
  for (const v of design.variants)
    for (const { layer, path } of layers(v.root, variantLabel(v.props))) {
      for (const [property, name] of Object.entries(layer.tokens))
        if (!tokens.has(name))
          problems.push({
            file,
            message: `${path} binds ${property} to ${name}, which is not a token in ${PACKAGE}/tokens/`,
          })
      for (const kind of unbound(layer))
        problems.push({ file, message: `${path} has an unbound ${kind}; bind it to a token` })
    }
  return problems
}

/** The problems of a code map against its read-back: variant values and layers it doesn't map. */
export function codeMapProblems(file: string, design: ReadBack, map: CodeMap): Problem[] {
  const problems: Problem[] = []
  for (const [property, values] of Object.entries(design.properties)) {
    const entry = map.properties[property]
    if (!entry) {
      problems.push({ file, message: `maps no prop or state for the property ${property}` })
      continue
    }
    const mapped = 'prop' in entry ? entry.values : entry.state
    for (const value of values)
      if (!(value in mapped))
        problems.push({ file, message: `maps nothing for ${property}=${value}` })
  }
  const names = new Set(
    design.variants.flatMap((v) => layers(v.root, '').map(({ layer }) => layer.name)),
  )
  for (const name of names)
    if (!(name in map.layers))
      problems.push({ file, message: `maps no part for the layer ${name}` })
  return problems
}

/** Every token name the build defines, in any theme or modifier context. */
export function tokenNames(root: string): Set<string> {
  const dir = join(root, PACKAGE, 'tokens')
  const read = (f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8'))
  const resolver = read('perron.resolver.json')
  const refs = JSON.stringify(resolver).match(/[\w.-]+\.tokens\.json/g) ?? []
  const sources: TokenSources = {
    resolver,
    files: Object.fromEntries([...new Set(refs)].map((f) => [f, read(f)])),
  }
  const t = loadTokens(sources)
  const all = [
    ...t.base,
    ...Object.values(t.themes).flat(),
    ...Object.values(t.overrides).flatMap((m) => Object.values(m.contexts).flat()),
  ]
  return new Set(all.map((x) => x.name))
}

/** The problems of every design in `dir` (from `root`), against the tokens at `root`. */
export function designProblems(root: string, dir: string): Problem[] {
  if (!existsSync(join(root, dir))) return []
  const files = readdirSync(join(root, dir)).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.code-map.json'),
  )
  if (!files.length) return []
  const tokens = tokenNames(root)
  const read = (rel: string) => JSON.parse(readFileSync(join(root, rel), 'utf8'))
  return files.sort().flatMap((f) => {
    const file = `${dir}/${f}`
    const mapFile = file.replace(/\.json$/, '.code-map.json')
    const design = read(file) as ReadBack
    const problems = readBackProblems(file, design, tokens)
    if (!existsSync(join(root, mapFile)))
      return [...problems, { file: mapFile, message: `${design.component} has no code map` }]
    return [...problems, ...codeMapProblems(mapFile, design, read(mapFile) as CodeMap)]
  })
}

const check: Check = {
  rule: RULE,
  run: (root) => designProblems(root, DIR),
}

export default check
