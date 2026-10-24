// The docgen a component's docs page reads its props table from: react-docgen, as Storybook runs
// it, but also finding a component that ends in `return useRender(...)`, Base UI's render-prop
// helper, which react-docgen alone passes over because it returns no JSX. Storybook's own docgen
// is off (.storybook/main.ts) and .storybook/perron-docgen.ts runs this one in its place; the
// docs check and the props table's test read components through it too. react-docgen cannot follow
// an imported type, so the members `<Name>Props` inherits from Base UI, such as `render`, come from
// the TypeScript compiler, read the way the props API (props.ts) reads `<Name>Props`.
import { dirname, relative } from 'node:path'
import ts from 'typescript'
import {
  builtinResolvers,
  defaultHandlers,
  ERROR_CODES,
  makeFsImporter,
  parse,
  utils,
  type Documentation,
  type Handler,
  type NodePath,
  type ResolverFunction,
} from 'react-docgen'
import { inPackage, propsProgram } from './props.ts'

type Definitions = ReturnType<ResolverFunction>

const isUseRenderCall = (p: NodePath): p is NodePath =>
  p.isCallExpression() && p.get('callee').isIdentifier({ name: 'useRender' })

const returnsUseRender = (path: NodePath) =>
  Boolean(utils.findFunctionReturn(path, isUseRenderCall))

/** Each exported function whose return is a `useRender(...)` call. */
const findUseRenderDefinitions: ResolverFunction = (file) => {
  const found: Definitions = []
  const visit = (path: Parameters<typeof utils.resolveExportDeclaration>[0]) => {
    for (const value of utils.resolveExportDeclaration(path))
      if (
        (value.isFunctionDeclaration() ||
          value.isFunctionExpression() ||
          value.isArrowFunctionExpression()) &&
        returnsUseRender(value)
      )
        found.push(value as Definitions[number])
    path.skip()
  }
  file.traverse({ ExportNamedDeclaration: visit, ExportDefaultDeclaration: visit })
  return found
}

const resolver = new builtinResolvers.ChainResolver(
  [new builtinResolvers.FindExportedDefinitionsResolver(), findUseRenderDefinitions],
  { chainingLogic: builtinResolvers.ChainResolver.Logic.ALL },
)

/** The name a definition is declared under in its file, which Storybook's docgen calls `actualName`. */
const actualName: Handler = (documentation, path) => {
  documentation.set('definedInFile', path.hub.file.opts.filename)
  let at: NodePath | null = path
  while (
    at &&
    !at.isFunctionDeclaration() &&
    !at.isClassDeclaration() &&
    !at.isVariableDeclarator()
  )
    at = at.parentPath
  const id = at?.get('id') as NodePath | undefined
  if (id?.isIdentifier()) documentation.set('actualName', id.node.name)
}

/** One component as docgen reads it, with the name its file declares it under. */
export type ComponentDoc = Documentation & { actualName?: string }

type PropDoc = NonNullable<Documentation['props']>[string]

/** Whether a declaration is Base UI's. */
const inBaseUi = (d: ts.Declaration) =>
  /[\\/]node_modules[\\/]@base-ui[\\/]/.test(d.getSourceFile().fileName)

/** A member as react-docgen writes one: its JSDoc with the tags as written, its `@default`. */
function propDoc(checker: ts.TypeChecker, member: ts.Symbol, at: ts.Declaration): PropDoc {
  const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(member, at))
  const tags = member.getJsDocTags(checker)
  const text = ts.displayPartsToString(member.getDocumentationComment(checker))
  const description = [
    text,
    ...tags.map((t) => `@${t.name} ${ts.displayPartsToString(t.text)}`.trim()),
  ]
    .filter(Boolean)
    .join('\n')
  const fallback = tags.find((t) => t.name === 'default')
  return {
    required: (member.flags & ts.SymbolFlags.Optional) === 0,
    tsType: {
      name: checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation),
    } as PropDoc['tsType'],
    description,
    ...(fallback && {
      defaultValue: { value: ts.displayPartsToString(fallback.text), computed: false },
    }),
  }
}

/** The type of the first parameter of the function `name` that `source` declares, if any. */
function firstParamType(checker: ts.TypeChecker, source: ts.SourceFile, name: string) {
  let found: ts.Type | undefined
  const visit = (node: ts.Node) => {
    if (found) return
    const fn =
      ts.isFunctionDeclaration(node) && node.name?.text === name
        ? node
        : ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text === name &&
            node.initializer &&
            (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
          ? node.initializer
          : undefined
    const param = fn?.parameters[0]
    if (param) found = checker.getTypeAtLocation(param)
    else ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

/**
 * Adds to each doc the members of the `<Name>Props` its component takes that react-docgen did not
 * read: those it inherits from Base UI, and the package's own declared in another file. React's
 * own, the HTML attributes, stay out of the table, as MUI's tables leave them out.
 */
function addInherited(docs: ComponentDoc[], src: string, filename: string) {
  const named = docs.filter((d) => d.actualName && src.includes(`${d.actualName}Props`))
  if (!named.length) return
  const config = ts.findConfigFile(dirname(filename), ts.sys.fileExists)
  const root = config ? dirname(config) : dirname(filename)
  const file = relative(root, filename)
  const { program, checker, propsOf } = propsProgram(root, [file], { [file]: src })
  const source = program.getSourceFile(filename)!
  for (const doc of named) {
    const { type } = propsOf(file, `${doc.actualName}Props`)
    if (!type || firstParamType(checker, source, doc.actualName!) !== type) continue
    for (const member of checker.getPropertiesOfType(type)) {
      if (doc.props?.[member.name]) continue
      const at = member.declarations?.find((d) => inPackage(d) || inBaseUi(d))
      if (!at) continue
      doc.props = { ...doc.props, [member.name]: propDoc(checker, member, at) }
    }
  }
}

/**
 * The components `src`, the file at `filename`, declares and exports, as the docs page's docgen
 * reads them, each with every member of its `<Name>Props` but React's own; one a file only
 * re-exports is its own file's.
 */
export function componentDocs(src: string, filename: string): ComponentDoc[] {
  let docs: (ComponentDoc & { definedInFile?: string })[]
  try {
    docs = parse(src, {
      filename,
      resolver,
      handlers: [...defaultHandlers, actualName],
      importer: makeFsImporter(),
    }) as (ComponentDoc & { definedInFile?: string })[]
  } catch (e) {
    if ((e as { code?: string }).code === ERROR_CODES.MISSING_DEFINITION) return []
    throw e
  }
  const own = docs.filter((d) => d.definedInFile === filename)
  addInherited(own, src, filename)
  return own
}
