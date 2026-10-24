// Reads each component's exported `<Name>Props` with the TypeScript compiler: the one loader the
// props check and the props API (api.ts) share.
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import ts from 'typescript'
import { PACKAGE } from './paths.ts'
import type { Entry } from './registry.ts'

/** The code file of a registered entry, by the contract's file convention. */
export const codeFile = (e: Entry) =>
  `${PACKAGE}/src/${e.layer === 'pattern' ? 'patterns' : 'components'}/${e.name}/${e.name}.tsx`

/** The options of `root`'s tsconfig.json, so types resolve as `npm run typecheck` sees them. */
function compilerOptions(root: string): ts.CompilerOptions {
  const path = join(root, 'tsconfig.json')
  if (!existsSync(path))
    return { strict: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.NodeNext, types: [] }
  const { config } = ts.readConfigFile(path, ts.sys.readFile)
  return ts.parseJsonConfigFileContent(config, ts.sys, root).options
}

/** Whether a declaration is the package's own, not a library's. */
export const inPackage = (d: ts.Declaration) =>
  !/[\\/]node_modules[\\/]/.test(d.getSourceFile().fileName)

/** One file's props type: the symbol it exports as `<Name>Props`, if any, and its type. */
export interface PropsType {
  name: string
  symbol?: ts.Symbol
  type?: ts.Type
}

/** One program over `files` (paths from `root`), and the props type `<Name>.tsx` exports. */
export function propsProgram(root: string, files: string[]) {
  const program = ts.createProgram(
    files.map((f) => join(root, f)),
    { ...compilerOptions(root), noEmit: true },
  )
  const checker = program.getTypeChecker()
  const propsOf = (file: string): PropsType => {
    const name = `${basename(file).replace(/\.tsx?$/, '')}Props`
    const source = program.getSourceFile(join(root, file))
    const module = source && checker.getSymbolAtLocation(source)
    const exported = module && checker.getExportsOfModule(module).find((s) => s.name === name)
    if (!exported?.declarations?.length) return { name }
    const symbol =
      exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
    return { name, symbol, type: checker.getDeclaredTypeOfSymbol(symbol) }
  }
  return { checker, propsOf }
}
