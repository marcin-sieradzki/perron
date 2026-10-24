// Serves the guideline pages to Storybook as `virtual:perron/pages`, built from the token files,
// the docs and the icon and logo folders on every start, and again when one of them changes.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { readSources } from '../scripts/build-tokens.ts'
import { readPages } from '../scripts/lib/pages.ts'
import { PACKAGE } from '../scripts/lib/paths.ts'
import { loadTokens } from '../scripts/lib/tokens.ts'

const ID = 'virtual:perron/pages'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const watched = /\/(tokens\/[^/]+\.json|docs\/.+\.md|icons\/.+|logos\/.+)$/

export function perronPages(): Plugin {
  return {
    name: 'perron-pages',
    resolveId: (id) => (id === ID ? `\0${ID}` : undefined),
    load(id) {
      if (id !== `\0${ID}`) return
      const pages = readPages(root, loadTokens(readSources()))
      return `export default ${JSON.stringify(pages)}`
    },
    configureServer(server) {
      server.watcher.add([
        join(root, 'docs'),
        ...['tokens', 'icons', 'logos'].map((d) => join(root, PACKAGE, d)),
      ])
      server.watcher.on('change', (file) => {
        if (!watched.test(file) || file.includes('/generated/')) return
        const mod = server.moduleGraph.getModuleById(`\0${ID}`)
        if (mod) server.reloadModule(mod)
      })
    },
  }
}
