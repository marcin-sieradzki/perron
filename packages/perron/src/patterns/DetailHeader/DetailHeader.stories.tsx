// DetailHeader's stories: one per row of the spec's Stories table (docs/patterns/detail-header.md),
// with the design deferred, and their play tests.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from '../../components/Button/Button.tsx'
import { DetailHeader } from './DetailHeader.tsx'

/** The caller's action: one outlined neutral Button. */
const showOnMap = (
  <Button variant="outline" color="neutral">
    Show on map
  </Button>
)

export default {
  title: 'Patterns/DetailHeader',
  component: DetailHeader,
  args: {
    variant: 'line',
    line: 'bus',
    lineName: '5C',
    title: 'Husum Torv',
    subheader: 'Next stop: Nørreport St.',
  },
} satisfies Meta<typeof DetailHeader>

type Story = StoryObj<typeof DetailHeader>

/** A bus's header: its 5C badge, its destination and its next stop. */
export const Line: Story = {
  args: {
    variant: 'line',
    line: 'bus',
    lineName: '5C',
    title: 'Husum Torv',
    subheader: 'Next stop: Nørreport St.',
  },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(heading).toHaveAccessibleName('5C Husum Torv')
    const mark = canvasElement.querySelector('.pn-DetailHeader-mark')
    await expect(mark).toHaveAttribute('aria-hidden', 'true')
    await expect(mark?.querySelector('.pn-LineBadge')).toHaveTextContent('5C')
    const root = canvasElement.querySelector('.pn-DetailHeader')
    await userEvent.tab()
    await expect(root?.contains(document.activeElement)).toBe(false)
  },
}

/** A station several lines serve: a neutral marker, its name, and the lines it has. */
export const Stop: Story = {
  args: {
    variant: 'stop',
    line: undefined,
    lineName: undefined,
    title: 'Nørreport St.',
    subheader: 'Metro, S-tog and buses',
  },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(heading).toHaveAccessibleName('Nørreport St.')
    const mark = canvasElement.querySelector('.pn-DetailHeader-mark')
    await expect(mark).toHaveAttribute('aria-hidden', 'true')
    const marker = mark?.querySelector('.pn-StationIcon')
    await expect(marker).toHaveAttribute('data-variant', 'outlined')
    await expect(marker).not.toHaveAttribute('data-line')
  },
}

/** Line's header with the panel's control at the end of the row. */
export const WithAction: Story = {
  args: {
    variant: 'line',
    line: 'bus',
    lineName: '5C',
    title: 'Husum Torv',
    subheader: 'Next stop: Nørreport St.',
    action: showOnMap,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const heading = canvas.getByRole('heading', { level: 2 })
    const button = canvas.getByRole('button', { name: 'Show on map' })
    await expect(heading.compareDocumentPosition(button)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    const before = document.activeElement
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(before)
  },
}

/** A long Danish name and a subheader, each wrapping beside the action, in a 320 px wide panel. */
export const LongTitle: Story = {
  args: {
    variant: 'stop',
    line: 'm3',
    lineName: undefined,
    title: 'Københavns Hovedbanegård (Tietgensgade)',
    subheader: 'Metro M3, entrance on Tietgensgade',
    action: showOnMap,
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 320 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector('.pn-DetailHeader')!
    const title = canvas.getByRole('heading', { level: 2 })
    const subheader = canvasElement.querySelector('.pn-DetailHeader-subheader')!
    const button = canvas.getByRole('button', { name: 'Show on map' })
    const container = root.parentElement!.getBoundingClientRect()
    const box = root.getBoundingClientRect()
    await expect(box.width).toBeLessThanOrEqual(container.width)
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    // the title wraps onto more than one line, inside the middle column
    const lineHeight = parseFloat(getComputedStyle(title).lineHeight)
    await expect(title.getBoundingClientRect().height).toBeGreaterThan(lineHeight)
    await expect(title.getBoundingClientRect().right).toBeLessThanOrEqual(
      button.getBoundingClientRect().left,
    )
    // the subheader wraps, inside the middle column and the container
    const subheaderBox = subheader.getBoundingClientRect()
    const subheaderLineHeight = parseFloat(getComputedStyle(subheader).lineHeight)
    await expect(subheaderBox.height).toBeGreaterThan(subheaderLineHeight)
    await expect(subheader.scrollWidth).toBeLessThanOrEqual(subheader.clientWidth)
    await expect(subheaderBox.left).toBeGreaterThanOrEqual(container.left)
    await expect(subheaderBox.right).toBeLessThanOrEqual(button.getBoundingClientRect().left)
    await expect(subheaderBox.bottom).toBeLessThanOrEqual(container.bottom)
    // the button stays whole: its label fits on one line, inside the root
    await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth)
    await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(box.right)
  },
}
