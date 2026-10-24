// The props rule: each component's `<Name>Props`, read with the TypeScript compiler, keeps to the
// vocabulary of the contract's "Props" and "State and events" sections (docs/components/README.md).
// The intents, the sizes and the names from other libraries come from the contract's tables.
import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { codeFile, inPackage, propsProgram } from '../lib/props.ts'
import { isBuilt, readRegistry } from '../lib/registry.ts'
import {
  byFileLine,
  codeSpans,
  CONTRACT,
  excuse,
  section,
  tableRows,
  type Check,
  type Problem,
} from './lib.ts'

const RULE = 'props'

/** What the contract's tables say a props type takes. */
export interface PropRules {
  /** The `color` values, from "Intents" */
  intents: string[]
  /** The `size` values, from the `size` row of the "Props" table */
  sizes: string[]
  /** Each name from "Names from other libraries", with what a component takes in its place */
  banned: Record<string, string>
}

/** The rules of the contract's "Props", "Names from other libraries" and "Intents" tables. */
export function readPropRules(contract: string): PropRules {
  const size = tableRows(section(contract, 'Props')).find(([prop]) =>
    codeSpans(prop).includes('size'),
  )
  if (!size) throw new Error(`${CONTRACT}, "Props", has no size row`)
  const banned: Record<string, string> = {}
  for (const [use, names] of tableRows(section(contract, 'Names from other libraries'))) {
    const plain = use.replaceAll('`', '')
    for (const name of codeSpans(names))
      banned[name] = /^[A-Z][a-z]/.test(plain) ? plain[0].toLowerCase() + plain.slice(1) : plain
  }
  return {
    intents: tableRows(section(contract, 'Intents')).map(([intent]) => codeSpans(intent)[0]),
    sizes: [...size[1].matchAll(/'([^']+)'/g)].map((m) => m[1]),
    banned,
  }
}
const BOOLEANS = ['disabled', 'fullWidth', 'required', 'readOnly', 'open', 'defaultOpen']
const EVENTS: Record<string, string[][]> = {
  onChange: [['event', 'value', 'details'], ['event']],
  onOpen: [['event', 'details']],
  onClose: [['event', 'reason', 'details']],
}

/** The members of the union `t`, without undefined and null: an optional `size` is still its literals. */
const unionMembers = (checker: ts.TypeChecker, t: ts.Type) => {
  const n = checker.getNonNullableType(t)
  return n.isUnion() ? n.types : [n]
}

/** What is wrong with the type of one member the props type declares itself, if anything. */
function typeBreach(
  checker: ts.TypeChecker,
  rules: PropRules,
  name: string,
  decl: ts.Declaration,
  t: ts.Type,
) {
  const { intents, sizes } = rules
  const ps = unionMembers(checker, t)
  const text = checker.typeToString(checker.getNonNullableType(t))
  const literals = ps.every((p) => p.isStringLiteral())
  const values = ps.map((p) => (p.isStringLiteral() ? p.value : checker.typeToString(p)))
  const isBool = ps.every((p) => p.flags & ts.TypeFlags.BooleanLike)
  if (name === 'variant' && !literals)
    return `variant is a union of string literals, the Penpot values, not ${text}`
  if (name === 'color' && !(literals && values.every((v) => intents.includes(v))))
    return `color takes only the intents ${intents.join(', ')}; not ${
      values
        .filter((v) => !intents.includes(v))
        .map((v) => `'${v}'`)
        .join(', ') || text
    }`
  if (name === 'size' && !(literals && values.every((v) => sizes.includes(v))))
    return `size takes only ${sizes.join(', ')}; not ${
      values
        .filter((v) => !sizes.includes(v))
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
  const rules = readPropRules(readFileSync(join(root, CONTRACT), 'utf8'))
  const { checker, propsOf } = propsProgram(root, files)
  const problems: Problem[] = []
  const lineOf = (node: ts.Node) => {
    const sf = node.getSourceFile()
    return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
  }
  const fileOf = (node: ts.Node) => relative(root, node.getSourceFile().fileName)
  for (const file of files) {
    const { name, symbol, type } = propsOf(file)
    if (!symbol?.declarations?.length || !type) {
      problems.push({
        file,
        line: 1,
        message: `exports no ${name}; a component exports its props type`,
      })
      continue
    }
    const propsDecl = symbol.declarations[0]
    const members = type.isUnion()
      ? [...new Map(type.types.flatMap((t) => t.getProperties()).map((p) => [p.name, p])).values()]
      : checker.getPropertiesOfType(type)
    for (const member of members) {
      const decls = member.declarations ?? []
      const own = decls.find(inPackage)
      const where = own ?? propsDecl
      const report = (message: string) =>
        problems.push({ file: fileOf(where), line: lineOf(where), message })
      const instead = rules.banned[member.name]
      if (instead) report(`${member.name} is not a prop of any component; use ${instead}`)
      const t = checker.getTypeOfSymbol(member)
      if (!own) {
        const ps = unionMembers(checker, t)
        if (
          ps.every((p) => p.flags & ts.TypeFlags.BooleanLike) &&
          /^(is|has|should)[A-Z]/.test(member.name)
        )
          report(prefix(member.name))
        continue
      }
      const breach = typeBreach(checker, rules, member.name, own, t)
      if (breach) report(breach)
      if (!decls.filter(inPackage).some(hasDoc)) report(`${member.name} has no JSDoc comment`)
    }
  }
  const unique = [...new Map(problems.map((p) => [`${p.file}:${p.line}:${p.message}`, p])).values()]
  return excuse(unique, RULE, (f) => readFileSync(join(root, f), 'utf8')).sort(byFileLine)
}

export default {
  rule: RULE,
  run(root) {
    const files: string[] = []
    const problems: Problem[] = []
    for (const entry of readRegistry(root)) {
      const file = codeFile(entry)
      if (existsSync(join(root, file))) files.push(file)
      else if (isBuilt(entry))
        problems.push({ file, message: `${entry.name} is ${entry.status} but has no ${file}` })
    }
    return [...problems, ...propsProblems(root, files)].sort(byFileLine)
  },
} satisfies Check
