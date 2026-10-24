// Writes a build's files, or in check mode only compares them: the drift check of every generator.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * The files, by path from `root`, whose text on disk differs from `files`. Each one is written,
 * unless `check` is set.
 */
export function syncFiles(root: string, files: Record<string, string>, check: boolean): string[] {
  const changed: string[] = []
  for (const [rel, text] of Object.entries(files)) {
    const file = join(root, rel)
    let current = ''
    try {
      current = readFileSync(file, 'utf8')
    } catch {
      // first build
    }
    if (current === text) continue
    changed.push(rel)
    if (check) continue
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
  }
  return changed
}

/** Runs a build from the command line: writes its files, or with `--check` names each stale one. */
export function syncCli(root: string, files: Record<string, string>, command: string) {
  const check = process.argv.includes('--check')
  const changed = syncFiles(root, files, check)
  for (const rel of changed)
    if (check) console.error(`${rel} is out of date. Run ${command}.`)
    else console.log(`wrote ${rel}`)
  if (check && changed.length) process.exit(1)
}
