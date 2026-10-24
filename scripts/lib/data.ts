// The data the Perron MCP server reads, shipped in @mylder/perron under data/: every token with its
// value in each theme, and every docs page with its tables filled in.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { headingOf, PAGES, tokenSegment } from './pages.ts'
import { PACKAGE } from './paths.ts'
import type { ResolvedTokens } from './tokens.ts'

const json = (data: unknown) => `${JSON.stringify(data, null, 2)}\n`

/** The data files, keyed by path from the repo root. `docs` holds pages the same build rewrites. */
export function buildData(root: string, tokens: ResolvedTokens, docs: Record<string, string> = {}) {
  const tokenList = tokenSegment(tokens, ['*']).rows.map((r) => ({
    name: r.name,
    type: r.type,
    cssVar: r.cssVar,
    ...(r.description ? { description: r.description } : {}),
    values: r.values,
    ...(Object.keys(r.overrides).length ? { overrides: r.overrides } : {}),
  }))
  const pages = PAGES.map((path) => {
    const markdown = docs[path] ?? readFileSync(join(root, path), 'utf8')
    return { path, ...headingOf(path, markdown), markdown }
  })
  return {
    [`${PACKAGE}/data/tokens.json`]: json(tokenList),
    [`${PACKAGE}/data/docs.json`]: json(pages),
  }
}
