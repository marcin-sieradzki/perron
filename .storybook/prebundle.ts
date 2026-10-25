// Every package the stories import, for Vite to pre-bundle before the first story loads. Vite otherwise
// finds a package a story newly imports (after a merge of main, or in a worktree whose cache predates
// it: FactList's and the contract story's `react-dom`) only mid-run, re-optimises, and reloads the
// page under the running tests, which then fail with "Failed to fetch dynamically imported module".
// Base UI's entries are listed whole, so the list stays current as components use new parts;
// prebundle.test.ts fails any other package a story reaches that STORY_DEPS leaves out.
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

/** The packages besides Base UI that the stories and the code they import load in the browser. */
export const STORY_DEPS = [
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom',
  'react-dom/client',
  'react-dom/server',
  'storybook/test',
]

/** What Vite pre-bundles for the stories: STORY_DEPS and every Base UI entry. */
export const prebundled = (): string[] => [...STORY_DEPS, ...baseUiEntries()]
