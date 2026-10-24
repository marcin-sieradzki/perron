import type { Preview } from '@storybook/react-vite'
// the tokens, fonts and page defaults every story renders with, as an app loads them at its root
import '@mylder/perron/perron.css'

const preview: Preview = {
  parameters: {
    // axe in error mode: a violation fails the story's test, and so CI (docs/components/README.md)
    a11y: { test: 'error' },
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
            'Toolbar',
            'Text',
            'EmptyState',
            'Surface',
            'Delay',
            'LineBadge',
            'SeverityLabel',
            'StationIcon',
            // registry:components end
          ],
          // registry:patterns start: written by npm run registry, by category then name
          // registry:patterns end
          // registry:specs start: written by npm run registry, each built entry's spec page
          'Specs',
          [
            // each spec page, as PAGES lists them
            'Button',
            'Toolbar',
            'Text',
            'EmptyState',
            'Surface',
            'Delay',
            'LineBadge',
            'SeverityLabel',
            'StationIcon',
          ],
          // registry:specs end
        ],
      },
    },
  },
}

export default preview
