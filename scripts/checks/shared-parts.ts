// The shared-parts rule: each part in the contract's "Shared parts" table is drawn once, in its
// own folder, so its class, its icon and its declarations appear nowhere else in the source.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE } from '../lib/paths.ts'
import { excuse, walk, type Check, type Problem } from './lib.ts'

const RULE = 'shared-parts'
const CONTRACT = 'docs/components/README.md'

/** One row of the contract's parts table, and what only its folder holds. */
export interface Part {
  name: string
  /** `pn-<Part>`; its inner parts' `pn-<Part>-<part>` classes count too */
  classes: string[]
  /** Icon names in `packages/perron/icons/`, whether the file exists yet or not */
  icons: string[]
  /** Declarations as the contract writes them, such as `clip-path: inset(50%)` or `clip:` */
  declarations: string[]
}

/** The parts the contract lists, from the table under its "Shared parts" heading. */
export function readParts(contract: string): Part[] {
  const section = contract.split(/^## Shared parts$/m)[1]?.split(/^## /m)[0] ?? ''
  const rows = section.split('\n').filter((l) => /^\|\s*`/.test(l))
  return rows.map((row) => {
    const cells = row
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())
    const holds = cells.at(-1) ?? ''
    const icons = [...holds.matchAll(/(?:`([\w-]+)`|(\w[\w-]*)) icon\b/g)].map((m) => m[1] ?? m[2])
    const items = [...holds.replace(/`[\w-]+` icon\b/g, '').matchAll(/`([^`]+)`/g)].map((m) => m[1])
    return {
      name: cells[0].replaceAll('`', ''),
      classes: items.filter((i) => i.startsWith('pn-')),
      icons,
      declarations: items.filter((i) => i.includes(':')),
    }
  })
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const camel = (s: string) => s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())

/** A declaration as CSS writes it, or as a React style object does: `clipPath: 'inset(50%)'`. */
function declaration(text: string) {
  const [prop, ...rest] = text.split(':')
  const value = rest.join(':').trim()
  const props = [...new Set([prop.trim(), camel(prop.trim())])].map(escape).join('|')
  const tail = value
    ? `\\s*['"\`]?${value
        .split(/\s*([(),])\s*/)
        .map((p) => (/^[(),]$/.test(p) ? `\\s*${escape(p)}\\s*` : escape(p)))
        .join('')}`
    : ''
  return new RegExp(`(?<![\\w-])(?:${props})\\s*:${tail}`, 'g')
}

/** What marks a part as drawn: each pattern, what it is, and the part folders it may appear in. */
function marks(root: string, parts: Part[]) {
  const out: { pattern: RegExp; what: string; owners: string[] }[] = []
  for (const part of parts) {
    for (const c of part.classes)
      out.push({
        pattern: new RegExp(`${escape(c)}(?![A-Za-z0-9])`, 'g'),
        what: c,
        owners: [part.name],
      })
    for (const d of part.declarations)
      out.push({ pattern: declaration(d), what: d, owners: [part.name] })
  }
  for (const icon of new Set(parts.flatMap((p) => p.icons))) {
    const owners = parts.filter((p) => p.icons.includes(icon)).map((p) => p.name)
    const what = `the ${icon} icon`
    out.push({ pattern: new RegExp(`(?<![\\w-])${escape(icon)}\\.svg\\b`, 'g'), what, owners })
    const svg = join(root, PACKAGE, 'icons', `${icon}.svg`)
    if (!existsSync(svg)) continue
    for (const [, d] of readFileSync(svg, 'utf8').matchAll(/\sd="([^"]+)"/g))
      out.push({ pattern: new RegExp(escape(d), 'g'), what, owners })
  }
  return out
}

/** Source a part could be drawn in: code, CSS and docs pages, but not tests, which may query it. */
const source = (name: string) => /\.(tsx?|css|mdx)$/.test(name) && !/\.test\.tsx?$/.test(name)

/**
 * The problems of the source under `src` (a path from `root`): every class, icon and declaration
 * of a shared part found outside that part's folder, `<src>/parts/<Part>/`.
 */
export function partProblems(
  root: string,
  src: string,
  parts = readParts(readFileSync(join(root, CONTRACT), 'utf8')),
): Problem[] {
  const all = marks(root, parts)
  const texts = new Map<string, string>()
  const problems: Problem[] = []
  for (const file of walk(root, src, source)) {
    const text = readFileSync(join(root, file), 'utf8')
    texts.set(file, text)
    for (const { pattern, what, owners } of all) {
      if (owners.some((o) => file.startsWith(`${src}/parts/${o}/`))) continue
      for (const m of text.matchAll(pattern)) {
        const line = text.slice(0, m.index).split('\n').length
        problems.push({
          file,
          line,
          message: `${what} belongs to ${owners.join(', ')}, in ${owners.map((o) => `${PACKAGE}/src/parts/${o}/`).join(' or ')}; compose the part instead`,
        })
      }
    }
  }
  problems.sort((a, b) => a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0))
  return excuse(problems, RULE, (f) => texts.get(f) ?? '')
}

export default {
  rule: RULE,
  run(root) {
    return partProblems(root, `${PACKAGE}/src`)
  },
} satisfies Check
