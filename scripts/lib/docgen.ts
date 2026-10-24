// The docgen a component's docs page reads its props table from: react-docgen, as Storybook runs
// it, but also finding a component that ends in `return useRender(...)`, Base UI's render-prop
// helper, which react-docgen alone passes over because it returns no JSX. Storybook's own docgen
// is off (.storybook/main.ts) and .storybook/perron-docgen.ts runs this one in its place; the
// docs check and the props table's test read components through it too.
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

/**
 * The components `src`, the file at `filename`, declares and exports, as the docs page's docgen
 * reads them; one a file only re-exports is its own file's.
 */
export function componentDocs(src: string, filename: string): ComponentDoc[] {
  try {
    const docs = parse(src, {
      filename,
      resolver,
      handlers: [...defaultHandlers, actualName],
      importer: makeFsImporter(),
    }) as (ComponentDoc & { definedInFile?: string })[]
    return docs.filter((d) => d.definedInFile === filename)
  } catch (e) {
    if ((e as { code?: string }).code === ERROR_CODES.MISSING_DEFINITION) return []
    throw e
  }
}
