// The patterns rule: a pattern imports only Perron's components and parts, the patterns its
// registry entry's dependsOn names, and the internal helpers that read no Base UI, never Base UI
// itself, as the contract's "Patterns" section says (docs/components/README.md).
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, posix } from 'node:path'
import ts from 'typescript'
import { PACKAGE } from '../lib/paths.ts'
import { readRegistry } from '../lib/registry.ts'
import { byFileLine, excuse, walk, type Check, type Problem } from './lib.ts'

const RULE = 'patterns'
const SRC = `${PACKAGE}/src`

/** Packages a pattern may import at runtime: React, and the package's own barrel. */
const PACKAGES = new Set(['react', '@mylder/perron'])
/** Files of the package a pattern may import besides components, parts and helpers, without extension. */
const FILES = new Set([`${SRC}/index`, `${SRC}/PerronProvider`])
const INTERNAL = `${SRC}/internal/`
const REPO = join(import.meta.dirname, '../..')

/** What a pattern file is checked with: the patterns it may compose, and how a helper is read. */
export interface PatternContext {
  /** The patterns its registry entry's `dependsOn` names */
  dependsOn?: string[]
  /** A package file's text, by its path from the repo root; none when it is missing */
  read?: (file: string) => string | undefined
}

/** A reader of the files under `root`: a file's text, or nothing when no file is there. */
const reader = (root: string) => (file: string) => {
  const path = join(root, file)
  return existsSync(path) && statSync(path).isFile() ? readFileSync(path, 'utf8') : undefined
}
const fromRepo = reader(REPO)

/** Whether the internal helper at `target` (no extension needed) imports Base UI itself. */
function readsBaseUi(target: string, read: (file: string) => string | undefined) {
  const text = [target, `${target}.ts`, `${target}.tsx`].map(read).find((t) => t !== undefined)
  return (
    text === undefined || imports(target, text).some(({ spec }) => spec.startsWith('@base-ui/'))
  )
}

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
function breach(
  file: string,
  spec: string,
  typeOnly: boolean,
  { dependsOn = [], read = fromRepo }: PatternContext,
): string | undefined {
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
  const allowed = [
    `${SRC}/components/`,
    `${SRC}/parts/`,
    `${own}/`,
    ...dependsOn.map((name) => `${SRC}/patterns/${name}/`),
  ]
  if (allowed.some((dir) => target.startsWith(dir))) return
  if (FILES.has(target.replace(/\.tsx?$/, ''))) return
  if (target.startsWith(INTERNAL))
    return readsBaseUi(target, read)
      ? `imports ${spec} (${target}), a helper that reads Base UI, which a pattern never does`
      : undefined
  if (target.startsWith(`${SRC}/patterns/`))
    return `imports ${spec} (${target}), a pattern its registry entry's dependsOn does not name; add it there`
  return `imports ${spec} (${target}); a pattern imports only Perron components and parts, the patterns it depends on, the internal helpers and its own folder`
}

/** The problems of one pattern file: each import that is not a Perron component, part or React. */
export function importProblems(
  file: string,
  text: string,
  context: PatternContext = {},
): Problem[] {
  const problems = imports(file, text).flatMap(({ spec, line, typeOnly }) => {
    const message = breach(file, spec, typeOnly, context)
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
    const patterns = new Set(
      readRegistry(root)
        .filter((e) => e.layer === 'pattern')
        .map((e) => e.name),
    )
    const dependsOn = new Map(
      readRegistry(root).map((e) => [e.name, e.dependsOn.filter((d) => patterns.has(d))]),
    )
    const read = reader(root)
    return walk(root, `${SRC}/patterns`, shipped)
      .flatMap((file) =>
        importProblems(file, readFileSync(join(root, file), 'utf8'), {
          dependsOn: dependsOn.get(file.split('/')[SRC.split('/').length + 1]) ?? [],
          read,
        }),
      )
      .sort(byFileLine)
  },
} satisfies Check
