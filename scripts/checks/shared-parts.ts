// The shared-parts rule: each part in the contract's "Shared parts" table is drawn once, in its
// own folder, so its class, its icon and its declarations appear nowhere else in the source; and
// each helper in its "Shared helpers" table is declared once, in its file. In
// CSS and MDX a declaration is matched as text; in TS and TSX only as a style object's key with a
// string value, such as `clipPath: 'inset(50%)'`, so a variable named `clip` is no declaration.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { PACKAGE } from '../lib/paths.ts'
import {
  byFileLine,
  codeSpans,
  CONTRACT,
  excuse,
  section,
  tableRows,
  walk,
  type Check,
  type Problem,
} from './lib.ts'

const RULE = 'shared-parts'

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
  return tableRows(section(contract, 'Shared parts')).map((cells) => {
    const holds = cells.at(-1) ?? ''
    const icons = [...holds.matchAll(/(?:`([\w-]+)`|(\w[\w-]*)) icon\b/g)].map((m) => m[1] ?? m[2])
    const items = codeSpans(holds.replace(/`[\w-]+` icon\b/g, ''))
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

/** A declaration's property, as CSS spells it and as a React style object does: `clip-path`, `clipPath`. */
const spellings = (prop: string) => [...new Set([prop.trim(), camel(prop.trim())])]

/** A declaration's value as a pattern, loose about the spaces around `(`, `)` and `,`. */
const valuePattern = (value: string) =>
  value
    .split(/\s*([(),])\s*/)
    .map((p) => (/^[(),]$/.test(p) ? `\\s*${escape(p)}\\s*` : escape(p)))
    .join('')

/** Where a declaration appears in CSS or MDX text: `clip-path: inset(50%)`, or any `clip:`. */
function inText(text: string, prop: string, value: string): number[] {
  const tail = value ? `\\s*['"\`]?${valuePattern(value)}` : ''
  const props = spellings(prop).map(escape).join('|')
  const re = new RegExp(`(?<![\\w-])(?:${props})\\s*:${tail}`, 'g')
  return [...text.matchAll(re)].map((m) => m.index)
}

/** Where a declaration appears in TS or TSX: an object key with a string value, `clipPath: '…'`. */
function inCode(file: string, text: string, prop: string, value: string): number[] {
  const names = spellings(prop)
  const wanted = value ? new RegExp(`^${valuePattern(value)}$`) : undefined
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const out: number[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isPropertyAssignment(node) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      names.includes(node.name.text) &&
      ts.isStringLiteralLike(node.initializer) &&
      (!wanted || wanted.test(node.initializer.text.trim()))
    )
      out.push(node.getStart(source))
    ts.forEachChild(node, visit)
  }
  visit(source)
  return out
}

/** Where `what` is drawn in one file: the offset of each appearance. */
type Find = (file: string, text: string) => number[]

const regexFind =
  (re: RegExp): Find =>
  (_, text) =>
    [...text.matchAll(re)].map((m) => m.index)

/** A declaration's finder: as code in TS and TSX, as text elsewhere. */
function declaration(text: string): Find {
  const [prop, ...rest] = text.split(':')
  const value = rest.join(':').trim()
  return (file, source) =>
    /\.tsx?$/.test(file) ? inCode(file, source, prop, value) : inText(source, prop, value)
}

/** What marks a part as drawn: each finder, what it finds, and the part folders it may appear in. */
function marks(root: string, parts: Part[]) {
  const out: { find: Find; what: string; owners: string[] }[] = []
  for (const part of parts) {
    for (const c of part.classes)
      out.push({
        find: regexFind(new RegExp(`${escape(c)}(?![A-Za-z0-9])`, 'g')),
        what: c,
        owners: [part.name],
      })
    for (const d of part.declarations)
      out.push({ find: declaration(d), what: d, owners: [part.name] })
  }
  for (const icon of new Set(parts.flatMap((p) => p.icons))) {
    const owners = parts.filter((p) => p.icons.includes(icon)).map((p) => p.name)
    const what = `the ${icon} icon`
    out.push({
      find: regexFind(new RegExp(`(?<![\\w-])${escape(icon)}\\.svg\\b`, 'g')),
      what,
      owners,
    })
    const svg = join(root, PACKAGE, 'icons', `${icon}.svg`)
    if (!existsSync(svg)) continue
    for (const [, d] of readFileSync(svg, 'utf8').matchAll(/\sd="([^"]+)"/g))
      out.push({ find: regexFind(new RegExp(escape(d), 'g')), what, owners })
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
    for (const { find, what, owners } of all) {
      if (owners.some((o) => file.startsWith(`${src}/parts/${o}/`))) continue
      for (const offset of find(file, text)) {
        const line = text.slice(0, offset).split('\n').length
        problems.push({
          file,
          line,
          message: `${what} belongs to ${owners.join(', ')}, in ${owners.map((o) => `${PACKAGE}/src/parts/${o}/`).join(' or ')}; compose the part instead`,
        })
      }
    }
  }
  return excuse(problems.sort(byFileLine), RULE, (f) => texts.get(f) ?? '')
}

/** One row of the contract's helpers table: the name, and its file from `packages/perron/src/`. */
export interface Helper {
  name: string
  file: string
}

/** The helpers the contract lists, from the table under its "Shared helpers" heading. */
export function readHelpers(contract: string): Helper[] {
  return tableRows(section(contract, 'Shared helpers')).map((cells) => ({
    name: codeSpans(cells[0])[0],
    file: codeSpans(cells[1])[0].replace(`${PACKAGE}/src/`, ''),
  }))
}

/** The names a file declares at its top level, with the offset of each. */
function topLevelNames(file: string, text: string) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const out: { name: string; offset: number }[] = []
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement))
      for (const d of statement.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) out.push({ name: d.name.text, offset: d.getStart(source) })
      }
    else if (
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
      statement.name
    )
      out.push({ name: statement.name.text, offset: statement.name.getStart(source) })
  }
  return out
}

/**
 * The problems of the code under `src` (a path from `root`): every shared helper declared at the
 * top level of a file other than its own, where an import of it belongs.
 */
export function helperProblems(
  root: string,
  src: string,
  helpers = readHelpers(readFileSync(join(root, CONTRACT), 'utf8')),
): Problem[] {
  const byName = new Map(helpers.map((h) => [h.name, h.file]))
  const texts = new Map<string, string>()
  const problems: Problem[] = []
  for (const file of walk(root, src, (n) => /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n))) {
    const text = readFileSync(join(root, file), 'utf8')
    texts.set(file, text)
    for (const { name, offset } of topLevelNames(file, text)) {
      const home = byName.get(name)
      if (!home || file === `${src}/${home}`) continue
      problems.push({
        file,
        line: text.slice(0, offset).split('\n').length,
        message: `declares ${name}, a shared helper; import it from ${PACKAGE}/src/${home} (${CONTRACT}, "Shared helpers")`,
      })
    }
  }
  return excuse(problems.sort(byFileLine), RULE, (f) => texts.get(f) ?? '')
}

export default {
  rule: RULE,
  run(root) {
    const src = `${PACKAGE}/src`
    return [...partProblems(root, src), ...helperProblems(root, src)].sort(byFileLine)
  },
} satisfies Check
