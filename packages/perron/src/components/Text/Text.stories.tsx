import { createRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Text } from './Text.tsx'

const meta = {
  title: 'Components/Text',
  component: Text,
  args: {
    children:
      'Signal fault at Danshøj. Trains between Flintholm and Ny Ellebjerg run slower than planned.',
  },
  // the page surface Text sits on in both themes, which the page itself leaves to the app
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 'var(--perron-space-300)',
          background: 'var(--perron-color-surface-default)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Text>

export default meta

type Story = StoryObj<typeof meta>

/** The one `.pn-Text` root a story renders. */
const rootOf = (canvasElement: HTMLElement) => {
  const root = canvasElement.querySelector<HTMLElement>('.pn-Text')
  if (!root) throw new Error('no .pn-Text root rendered')
  return root
}

const bodyRef = createRef<HTMLElement>()

// passes none of variant, color or emphasis, so the play test checks the defaults fill them in
export const BodyNeutralPrimary: Story = {
  render: (args) => <Text {...args} ref={bodyRef} />,
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement)
    await expect(root.tagName).toBe('P')
    await expect(root).toHaveClass('pn-Text')
    await expect(root).toHaveAttribute('data-variant', 'body')
    await expect(root).toHaveAttribute('data-color', 'neutral')
    await expect(root).toHaveAttribute('data-emphasis', 'primary')
    await expect(bodyRef.current).toBe(root)
  },
}

export const DisplayNeutralPrimary: Story = {
  args: { variant: 'display', children: 'Every bus and train in Copenhagen, live' },
}

export const HeadingLgNeutralPrimary: Story = {
  args: { variant: 'heading-lg', render: <h1 />, children: 'Disruptions' },
}

export const HeadingMdNeutralPrimary: Story = {
  args: { variant: 'heading-md', render: <h2 />, children: 'Nørreport St.' },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2, name: 'Nørreport St.' })
    await expect(heading).toHaveClass('pn-Text')
    await expect(heading).toHaveAttribute('data-variant', 'heading-md')
  },
}

export const HeadingSmNeutralPrimary: Story = {
  args: { variant: 'heading-sm', render: <h3 />, children: 'Signal fault at Danshøj' },
}

export const BodySmNeutralPrimary: Story = {
  args: {
    variant: 'body-sm',
    children: [
      'Next train to Ny Ellebjerg at ',
      <time key="time" dateTime="08:14">
        08:14
      </time>,
    ],
  },
  play: async ({ canvasElement }) => {
    const [first, second] = rootOf(canvasElement).childNodes
    await expect(first.nodeType).toBe(Node.TEXT_NODE)
    await expect(first.textContent).toBe('Next train to Ny Ellebjerg at ')
    await expect(second.nodeName).toBe('TIME')
    await expect(second.textContent).toBe('08:14')
  },
}

export const CaptionNeutralPrimary: Story = {
  args: { variant: 'caption', children: 'Reporting live, by operator' },
  play: async ({ canvasElement }) => {
    await expect(rootOf(canvasElement).tagName).toBe('SPAN')
  },
}

export const LabelNeutralPrimary: Story = {
  args: { variant: 'label', children: 'Show whole line' },
}

export const LabelSmNeutralPrimary: Story = {
  args: { variant: 'label-sm', children: 'Average delay' },
}

export const OverlineNeutralPrimary: Story = {
  args: { variant: 'overline', children: 'Nearby stops' },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement)
    await expect(root.textContent).toBe('Nearby stops')
    await expect(getComputedStyle(root).textTransform).toBe('uppercase')
  },
}

export const BadgeNeutralPrimary: Story = {
  args: { variant: 'badge', children: '5C' },
}

export const StatNeutralPrimary: Story = {
  args: { variant: 'stat', children: '94%' },
}

export const DataXlNeutralPrimary: Story = {
  args: { variant: 'data-xl', children: '08:14' },
}

export const DataLgNeutralPrimary: Story = {
  args: { variant: 'data-lg', children: '3 min' },
}

export const DataNeutralPrimary: Story = {
  args: { variant: 'data', children: '08:17' },
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(rootOf(canvasElement)).fontVariantNumeric).toBe('tabular-nums')
  },
}

export const DataSmNeutralPrimary: Story = {
  args: { variant: 'data-sm', children: '12' },
}

export const BodyBrandPrimary: Story = {
  args: { color: 'brand', children: 'Every bus and train in Copenhagen, as it moves.' },
}

export const BodySuccessPrimary: Story = {
  args: { color: 'success', children: 'Running normally' },
}

export const BodyWarningPrimary: Story = {
  args: {
    color: 'warning',
    children: 'Delays likely after 17:00 because of roadworks on Åboulevard.',
  },
}

export const BodyDangerPrimary: Story = {
  args: { color: 'danger', children: 'Running 4 min late' },
}

export const BodyInfoPrimary: Story = {
  args: { color: 'info', children: 'Diverted via Vesterport until Sunday.' },
}

export const BodyNeutralSecondary: Story = {
  args: { emphasis: 'secondary', children: 'Departures from platform 2' },
}

/** A hint, always next to stronger text: tertiary is for nothing else (Semantic colours). */
export const BodyNeutralTertiary: Story = {
  args: { emphasis: 'tertiary', children: 'Try a line number such as 5C.' },
  render: (args) => (
    <>
      <Text variant="label">Search lines and stops</Text>
      <Text {...args} />
    </>
  ),
  parameters: {
    // color.text.tertiary misses 4.5:1 on purpose, a miss Accessibility lists by name
    // (docs/foundations/accessibility.md), so axe's contrast rule is off for this story alone
    a11y: { options: { rules: { 'color-contrast': { enabled: false } } } },
  },
}
