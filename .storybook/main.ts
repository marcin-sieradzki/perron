import type { StorybookConfig } from '@storybook/react-vite'
import { perronPages } from './perron-pages.ts'

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../storybook/pages/*.mdx'],
  addons: ['@storybook/addon-docs'],
  core: { disableTelemetry: true },
  viteFinal: (vite) => ({ ...vite, plugins: [...(vite.plugins ?? []), perronPages()] }),
}

export default config
