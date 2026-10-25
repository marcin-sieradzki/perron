// Where the site reads from: the repository's root, its files, its packages' versions, and links
// into the repository on GitHub for files the site has no page for. Every route is built from
// these reads at build time, in server components; nothing here runs in the browser.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** The repository on GitHub, for the header's link and for files the site has no page for. */
export const REPO_URL = 'https://github.com/marcin-sieradzki/perron'

/** The branch GitHub links point at. */
const BRANCH = 'main'

/** A file only the repository's root holds, so the walk up stops at the right folder. */
const MARKER = 'packages/perron/components.json'

/**
 * The repository's root: the nearest folder at or above `from` that holds the registry. `next
 * build` runs in `website/` and Vitest at the root, so both find the same folder.
 */
export function findRepoRoot(from = process.cwd()): string {
  for (let dir = from; ; dir = dirname(dir)) {
    if (existsSync(join(dir, MARKER))) return dir
    if (dirname(dir) === dir) throw new Error(`No Perron repository at or above ${from}`)
  }
}

let root: string | undefined

/** The repository's root, found once. */
export function repoRoot() {
  root ??= findRepoRoot()
  return root
}

/** A file's absolute path, from its path from the repo root. */
export const repoPath = (path: string) => join(repoRoot(), path)

/** Whether a file or folder exists, by path from the repo root. */
export const repoFileExists = (path: string) => existsSync(repoPath(path))

/** A text file's contents, by path from the repo root. */
export const readRepoFile = (path: string) => readFileSync(repoPath(path), 'utf8')

/** A JSON file's contents, by path from the repo root. */
export const readRepoJson = <T>(path: string): T => JSON.parse(readRepoFile(path)) as T

/** A file or folder on GitHub, by path from the repo root: a folder as a tree, a file as a blob. */
export function githubUrl(path: string) {
  const clean = path.replace(/^\/+|\/+$/g, '')
  const folder =
    path.endsWith('/') || (repoFileExists(clean) && statSync(repoPath(clean)).isDirectory())
  return clean ? `${REPO_URL}/${folder ? 'tree' : 'blob'}/${BRANCH}/${clean}` : REPO_URL
}

export interface PackageInfo {
  name: string
  version: string
}

/** The package the site documents, `@mylder/perron`, and the MCP server, by their folders. */
export const PACKAGES = { perron: 'packages/perron', mcp: 'packages/mcp' } as const

/** A workspace package's name and version, from its `package.json`. */
export function readPackage(folder: string): PackageInfo {
  const { name, version } = readRepoJson<PackageInfo>(`${folder}/package.json`)
  return { name, version }
}

/**
 * Memoises a loader for the build: every page of `next build` reads the same files, so each is
 * read once. In `next dev` and in tests it reads afresh, so an edited doc shows on reload.
 */
export function once<T>(load: () => T): () => T {
  let value: { v: T } | undefined
  return () => {
    if (process.env.NODE_ENV !== 'production') return load()
    value ??= { v: load() }
    return value.v
  }
}
