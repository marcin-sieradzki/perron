import type { Preview } from '@storybook/react-vite'
// the tokens, fonts and page defaults every story renders with, as an app loads them at its root
import '@mylder/perron/perron.css'

// A docs page shows each story's first render, and its play stays the test (the canvas, Vitest).
// An inline story already skips play (`docs.story.autoplay`, false); a story in its own iframe
// (`docs.story.inline: false`, as an overlay's) loads that iframe from this URL, and Storybook's
// embed mode skips play there. storybook/blocks/docs-embed.test.ts holds Storybook to both.
Object.assign(globalThis, { PREVIEW_URL: 'iframe.html?embed=true' })

const preview: Preview = {
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
            'Text',
            'EmptyState',
            'Surface',
            'MapControls',
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
            'Text',
            'EmptyState',
            'Surface',
            'MapControls',
            'Delay',
            'LineBadge',
            'SeverityLabel',
            'StationIcon',
            'DataStatePanel',
            'DetailHeader',
          ],
          // registry:specs end
        ],
      },
    },
  },
}

export default preview
