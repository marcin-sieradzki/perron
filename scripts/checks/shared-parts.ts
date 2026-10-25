// The shared-parts rule: each part in the contract's "Shared parts" table is drawn once, in its
// own folder, so its class, its icon and its declarations appear nowhere else in the source; and
// each helper in its "Shared helpers" table is declared once, in its file: not again by its name,
// by an alias the table lists, or under a new name with the same body. In
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

/**
 * An icon a row names: "the `close` icon", "the chevron icon", or a list ending in "icons", such as
 * "the `info-circle` and `exclamation-circle` icons" or "the `a`, `b` or `c` icons".
 */
const ICONS = /((?:`[\w-]+`(?:,\s*|\s+(?:and|or)\s+(?:the\s+)?))*`[\w-]+`|\b\w[\w-]*) icons?\b/g

/** The parts the contract lists, from the table under its "Shared parts" heading. */
export function readParts(contract: string): Part[] {
  return tableRows(section(contract, 'Shared parts')).map((cells) => {
    const holds = cells.at(-1) ?? ''
    const icons = [...holds.matchAll(ICONS)].flatMap((m) =>
      m[1].startsWith('`') ? codeSpans(m[1]) : [m[1]],
    )
    const items = codeSpans(holds.replace(ICONS, ''))
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

/**
 * One row of the contract's helpers table: the name, the names a copy of it went by before
 * (the cell's other code spans), and its file from `packages/perron/src/`.
 */
export interface Helper {
  name: string
  aliases: string[]
  file: string
}

/** The helpers the contract lists, from the table under its "Shared helpers" heading. */
export function readHelpers(contract: string): Helper[] {
  return tableRows(section(contract, 'Shared helpers')).map((cells) => {
    const [name, ...aliases] = codeSpans(cells[0])
    return { name, aliases, file: codeSpans(cells[1])[0].replace(`${PACKAGE}/src/`, '') }
  })
}

type Fn = ts.FunctionLikeDeclaration & { body: ts.ConciseBody }

/** A function declared at the top level, or a `const` holding an arrow or a function expression. */
function functionOf(node: ts.Node | undefined): Fn | undefined {
  return node &&
    (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
    node.body
    ? (node as Fn)
    : undefined
}

/** The names a file declares at its top level, with the offset of each and its function, if any. */
function topLevelNames(file: string, text: string) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const out: { name: string; offset: number; fn?: Fn }[] = []
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement))
      for (const d of statement.declarationList.declarations) {
        if (ts.isIdentifier(d.name))
          out.push({ name: d.name.text, offset: d.getStart(source), fn: functionOf(d.initializer) })
      }
    else if (
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
      statement.name
    )
      out.push({
        name: statement.name.text,
        offset: statement.name.getStart(source),
        fn: functionOf(statement),
      })
  }
  return out
}

/**
 * The functions nested inside a file's top-level statements, such as a callback passed to `map`,
 * with the offset of each: a helper's body there is a copy as much as one under a new name.
 */
function nestedFunctions(file: string, text: string) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const out: { offset: number; fn: Fn; name?: string }[] = []
  const visit = (node: ts.Node, top: boolean) => {
    const fn = functionOf(node)
    // a named one, `const fill = (el) => …` or `function fill(el) {…}`, is a helper declared inline
    const named =
      ts.isFunctionDeclaration(node) && node.name
        ? node.name.text
        : ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)
          ? node.parent.name.text
          : undefined
    if (fn && !top) out.push({ offset: node.getStart(source), fn, ...(named && { name: named }) })
    // a top-level `const` keeps its own function at the top level, which topLevelNames reads
    const keeps =
      ts.isVariableStatement(node) ||
      ts.isVariableDeclarationList(node) ||
      ts.isVariableDeclaration(node)
    ts.forEachChild(node, (kid) => visit(kid, top && keeps))
  }
  for (const statement of source.statements) visit(statement, true)
  return out
}

/** Below this many syntax nodes a body is too small to call a copy: `(node) => node != null`. */
const SMALLEST_COPY = 8

/**
 * A function's body as a shape: its syntax tree with the names it declares (its parameters and
 * locals, in order) and its own name numbered, comments, white space, types and redundant
 * parentheses left out. Two functions with one shape are one function under two names. Nothing for
 * a body under `SMALLEST_COPY` nodes.
 */
