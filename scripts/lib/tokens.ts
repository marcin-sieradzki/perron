// Turns Perron's DTCG 2025.10 token files into CSS custom properties, a typed TS module and a
// Penpot import file. Pure functions only; scripts/build-tokens.ts does the file I/O.

type Json = { [key: string]: unknown }

export interface Token {
  /** Dot path, for example `color.text.primary` */
  name: string
  type: string
  value: unknown
  description?: string
  extensions?: Json
}

export interface TokenSources {
  resolver: Json
  /** File contents keyed by the `$ref` used in the resolver */
  files: Record<string, Json>
}

export interface ResolvedTokens {
  /** Tokens from the always-on sets */
  base: Token[]
  /** Tokens from each theme context, keyed by context name */
  themes: Record<string, Token[]>
  defaultTheme: string
}

const REF = /^\{([^{}]+)\}$/
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

function flatten(tree: Json, inheritedType: string | undefined, path: string[], out: Token[]) {
  const groupType = (tree.$type as string | undefined) ?? inheritedType
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith('$') || !isObject(node)) continue
    if (/[.{}]/.test(key))
      throw new Error(`Invalid token or group name "${key}" in ${path.join('.')}`)
    const here = [...path, key]
    if ('$value' in node) {
      const type = (node.$type as string | undefined) ?? groupType
      if (!type) throw new Error(`Token ${here.join('.')} has no $type`)
      out.push({
        name: here.join('.'),
        type,
        value: node.$value,
        description: node.$description as string | undefined,
        extensions: node.$extensions as Json | undefined,
      })
    } else flatten(node, groupType, here, out)
  }
  return out
}

function refsOf(ref: { $ref: string }[], files: Record<string, Json>) {
  return ref.flatMap(({ $ref }) => {
    const file = files[$ref]
    if (!file) throw new Error(`Resolver points to missing file ${$ref}`)
    return flatten(file, undefined, [], [])
  })
}

/** Reads the resolver and returns the base tokens plus the tokens of each theme context. */
export function loadTokens({ resolver, files }: TokenSources): ResolvedTokens {
  if (resolver.version !== '2025.10') throw new Error('Resolver version must be 2025.10')
  const sets = resolver.sets as Record<string, { sources: { $ref: string }[] }>
  const modifiers = resolver.modifiers as Record<
    string,
    { contexts: Record<string, { $ref: string }[]>; default: string }
  >
  const order = resolver.resolutionOrder as { $ref: string }[]
  const base: Token[] = []
  let themes: Record<string, Token[]> = {}
  let defaultTheme = ''
  for (const { $ref } of order) {
    const [, kind, name] = $ref.split('/')
    if (kind === 'sets') base.push(...refsOf(sets[name].sources, files))
    else if (kind === 'modifiers') {
      const m = modifiers[name]
      themes = Object.fromEntries(
        Object.entries(m.contexts).map(([ctx, refs]) => [ctx, refsOf(refs, files)]),
      )
      defaultTheme = m.default
    } else throw new Error(`Unknown resolutionOrder entry ${$ref}`)
  }
  const seen = new Set<string>()
  for (const t of base) {
    if (seen.has(t.name)) throw new Error(`Duplicate token ${t.name}`)
    seen.add(t.name)
  }
  // A base token that pointed at a theme token would freeze to the root theme inside a nested
  // data-theme element, because custom properties resolve where they are declared.
  const refs = (v: unknown): string[] =>
    typeof v === 'string'
      ? [REF.exec(v)?.[1]].filter((x): x is string => !!x)
      : Array.isArray(v)
        ? v.flatMap(refs)
        : isObject(v)
          ? Object.values(v).flatMap(refs)
          : []
  for (const t of base)
    for (const r of refs(t.value))
      if (!seen.has(r))
        throw new Error(`Base token ${t.name} refers to ${r}, which is not a base token`)
  const names = Object.values(themes).map((ts) =>
    ts
      .map((t) => t.name)
      .sort()
      .join('\n'),
  )
  if (new Set(names).size > 1) throw new Error('Every theme must define the same tokens')
  for (const ts of Object.values(themes))
    for (const t of ts)
      if (seen.has(t.name)) throw new Error(`Theme token ${t.name} also defined in base`)
  return { base, themes, defaultTheme }
}

