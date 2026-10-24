// ToolbarGroup's props table on Toolbar's docs page reads this meta's `component`. Its one story,
// hidden from the sidebar (`!dev`), renders the group in a toolbar, as Base UI's parts need.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toolbar, ToolbarButton, ToolbarGroup } from './Toolbar.tsx'

const meta = {
  title: 'Components/Toolbar/ToolbarGroup',
  component: ToolbarGroup,
  tags: ['!dev'],
  args: {
    children: (
      <>
        <ToolbarButton>Show whole line</ToolbarButton>
        <ToolbarButton color="brand">Show departures</ToolbarButton>
      </>
    ),
  },
  render: (args) => (
    <Toolbar aria-label="Actions">
      <ToolbarGroup {...args} />
    </Toolbar>
  ),
} satisfies Meta<typeof ToolbarGroup>

export default meta

/** A group of two buttons in a toolbar. */
export const Default: StoryObj<typeof meta> = {}
