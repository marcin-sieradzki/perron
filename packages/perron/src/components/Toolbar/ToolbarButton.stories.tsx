// ToolbarButton's props table on Toolbar's docs page reads this meta's `component`. Its one story,
// hidden from the sidebar (`!dev`), renders the button in a toolbar, as Base UI's parts need; the
// button's own stories are in Toolbar.stories.tsx.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toolbar, ToolbarButton } from './Toolbar.tsx'

const meta = {
  title: 'Components/Toolbar/ToolbarButton',
  component: ToolbarButton,
  tags: ['!dev'],
  args: { children: 'Show whole line' },
  render: (args) => (
    <Toolbar aria-label="Actions">
      <ToolbarButton {...args} />
    </Toolbar>
  ),
} satisfies Meta<typeof ToolbarButton>

export default meta

/** A neutral button in a toolbar. */
export const Default: StoryObj<typeof meta> = {}