export function shapeOf(fn: Fn, own: string): string | undefined {
  const names = new Map([[own, '$self']])
  const bind = (node: ts.Node) => {
    if ((ts.isParameter(node) || ts.isVariableDeclaration(node)) && ts.isIdentifier(node.name))
      if (!names.has(node.name.text)) names.set(node.name.text, `$${names.size}`)
    ts.forEachChild(node, bind)
  }
  bind(fn)
  let count = 0
  const shape = (node: ts.Node): string => {
    if (ts.isParenthesizedExpression(node)) return shape(node.expression)
    count++
    if (ts.isIdentifier(node)) return names.get(node.text) ?? node.text
    if (
      node.kind >= ts.SyntaxKind.FirstLiteralToken &&
      node.kind <= ts.SyntaxKind.LastTemplateToken
    )
      return `${node.kind}:${(node as ts.LiteralLikeNode).text}`
    const kids: string[] = []
    ts.forEachChild(node, (kid) => {
      if (!ts.isTypeNode(kid)) kids.push(shape(kid))
    })
    const op =
      ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)
        ? `${node.operator}`
        : ''
    return `${node.kind}${op}(${kids.join(',')})`
  }
  const body = `${fn.parameters.length}:${shape(fn.body)}`
  return count >= SMALLEST_COPY ? body : undefined
}

/** Each helper's shape, from its own declaration in its file under `src`, where it has one. */
function helperShapes(root: string, src: string, helpers: Helper[]) {
  const out = new Map<string, Helper>()
  for (const helper of helpers) {
    const file = `${src}/${helper.file}`
    if (!existsSync(join(root, file))) continue
    const own = topLevelNames(file, readFileSync(join(root, file), 'utf8')).find(
      (d) => d.name === helper.name,
    )
    const shape = own?.fn && shapeOf(own.fn, own.name)
    if (shape) out.set(shape, helper)
  }
  return out
}

/**
 * The problems of the code under `src` (a path from `root`): every shared helper declared at the
 * top level of a file other than its own, by its name, by an alias, or as a function with its
 * shape under another name, where an import of it belongs.
 */
export function helperProblems(
  root: string,
  src: string,
  helpers = readHelpers(readFileSync(join(root, CONTRACT), 'utf8')),
): Problem[] {
  const byName = new Map(helpers.flatMap((h) => [h.name, ...h.aliases].map((n) => [n, h])))
  const byShape = helperShapes(root, src, helpers)
  const texts = new Map<string, string>()
  const problems: Problem[] = []
  // unit tests too: a renamed copy of heardMarkup in a test is a copy all the same
  for (const file of walk(root, src, (n) => /\.tsx?$/.test(n))) {
    const text = readFileSync(join(root, file), 'utf8')
    texts.set(file, text)
    for (const { name, offset, fn } of topLevelNames(file, text)) {
      const shape = fn && byName.get(name) === undefined ? shapeOf(fn, name) : undefined
      const helper = byName.get(name) ?? (shape ? byShape.get(shape) : undefined)
      if (!helper || file === `${src}/${helper.file}`) continue
      const what =
        name === helper.name
          ? 'a shared helper'
          : helper.aliases.includes(name)
            ? `the shared helper ${helper.name} under another name`
            : `a copy of the shared helper ${helper.name}`
      problems.push({
        file,
        line: text.slice(0, offset).split('\n').length,
        message: `declares ${name}, ${what}; import ${helper.name} from ${PACKAGE}/src/${helper.file} (${CONTRACT}, "Shared helpers")`,
      })
    }
    for (const { offset, fn } of nestedFunctions(file, text)) {
      const shape = shapeOf(fn, '')
      const helper = shape ? byShape.get(shape) : undefined
      if (!helper || file === `${src}/${helper.file}`) continue
      problems.push({
        file,
        line: text.slice(0, offset).split('\n').length,
        message: `holds a copy of the shared helper ${helper.name} inline, such as in a map; call ${helper.name} from ${PACKAGE}/src/${helper.file} (${CONTRACT}, "Shared helpers")`,
      })
    }
  }
  return excuse(problems.sort(byFileLine), RULE, (f) => texts.get(f) ?? '')
}

