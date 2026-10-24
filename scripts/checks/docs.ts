// The `docs` rule: every registered component or pattern has its spec page from `building` on,
// and its Storybook docs page, `<Name>.mdx` beside its code, from `stable` on: the component-docs
// skill writes that page once review passes, and the entry turns stable in the same PR
// (docs/components/README.md, "Files"). And the docgen that page's props table reads finds the
// component, with its props, in its code from `building` on, so a build cannot hand the docs stage
// an empty table. Each prop the spec's Props table gives a default shows that default in the
// table too, from a destructuring default or the member's JSDoc `@default`, such as "The locale's"
// for an owned-string prop, so the docs stage never meets an empty Default cell the build could
// have filled. A missing file or table has no line to excuse, so this rule takes no perron-allow.
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

/**
 * Each row of a spec's Props table that names one prop, with its line and its default, as the
 * props table would show it. A spec without the table gives none.
 */
function specDefaults(spec: string) {
  const lines = spec.split('\n')
  const start = lines.findIndex((l) => /^## Props\s*$/.test(l))
  if (start < 0) return []
  const head = lines.findIndex((l, i) => i > start && l.startsWith('|'))
  if (head < 0 || lines.slice(start + 1, head).some((l) => l.startsWith('## '))) return []
  const cells = (l: string) =>
    l
      .split(/(?<!\\)\|/)
      .slice(1, -1)
      .map((c) => c.trim().replaceAll('\\|', '|'))
  const column = cells(lines[head]).indexOf('Default')
  if (column < 0) return []
  const rows: { prop: string; line: number; default: string }[] = []
  for (let i = head + 2; i < lines.length && lines[i].startsWith('|'); i++) {
    const row = cells(lines[i])
    const names = codeSpans(row[0] ?? '')
    if (names.length === 1)
      rows.push({ prop: names[0], line: i + 1, default: specDefault(row[column] ?? '') })
  }
  return rows
}

/** Each prop whose default the docs page would show otherwise than the spec gives it. */
function defaultProblems(root: string, e: Entry, doc: ComponentDoc): Problem[] {
  const spec = join(root, specPage(e))
  if (!existsSync(spec)) return []
  return specDefaults(readFileSync(spec, 'utf8')).flatMap(({ prop, line, default: want }) => {
    const got = String(doc.props?.[prop]?.defaultValue?.value ?? '').trim()
    if (!doc.props?.[prop] || !want || got === want) return []
    return {
      file: codeFile(e),
      message: `${e.name}'s docs page would show ${got ? `"${got}"` : 'no default'} for ${prop}, where ${specPage(e)}:${line} gives "${want}": give it as the destructuring default or as \`@default ${want}\` in its JSDoc`,
    }
  })
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
      if (doc) problems.push(...defaultProblems(root, e, doc))
      if (DOCUMENTED.has(e.status) && missing(docsPage(e)))
        problems.push({
          file: docsPage(e),
          message: `${e.name} is ${e.status} and has no docs page; the component-docs skill writes it`,
        })
    }
    return problems.sort(byFileLine)
  },
} satisfies Check
