import type { StorybookConfig } from '@storybook/react-vite'
import { perronDocgen } from './perron-docgen.ts'
import { perronPages } from './perron-pages.ts'
import { baseUiEntries } from './prebundle.ts'

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
  // Storybook's react-docgen finds no component that returns `useRender(...)`; perronDocgen does
  typescript: { reactDocgen: false },
  viteFinal: (vite) => ({
    ...vite,
    plugins: [perronDocgen(), ...(vite.plugins ?? []), perronPages()],
    // pre-bundled up front, so a newly imported part never reloads the page mid-run (prebundle.ts)
    optimizeDeps: {
      ...vite.optimizeDeps,
      include: [...(vite.optimizeDeps?.include ?? []), ...baseUiEntries()],
    },
  }),
}

export default config