/**
 * Whether `fn` is one Testing Library query, such as `within(el).getByRole('button', { name })`:
 * a story's name for one of its own elements, not a helper to share.
 */
function isQuery(fn: Fn) {
  let body: ts.Node = fn.body
  if (ts.isBlock(body)) {
    const [only] = body.statements
    if (body.statements.length !== 1 || !ts.isReturnStatement(only) || !only.expression)
      return false
    body = only.expression
  }
  while (ts.isParenthesizedExpression(body) || ts.isAwaitExpression(body)) body = body.expression
  return (
    ts.isCallExpression(body) &&
    ts.isPropertyAccessExpression(body.expression) &&
    /^(get|find|query)(All)?By[A-Z]/.test(body.expression.name.text)
  )
}

/**
 * Whether `fn`, its default values included, reads a name its own file declares at the top level
 * (other than its own): a story's `TITLE` or `LABEL`, so a copy elsewhere does something else.
 */
function readsLocal(fn: Fn, local: Set<string>, own: string) {
  let found = false
  const visit = (node: ts.Node) => {
    if (found) return
    if (
      ts.isIdentifier(node) &&
      node.text !== own &&
      local.has(node.text) &&
      !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) &&
      !(ts.isPropertyAssignment(node.parent) && node.parent.name === node)
    )
      found = true
    else ts.forEachChild(node, visit)
  }
  visit(fn)
  return found
}

/** A story file or a unit test, whose helpers a second one copies. */
const TEST_FILE = /\.(stories\.tsx|test\.tsx?)$/

/**
 * The problems of the stories and unit tests under `src` (a path from `root`): a function declared
 * at the top level of one such file whose shape another declares too, under any name. A helper a
 * second file needs is written once under `testing/` (`stories.ts` for a story's, `markup.ts` for
 * a markup test's) and joins the Shared helpers table.
 */
export function copiedStoryHelpers(root: string, src: string): Problem[] {
  const texts = new Map<string, string>()
  type Found = { file: string; name: string; offset: number; inline?: boolean }
  const byShape = new Map<string, Found[]>()
  const add = (shape: string | undefined, found: Found) => {
    if (shape) byShape.set(shape, [...(byShape.get(shape) ?? []), found])
  }
  for (const file of walk(root, src, (n) => TEST_FILE.test(n))) {
    if (file.startsWith(`${src}/testing/`)) continue
    const text = readFileSync(join(root, file), 'utf8')
    texts.set(file, text)
    const names = topLevelNames(file, text)
    const local = new Set(names.map((n) => n.name))
    for (const { name, offset, fn } of names) {
      if (!fn || isQuery(fn) || readsLocal(fn, local, name)) continue
      add(shapeOf(fn, name), { file, name, offset })
    }
    // a helper copied into a story's body, such as a `const fill = …` inside its play function
    for (const { offset, fn, name } of nestedFunctions(file, text))
      if (name && !isQuery(fn) && !readsLocal(fn, local, name))
        add(shapeOf(fn, name), { file, name, offset, inline: true })
  }
  const problems: Problem[] = []
  for (const found of byShape.values()) {
    const files = new Set(found.map((f) => f.file))
    // a copy between two files that keeps one of them at the top level, where a helper lives
    if (files.size < 2 || found.every((f) => f.inline)) continue
    for (const { file, name, offset, inline } of found) {
      const others = found.filter((f) => f.file !== file).map((f) => `${f.name} in ${f.file}`)
      problems.push({
        file,
        line: texts.get(file)!.slice(0, offset).split('\n').length,
        message: `declares ${name}${inline ? ' inside a story' : ''}, a helper ${others.join(' and ')} declares too; write it once in ${PACKAGE}/src/testing/${file.endsWith('.stories.tsx') ? 'stories.ts' : 'markup.ts'}, add it to ${CONTRACT}'s "Shared helpers" table, and import it`,
      })
    }
  }
  return excuse(problems.sort(byFileLine), RULE, (f) => texts.get(f) ?? '')
}

export default {
  rule: RULE,
  run(root) {
    const src = `${PACKAGE}/src`
    return [
      ...partProblems(root, src),
      ...helperProblems(root, src),
      ...copiedStoryHelpers(root, src),
    ].sort(byFileLine)
  },
} satisfies Check
