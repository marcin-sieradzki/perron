// Checks token files against the Design Tokens Format Module 2025.10 and its Color Module: names,
// reserved properties, every type's value syntax, and that references land on a token of the right
// type. Returns one line per problem; an empty list means the files conform.

import type { TokenSources } from './tokens.ts'

type Json = { [key: string]: unknown }

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const REF = /^\{([^{}]+)\}$/

const TYPES = new Set([
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'duration',
  'cubicBezier',
  'number',
  'strokeStyle',
  'border',
  'transition',
  'shadow',
  'gradient',
  'typography',
])
const TOKEN_PROPS = new Set(['$value', '$type', '$description', '$extensions', '$deprecated'])
const GROUP_PROPS = new Set(['$type', '$description', '$extensions', '$deprecated'])
const COLOR_SPACES = new Set([
  'srgb',
  'srgb-linear',
  'hsl',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'display-p3',
  'a98-rgb',
  'prophoto-rgb',
  'rec2020',
  'xyz-d65',
  'xyz-d50',
])
const FONT_WEIGHTS = new Set([
  'thin',
  'hairline',
  'extra-light',
  'ultra-light',
  'light',
  'normal',
  'regular',
  'book',
  'medium',
  'semi-bold',
  'demi-bold',
  'bold',
  'extra-bold',
  'ultra-bold',
  'black',
  'heavy',
  'extra-black',
  'ultra-black',
])
const STROKE_STYLES = new Set([
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'outset',
  'inset',
])
// Sub-values of each composite type, with their types; `?` marks an optional one.
const COMPOSITES: Record<string, Record<string, string>> = {
  typography: {
    fontFamily: 'fontFamily',
    fontSize: 'dimension',
    fontWeight: 'fontWeight',
    letterSpacing: 'dimension',
    lineHeight: 'number',
  },
  shadow: {
    color: 'color',
    offsetX: 'dimension',
    offsetY: 'dimension',
    blur: 'dimension',
    spread: 'dimension',
    'inset?': 'boolean',
  },
  border: { color: 'color', width: 'dimension', style: 'strokeStyle' },
  transition: { duration: 'duration', delay: 'duration', timingFunction: 'cubicBezier' },
  gradientStop: { color: 'color', position: 'number' },
}

interface Entry {
  name: string
  file: string
  type?: string
  node: Json
}

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function collect(tree: Json, file: string, groupType: string | undefined, path: string[]) {
  const entries: Entry[] = []
  const problems: string[] = []
  const where = (p: string[]) => `${file} ${p.join('.') || '(root)'}`
  const checkMeta = (node: Json, p: string[]) => {
    if (node.$type !== undefined && !TYPES.has(node.$type as string))
      problems.push(`${where(p)}: unknown $type ${JSON.stringify(node.$type)}`)
    if (node.$description !== undefined && typeof node.$description !== 'string')
      problems.push(`${where(p)}: $description must be a string`)
    if (node.$deprecated !== undefined && !['boolean', 'string'].includes(typeof node.$deprecated))
      problems.push(`${where(p)}: $deprecated must be a boolean or a string`)
    if (node.$extensions !== undefined) {
      if (!isObject(node.$extensions)) problems.push(`${where(p)}: $extensions must be an object`)
      else
        for (const k of Object.keys(node.$extensions))
          if (!k.includes('.'))
            problems.push(`${where(p)}: extension key "${k}" should be a reverse domain name`)
    }
  }
  const walk = (node: Json, inherited: string | undefined, p: string[]) => {
    checkMeta(node, p)
    const type = (node.$type as string | undefined) ?? inherited
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) {
        if (key === '$root' || key === '$extends')
          problems.push(`${where(p)}: ${key} is valid 2025.10 but this build does not read it yet`)
        else if (!GROUP_PROPS.has(key) && !(key === '$schema' && p.length === 0))
          problems.push(`${where(p)}: unknown group property ${key}`)
        continue
      }
      const here = [...p, key]
      if (/[{}.]/.test(key)) problems.push(`${where(here)}: names must not contain { } or .`)
      if (!isObject(child)) {
        problems.push(`${where(here)}: must be a token or a group object`)
        continue
      }
      if (!('$value' in child)) {
        walk(child, type, here)
        continue
      }
      checkMeta(child, here)
      for (const k of Object.keys(child))
        if (!k.startsWith('$')) problems.push(`${where(here)}: a token cannot also hold "${k}"`)
        else if (!TOKEN_PROPS.has(k)) problems.push(`${where(here)}: unknown token property ${k}`)
      entries.push({
        name: here.join('.'),
        file,
        type: (child.$type as string | undefined) ?? type,
        node: child,
      })
    }
  }
  walk(tree, groupType, path)
  return { entries, problems }
}

