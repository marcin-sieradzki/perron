// Finding a package installed in the project, from its working folder up, as Node would.
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** The installed package's folder, or undefined when the project doesn't have it. */
export function packageDir(name: string, cwd: string) {
  for (let dir = cwd; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name)
    if (existsSync(join(candidate, 'package.json'))) return candidate
    if (dirname(dir) === dir) return undefined
  }
}
