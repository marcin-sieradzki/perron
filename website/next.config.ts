// Every route is prerendered by `next build` from the repo's files, read with node:fs in server
// components and in the loaders of lib/, which import the repo's own readers in scripts/lib and
// packages/mcp/src. Those sit outside website/, so Turbopack's root is the repository's.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: repo,
  turbopack: {
    root: repo,
    // The loaders read docs by paths built at run time, which Turbopack warns would trace the
    // whole repo into a server bundle. Every route is static, so nothing is traced to serve it.
    ignoreIssue: [
      { path: '**/scripts/lib/**', title: /Dynamic filesystem access/ },
      { path: '**/website/**', title: /Dynamic filesystem access/ },
    ],
  },
}

export default config
