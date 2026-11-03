// DataStatePanel's stories: the data in, with every prop a control, each other status side by side,
// then the retry's test.
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { showcase } from '../../testing/Showcase.tsx'
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
/** The args a story renders with: the meta's and its own. */
type StoryArgs = Parameters<NonNullable<Story['render']>>[0]

/** The live region: the message part, always rendered (CR-2). */
const region = (canvasElement: HTMLElement) => within(canvasElement).getByRole('status')

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

/** The data is in: the list of departures, and an empty message part (CR-1, CR-2). */
const ready = {
  args: { status: 'ready' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(3)
    await expect(region(canvasElement)).toBeEmptyDOMElement()
    await expect(canvasElement.querySelector('.pn-EmptyState')).toBeNull()
  },
} satisfies Story

/** No data yet: "Loading" alone, with no sentence, no action and no list (CR-3). */
const loading = {
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
} satisfies Story

/** The data came back with nothing in it: the title, a sentence and an action. */
const empty = {
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
} satisfies Story

/** The data could not be loaded: the title, a sentence and "Try again". */
const error = {
  args: {
    status: 'error',
    description: 'Try again in a minute.',
    action: tryAgain,
  },
  play: async ({ canvasElement }) => {
    await expect(region(canvasElement)).toHaveTextContent('Could not load the data')
    await expect(region(canvasElement)).toHaveTextContent('Try again in a minute.')
    await expect(within(canvasElement).queryByRole('list')).toBeNull()
    const button = within(canvasElement).getByRole('button', { name: 'Try again' })
    const before = document.activeElement
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(before)
  },
} satisfies Story

/** The data is in: the list of departures, every prop a control. */
export const Default: Story = {
  ...ready,
  play: async (context) => {
    await ready.play(context)
  },
}

/** Each status but ready, one panel apiece. */
export const States: Story = {
  ...showcase<StoryArgs>(
    [
      { label: 'Loading', story: loading },
      { label: 'Empty', story: empty },
      { label: 'Error', story: error },
    ],
    (args) => <DataStatePanel {...args} />,
  ),
}

/**
 * The error status, its "Try again" starting to load the data again through the caller's state.
 * Focus moves to the message part once the button it was on is gone (CR-6), and leaves it at the
 * end, so focus ends where it started.
 */
export const ErrorRetry: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    status: 'error',
    description: 'Try again in a minute.',
    action: tryAgain,
  },
  render: (args) => <Retrying {...args} />,
  play: async ({ canvasElement }) => {
    const message = region(canvasElement)
    await expect(message).toHaveTextContent('Could not load the data')
    const button = within(canvasElement).getByRole('button', { name: 'Try again' })
    const before = document.activeElement
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(message).toHaveTextContent(/^Loading$/))
    await expect(button).not.toBeInTheDocument()
    await expect(message).toHaveFocus()
    await expect(document.activeElement).not.toBe(document.body)
    message.blur()
    await expect(document.activeElement).toBe(before)
  },
}
