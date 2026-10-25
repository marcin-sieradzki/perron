// The props API of every released component, packages/perron/api.json, read from each
// `<Name>Props` with the TypeScript compiler and built in memory for scripts/build-api.ts. The
// api-compatibility check holds it against the same file at the last release tag.
import ts from 'typescript'
import { PACKAGE } from './paths.ts'
import { codeFile, inPackage, propsProgram } from './props.ts'
import { readRegistry, type Entry } from './registry.ts'

/** One prop: whether a caller may leave it out, and its type's union members, sorted. */
export interface Prop {
  optional: boolean
  type: string[]
}

/** One component's props type: what it extends, as written, and the members it declares itself. */
export interface ComponentApi {
  extends: string[]
  props: Record<string, Prop>
}

export type Api = Record<string, ComponentApi>

/** The file, by path from the repo root. */
export const API = `${PACKAGE}/api.json`

/** Callers rely on an entry's API from `stable` on, and a deprecated one keeps working. */
export const released = (e: Entry) => e.status === 'stable' || e.status === 'deprecated'

const text = (node: ts.Node) => node.getText().replace(/\s+/g, ' ')

const printer = ts.createPrinter({ removeComments: true })

/**
 * A type's text with every union inside it in sorted order, its white space collapsed: the
 * checker writes a nested union, such as a callback's `event`, in the order the program met its
 * members, which another component's types can change. Text that does not parse as a type is
 * kept as it is.
 */
export function canonical(type: string): string {
  const source = ts.createSourceFile('type.ts', `type T = ${type}`, ts.ScriptTarget.Latest, true)
  const [alias] = source.statements
  const broken = (source as { parseDiagnostics?: unknown[] }).parseDiagnostics?.length
  if (broken || source.statements.length !== 1 || !alias || !ts.isTypeAliasDeclaration(alias))
    return type
  const say = (node: ts.Node) =>
    printer.printNode(ts.EmitHint.Unspecified, node, source).replace(/\s+/g, ' ')
  const sorted: ts.TransformerFactory<ts.Node> = (context) => {
    const visit = (node: ts.Node): ts.Node => {
      const out = ts.visitEachChild(node, visit, context)
      if (!ts.isUnionTypeNode(out)) return out
      const types = [...out.types].sort((a, b) => (say(a) < say(b) ? -1 : say(a) > say(b) ? 1 : 0))
      return context.factory.updateUnionTypeNode(out, context.factory.createNodeArray(types))
    }
    return (node) => ts.visitNode(node, visit) as ts.Node
  }
  const [out] = ts.transform(alias.type, [sorted]).transformed
  return say(out).trim()
}

/** A type's union members as text: a library alias such as `ReactNode` stays whole. */
function members(checker: ts.TypeChecker, type: ts.Type): string[] {
  const say = (t: ts.Type) =>
    canonical(checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation))
  const alias = type.aliasSymbol?.declarations?.[0]
  if ((alias && !inPackage(alias)) || !type.isUnion()) return [say(type)]
  const out = type.types.map(say)
  // TypeScript spells boolean as true | false inside a union
  const bool = out.includes('true') && out.includes('false')
  return [
    ...new Set(bool ? [...out.filter((m) => m !== 'true' && m !== 'false'), 'boolean'] : out),
  ].sort()
}

/** What a props type extends, as written: an interface's heritage, an intersection's other parts. */
function bases(decl: ts.Declaration): string[] {
  if (ts.isInterfaceDeclaration(decl))
    return (decl.heritageClauses ?? []).flatMap((h) => h.types.map(text))
  if (ts.isTypeAliasDeclaration(decl)) {
    const parts = ts.isIntersectionTypeNode(decl.type) ? decl.type.types : [decl.type]
    return parts.filter((p) => !ts.isTypeLiteralNode(p)).map(text)
  }
  return []
}

/** The props API of each `<Name>.tsx` in `files` (paths from `root`), from its `<Name>Props`. */
export function propsApi(root: string, files: string[]): Api {
  if (!files.length) return {}
  const { checker, propsOf } = propsProgram(root, files)
  const api: Api = {}
  for (const file of files) {
    const { name, symbol, type: propsType } = propsOf(file)
    if (!symbol || !propsType) throw new Error(`${file} exports no ${name}`)
    const props: Record<string, Prop> = {}
    for (const p of checker.getPropertiesOfType(propsType)) {
      const own = p.declarations?.find(inPackage)
      if (!own) continue
      const optional = (p.flags & ts.SymbolFlags.Optional) !== 0
      // the type as declared, without the `undefined` that `?` adds
      const node = (own as ts.PropertySignature).type
      const type = node
        ? checker.getTypeFromTypeNode(node)
        : checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(p, own))
      props[p.name] = { optional, type: members(checker, type) }
    }
    const sorted = Object.fromEntries(Object.entries(props).sort(([a], [b]) => (a < b ? -1 : 1)))
    api[name.replace(/Props$/, '')] = {
      extends: (symbol.declarations ?? []).flatMap(bases),
      props: sorted,
    }
  }
  return api
}

/** The props API of the repo's released entries, from their code under `root`. */
export function readApi(root: string): Api {
  return propsApi(
    root,
    readRegistry(root)
      .filter(released)
      .sort((a, b) => (a.name < b.name ? -1 : 1))
      .map(codeFile),
  )
}

/** The file api.json should hold now, keyed by its path from the repo root. */
export function apiFiles(root: string) {
  return { [API]: `${JSON.stringify(readApi(root), null, 2)}\n` }
}
