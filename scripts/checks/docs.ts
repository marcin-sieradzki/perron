// The `docs` rule: every registered component or pattern has its spec page from `building` on,
// and its Storybook docs page, `<Name>.mdx` beside its code, from `stable` on: the component-docs
// skill writes that page once review passes, and the entry turns stable in the same PR
// (docs/components/README.md, "Files"). And the docgen that page's props table reads finds the
// component, with its props, in its code from `building` on, so a build cannot hand the docs stage
// an empty table. The spec's Props table and that table give the same props: a row for every member
// of `<Name>Props`, those it inherits from Base UI included, and a member for every row (a
// `slotProps.<part>` row is the `slotProps` member's). Each prop the spec gives a default shows that
// default in the table too, from a destructuring default or the member's JSDoc `@default`, such as
// "The locale's" for an owned-string prop, so the docs stage never meets a row or a Default cell the
// brief or the build could have settled. A missing file or table has no line to excuse, so this rule
// takes no perron-allow.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { componentDocs, type ComponentDoc } from '../lib/docgen.ts'
import { PACKAGE } from '../lib/paths.ts'
import { codeFile } from '../lib/props.ts'
import { folderOf, isBuilt, readRegistry, specPage, type Entry } from '../lib/registry.ts'
import { byFileLine, codeSpans, type Check, type Problem } from './lib.ts'

const RULE = 'docs'

/** An entry's docs page, by path from the repo root. */
const docsPage = (e: Entry) => `${PACKAGE}/src/${folderOf(e.layer)}/${e.name}/${e.name}.mdx`

/** The statuses that need the docs page: the entry's docs stage is done. */
const DOCUMENTED = new Set(['stable', 'deprecated'])

/** The docs page's docgen of `e`, read out of its code. */
function docOf(root: string, e: Entry) {
  const file = join(root, codeFile(e))
  return componentDocs(readFileSync(file, 'utf8'), file).find((d) => d.actualName === e.name)
}

/** A Default cell as the props table would show it: a lone code span's text; nothing for none. */
function specDefault(cell: string) {
  const plain = /^`[^`]+`$/.test(cell) ? codeSpans(cell)[0] : cell
  return /^(none|\(required\)|—|-)?$/i.test(plain.trim()) ? '' : plain.trim()
}

/** One row of a spec's Props table: the props it names, its line and its default. */
interface SpecRow {
  names: string[]
  line: number
  default: string
}

/**
 * The rows of a spec's Props table, each with the props its Name cell names, its line, and its
 * default as the props table would show it; nothing when the spec has no such table.
 */
function propsRows(spec: string): SpecRow[] | undefined {
  const lines = spec.split('\n')
  const start = lines.findIndex((l) => /^## Props\s*$/.test(l))
  if (start < 0) return undefined
  const head = lines.findIndex((l, i) => i > start && l.startsWith('|'))
  if (head < 0 || lines.slice(start + 1, head).some((l) => l.startsWith('## '))) return undefined
  const cells = (l: string) =>
    l
      .split(/(?<!\\)\|/)
      .slice(1, -1)
      .map((c) => c.trim().replaceAll('\\|', '|'))
  const column = cells(lines[head]).indexOf('Default')
  if (column < 0) return undefined
  const rows: SpecRow[] = []
  for (let i = head + 2; i < lines.length && lines[i].startsWith('|'); i++) {
    const row = cells(lines[i])
    const names = codeSpans(row[0] ?? '')
    if (names.length) rows.push({ names, line: i + 1, default: specDefault(row[column] ?? '') })
  }
  return rows
}

/** The member of `<Name>Props` a Name cell's prop is: `slotProps.icon` is `slotProps`. */
const memberOf = (name: string) => name.split('.')[0]

/** Each row with no member behind it, and each member with no row. */
function rowProblems(e: Entry, doc: ComponentDoc, rows: SpecRow[]): Problem[] {
  const members = Object.keys(doc.props ?? {})
  const named = new Set(rows.flatMap((r) => r.names.map(memberOf)))
  const missing = members
    .filter((m) => !named.has(m))
    .map((m) => ({
      file: specPage(e),
      message: `${e.name}'s docs page would show ${m}, which ${specPage(e)}'s Props table has no row for: give it a row, as for every member of ${e.name}Props, those inherited from Base UI included, which the component does not declare again`,
    }))
  const extra = rows.flatMap((r) =>
    r.names
      .filter((n) => !members.includes(memberOf(n)))
      .map((n) => ({
        file: specPage(e),
        line: r.line,
        message: `${n} is a row of ${specPage(e)}'s Props table but no member of ${e.name}Props, so the docs page would leave it out: give ${e.name}Props the member, or take the row out`,
      })),
  )
  return [...missing, ...extra]
}

/** Each prop whose default the docs page would show otherwise than the spec gives it. */
function defaultProblems(e: Entry, doc: ComponentDoc, rows: SpecRow[]): Problem[] {
  return rows.flatMap(({ names, line, default: want }) => {
    if (names.length !== 1) return []
    const prop = names[0]
    const got = String(doc.props?.[prop]?.defaultValue?.value ?? '').trim()
    if (!doc.props?.[prop] || !want || got === want) return []
    return {
      file: codeFile(e),
      message: `${e.name}'s docs page would show ${got ? `"${got}"` : 'no default'} for ${prop}, where ${specPage(e)}:${line} gives "${want}": give it as the destructuring default or as \`@default ${want}\` in its JSDoc`,
    }
  })
}

/** Where the spec's Props table and the docs page's would differ. */
function tableProblems(root: string, e: Entry, doc: ComponentDoc): Problem[] {
  const spec = join(root, specPage(e))
  const rows = existsSync(spec) ? propsRows(readFileSync(spec, 'utf8')) : undefined
  return rows ? [...rowProblems(e, doc, rows), ...defaultProblems(e, doc, rows)] : []
}

export default {
  rule: RULE,
  run(root) {
    const problems: Problem[] = []
    const missing = (rel: string) => !existsSync(join(root, rel))
    for (const e of readRegistry(root).filter(isBuilt)) {
      if (missing(specPage(e)))
        problems.push({
          file: specPage(e),
          message: `${e.name} is ${e.status} and has no spec page; copy docs/components/TEMPLATE.md`,
        })
      const doc = missing(codeFile(e)) ? undefined : docOf(root, e)
      if (!missing(codeFile(e)) && !Object.keys(doc?.props ?? {}).length)
        problems.push({
          file: codeFile(e),
          message: `${e.name}'s docs page would show no props: its docgen finds no exported function component ${e.name} taking ${e.name}Props`,
        })
      if (doc) problems.push(...tableProblems(root, e, doc))
      if (DOCUMENTED.has(e.status) && missing(docsPage(e)))
        problems.push({
          file: docsPage(e),
          message: `${e.name} is ${e.status} and has no docs page; the component-docs skill writes it`,
        })
    }
    return problems.sort(byFileLine)
  },
} satisfies Check