/** All tokens visible in one theme (base plus that theme), by name. */
export function tokenMap(tokens: ResolvedTokens, theme: string) {
  return new Map([...tokens.base, ...tokens.themes[theme]].map((t) => [t.name, t]))
}

/** Follows aliases until a literal value; throws on missing targets and cycles. */
export function resolveValue(
  value: unknown,
  map: Map<string, Token>,
  trail: string[] = [],
): unknown {
  if (typeof value === 'string') {
    const m = REF.exec(value)
    if (!m) return value
    const target = map.get(m[1])
    if (!target)
      throw new Error(`Unknown reference {${m[1]}} (from ${trail.join(' → ') || 'value'})`)
    if (trail.includes(m[1])) throw new Error(`Reference cycle: ${[...trail, m[1]].join(' → ')}`)
    return resolveValue(target.value, map, [...trail, m[1]])
  }
  if (Array.isArray(value)) return value.map((v) => resolveValue(v, map, trail))
  if (isObject(value))
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolveValue(v, map, trail)]),
    )
  return value
}

export const cssVarName = (name: string) => `--perron-${name.replaceAll('.', '-')}`

interface Dim {
  value: number
  unit: string
}
interface Color {
  colorSpace: string
  components: number[]
  alpha?: number
  hex: string
}

const GENERIC_FAMILIES = new Set([
  'system-ui',
  'sans-serif',
  'serif',
  'monospace',
  'ui-monospace',
  '-apple-system',
])
const dimCss = (d: Dim) => `${d.value}${d.unit}`

