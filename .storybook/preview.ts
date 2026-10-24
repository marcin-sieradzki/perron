import type { Preview } from '@storybook/react-vite'

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
            // the pages outside docs/foundations and docs/components, in PAGES order
            'Content design',
            'Glossary',
          ],
          'Components',
          [
            // the contract and its template first, then each registered component
            'Contract',
            'Spec template',
            // registry:components start: written by npm run registry, by category then name
            // registry:components end
          ],
          // registry:patterns start: written by npm run registry, by category then name
          // registry:patterns end
        ],
      },
    },
  },
}

export default preview
