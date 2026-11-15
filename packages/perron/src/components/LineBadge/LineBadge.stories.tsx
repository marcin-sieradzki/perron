// LineBadge's stories: the badge alone with every prop a control, then every line at both sizes.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { axis, Showcase, type Axis } from '../../testing/Showcase.tsx'
import { LineBadge, type LineBadgeProps } from './LineBadge.tsx'

const meta = {
  title: 'Components/LineBadge',
  component: LineBadge,
  // every required prop and caller word, so any story renders alone, on a pair that meets 4.5:1
  args: { line: 'm2', size: 'medium', children: 'M2' },
} satisfies Meta<typeof LineBadge>

export default meta

type Story = StoryObj<typeof meta>

/** Every line, with the short name riders know it by. */
const LINES: Axis<{ line: LineBadgeProps['line']; name: string }>[] = [
  ['m1', 'M1'],
  ['m2', 'M2'],
  ['m3', 'M3'],
  ['m4', 'M4'],
  ['a', 'A'],
  ['b', 'B'],
  ['c', 'C'],
  ['e', 'E'],
  ['f', 'F'],
  ['h', 'H'],
  ['bus', '5C'],
  ['regional', 'RE'],
].map(([line, name]) => ({
  label: line === 'bus' ? 'Bus' : line === 'regional' ? 'Regional' : name,
  value: { line: line as LineBadgeProps['line'], name },
}))

/** The badge alone, every prop a control: M2 at `medium`, a pair that meets 4.5:1. */
export const Default: Story = {}

/** Every line at both sizes, each showing its short name. */
export const Lines: Story = {
  render: (args) => (
    <Showcase
      rows={LINES}
      columns={axis(['medium', 'large'] as const)}
      render={({ line, name }, size) => (
        <LineBadge {...args} line={line} size={size}>
          {name}
        </LineBadge>
      )}
    />
  ),
}