/**
 * Replaces JSON Pointer references (`{ "$ref": "#/palette/neutral/900/$value/components" }`) with
 * the value they point at. Pointers resolve within their own file, as the format defines them.
 */
export function inlinePointers(file: Json): Json {
  const at = (pointer: string) =>
    pointer
      .slice(2)
      .split('/')
      .map((s) => s.replaceAll('~1', '/').replaceAll('~0', '~'))
      .reduce<unknown>(
        (node, key) => (isObject(node) || Array.isArray(node) ? (node as Json)[key] : undefined),
        file,
      )
  const walk = (v: unknown, trail: string[]): unknown => {
    if (Array.isArray(v)) return v.map((x) => walk(x, trail))
    if (!isObject(v)) return v
    const pointer = v.$ref
    if (typeof pointer === 'string' && Object.keys(v).length === 1) {
      if (!pointer.startsWith('#/'))
        throw new Error(`Only same-file JSON Pointers resolve: ${pointer}`)
      if (trail.includes(pointer))
        throw new Error(`JSON Pointer cycle: ${[...trail, pointer].join(' → ')}`)
      const target = at(pointer)
      if (target === undefined) throw new Error(`JSON Pointer ${pointer} points at nothing`)
      return walk(target, [...trail, pointer])
    }
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, trail)]))
  }
  return walk(file, []) as Json
}

/** Every problem in the token files the resolver names, checked in each theme context. */
export function validateSources({ resolver, files }: TokenSources) {
  const sets = resolver.sets as Record<string, { sources: { $ref: string }[] }>
  const modifiers = resolver.modifiers as Record<
    string,
    { contexts: Record<string, { $ref: string }[]> }
  >
  const problems = new Set<string>()
  const load = (refs: { $ref: string }[]) =>
    refs.flatMap(({ $ref }) => {
      const r = collect(inlinePointers(files[$ref]), $ref, undefined, [])
      r.problems.forEach((p) => problems.add(p))
      return r.entries
    })
  const base = load(Object.values(sets).flatMap((s) => s.sources))
  const contexts = Object.values(modifiers).flatMap((m) =>
    Object.values(m.contexts).map((refs) => [...base, ...load(refs)]),
  )
  for (const entries of contexts.length ? contexts : [base]) {
    const byName = new Map(entries.map((e) => [e.name, e]))
    const typeOf = (e: Entry, trail: string[] = []): string | undefined => {
      if (e.type) return e.type
      const m = typeof e.node.$value === 'string' ? REF.exec(e.node.$value) : null
      const target = m ? byName.get(m[1]) : undefined
      return target && !trail.includes(target.name) ? typeOf(target, [...trail, e.name]) : undefined
    }
    for (const e of entries) {
      const type = typeOf(e)
      const at = `${e.file} ${e.name}`
      if (!type) problems.add(`${at}: no $type, and none to inherit`)
      else checkValue(type, e.node.$value, at, byName, typeOf, problems)
    }
  }
  return [...problems]
}

