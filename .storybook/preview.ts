import type { Preview } from '@storybook/react-vite'
// the tokens, fonts and page defaults every story renders with, as an app loads them at its root
import '@mylder/perron/perron.css'

// A docs page shows each story's first render, and its play stays the test (the canvas, Vitest).
// An inline story already skips play (`docs.story.autoplay`, false); a story in its own iframe
// (`docs.story.inline: false`, as an overlay's) loads that iframe from this URL, and Storybook's
// embed mode skips play there. storybook/blocks/docs-embed.test.ts holds Storybook to both.
Object.assign(globalThis, { PREVIEW_URL: 'iframe.html?embed=true' })

/** Words in every script the stories write, so each face loads the subsets they need. */
const SAMPLE = 'Aa Ææ Øø Åå Ää Öö 0123 →'

let fonts: Promise<void> | undefined
/**
 * Loads every face of the library's fonts (styles/fonts.css) before the first story renders, so
 * a `play` that measures text measures it in them, on CI's Linux as on a Mac, never in a fallback
 * that wraps differently; and fails the story when one does not load. A browser loads a face only
 * once text asks for it, so `document.fonts.ready` alone can resolve before any has begun.
 */
export function libraryFonts() {
  fonts ??= (async () => {
    const specs = new Set(
      [...document.fonts].map(
        (f) => `${f.style} ${f.weight} 16px "${f.family.replace(/^["']|["']$/g, '')}"`,
      ),
    )
    for (const spec of specs)
      if (!(await document.fonts.load(spec, SAMPLE)).length)
        throw new Error(`the font ${spec} did not load, so stories would measure a fallback`)
  })()
  return fonts
}

const preview: Preview = {
  loaders: [libraryFonts],
  parameters: {
    // axe in error mode: a violation fails the story's test, and so CI (docs/components/README.md)
    a11y: { test: 'error' },
    // a story opts in to its play on the docs page with `autoplay: true`, rendering inline
    docs: { story: { autoplay: false } },
    options: {
      storySort: {
        // the order of the Contents page
        order: [
          'Foundations',
          [
            'Contents',
            'Accessibility',
            'Elevation',
            'Icons',
            'Layout',
            'Logos',
            'Motion',
            'Primitive colours',
            'Semantic colours',
            'Semantic spacing',
            'Typography',
            'Data states',
            'Map',
          ],
          'Guidelines',
          [
            // the pages outside docs/foundations, docs/components and docs/patterns, in PAGES order
            'Content design',
            'Glossary',
          ],
          'Components',
          [
            // the contract and its template first, then each registered component
            'Contract',
            'Spec template',
            // registry:components start: written by npm run registry, by category then name
            'Button',
            'IconButton',
            'LinkButton',
            'Toolbar',
            'Brand',
            'Count',
            'FactList',
            'Kbd',
            'Stat',
            'Tag',
            'Text',
            'EmptyState',
            'Section',
            'Surface',
            'Attribution',
            'MapControls',
            'Tabs',
            'Dialog',
            'Sheet',
            'Delay',
            'LineBadge',
            'SeverityLabel',
            'StationIcon',
            // registry:components end
          ],
          // registry:patterns start: written by npm run registry, by category then name
          'Patterns',
          [
            // each registered pattern
            'DataStatePanel',
            'DetailHeader',
            'StopTimeline',
            'DisruptionCard',
            'KioskBar',
          ],
          // registry:patterns end
          // registry:specs start: written by npm run registry, each built entry's spec page
          'Specs',
          [
            // each spec page, as PAGES lists them
            'Button',
            'IconButton',
            'LinkButton',
            'Toolbar',
            'Brand',
            'Count',
            'FactList',
            'Kbd',
            'Stat',
            'Tag',
            'Text',
            'EmptyState',
            'Section',
            'Surface',
            'Attribution',
            'MapControls',
            'Tabs',
            'Dialog',
            'Sheet',
            'Delay',
            'LineBadge',
            'SeverityLabel',
            'StationIcon',
            'DataStatePanel',
            'DetailHeader',
            'StopTimeline',
            'DisruptionCard',
            'KioskBar',
          ],
          // registry:specs end
        ],
      },
    },
  },
}

export default preview
