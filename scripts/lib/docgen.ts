// The docgen a component's docs page reads its props table from: react-docgen, as Storybook runs
// it, but also finding a component that ends in `return useRender(...)`, Base UI's render-prop
// helper, which react-docgen alone passes over because it returns no JSX. Storybook's own docgen
// is off (.storybook/main.ts) and .storybook/perron-docgen.ts runs this one in its place; the
// docs check and the props table's test read components through it too. react-docgen cannot follow
// an imported type, so the members `<Name>Props` inherits from Base UI, such as `render`, come from
// the TypeScript compiler, read the way the props API (props.ts) reads `<Name>Props`. A default
// the component cannot write as a destructuring default, such as `render`'s `<span />` or an
// owned-string prop's "The locale's", is its JSDoc's `@default`, which react-docgen leaves in the
// description; it becomes the prop's default here, as Base UI's members' do.
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

/**
 * React's props the contract's Props table shares with every component, which reach the root, and
 * their descriptions, since React's types give none. They join every table, as Base UI's own
 * `className` and `style` do on a Base UI part, so a `useRender` component's table has them too.
 */
const ROOT_PROPS: Record<string, string> = {
  className: "Joined after the component's own class on the root element.",
  style: 'Reaches the root element.',
  ref: 'Reaches the root element.',
}

/** Whether a declaration is Base UI's. */
const inBaseUi = (d: ts.Declaration) =>
  /[\\/]node_modules[\\/]@base-ui[\\/]/.test(d.getSourceFile().fileName)

/**
 * A member's type as the Props table shows it: without the `undefined` an optional member adds,
 * but with a `null` the type itself takes, such as Base UI's `value: number | null`, a ref's aside.
 */
function typeName(checker: ts.TypeChecker, type: ts.Type) {
  const name = (t: ts.Type) => checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation)
  const nullable = type.isUnion() && type.types.some((t) => t.flags & ts.TypeFlags.Null)
  const shown = name(checker.getNonNullableType(type))
  // React's `Ref<T>` takes null as every ref does; the table shows it as it always has
  if (!nullable || shown.includes('RefObject<')) return shown
  return `${shown.includes('=>') ? `(${shown})` : shown} | null`
}

/** A member as react-docgen writes one: its JSDoc with the tags as written, its `@default`. */
function propDoc(checker: ts.TypeChecker, member: ts.Symbol, at: ts.Declaration): PropDoc {
  const type = checker.getTypeOfSymbolAtLocation(member, at)
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
      name: typeName(checker, type),
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
 * read: those it inherits from Base UI, and the package's own declared in another file; and the
 * type of a member it read as `unknown`, such as a `readonly T[]`, written as the compiler does. React's
 * own, the HTML attributes, stay out of the table, as MUI's tables leave them out, but for the
 * root's `className`, `style` and `ref`. An inherited
 * member the component destructures with a default gets a row from react-docgen with that default
 * and nothing else: it takes the inherited type and JSDoc, and keeps the destructuring default.
 */
function addInherited(docs: ComponentDoc[], src: string, filename: string, shared?: DocgenProgram) {
  const named = docs.filter((d) => d.actualName && src.includes(`${d.actualName}Props`))
  if (!named.length) return
  const root = configRoot(filename)
  const file = relative(root, filename)
  // a program made for many files serves this one when it read the same text from the same root
  const fits = shared?.root === root && shared.program.getSourceFile(filename)?.text === src
  const { program, checker, propsOf } = fits ? shared : propsProgram(root, [file], { [file]: src })
  const source = program.getSourceFile(filename)!
  for (const doc of named) {
    const { type } = propsOf(file, `${doc.actualName}Props`)
    if (!type || firstParamType(checker, source, doc.actualName!) !== type) continue
    for (const member of checker.getPropertiesOfType(type)) {
      const read = doc.props?.[member.name]
      if (read?.tsType && read.tsType.name !== 'unknown') continue
      const own = member.declarations?.find((d) => inPackage(d) || inBaseUi(d))
      const at = own ?? (ROOT_PROPS[member.name] ? member.declarations?.[0] : undefined)
      if (!at) continue
      if (read?.tsType) {
        // react-docgen read the member but not its type, as for `readonly T[]`: the compiler's
        read.tsType = { name: propDoc(checker, member, at).tsType!.name } as typeof read.tsType
        continue
      }
      const inherited = propDoc(checker, member, at)
      if (!own) {
        inherited.description = ROOT_PROPS[member.name]
        // React's `Ref<T>` alias, as written, rather than the union it stands for
        const written = checker.typeToString(checker.getTypeOfSymbolAtLocation(member, at))
        inherited.tsType = {
          name: written.replace(/ \| undefined$/, ''),
        } as typeof inherited.tsType
      }
      if (read?.defaultValue) inherited.defaultValue = read.defaultValue
      doc.props = { ...doc.props, [member.name]: inherited }
    }
  }
}

/** The folder of the tsconfig that holds `filename`, the root its program resolves from. */
function configRoot(filename: string) {
  const config = ts.findConfigFile(dirname(filename), ts.sys.fileExists)
  return config ? dirname(config) : dirname(filename)
}

/** One TypeScript program over many components' files, for `componentDocs` to share. */
export type DocgenProgram = ReturnType<typeof propsProgram> & { root: string }

/**
 * One program over `filenames`, as they are on disk, so a caller that reads many components, as
 * the docs check does, builds the compiler's view of their types once rather than once a file.
 */
export function docgenProgram(filenames: string[]): DocgenProgram | undefined {
  if (!filenames.length) return undefined
  const root = configRoot(filenames[0])
  return {
    root,
    ...propsProgram(
      root,
      filenames.map((f) => relative(root, f)),
    ),
  }
}

/** The text of a `@default` tag in a JSDoc description: up to the next tag or the end. */
const DEFAULT_TAG = /^@default[ \t]+(.+?)\s*(?=^@\w|(?![\s\S]))/ms

/** Gives each of a doc's own props with no destructuring default the one its `@default` names. */
function addTaggedDefaults(doc: ComponentDoc) {
  for (const prop of Object.values(doc.props ?? {})) {
    if (prop.defaultValue) continue
    const tagged = DEFAULT_TAG.exec(prop.description ?? '')?.[1]
    if (tagged) prop.defaultValue = { value: tagged.replace(/\s+/g, ' '), computed: false }
  }
}

/**
 * The components `src`, the file at `filename`, declares and exports, as the docs page's docgen
 * reads them, each with every member of its `<Name>Props` but React's own; one a file only
 * re-exports is its own file's. `shared`, from `docgenProgram`, saves building a program for it.
 */
export function componentDocs(
  src: string,
  filename: string,
  shared?: DocgenProgram,
): ComponentDoc[] {
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
  own.forEach(addTaggedDefaults)
  addInherited(own, src, filename, shared)
  return own
}
