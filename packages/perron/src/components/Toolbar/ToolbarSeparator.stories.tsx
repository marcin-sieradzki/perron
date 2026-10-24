// ToolbarSeparator's props table on Toolbar's docs page reads this meta's `component`. Its one
// story, hidden from the sidebar (`!dev`), renders the separator in a toolbar, as Base UI's parts
// need.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toolbar, ToolbarButton, ToolbarSeparator } from './Toolbar.tsx'

const meta = {
  title: 'Components/Toolbar/ToolbarSeparator',
  component: ToolbarSeparator,
  tags: ['!dev'],
  render: (args) => (
    <Toolbar aria-label="Actions">
      <ToolbarButton>Show whole line</ToolbarButton>
      <ToolbarSeparator {...args} />
      <ToolbarButton>Show departures</ToolbarButton>
    </Toolbar>
  ),
} satisfies Meta<typeof ToolbarSeparator>

export default meta

/** A separator between two buttons in a toolbar. */
export const Default: StoryObj<typeof meta> = {}
