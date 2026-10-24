// Fills the tables in docs/foundations/*.md from the token files and the icon and logo
// manifests, so every value, ratio and file a page shows is what the build ships. Three kinds of
// block, each rebuilt on every build:
//   <!-- tokens: <patterns> --> ... <!-- /tokens -->
//   <!-- contrast <minimum>: <patterns> on <token names> --> ... <!-- /contrast -->
//   <!-- files: icons|logos --> ... <!-- /files -->
// A pattern is a token name, or a prefix ending in `*`.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as prettier from 'prettier'
import { iconGrid, readIcons, readLogos, type Asset } from './assets.ts'
import { composite, contrastRatio } from './color.ts'
import { PACKAGE } from './paths.ts'
import { resolveValue, tokenMap, toCss, type ResolvedTokens, type Token } from './tokens.ts'

export const TOKENS = /(<!-- tokens: ([^>]*?) -->)[\s\S]*?(<!-- \/tokens -->)/g
export const CONTRAST =
  /(<!-- contrast ([\d.]+): ([^>]*?) on ([^>]*?) -->)[\s\S]*?(<!-- \/contrast -->)/g
export const FILES = /(<!-- files: (icons|logos) -->)[\s\S]*?(<!-- \/files -->)/g
const REF = /^\{([^{}]+)\}$/
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

export const words = (s: string) => s.trim().split(/\s+/)
const title = (s: string) => s[0].toUpperCase() + s.slice(1)
const parent = (name: string) => name.slice(0, name.lastIndexOf('.'))
const leaf = (name: string) => name.slice(name.lastIndexOf('.') + 1)
const matches = (pattern: string, name: string) =>
  pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : name === pattern

/**
 * The tokens the patterns name, in pattern order, then source order, except that numbered
 * siblings run in number order: JSON objects put `100` before `050`.
 */
export function select(tokens: ResolvedTokens, patterns: string[]) {
  const all = [...tokens.base, ...tokens.themes[tokens.defaultTheme]]
  const groups = new Map<string, Token[]>()
  for (const p of patterns)
    for (const t of all)
      if (matches(p, t.name) && !groups.get(parent(t.name))?.includes(t))
        groups.set(parent(t.name), [...(groups.get(parent(t.name)) ?? []), t])
  return [...groups.values()].flatMap((g) =>
    g.every((t) => /^\d+$/.test(leaf(t.name)))
      ? [...g].sort((a, b) => Number(leaf(a.name)) - Number(leaf(b.name)))
      : g,
  )
}

/** The CSS text of a token's value in one theme, as the build would write it with aliases followed. */
export function literal(tokens: ResolvedTokens, type: string, value: unknown, theme: string) {
  return toCss(type, resolveValue(value, tokenMap(tokens, theme)), () => null)
}

function cell(tokens: ResolvedTokens, t: Token, theme: string, value: unknown) {
  const text =
    t.type === 'fontFamily'
      ? ([] as unknown[]).concat(resolveValue(value, tokenMap(tokens, theme))).join(', ')
      : literal(tokens, t.type, value, theme)
  const alias = typeof value === 'string' ? REF.exec(value)?.[1] : undefined
  return `\`${text}\`${alias ? ` (${alias})` : ''}`
}

const row = (cells: string[]) => `| ${cells.join(' | ')} |`
const grid = (head: string[], rows: string[][]) =>
  [head, head.map(() => '---'), ...rows].map(row).join('\n')
const use = (t: Token) => (t.description ?? '').replaceAll('|', '\\|')

function typographyTable(tokens: ResolvedTokens, list: Token[]) {
  const map = tokenMap(tokens, tokens.defaultTheme)
  const rows = list.map((t) => {
    const v = resolveValue(t.value, map) as Record<string, unknown>
    const px = (d: unknown) => `${(d as { value: number }).value} px`
    return [
      `\`${t.name}\``,
      (v.fontFamily as string[])[0],
      String(v.fontWeight),
      px(v.fontSize),
      String(v.lineHeight),
      px(v.letterSpacing),
      use(t),
    ]
  })
  return grid(['Role', 'Family', 'Weight', 'Size', 'Line height', 'Tracking', 'Use'], rows)
}

function tokenTable(tokens: ResolvedTokens, patterns: string[]) {
  const list = select(tokens, patterns)
  if (!list.length) throw new Error(`No token matches <!-- tokens: ${patterns.join(' ')} -->`)
  if (list.every((t) => t.type === 'typography')) return typographyTable(tokens, list)
  const themed = new Set(tokens.themes[tokens.defaultTheme].map((t) => t.name))
  const themes = list.some((t) => themed.has(t.name)) ? Object.keys(tokens.themes) : []
  // a column for each modifier context that changes one of these tokens, such as reduced motion
  const contexts = Object.entries(tokens.overrides).flatMap(([name, m]) =>
    Object.entries(m.contexts)
      .filter(([, ts]) => ts.some((o) => list.some((t) => t.name === o.name)))
      .map(([ctx, ts]) => ({
        head: `${title(ctx)} ${name}`,
        byName: new Map(ts.map((o) => [o.name, o])),
      })),
  )
  // scales such as space and palette steps say their use on the page, not per token
  const described = list.some((t) => t.description)
  const head = [
    'Token',
    ...(themes.length ? themes.map(title) : ['Value']),
    ...contexts.map((c) => c.head),
    ...(described ? ['Use'] : []),
  ]
  const rows = list.map((t) => {
    const values = (themes.length ? themes : [tokens.defaultTheme]).map((th) =>
      cell(tokens, t, th, tokenMap(tokens, th).get(t.name)!.value),
    )
    const overridden = contexts.map((c) => {
      const o = c.byName.get(t.name)
      return o ? cell(tokens, t, tokens.defaultTheme, o.value) : ''
    })
    return [`\`${t.name}\``, ...values, ...overridden, ...(described ? [use(t)] : [])]
  })
  return grid(head, rows)
}

