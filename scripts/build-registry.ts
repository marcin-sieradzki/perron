// Builds what packages/perron/components.json decides: the barrels src/index.ts and src/patterns.ts,
// the package exports, the Storybook sort order and the spec pages in PAGES.
// Usage: node scripts/build-registry.ts [--check]
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { registryFiles } from './lib/registry.ts'
import { syncCli } from './lib/sync.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

syncCli(root, registryFiles(root), 'npm run registry')
