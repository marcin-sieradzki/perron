// Builds packages/perron/api.json, the props API of every stable or deprecated component and
// pattern, which the api-compatibility check holds against the last release.
// Usage: node scripts/build-api.ts [--check]
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apiFiles } from './lib/api.ts'
import { syncCli } from './lib/sync.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

syncCli(root, apiFiles(root), 'npm run api')
