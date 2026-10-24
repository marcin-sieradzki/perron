// The `docs` rule: every registered component or pattern has its spec page from `building` on,
// and its Storybook docs page, `<Name>.mdx` beside its code, from `stable` on: the component-docs
// skill writes that page once review passes, and the entry turns stable in the same PR
// (docs/components/README.md, "Files"). A missing file has no line to excuse, so this rule takes
// no perron-allow.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE } from '../lib/paths.ts'
import { folderOf, isBuilt, readRegistry, specPage, type Entry } from '../lib/registry.ts'
import { byFileLine, type Check, type Problem } from './lib.ts'

const RULE = 'docs'

/** An entry's docs page, by path from the repo root. */
const docsPage = (e: Entry) => `${PACKAGE}/src/${folderOf(e.layer)}/${e.name}/${e.name}.mdx`

/** The statuses that need the docs page: the entry's docs stage is done. */
const DOCUMENTED = new Set(['stable', 'deprecated'])

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
      if (DOCUMENTED.has(e.status) && missing(docsPage(e)))
        problems.push({
          file: docsPage(e),
          message: `${e.name} is ${e.status} and has no docs page; the component-docs skill writes it`,
        })
    }
    return problems.sort(byFileLine)
  },
} satisfies Check
