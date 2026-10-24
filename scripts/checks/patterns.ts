// The patterns rule: a pattern imports only Perron's components and parts, never Base UI, as the
// contract's "Patterns" section says (docs/components/README.md).
import { readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import ts from 'typescript'
import { PACKAGE } from '../lib/paths.ts'
import { byFileLine, excuse, walk, type Check, type Problem } from './lib.ts'

const RULE = 'patterns'
const SRC = `${PACKAGE}/src`

/** Packages a pattern may import at runtime: React, and the package's own barrel. */
const PACKAGES = new Set(['react', '@mylder/perron'])
/** Files of the package a pattern may import besides components and parts, without extension. */
const FILES = new Set([`${SRC}/index`, `${SRC}/PerronProvider`])

/** Each module `text` imports or re-exports, with its line and whether only its types are used. */
function imports(file: string, text: string) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const out: { spec: string; line: number; typeOnly: boolean }[] = []
  const add = (node: ts.Node, spec: ts.Expression | undefined, typeOnly: boolean) => {
    if (!spec || !ts.isStringLiteralLike(spec)) return
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
    out.push({ spec: spec.text, line, typeOnly })
  }
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      const c = node.importClause
      add(node, node.moduleSpecifier, !!c && (c.isTypeOnly || allTypes(c.namedBindings, !c.name)))
    } else if (ts.isExportDeclaration(node))
      add(node, node.moduleSpecifier, node.isTypeOnly || allTypes(node.exportClause, true))
    else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    )
      add(node, node.moduleReference.expression, node.isTypeOnly)
    else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    )
      add(node, node.arguments[0], false)
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      add(node, node.argument.literal, true)
    ts.forEachChild(node, visit)
  }
  visit(source)
  return out
}

/** Whether every name in `{ a, type b }` is a type, so the import leaves nothing at runtime. */
function allTypes(
  bindings: ts.NamedImportBindings | ts.NamedExportBindings | undefined,
  alone: boolean,
) {
  if (!bindings || !(ts.isNamedImports(bindings) || ts.isNamedExports(bindings))) return false
  return alone && bindings.elements.length > 0 && bindings.elements.every((e) => e.isTypeOnly)
}

/** Why `spec`, imported by the pattern file `file` (a path from the repo root), is not allowed. */
function breach(file: string, spec: string, typeOnly: boolean): string | undefined {
  if (spec === '@base-ui/react' || spec.startsWith('@base-ui/'))
    return `imports ${spec}; a pattern builds on Perron's components, never on Base UI`
  if (!spec.startsWith('.')) {
    if (PACKAGES.has(spec) || typeOnly) return
    return `imports ${spec}; a pattern imports only Perron components and parts, React and its own files`
  }
  const target = posix.normalize(posix.join(posix.dirname(file), spec))
  const own = file
    .split('/')
    .slice(0, SRC.split('/').length + 2)
    .join('/')
  const allowed = [`${SRC}/components/`, `${SRC}/parts/`, `${own}/`]
  if (allowed.some((dir) => target.startsWith(dir))) return
  if (FILES.has(target.replace(/\.tsx?$/, ''))) return
  return `imports ${spec} (${target}); a pattern imports only Perron components and parts and its own folder`
}

/** The problems of one pattern file: each import that is not a Perron component, part or React. */
export function importProblems(file: string, text: string): Problem[] {
  const problems = imports(file, text).flatMap(({ spec, line, typeOnly }) => {
    const message = breach(file, spec, typeOnly)
    return message ? [{ file, line, message }] : []
  })
  return excuse(problems, RULE, () => text)
}

/** The shipped files of a pattern: its code, not its stories or tests. */
const shipped = (name: string) =>
  /\.tsx?$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name) && !name.endsWith('.d.ts')

export default {
  rule: RULE,
  run(root) {
    return walk(root, `${SRC}/patterns`, shipped)
      .flatMap((file) => importProblems(file, readFileSync(join(root, file), 'utf8')))
      .sort(byFileLine)
  },
} satisfies Check