function checkValue(
  type: string,
  value: unknown,
  at: string,
  byName: Map<string, Entry>,
  typeOf: (e: Entry) => string | undefined,
  problems: Set<string>,
) {
  const bad = (why: string) => problems.add(`${at}: ${why}`)
  const sub = (t: string, v: unknown, key: string) =>
    checkValue(t, v, `${at} ${key}`, byName, typeOf, problems)
  if (typeof value === 'string' && REF.test(value)) {
    const target = byName.get(REF.exec(value)![1])
    if (!target) return bad(`reference ${value} is not a token`)
    const t = typeOf(target)
    if (t !== type) bad(`reference ${value} is a ${t}, expected a ${type}`)
    return
  }
  const fields = (v: Json, spec: Record<string, string>) => {
    for (const [k, t] of Object.entries(spec)) {
      const key = k.replace('?', '')
      if (!(key in v)) {
        if (!k.endsWith('?')) bad(`missing ${key}`)
      } else if (t === 'boolean') {
        if (typeof v[key] !== 'boolean') bad(`${key} must be true or false`)
      } else sub(t, v[key], key)
    }
    const known = new Set(Object.keys(spec).map((k) => k.replace('?', '')))
    for (const k of Object.keys(v)) if (!known.has(k)) bad(`unknown sub-value ${k}`)
  }
  switch (type) {
    case 'color': {
      if (!isObject(value)) return bad('a colour is an object with colorSpace and components')
      const { colorSpace, components, alpha, hex } = value
      if (!COLOR_SPACES.has(colorSpace as string)) bad(`unknown colorSpace ${String(colorSpace)}`)
      if (
        !Array.isArray(components) ||
        components.length !== 3 ||
        !components.every((c) => isNumber(c) || c === 'none')
      )
        bad('components must be three numbers or "none"')
      else if (colorSpace === 'srgb' && components.some((c) => isNumber(c) && (c < 0 || c > 1)))
        bad('srgb components are 0 to 1')
      if (alpha !== undefined && (!isNumber(alpha) || alpha < 0 || alpha > 1))
        bad('alpha is a number from 0 to 1')
      if (hex !== undefined) {
        if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex))
          bad('hex is a 6-digit CSS hex colour')
        // Perron's own rule: the hex fallback is exactly the colour, not an approximation
        else if (colorSpace === 'srgb' && Array.isArray(components)) {
          const fromComponents = components
            .map((c) =>
              Math.round((c as number) * 255)
                .toString(16)
                .padStart(2, '0'),
            )
            .join('')
          if (fromComponents !== hex.slice(1).toLowerCase())
            bad(`hex ${hex} does not match its components`)
        }
      }
      for (const k of Object.keys(value))
        if (!['colorSpace', 'components', 'alpha', 'hex'].includes(k)) bad(`unknown property ${k}`)
      return
    }
    case 'dimension':
    case 'duration': {
      const units = type === 'dimension' ? ['px', 'rem'] : ['ms', 's']
      if (!isObject(value) || !isNumber(value.value) || !units.includes(value.unit as string))
        return bad(`a ${type} is { value: number, unit: ${units.join(' | ')} }`)
      if (Object.keys(value).length !== 2) bad(`a ${type} has only value and unit`)
      return
    }
    case 'fontFamily':
      if (
        typeof value !== 'string' &&
        !(Array.isArray(value) && value.length && value.every((f) => typeof f === 'string'))
      )
        bad('a font family is a name or a list of names')
      return
    case 'fontWeight':
      if (isNumber(value) ? value < 1 || value > 1000 : !FONT_WEIGHTS.has(value as string))
        bad('a font weight is 1 to 1000 or a weight keyword')
      return
    case 'number':
      if (!isNumber(value)) bad('a number token holds a JSON number')
      return
    case 'cubicBezier':
      if (
        !Array.isArray(value) ||
        value.length !== 4 ||
        !value.every(isNumber) ||
        [value[0], value[2]].some((x) => x < 0 || x > 1)
      )
        bad('a cubic Bézier is [x1, y1, x2, y2] with x in 0 to 1')
      return
    case 'strokeStyle':
      if (typeof value === 'string') {
        if (!STROKE_STYLES.has(value)) bad(`unknown stroke style ${value}`)
        return
      }
      if (!isObject(value) || !Array.isArray(value.dashArray))
        return bad('a stroke style is a keyword or { dashArray, lineCap }')
      value.dashArray.forEach((d, i) => sub('dimension', d, `dashArray[${i}]`))
      if (!['round', 'butt', 'square'].includes(value.lineCap as string))
        bad('lineCap is round, butt or square')
      for (const k of Object.keys(value))
        if (k !== 'dashArray' && k !== 'lineCap') bad(`unknown property ${k}`)
      return
    case 'shadow':
    case 'gradient': {
      const list = Array.isArray(value) ? value : type === 'shadow' ? [value] : null
      if (!list) return bad('a gradient is a list of stops')
      list.forEach((item, i) => {
        if (typeof item === 'string' && REF.test(item)) sub(type, item, `[${i}]`)
        else if (isObject(item))
          fields(item, COMPOSITES[type === 'shadow' ? 'shadow' : 'gradientStop'])
        else bad(`[${i}] must be an object or a reference`)
      })
      return
    }
    case 'typography':
    case 'border':
    case 'transition':
      if (!isObject(value)) return bad(`a ${type} is an object`)
      fields(value, COMPOSITES[type])
      return
  }
}
