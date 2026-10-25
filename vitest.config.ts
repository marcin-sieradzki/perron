// Three Vitest projects: `unit`, the node tests beside each module (npm test); `stories`, every
// Storybook story run as a test in headless Chromium, with axe and its play function; and
// `fixtures`, which runs the stories in storybook/fixtures and expects each to fail, and measures
// the visual stage's made-up component in storybook/fixtures/visual (npm run test:stories runs the
// last two).
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            'scripts/**/*.test.ts',
            'storybook/contract/*.test.ts',
            'storybook/blocks/*.test.ts',
            '.storybook/*.test.ts',
            'penpot/*.test.ts',
            'packages/**/*.test.{ts,tsx}',
          ],
          // it builds a Storybook and drives Chromium, so it runs with the fixtures
          exclude: [...configDefaults.exclude, 'scripts/visual.test.ts'],
        },
      },
      {
        plugins: [storybookTest({ configDir: '.storybook' })],
        test: {
          name: 'stories',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'fixtures',
          environment: 'node',
          include: ['storybook/fixtures.test.ts', 'scripts/visual.test.ts'],
        },
      },
    ],
  },
})
