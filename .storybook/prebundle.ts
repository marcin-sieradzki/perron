// Every public entry of Base UI, for Vite to pre-bundle before the first story loads. Vite otherwise
// finds a Base UI part a story newly imports (after a rebase, or in a fresh worktree whose cache
// predates it) only mid-run, re-optimises, and reloads the page under the running tests, which then
// fail with "Failed to fetch dynamically imported module". Listing them all keeps the list current
// as components start using new parts.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/** `@base-ui/react/<part>` for each public subpath export: no internals, types or package.json. */
export function baseUiEntries(): string[] {
  const manifest = require.resolve('@base-ui/react/package.json')
  const { exports } = JSON.parse(readFileSync(manifest, 'utf8')) as {
    exports: Record<string, unknown>
  }
  return Object.keys(exports)
    .filter((key) => key.startsWith('./') && !/^\.\/(internals\/|types$|package\.json$)/.test(key))
    .map((key) => `@base-ui/react/${key.slice(2)}`)
}