/** Each colour against each background in each theme; translucent colours over the background. */
function contrastTable(tokens: ResolvedTokens, min: number, patterns: string[], backs: string[]) {
  const list = select(tokens, patterns)
  if (!list.length) throw new Error(`No token matches <!-- contrast: ${patterns.join(' ')} -->`)
  const themes = Object.keys(tokens.themes)
  const color = (name: string, th: string) => {
    const t = tokenMap(tokens, th).get(name)
    if (t?.type !== 'color') throw new Error(`${name} is not a colour token`)
    return literal(tokens, 'color', t.value, th)
  }
  const head = ['Colour', ...themes.flatMap((th) => backs.map((b) => `${title(th)} ${leaf(b)}`))]
  const rows = list.map((t) => [
    `\`${t.name}\``,
    ...themes.flatMap((th) =>
      backs.map((b) => {
        const bg = color(b, th)
        if (!/^#[0-9A-F]{6}$/.test(bg))
          throw new Error(`${b} is translucent: contrast needs a solid background`)
        const ratio = contrastRatio(composite(color(t.name, th), bg), bg)
        return `${ratio.toFixed(2)}:1${ratio < min ? ' (miss)' : ''}`
      }),
    ),
  ])
  return grid(head, rows)
}

/** One table per category, each under a heading, with a preview of every file. */
function fileTables<T extends Asset>(
  dir: string,
  list: T[],
  head: string[],
  cells: (a: T, preview: string) => string[],
) {
  return [...new Set(list.map((a) => a.category))]
    .map((category) => {
      const rows = list
        .filter((a) => a.category === category)
        .map((a) => cells(a, `<img src="../../${PACKAGE}/${dir}/${a.name}.svg" alt="">`))
      return `### ${category}\n\n${grid(head, rows)}`
    })
    .join('\n\n')
}

function filesBlock(tokens: ResolvedTokens, root: string, dir: string) {
  if (dir === 'logos')
    return fileTables(dir, readLogos(root), ['Logo', 'File', 'Theme', 'Use'], (l, preview) => [
      preview,
      `\`${dir}/${l.name}.svg\``,
      title(l.theme),
      l.use,
    ])
  const map = tokenMap(tokens, tokens.defaultTheme)
  return fileTables(dir, readIcons(root), ['Icon', 'Name', 'Grid', 'Size', 'Use'], (i, preview) => {
    const size = map.get(i.size)
    if (size?.type !== 'dimension') throw new Error(`${i.name}: ${i.size} is not a size token`)
    return [
      preview,
      `\`${i.name}\``,
      `${iconGrid(i.svg)} px`,
      `\`${i.size}\`, ${literal(tokens, 'dimension', size.value, tokens.defaultTheme).replace('px', ' px')}`,
      i.use,
    ]
  })
}

/** `markdown` with every table rebuilt from `tokens` and the files in `root`. */
export function fillTables(markdown: string, tokens: ResolvedTokens, root = repoRoot) {
  return markdown
    .replace(
      FILES,
      (_, open: string, dir: string, close: string) =>
        `${open}\n\n${filesBlock(tokens, root, dir)}\n\n${close}`,
    )
    .replace(
      TOKENS,
      (_, open: string, patterns: string, close: string) =>
        `${open}\n\n${tokenTable(tokens, words(patterns))}\n\n${close}`,
    )
    .replace(
      CONTRAST,
      (_, open: string, min: string, patterns: string, backs: string, close: string) =>
        `${open}\n\n${contrastTable(tokens, Number(min), words(patterns), words(backs))}\n\n${close}`,
    )
}

/** Every token a `tokens` table in `markdown` lists. */
export function documentedTokens(markdown: string, tokens: ResolvedTokens) {
  return [...markdown.matchAll(TOKENS)].flatMap((m) =>
    select(tokens, words(m[2])).map((t) => t.name),
  )
}

/** The foundation pages with their tables rebuilt and formatted, keyed by path from `root`. */
export async function buildDocs(root: string, tokens: ResolvedTokens) {
  const dir = join(root, 'docs/foundations')
  const out: Record<string, string> = {}
  for (const name of readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()) {
    const file = join(dir, name)
    const options = await prettier.resolveConfig(file)
    out[`docs/foundations/${name}`] = await prettier.format(
      fillTables(readFileSync(file, 'utf8'), tokens, root),
      { ...options, filepath: file },
    )
  }
  return out
}
