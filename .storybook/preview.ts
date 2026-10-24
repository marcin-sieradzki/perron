import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        // the order of the Contents page, which follows Rift's foundations
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
        ],
      },
    },
  },
}

export default preview
