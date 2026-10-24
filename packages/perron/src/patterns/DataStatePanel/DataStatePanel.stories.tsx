// DataStatePanel's stories: one per row of the spec's Stories table (docs/patterns/data-state-panel.md),
// with the design deferred, named by the `status` value, and their play tests.
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../../components/Button/Button.tsx'
import { DataStatePanel } from './DataStatePanel.tsx'
import type { DataStatePanelProps } from './DataStatePanel.tsx'

/** The data view: a short list of three departures as plain text. */
const departures = (
  <ul>
    <li>5C to Husum Torv, 08:14</li>
    <li>6A to Buddinge st, 08:17</li>
    <li>350S to Ballerup st, 08:21</li>
  </ul>
)

/** The empty status's action: one neutral Button, as the spec's Do and don't asks. */
const clearFilters = (
  <Button variant="outline" color="neutral">
    Clear filters
  </Button>
)

/** The error status's action, which loads the data again. */
const tryAgain = (
  <Button variant="outline" color="neutral">
    Try again
  </Button>
)

const meta = {
  title: 'Patterns/DataStatePanel',
  component: DataStatePanel,
  args: { children: departures },
} satisfies Meta<typeof DataStatePanel>

export default meta

type Story = StoryObj<typeof meta>

/** The live region: the message part, always rendered (CR-2). */
const region = (canvasElement: HTMLElement) => within(canvasElement).getByRole('status')

/** The data is in: the list of departures, and an empty message part (CR-1, CR-2). */
export const Ready: Story = {
  args: { status: 'ready' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(3)
    await expect(region(canvasElement)).toBeEmptyDOMElement()
    await expect(canvasElement.querySelector('.pn-EmptyState')).toBeNull()
  },
}

/** No data yet: "Loading" alone, with no sentence, no action and no list (CR-3). */
export const Loading: Story = {
  args: {
    status: 'loading',
    description: 'Try again in a minute.',
    action: tryAgain,
  },
  play: async ({ canvasElement }) => {
    await expect(region(canvasElement)).toHaveTextContent(/^Loading$/)
    await expect(within(canvasElement).queryByRole('list')).toBeNull()
    await expect(within(canvasElement).queryByText('Try again in a minute.')).toBeNull()
    await expect(within(canvasElement).queryByRole('button')).toBeNull()
  },
}

/** The data came back with nothing in it: the title, a sentence and an action. */
export const Empty: Story = {
  args: {
    status: 'empty',
    description: 'Try another line, such as 5C.',
    action: clearFilters,
  },
  play: async ({ canvasElement }) => {
    await expect(region(canvasElement)).toHaveTextContent('No data to show')
    await expect(region(canvasElement)).toHaveTextContent('Try another line, such as 5C.')
    await expect(within(canvasElement).queryByRole('list')).toBeNull()
    const button = within(canvasElement).getByRole('button', { name: 'Clear filters' })
    const before = document.activeElement
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(before)
  },
}

/** The caller's state: "Try again" sets `status` to `'loading'`, as a data view's retry would. */
function Retrying(args: DataStatePanelProps) {
  const [status, setStatus] = useState(args.status)
  return (
    <DataStatePanel
      {...args}
      status={status}
      action={
        <Button variant="outline" color="neutral" onClick={() => setStatus('loading')}>
          Try again
        </Button>
      }
    />
  )
}

/**
 * The data could not be loaded: the title, a sentence and "Try again", which starts loading.
 * Focus moves to the message part once the button it was on is gone (CR-6).
 */
export const Error: Story = {
  args: {
    status: 'error',
    description: 'Try again in a minute.',
    action: tryAgain,
  },
  render: (args) => <Retrying {...args} />,
  play: async ({ canvasElement }) => {
    const message = region(canvasElement)
    await expect(message).toHaveTextContent('Could not load the data')
    await expect(message).toHaveTextContent('Try again in a minute.')
    const button = within(canvasElement).getByRole('button', { name: 'Try again' })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(message).toHaveTextContent(/^Loading$/))
    await expect(button).not.toBeInTheDocument()
    await expect(message).toHaveFocus()
    await expect(document.activeElement).not.toBe(document.body)
  },
}