export function colorCss(c: Color) {
  if (c.colorSpace !== 'srgb')
    throw new Error(`Only srgb colours are supported, got ${c.colorSpace}`)
  if (c.alpha === undefined || c.alpha === 1) return c.hex.toUpperCase()
  const n = parseInt(c.hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${c.alpha})`
}

/**
 * CSS text for a value. `ref` turns an alias into `var(...)`; pass `resolve` to get literals instead.
 */
export function toCss(type: string, value: unknown, ref: (v: unknown) => string | null): string {
  const r = ref(value)
  if (r) return r
  const sub = (t: string, v: unknown) => toCss(t, v, ref)
  switch (type) {
    case 'color':
      return colorCss(value as Color)
    case 'dimension':
    case 'duration':
      return dimCss(value as Dim)
    case 'number':
    case 'fontWeight':
      return String(value)
    case 'fontFamily':
      return (Array.isArray(value) ? value : [value])
        .map((f: string) => (GENERIC_FAMILIES.has(f) ? f : `"${f}"`))
        .join(', ')
    case 'cubicBezier':
      return `cubic-bezier(${(value as number[]).join(', ')})`
    case 'shadow':
      return (Array.isArray(value) ? value : [value])
        .map((s: Json) =>
          [
            s.inset ? 'inset' : '',
            sub('dimension', s.offsetX),
            sub('dimension', s.offsetY),
            sub('dimension', s.blur),
            sub('dimension', s.spread),
            sub('color', s.color),
          ]
            .filter(Boolean)
            .join(' '),
        )
        .join(', ')
    case 'strokeStyle':
      return typeof value === 'string'
        ? value
        : ((value as Json).dashArray as unknown[]).map((d) => sub('dimension', d)).join(' ')
    case 'typography': {
      const t = value as Json
      return `${sub('fontWeight', t.fontWeight)} ${sub('dimension', t.fontSize)}/${sub('number', t.lineHeight)} ${sub('fontFamily', t.fontFamily)}`
    }
    default:
      throw new Error(`Unsupported token type ${type}`)
  }
}

function declarations(list: Token[]) {
  const varRef = (v: unknown) => {
    const m = typeof v === 'string' ? REF.exec(v) : null
    return m ? `var(${cssVarName(m[1])})` : null
  }
  const out: string[] = []
  for (const t of list) {
    out.push(`  ${cssVarName(t.name)}: ${toCss(t.type, t.value, varRef)};`)
    if (t.type === 'typography') {
      const ls = (t.value as Json).letterSpacing
      out.push(`  ${cssVarName(t.name)}-tracking: ${toCss('dimension', ls, varRef)};`)
    }
  }
  return out.join('\n')
}

const HEADER = 'Generated by scripts/build-tokens.ts from tokens/. Do not edit by hand.'

/**
 * Light and dark follow the OS unless an element sets data-theme. Any element can set data-theme,
 * so a page can show both themes side by side.
 */
export function emitCss(tokens: ResolvedTokens, keep: (t: Token) => boolean = () => true) {
  const base = tokens.base.filter(keep)
  const themes = Object.fromEntries(
    Object.entries(tokens.themes).map(([k, list]) => [k, list.filter(keep)]),
  )
  const { defaultTheme } = tokens
  const others = Object.keys(themes).filter((t) => t !== defaultTheme)
  if (others.length !== 1 || others[0] !== 'dark')
    throw new Error('emitCss expects exactly a default theme plus dark')
  const block = (sel: string, theme: string, indent = '') =>
    `${indent}${sel} {\n${indent}  color-scheme: ${theme};\n${declarations(themes[theme])
      .split('\n')
      .map((l) => indent + l)
      .join('\n')}\n${indent}}`
  return `/* ${HEADER} */

:root {
${declarations(base)}
}

${block(`:root,\n[data-theme='${defaultTheme}']`, defaultTheme)}

@media (prefers-color-scheme: dark) {
${block(`:root:not([data-theme='${defaultTheme}'])`, 'dark', '  ')}
}

${block(`[data-theme='dark']`, 'dark')}
`
}

const NUMERIC_TYPES = new Set(['dimension', 'duration', 'number', 'fontWeight'])

/** Typed module: literal CSS values per token and theme, numbers for maths, and a cssVar helper. */
export function emitTs(tokens: ResolvedTokens) {
  const lit = (theme: string) => {
    const map = tokenMap(tokens, theme)
    return (t: Token) => toCss(t.type, resolveValue(t.value, map), () => null)
  }
  const obj = (list: Token[], f: (t: Token) => string) =>
    `{\n${list.map((t) => `  ${JSON.stringify(t.name)}: ${JSON.stringify(f(t))},`).join('\n')}\n}`
  const baseLit = lit(tokens.defaultTheme)
  const themeNames = Object.keys(tokens.themes)
  const map = tokenMap(tokens, tokens.defaultTheme)
  const numeric = tokens.base
    .filter((t) => NUMERIC_TYPES.has(t.type))
    .map((t) => {
      const v = resolveValue(t.value, map)
      return `  ${JSON.stringify(t.name)}: ${typeof v === 'number' ? v : (v as Dim).value},`
    })
  const indent = (s: string) => s.replaceAll('\n', '\n  ')
  return `// ${HEADER}

/** Theme names. The first one is the default. */
export const themes = ${JSON.stringify([tokens.defaultTheme, ...themeNames.filter((t) => t !== tokens.defaultTheme)])} as const
export type Theme = (typeof themes)[number]

/** Tokens that are the same in every theme, as CSS values. */
export const base = ${obj(tokens.base, baseLit)} as const

/** Theme tokens as CSS values, per theme. Use these where CSS variables cannot reach, such as canvas. */
export const theme = {
${themeNames.map((th) => `  ${th}: ${indent(obj(tokens.themes[th], lit(th)))},`).join('\n')}
} as const

/** Dimension, duration and number tokens as plain numbers (px, ms or unitless). */
export const numeric = {
${numeric.join('\n')}
} as const

export type BaseToken = keyof typeof base
export type ThemeToken = keyof (typeof theme)['${tokens.defaultTheme}']
export type TokenName = BaseToken | ThemeToken

/** \`var(--perron-...)\` for a token, for inline styles. */
export const cssVar = (name: TokenName) => \`var(--perron-\${name.replaceAll('.', '-')})\`
`
}

