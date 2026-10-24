// Gives each component Storybook loads its `__docgenInfo`, which the docs page's props table reads,
// from scripts/lib/docgen.ts: Storybook's react-docgen plugin, but one that also finds a component
// built on `useRender`.
import { createFilter, type Plugin } from 'vite'
import { componentDocs } from '../scripts/lib/docgen.ts'

/** Source files, as Storybook's react-docgen plugin picks them: no library, no virtual module. */
const isSource = createFilter(/\.(mjs|tsx?|jsx?)$/, /node_modules/)

export function perronDocgen(): Plugin {
  return {
    name: 'perron-docgen',
    enforce: 'pre',
    transform(src, id) {
      if (!isSource(id)) return
      const docs = componentDocs(src, id).filter((d) => d.actualName)
      if (!docs.length) return
      const appended = docs.map(({ actualName, ...doc }) => {
        return `;${actualName}.__docgenInfo=${JSON.stringify(doc)}`
      })
      return { code: src + appended.join(''), map: null }
    },
  }
}
