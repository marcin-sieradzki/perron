// The `docs` rule: every registered component or pattern has its spec page from `building` on,
// and its Storybook docs page, `<Name>.mdx` beside its code, from `stable` on: the component-docs
// skill writes that page once review passes, and the entry turns stable in the same PR
// (docs/components/README.md, "Files"). And the docgen that page's props table reads finds the
// component, with its props, in its code from `building` on, so a build cannot hand the docs stage
// an empty table. A missing file or table has no line to excuse, so this rule takes no perron-allow.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { componentDocs } from '../lib/docgen.ts'
import { PACKAGE } from '../lib/paths.ts'
import { codeFile } from '../lib/props.ts'
import { folderOf, isBuilt, readRegistry, specPage, type Entry } from '../lib/registry.ts'
import { byFileLine, type Check, type Problem } from './lib.ts'

const RULE = 'docs'

/** An entry's docs page, by path from the repo root. */
const docsPage = (e: Entry) => `${PACKAGE}/src/${folderOf(e.layer)}/${e.name}/${e.name}.mdx`

/** The statuses that need the docs page: the entry's docs stage is done. */
const DOCUMENTED = new Set(['stable', 'deprecated'])

/** Whether the docs page's docgen reads `e` out of its code with at least one prop. */
function hasProps(root: string, e: Entry) {
  const file = join(root, codeFile(e))
  const doc = componentDocs(readFileSync(file, 'utf8'), file).find((d) => d.actualName === e.name)
  return Object.keys(doc?.props ?? {}).length > 0
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
      if (!missing(codeFile(e)) && !hasProps(root, e))
        problems.push({
          file: codeFile(e),
          message: `${e.name}'s docs page would show no props: its docgen finds no exported function component ${e.name} taking ${e.name}Props`,
        })
      if (DOCUMENTED.has(e.status) && missing(docsPage(e)))
        problems.push({
          file: docsPage(e),
          message: `${e.name} is ${e.status} and has no docs page; the component-docs skill writes it`,
        })
    }
    return problems.sort(byFileLine)
  },
} satisfies Check