// Penpot reads token files in the Tokens Studio flavour of DTCG: one object per set, string
// values, and its own type names. Types Penpot has no equivalent for are left out.
function penpotType(t: Token) {
  const top = t.name.split('.')[0]
  switch (t.type) {
    case 'color':
      return 'color'
    case 'dimension':
      if (top === 'radius') return 'borderRadius'
      if (top === 'space') return 'spacing'
      if (top === 'size') return 'sizing'
      if (t.name.startsWith('font.size')) return 'fontSizes'
      return 'dimension'
    case 'fontFamily':
      return 'fontFamilies'
    case 'fontWeight':
      return 'fontWeights'
    case 'number':
      return top === 'opacity' ? 'opacity' : 'number'
    case 'typography':
      return 'typography'
    case 'shadow':
      return 'boxShadow'
    default:
      return null
  }
}

export function emitPenpot(tokens: ResolvedTokens) {
  const keep = (v: unknown) => (typeof v === 'string' && REF.test(v) ? v : null)
  const value = (t: Token): unknown => {
    const r = keep(t.value)
    if (r) return r
    const sub = (type: string, v: unknown) => keep(v) ?? toCss(type, v, () => null)
    switch (t.type) {
      case 'fontFamily':
        return (Array.isArray(t.value) ? t.value : [t.value])[0]
      case 'typography': {
        const v = t.value as Json
        return {
          fontFamily: sub('fontFamily', v.fontFamily),
          fontWeight: sub('fontWeight', v.fontWeight),
          fontSize: sub('dimension', v.fontSize),
          lineHeight: sub('number', v.lineHeight),
          letterSpacing: sub('dimension', v.letterSpacing),
        }
      }
      case 'shadow':
        return (Array.isArray(t.value) ? t.value : [t.value]).map((s: Json) => ({
          x: sub('dimension', s.offsetX),
          y: sub('dimension', s.offsetY),
          blur: sub('dimension', s.blur),
          spread: sub('dimension', s.spread),
          color: sub('color', s.color),
          type: 'dropShadow',
        }))
      default:
        return toCss(t.type, t.value, () => null)
    }
  }
  const set = (list: Token[]) => {
    const root: Json = {}
    for (const t of list) {
      const type = penpotType(t)
      if (!type) continue
      const path = t.name.split('.')
      let node = root
      for (const p of path.slice(0, -1)) node = (node[p] ??= {}) as Json
      node[path.at(-1)!] = {
        $type: type,
        $value: value(t),
        ...(t.description ? { $description: t.description } : {}),
      }
    }
    return root
  }
  const themeNames = Object.keys(tokens.themes)
  const out: Json = { base: set(tokens.base) }
  for (const th of themeNames) out[th] = set(tokens.themes[th])
  out.$themes = themeNames.map((th) => ({
    id: th,
    name: th[0].toUpperCase() + th.slice(1),
    group: 'Theme',
    selectedTokenSets: { base: 'enabled', [th]: 'enabled' },
  }))
  out.$metadata = { tokenSetOrder: ['base', ...themeNames] }
  return JSON.stringify(out, null, 2) + '\n'
}

/**
 * One class per typography role, `.perron-typography-<role>`, so components and apps can apply a
 * role with a single class. Data roles get tabular figures.
 */
export function emitTypographyCss(tokens: ResolvedTokens) {
  const roles = tokens.base.filter((t) => t.type === 'typography')
  const rules = roles.map((t) => {
    const name = cssVarName(t.name).slice(2)
    const transform = (t.extensions?.['org.perron'] as Json | undefined)?.textTransform
    const family = String((t.value as Json).fontFamily)
    return [
      `.${name} {`,
      `  font: var(--${name});`,
      `  letter-spacing: var(--${name}-tracking);`,
      transform ? `  text-transform: ${transform};` : '',
      family.includes('font.family.data') ? '  font-variant-numeric: tabular-nums;' : '',
      '}',
    ]
      .filter(Boolean)
      .join('\n')
  })
  return `/* ${HEADER} */\n\n${rules.join('\n\n')}\n`
}

/** Every generated file, keyed by path relative to the repo root. */
export function buildAll(sources: TokenSources) {
  const tokens = loadTokens(sources)
  return {
    'tokens/generated/tokens.css': emitCss(tokens),
    'tokens/generated/typography.css': emitTypographyCss(tokens),
    'tokens/generated/tokens.ts': emitTs(tokens),
    'tokens/generated/penpot.tokens.json': emitPenpot(tokens),
  }
}
