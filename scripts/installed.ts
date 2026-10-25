// Whether node_modules holds what package-lock.json asks for, the first step of `npm run check`. A
// merge that changes the lockfile, such as one adding a workspace, leaves node_modules behind it,
// and the check would then fail far from the cause ("next: command not found"). npm records what
// it installed in node_modules/.package-lock.json; a package the lockfile needs that is missing
// there, or there at another version, means `npm ci` has to run again. Optional packages, such as
// another platform's binaries, may be missing.
// Usage: node scripts/installed.ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

interface Lock {
  packages?: Record<string, { version?: string; optional?: boolean; devOptional?: boolean }>
}

/** The packages `lock` needs that `installed` lacks or holds at another version, by path. */
export function staleInstall(lock: Lock, installed: Lock | undefined): string[] {
  const have = installed?.packages ?? {}
  return Object.entries(lock.packages ?? {})
    .filter(([path, entry]) => {
      if (path === '') return false
      const got = have[path]
      if (!got) return !entry.optional && !entry.devOptional
      return got.version !== entry.version
    })
    .map(([path]) => path)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = join(import.meta.dirname, '..')
  const read = (file: string): Lock | undefined =>
    existsSync(join(root, file)) ? JSON.parse(readFileSync(join(root, file), 'utf8')) : undefined
  const stale = staleInstall(
    read('package-lock.json') ?? {},
    read('node_modules/.package-lock.json'),
  )
  if (stale.length) {
    const named =
      stale.slice(0, 5).join(', ') + (stale.length > 5 ? ` and ${stale.length - 5} more` : '')
    process.stderr.write(
      `node_modules is behind package-lock.json (${named}), as after a merge that changed the lockfile: run npm ci, then the check again\n`,
    )
    process.exit(1)
  }
}
