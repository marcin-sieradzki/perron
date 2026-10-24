// An icon-only button with no name: axe's button-name rule must fail it.
import type { Meta, StoryObj } from '@storybook/react-vite'

export default { title: 'Fixtures/Unlabelled button' } satisfies Meta

export const UnlabelledButton: StoryObj = {
  render: () => (
    <button>
      <svg aria-hidden />
    </button>
  ),
}
