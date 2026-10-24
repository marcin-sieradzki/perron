import type { StorybookConfig } from '@storybook/react-vite'
import { perronPages } from './perron-pages.ts'

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: [
    '../storybook/pages/*.mdx',
    '../packages/perron/src/**/*.mdx',
    '../packages/perron/src/**/*.stories.tsx',
    '../storybook/contract/*.stories.tsx',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  core: { disableTelemetry: true },
  viteFinal: (vite) => ({ ...vite, plugins: [...(vite.plugins ?? []), perronPages()] }),
}

export default config
