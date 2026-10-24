// The real Storybook config with only the fixture stories, which are meant to fail.
import config from '../../../.storybook/main.ts'

export default { ...config, stories: ['../*.stories.tsx'] }
