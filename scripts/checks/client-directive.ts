// The `client-directive` rule: every registered entry's main file, `<Name>.tsx`, and
// `PerronProvider.tsx` open with the `'use client'` directive, so a React Server Components app,
// such as a Next.js one, can import `@mylder/perron` from a server module and gets the components
// as client references (the contract's "Files", docs/components/README.md). The barrels carry no
// directive: they only re-export, and npm run registry writes them from the same entries. Only a
// comment may sit above it.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { isBuilt } from '../lib/entry.ts'
import { PACKAGE } from '../lib/paths.ts'
import { codeFile } from '../lib/props.ts'
import { readRegistry } from '../lib/registry.ts'
import { byFileLine, excuse, type Check, type Problem } from './lib.ts'

const RULE = 'client-directive'
const PROVIDER = `${PACKAGE}/src/PerronProvider.tsx`

/** Whether the first statement of `text` is the `'use client'` directive, comments aside. */
export function hasDirective(file: string, text: string) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX)
  const [first] = source.statements
  return (
    !!first &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === 'use client'
  )
}

/** The files that need the directive: the provider and each built entry's main file. */
export function clientFiles(root: string) {
  return [PROVIDER, ...readRegistry(root).filter(isBuilt).map(codeFile)]
}

export default {
  rule: RULE,
  run(root) {
    const read = (file: string) => readFileSync(join(root, file), 'utf8')
    const problems: Problem[] = clientFiles(root).flatMap((file): Problem[] => {
      if (!existsSync(join(root, file)))
        return [{ file, message: `is missing; a built entry's code is its <Name>.tsx` }]
      if (hasDirective(file, read(file))) return []
      return [
        {
          file,
          line: 1,
          message: `does not open with 'use client'; a server module importing @mylder/perron then runs its hooks and contexts on the server`,
        },
      ]
    })
    return excuse(problems, RULE, read).sort(byFileLine)
  },
} satisfies Check
