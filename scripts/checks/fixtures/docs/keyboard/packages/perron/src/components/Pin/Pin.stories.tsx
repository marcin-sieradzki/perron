// One story, whose play presses Enter, Tab and Shift+Tab.
import { userEvent } from 'storybook/test'

export default { title: 'Components/Pin' }

export const Default = {
  args: { label: 'Pin' },
  play: async () => {
    await userEvent.keyboard('{Enter}')
    await userEvent.tab()
    await userEvent.tab({ shift: true })
  },
}
