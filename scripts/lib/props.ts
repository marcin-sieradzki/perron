// Reads each component's exported `<Name>Props` with the TypeScript compiler: the one loader the
// props check and the props API (api.ts) share.
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import ts from 'typescript'
import { PACKAGE } from './paths.ts'
import { folderOf, type Entry } from './entry.ts'

/** The code file of a registered entry, by the contract's file convention. */
export const codeFile = (e: Entry) => `${PACKAGE}/src/${folderOf(e.layer)}/${e.name}/${e.name}.tsx`

/** The options of `root`'s tsconfig.json, so types resolve as `npm run typecheck` sees them. */
function compilerOptions(root: string): ts.CompilerOptions {
  const path = join(root, 'tsconfig.json')
  if (!existsSync(path))
    return { strict: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.NodeNext, types: [] }
  const { config } = ts.readConfigFile(path, ts.sys.readFile)
  return ts.parseJsonConfigFileContent(config, ts.sys, root).options
}

const inNodeModules = (file: string) => /[\\/]node_modules[\\/]/.test(file)

/** Whether a declaration is the package's own, not a library's. */
export const inPackage = (d: ts.Declaration) => !inNodeModules(d.getSourceFile().fileName)

/** One file's props type: the symbol it exports as `<Name>Props`, if any, and its type. */
export interface PropsType {
  name: string
  symbol?: ts.Symbol
  type?: ts.Type
}

/** A library's files, parsed once per process and root: its programs read the same node_modules. */
const libraryFiles = new Map<string, ts.SourceFile>()

/**
 * One program over `files` (paths from `root`), and the props type `<Name>.tsx` exports, or the one
 * named `name`. `texts` gives a file's text by its path from `root`, in place of the one on disk.
 */
export function propsProgram(root: string, files: string[], texts: Record<string, string> = {}) {
  const options = { ...compilerOptions(root), noEmit: true }
  const host = ts.createCompilerHost(options)
  const given = new Map(Object.entries(texts).map(([f, text]) => [join(root, f), text]))
  const { getSourceFile, fileExists, readFile } = host
  host.fileExists = (f) => given.has(f) || fileExists.call(host, f)
  host.readFile = (f) => given.get(f) ?? readFile.call(host, f)
  host.getSourceFile = (f, language, ...rest) => {
    const text = given.get(f)
    if (text !== undefined) return ts.createSourceFile(f, text, language, true)
    if (!inNodeModules(f)) return getSourceFile.call(host, f, language, ...rest)
    const key = `${root}\0${f}`
    let source = libraryFiles.get(key)
    if (!source) {
      source = getSourceFile.call(host, f, language, ...rest)
      if (source) libraryFiles.set(key, source)
    }
    return source
  }
  const program = ts.createProgram(
    files.map((f) => join(root, f)),
    options,
    host,
  )
  const checker = program.getTypeChecker()
  const propsOf = (
    file: string,
    name = `${basename(file).replace(/\.tsx?$/, '')}Props`,
  ): PropsType => {
    const source = program.getSourceFile(join(root, file))
    const module = source && checker.getSymbolAtLocation(source)
    const exported = module && checker.getExportsOfModule(module).find((s) => s.name === name)
    if (!exported?.declarations?.length) return { name }
    const symbol =
      exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
    return { name, symbol, type: checker.getDeclaredTypeOfSymbol(symbol) }
  }
  return { program, checker, propsOf }
}
