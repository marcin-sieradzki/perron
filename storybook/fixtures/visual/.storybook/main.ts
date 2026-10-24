// The real Storybook config with only the visual fixture: a made-up component that
// scripts/visual.test.ts measures against the read-back in scripts/checks/fixtures/visual.
import config from '../../../../.storybook/main.ts'

export default { ...config, stories: ['../*.stories.tsx'] }
