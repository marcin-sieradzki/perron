// The stories project of vitest.config.ts, pointed at the fixture stories. Run by
// storybook/fixtures.test.ts, which expects every story here to fail.
import { join } from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [storybookTest({ configDir: join(import.meta.dirname, '.storybook') })],
  test: {
    name: 'fixtures',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
