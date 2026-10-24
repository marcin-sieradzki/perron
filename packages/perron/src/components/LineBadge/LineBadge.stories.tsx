// LineBadge's stories: Default, then one per variant of the deferred design, every line at both
// sizes.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LineBadge } from './LineBadge.tsx'

const meta = {
  title: 'Components/LineBadge',
  component: LineBadge,
  // every required prop and caller word, so any story renders alone, on a pair that meets 4.5:1
  args: { line: 'm2', size: 'medium', children: 'M2' },
} satisfies Meta<typeof LineBadge>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The official pairs of M1, M4, A, B and C miss 4.5:1 and stay exact by rule (CR-4, CR-6), as
 * docs/foundations/semantic-colours.md#line-colours lists them, so their stories alone turn off
 * axe's color-contrast rule; every other story keeps it.
 */
const officialPairBelowContrast = {
  a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
}

/** The contract story's args. M2's pair meets 4.5:1, so axe's color-contrast rule stays on. */
export const Default: Story = {
  args: { line: 'm2', size: 'medium', children: 'M2' },
}

export const M1Medium: Story = {
  name: 'M1 Medium',
  args: { line: 'm1', size: 'medium', children: 'M1' },
  parameters: officialPairBelowContrast,
}

export const M2Medium: Story = {
  name: 'M2 Medium',
  args: { line: 'm2', size: 'medium', children: 'M2' },
}

export const M3Medium: Story = {
  name: 'M3 Medium',
  args: { line: 'm3', size: 'medium', children: 'M3' },
}

export const M4Medium: Story = {
  name: 'M4 Medium',
  args: { line: 'm4', size: 'medium', children: 'M4' },
  parameters: officialPairBelowContrast,
}

export const AMedium: Story = {
  args: { line: 'a', size: 'medium', children: 'A' },
  parameters: officialPairBelowContrast,
}

export const BMedium: Story = {
  args: { line: 'b', size: 'medium', children: 'B' },
  parameters: officialPairBelowContrast,
}

export const CMedium: Story = {
  args: { line: 'c', size: 'medium', children: 'C' },
  parameters: officialPairBelowContrast,
}

export const EMedium: Story = {
  args: { line: 'e', size: 'medium', children: 'E' },
}

export const FMedium: Story = {
  args: { line: 'f', size: 'medium', children: 'F' },
}

export const HMedium: Story = {
  args: { line: 'h', size: 'medium', children: 'H' },
}

export const BusMedium: Story = {
  args: { line: 'bus', size: 'medium', children: '5C' },
}

export const RegionalMedium: Story = {
  args: { line: 'regional', size: 'medium', children: 'RE' },
}

export const M1Large: Story = {
  name: 'M1 Large',
  args: { line: 'm1', size: 'large', children: 'M1' },
  parameters: officialPairBelowContrast,
}

export const M2Large: Story = {
  name: 'M2 Large',
  args: { line: 'm2', size: 'large', children: 'M2' },
}

export const M3Large: Story = {
  name: 'M3 Large',
  args: { line: 'm3', size: 'large', children: 'M3' },
}

export const M4Large: Story = {
  name: 'M4 Large',
  args: { line: 'm4', size: 'large', children: 'M4' },
  parameters: officialPairBelowContrast,
}

export const ALarge: Story = {
  args: { line: 'a', size: 'large', children: 'A' },
  parameters: officialPairBelowContrast,
}

export const BLarge: Story = {
  args: { line: 'b', size: 'large', children: 'B' },
  parameters: officialPairBelowContrast,
}

export const CLarge: Story = {
  args: { line: 'c', size: 'large', children: 'C' },
  parameters: officialPairBelowContrast,
}

export const ELarge: Story = {
  args: { line: 'e', size: 'large', children: 'E' },
}

export const FLarge: Story = {
  args: { line: 'f', size: 'large', children: 'F' },
}

export const HLarge: Story = {
  args: { line: 'h', size: 'large', children: 'H' },
}

export const BusLarge: Story = {
  args: { line: 'bus', size: 'large', children: '5C' },
}

export const RegionalLarge: Story = {
  args: { line: 'regional', size: 'large', children: 'RE' },
}
