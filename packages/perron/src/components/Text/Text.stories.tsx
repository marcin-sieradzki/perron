// Text's stories: one paragraph with every prop a control, then every variant, colour and
// emphasis side by side, and text with an element inside it.
import { createRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Showcase, type Axis } from '../../testing/Showcase.tsx'
import { Text, type TextProps } from './Text.tsx'

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

/**
 * A paragraph, every prop a control. It passes none of `variant`, `color` or `emphasis`, so the
 * test checks the defaults fill them in: a `<p>` with `body`, `neutral` and `primary`, its `ref` on
 * the root.
 */
export const Default: Story = {
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

type Variant = NonNullable<TextProps['variant']>

/** Each variant with words it is made for, a heading on the heading element `render` gives. */
type Sample = Pick<TextProps, 'render' | 'children'> & { variant: Variant }

const VARIANTS: Axis<Sample>[] = (
  [
    { variant: 'display', children: 'Every bus and train in Copenhagen, live' },
    { variant: 'heading-lg', render: <h1 />, children: 'Disruptions' },
    { variant: 'heading-md', render: <h2 />, children: 'Nørreport St.' },
    { variant: 'heading-sm', render: <h3 />, children: 'Signal fault at Danshøj' },
    { variant: 'body', children: 'Trains between Flintholm and Ny Ellebjerg run slower.' },
    { variant: 'body-sm', children: 'Next train to Ny Ellebjerg at 08:14' },
    { variant: 'caption', children: 'Reporting live, by operator' },
    { variant: 'label', children: 'Show whole line' },
    { variant: 'label-sm', children: 'Average delay' },
    { variant: 'overline', children: 'Nearby stops' },
    { variant: 'badge', children: '5C' },
    { variant: 'stat', children: '94%' },
    { variant: 'data-xl', children: '08:14' },
    { variant: 'data-lg', children: '3 min' },
    { variant: 'data', children: '08:17' },
    { variant: 'data-sm', children: '12' },
  ] satisfies Sample[]
).map((value) => ({ label: value.variant, value }))

/** The root of the one Text of `variant` a story renders. */
const variantOf = (canvasElement: HTMLElement, variant: Variant) => {
  const root = canvasElement.querySelector<HTMLElement>(`.pn-Text[data-variant="${variant}"]`)
  if (!root) throw new Error(`no .pn-Text root with data-variant ${variant} rendered`)
  return root
}

/**
 * Every typography role, each with words it is made for. A heading takes the element `render`
 * gives, `caption` is a `<span>`, `overline` is uppercase, and `data` sets tabular figures.
 */
export const Variants: Story = {
  render: (args) => <Showcase rows={VARIANTS} render={(value) => <Text {...args} {...value} />} />,
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2, name: 'Nørreport St.' })
    await expect(heading).toHaveClass('pn-Text')
    await expect(heading).toHaveAttribute('data-variant', 'heading-md')
    await expect(variantOf(canvasElement, 'caption').tagName).toBe('SPAN')
    const overline = variantOf(canvasElement, 'overline')
    await expect(overline.textContent).toBe('Nearby stops')
    await expect(getComputedStyle(overline).textTransform).toBe('uppercase')
    await expect(getComputedStyle(variantOf(canvasElement, 'data')).fontVariantNumeric).toBe(
      'tabular-nums',
    )
  },
}

/** Each colour, in words it is made for. */
export const Colors: Story = {
  render: (args) => (
    <Showcase
      rows={
        [
          { label: 'Neutral', value: { color: 'neutral', children: 'Departures from platform 2' } },
          {
            label: 'Brand',
            value: { color: 'brand', children: 'Every bus and train, as it moves.' },
          },
          { label: 'Success', value: { color: 'success', children: 'Running normally' } },
          { label: 'Warning', value: { color: 'warning', children: 'Delays likely after 17:00' } },
          { label: 'Danger', value: { color: 'danger', children: 'Running 4 min late' } },
          { label: 'Info', value: { color: 'info', children: 'Diverted via Vesterport' } },
        ] satisfies Axis<Pick<TextProps, 'color' | 'children'>>[]
      }
      render={(value) => <Text {...args} {...value} />}
    />
  ),
}

/**
 * Each emphasis. Tertiary is a hint, always next to stronger text: it is for nothing else
 * (Semantic colours), so it follows a label here.
 */
export const Emphasis: Story = {
  parameters: {
    // color.text.tertiary misses 4.5:1 on purpose, a miss Accessibility lists by name
    // (docs/foundations/accessibility.md), so axe leaves the tertiary text out
    a11y: { context: { include: ['body'], exclude: ['.pn-Text[data-emphasis="tertiary"]'] } },
  },
  render: (args) => (
    <Showcase
      rows={[
        { label: 'Primary', value: <Text {...args}>Departures from platform 2</Text> },
        {
          label: 'Secondary',
          value: (
            <Text {...args} emphasis="secondary">
              Departures from platform 2
            </Text>
          ),
        },
        {
          label: 'Tertiary',
          value: (
            <>
              <Text variant="label">Search lines and stops</Text>
              <Text {...args} emphasis="tertiary">
                Try a line number such as 5C.
              </Text>
            </>
          ),
        },
      ]}
      render={(node) => node}
    />
  ),
}

/** Text with an element inside it, a `<time>`, which stays where the caller put it. */
export const RichContent: Story = {
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
