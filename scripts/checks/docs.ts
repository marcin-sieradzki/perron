// The `docs` rule: every registered component or pattern past designing has its Storybook docs
// page, `<Name>.mdx` beside its code, and its spec page (docs/components/README.md, "Files").
// A missing file has no line to excuse, so this rule takes no perron-allow.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE } from '../lib/paths.ts'
import { readRegistry, specPage, type Entry } from '../lib/registry.ts'
import type { Check, Problem } from './lib.ts'

/** An entry's docs page, by path from the repo root. */
export const docsPage = (e: Entry) =>
  `${PACKAGE}/src/${e.layer === 'component' ? 'components' : 'patterns'}/${e.name}/${e.name}.mdx`

const check: Check = {
  rule: 'docs',
  run(root) {
    const problems: Problem[] = []
    const missing = (rel: string) => !existsSync(join(root, rel))
    for (const e of readRegistry(root)) {
      if (e.status === 'designing') continue
      if (missing(docsPage(e)))
        problems.push({
          file: docsPage(e),
          message: `${e.name} is ${e.status} and has no docs page; the component-docs skill writes it`,
        })
      if (missing(specPage(e)))
        problems.push({
          file: specPage(e),
          message: `${e.name} is ${e.status} and has no spec page; copy docs/components/TEMPLATE.md`,
        })
    }
    return problems
  },
}

export default check
