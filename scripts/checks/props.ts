// The props rule: each component's `<Name>Props`, read with the TypeScript compiler, keeps to the
// vocabulary of the contract's "Props" and "State and events" sections (docs/components/README.md).
import { existsSync, readFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import ts from 'typescript'
import { PACKAGE } from '../lib/paths.ts'
import { readRegistry, type Entry } from '../lib/registry.ts'
import { excuse, type Check, type Problem } from './lib.ts'

const RULE = 'props'

const INTENTS = ['neutral', 'brand', 'success', 'warning', 'danger', 'info']
const SIZES = ['small', 'medium', 'large']
const BANNED: Record<string, string> = {
  sx: 'restyle through className',
  classes: 'restyle through className, on the root or in slotProps',
  component: 'swap the root with render',
  as: 'swap the root with render',
  styled: 'restyle through className',
  theme: 'the tokens carry the themes',
  state: "read Base UI's data attributes",
  onValueChange: 'adapt it to onChange(event, value, details)',
  onOpenChange: 'adapt it to onOpen(event, details) and onClose(event, reason, details)',
  leftIcon: 'use startIcon',
  rightIcon: 'use endIcon',
}
const BOOLEANS = ['disabled', 'fullWidth', 'required', 'readOnly', 'open', 'defaultOpen']
const EVENTS: Record<string, string[][]> = {
  onChange: [['event', 'value', 'details'], ['event']],
  onOpen: [['event', 'details']],
  onClose: [['event', 'reason', 'details']],
}

/** The code file of a registered entry, by the contract's file convention. */
export const codeFile = (e: Entry) =>
  `${PACKAGE}/src/${e.layer === 'pattern' ? 'patterns' : 'components'}/${e.name}/${e.name}.tsx`

/** The compiler options of the repo's tsconfig.json, so types resolve as `npm run typecheck` sees them. */
function options(root: string) {
  const path = join(root, 'tsconfig.json')
  const { config } = ts.readConfigFile(path, ts.sys.readFile)
  return ts.parseJsonConfigFileContent(config, ts.sys, root).options
}

const inPackage = (d: ts.Declaration) => !/[\\/]node_modules[\\/]/.test(d.getSourceFile().fileName)

/** The parts of `t` without undefined and null: an optional `size` is still its literals. */
const parts = (checker: ts.TypeChecker, t: ts.Type) => {
  const n = checker.getNonNullableType(t)
  return n.isUnion() ? n.types : [n]
}

/** What is wrong with the type of one member the props type declares itself, if anything. */
function typeBreach(checker: ts.TypeChecker, name: string, decl: ts.Declaration, t: ts.Type) {
  const ps = parts(checker, t)
  const text = checker.typeToString(checker.getNonNullableType(t))
  const literals = ps.every((p) => p.isStringLiteral())
  const values = ps.map((p) => (p.isStringLiteral() ? p.value : checker.typeToString(p)))
  const isBool = ps.every((p) => p.flags & ts.TypeFlags.BooleanLike)
  if (name === 'variant' && !literals)
    return `variant is a union of string literals, the Penpot values, not ${text}`
  if (name === 'color' && !(literals && values.every((v) => INTENTS.includes(v))))
    return `color takes only the intents ${INTENTS.join(', ')}; not ${
      values
        .filter((v) => !INTENTS.includes(v))
        .map((v) => `'${v}'`)
        .join(', ') || text
    }`
  if (name === 'size' && !(literals && values.every((v) => SIZES.includes(v))))
    return `size takes only small, medium and large; not ${
      values
        .filter((v) => !SIZES.includes(v))
        .map((v) => `'${v}'`)
        .join(', ') || text
    }`
  if (BOOLEANS.includes(name) && !isBool)
    return `${name} is a boolean in every component, not ${text}`
  if (isBool && /^(is|has|should)[A-Z]/.test(name)) return prefix(name)
  if ((name === 'startIcon' || name === 'endIcon') && !isReactNode(decl))
    return `${name} is a ReactNode, not ${text}`
  if (
    (name === 'name' || /^[a-z]\w*Label$/.test(name)) &&
    !(ps.length === 1 && ps[0].flags & ts.TypeFlags.String)
  )
    return `${name} is a string, not ${text}`
  if (EVENTS[name]) {
    const sig = checker.getNonNullableType(t).getCallSignatures()[0]
    const got = sig?.parameters.map((p) => p.name) ?? []
    if (!EVENTS[name].some((want) => want.join() === got.join()))
      return `${name} is ${EVENTS[name].map((w) => `${name}(${w.join(', ')})`).join(', or a native text input’s ')}; here it is ${sig ? `${name}(${got.join(', ')})` : text}`
  }
}

const prefix = (name: string) =>
  `${name} is a boolean with is, has or should in front; name it as an adjective, such as ${name.replace(/^(is|has|should)(\w)/, (_, __, c: string) => c.toLowerCase())}`

/** Whether a member is declared as React's `ReactNode`, by name, as the contract writes it. */
function isReactNode(decl: ts.Declaration) {
  const type = (decl as ts.PropertySignature).type
  return !!type && ts.isTypeReferenceNode(type) && /(^|\.)ReactNode$/.test(type.typeName.getText())
}

const hasDoc = (d: ts.Declaration) =>
  ts.getJSDocCommentsAndTags(d).some((j) => ts.isJSDoc(j) && (!!j.comment || !!j.tags?.length))

/**
 * The problems of the props types in `files` (paths from `root`): each file `<Name>.tsx` exports
 * `<Name>Props`, whose members keep to the contract's vocabulary and carry JSDoc.
 */
export function propsProblems(root: string, files: string[]): Problem[] {
  if (!files.length) return []
  const program = ts.createProgram(
    files.map((f) => join(root, f)),
    { ...options(root), noEmit: true },
  )
  const checker = program.getTypeChecker()
  const problems: Problem[] = []
  const lineOf = (node: ts.Node) => {
    const sf = node.getSourceFile()
    return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
  }
  const fileOf = (node: ts.Node) => relative(root, node.getSourceFile().fileName)
  for (const file of files) {
    const name = `${basename(file).replace(/\.tsx?$/, '')}Props`
    const source = program.getSourceFile(join(root, file))
    const module = source && checker.getSymbolAtLocation(source)
    const symbol = module && checker.getExportsOfModule(module).find((s) => s.name === name)
    if (!symbol?.declarations?.length) {
      problems.push({
        file,
        line: 1,
        message: `exports no ${name}; a component exports its props type`,
      })
      continue
    }
    const at = symbol.declarations[0]
    const type = checker.getDeclaredTypeOfSymbol(
      symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol,
    )
    const members = type.isUnion()
      ? [...new Map(type.types.flatMap((t) => t.getProperties()).map((p) => [p.name, p])).values()]
      : checker.getPropertiesOfType(type)
    for (const member of members) {
      const decls = member.declarations ?? []
      const own = decls.find(inPackage)
      const where = own ?? at
      const report = (message: string) =>
        problems.push({ file: fileOf(where), line: lineOf(where), message })
      if (BANNED[member.name])
        report(`${member.name} is not a prop of any component; ${BANNED[member.name]}`)
      const t = checker.getTypeOfSymbol(member)
      if (!own) {
        const ps = parts(checker, t)
        if (
          ps.every((p) => p.flags & ts.TypeFlags.BooleanLike) &&
          /^(is|has|should)[A-Z]/.test(member.name)
        )
          report(prefix(member.name))
        continue
      }
      const breach = typeBreach(checker, member.name, own, t)
      if (breach) report(breach)
      if (!decls.filter(inPackage).some(hasDoc)) report(`${member.name} has no JSDoc comment`)
    }
  }
  const unique = [...new Map(problems.map((p) => [`${p.file}:${p.line}:${p.message}`, p])).values()]
  return excuse(unique, RULE, (f) => readFileSync(join(root, f), 'utf8'))
}

export default {
  rule: RULE,
  run(root) {
    const files: string[] = []
    const problems: Problem[] = []
    for (const entry of readRegistry(root)) {
      const file = codeFile(entry)
      if (existsSync(join(root, file))) files.push(file)
      else if (entry.status !== 'designing')
        problems.push({ file, message: `${entry.name} is ${entry.status} but has no ${file}` })
    }
    return [...problems, ...propsProblems(root, files)]
  },
} satisfies Check
