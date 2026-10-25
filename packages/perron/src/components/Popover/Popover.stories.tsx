// Popover's stories: the deferred design's one variant, Default, and the content's shapes and the
// behaviour beside it, each open at first render below the trigger that opens it again, with the
// play tests the spec's Stories table names (docs/components/popover.md).
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { byTestId, closed, mounted, rendered } from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { Text } from '../Text/Text.tsx'
import { Popover } from './Popover.tsx'
import type { PopoverProps } from './Popover.tsx'

const TRIGGER = 'About the data'
const TITLE = 'About the data'
const DESCRIPTION = 'Where the positions on the map come from.'
const CONTENT = 'Each vehicle reports its position by GPS. A dot shows how old its last report is.'

const LAYERS_TRIGGER = 'Map layers'
const LAYERS_TITLE = 'Map layers'
const SHOW_STOPS = 'Show stops'
const SHOW_LINES = 'Show lines'
const AFTER = 'Search stops'

const LONG_TITLE = 'Realtidspositionsopdateringsintervalindstillinger'
const PARAGRAPHS = Array.from(
  { length: 12 },
  (_, i) =>
    `Note ${i + 1}: a vehicle that has not reported for two minutes shows its last known position. Its dot turns grey, and the departure list marks its times as planned rather than live.`,
)

const meta = {
  title: 'Components/Popover',
  component: Popover,
  args: {
    trigger: <Button>{TRIGGER}</Button>,
    title: TITLE,
    description: DESCRIPTION,
    children: CONTENT,
    defaultOpen: true,
    onOpen: fn(),
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <PerronProvider locale="en">
        <Story />
      </PerronProvider>
    ),
  ],
  // The popover portals to the end of <body>, so on the docs page each story renders in its own
  // frame rather than inline, the trigger at its top with room below for the popup (CR-14).
  parameters: { docs: { story: { inline: false, height: '480px' } } },
} satisfies Meta<typeof Popover>

export default meta

type Story = StoryObj<typeof meta>

/** The open popover, found by its role in the portal at the end of `<body>`. */
const popover = (name = TITLE) => screen.findByRole('dialog', { name })

/** The trigger, in the story's canvas. */
const triggerIn = (canvasElement: HTMLElement, name = TRIGGER) =>
  within(canvasElement).getByRole('button', { name })

/** The open popover's close button, once Base UI has moved focus to it. */
async function focusedClose(popup: HTMLElement, name = 'Close') {
  const close = within(popup).getByRole('button', { name })
  await waitFor(() => expect(close).toHaveFocus())
  return close
}

/** The one variant: open, with a title, a description and a sentence of content, below its trigger. */
export const Default: Story = {
  play: async ({ canvasElement, args, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the popover is named by its title and described by its description', async () => {
      const popup = await popover()
      await expect(popup).toHaveAccessibleDescription(DESCRIPTION)
      expectOwnedStrings(popup.outerHTML, 'en', [TITLE, DESCRIPTION, CONTENT])
    })
    await step('it sits below the trigger, space.200 from it', async () => {
      const popup = await popover()
      await expect(popup).toHaveAttribute('data-side', 'bottom')
      const gap = popup.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom
      await expect(
        Math.abs(gap - Number.parseFloat(rendered('space-200', 'width'))),
      ).toBeLessThanOrEqual(1)
    })
    await step('the close button has focus', async () => {
      await focusedClose(await popover())
    })
    await step('Escape closes it, and focus returns to the trigger', async () => {
      await userEvent.keyboard('{Escape}')
      await closed()
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'escape-key',
        expect.anything(),
      )
      await waitFor(() => expect(trigger).toHaveFocus())
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    })
    await step('Enter on the trigger opens it again', async () => {
      await userEvent.keyboard('{Enter}')
      await popover()
      await expect(args.onOpen).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ reason: 'trigger-press' }),
      )
    })
    await step('a click on the close button closes it, and focus returns', async () => {
      const close = await focusedClose(await popover())
      await userEvent.click(close)
      await closed()
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'close-press',
        expect.anything(),
      )
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
  },
}

/** Two controls in the content, open from the story's state, with a button after the trigger. */
function ControlsPopover(args: PopoverProps) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ display: 'flex', gap: 'var(--perron-space-200)' }}>
      <Popover
        {...args}
        open={open}
        onOpen={(event, details) => {
          setOpen(true)
          args.onOpen?.(event, details)
        }}
        onClose={(event, reason, details) => {
          setOpen(false)
          args.onClose?.(event, reason, details)
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--perron-space-200)' }}>
          <Button variant="outline">{SHOW_STOPS}</Button>
          <Button variant="outline">{SHOW_LINES}</Button>
        </div>
      </Popover>
      <Button variant="outline">{AFTER}</Button>
    </div>
  )
}

/** Open from the story's state, the title "Map layers" and two Buttons in the content. */
export const Controls: Story = {
  args: {
    trigger: <Button>{LAYERS_TRIGGER}</Button>,
    title: LAYERS_TITLE,
    description: undefined,
    children: undefined,
    defaultOpen: undefined,
  },
  render: (args) => <ControlsPopover {...args} />,
  play: async ({ canvasElement, args, step }) => {
    const trigger = triggerIn(canvasElement, LAYERS_TRIGGER)
    const after = within(canvasElement).getByRole('button', { name: AFTER })
    await step(
      'Tab goes from the close button to the controls, and on past the trigger',
      async () => {
        const popup = await popover(LAYERS_TITLE)
        await focusedClose(popup)
        await userEvent.tab()
        await waitFor(() =>
          expect(within(popup).getByRole('button', { name: SHOW_STOPS })).toHaveFocus(),
        )
        await userEvent.tab()
        await waitFor(() =>
          expect(within(popup).getByRole('button', { name: SHOW_LINES })).toHaveFocus(),
        )
        await userEvent.tab()
        await waitFor(() => expect(after).toHaveFocus())
        await closed()
        await expect(args.onClose).toHaveBeenLastCalledWith(
          expect.anything(),
          'focus-out',
          expect.anything(),
        )
      },
    )
    await step('reopened, Shift+Tab from the close button goes back to the trigger', async () => {
      await userEvent.click(trigger)
      const popup = await popover(LAYERS_TITLE)
      await focusedClose(popup)
      await userEvent.tab({ shift: true })
      await waitFor(() => expect(trigger).toHaveFocus())
      await expect(screen.getByRole('dialog', { name: LAYERS_TITLE })).toBeInTheDocument()
    })
    await step('a press outside closes it', async () => {
      await userEvent.click(document.body)
      await closed()
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'outside-press',
        expect.anything(),
      )
      trigger.blur()
    })
  },
}

/** A title and content, with no description. */
export const TitleOnly: Story = {
  args: { description: undefined },
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    const popup = await popover()
    await step('no description renders', async () => {
      await expect(popup).not.toHaveAttribute('aria-describedby')
      await expect(popup.querySelector('.pn-Popover-description')).toBeNull()
      await expect(popup.querySelector('.pn-Popover-content')).toHaveTextContent(CONTENT)
    })
    await step('Escape closes it, and focus returns to the trigger', async () => {
      await focusedClose(popup)
      await userEvent.keyboard('{Escape}')
      await closed()
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
  },
}

/** Content taller than the room below the trigger, and a long Danish word in the title. */
export const LongContent: Story = {
  args: {
    title: LONG_TITLE,
    children: (
      <div style={{ display: 'grid', gap: 'var(--perron-space-200)' }}>
        {PARAGRAPHS.map((note) => (
          <Text key={note}>{note}</Text>
        ))}
      </div>
    ),
  },
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    const popup = await popover(LONG_TITLE)
    await step('it stays below the trigger rather than move beside it', async () => {
      await expect(popup).toHaveAttribute('data-side', 'bottom')
      await expect(popup.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        trigger.getBoundingClientRect().bottom,
      )
    })
    await step('the popup fits the room Base UI gives it, and scrolls', async () => {
      const positioner = popup.parentElement as HTMLElement
      const available = Number.parseFloat(
        getComputedStyle(positioner).getPropertyValue('--available-height'),
      )
      const box = popup.getBoundingClientRect()
      await expect(box.height).toBeLessThanOrEqual(available + 0.5)
      await expect(box.width).toBeLessThanOrEqual(320.5)
      await expect(popup.scrollHeight).toBeGreaterThan(popup.clientHeight)
    })
    await step('the long word in the title wraps inside the popup', async () => {
      const title = popup.querySelector('.pn-Popover-title') as HTMLElement
      await expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth)
      await expect(title.getBoundingClientRect().right).toBeLessThanOrEqual(
        popup.getBoundingClientRect().right,
      )
      await expect(popup.scrollWidth).toBeLessThanOrEqual(popup.clientWidth)
    })
    await step('Escape closes it, and focus returns to the trigger', async () => {
      await focusedClose(popup)
      await userEvent.keyboard('{Escape}')
      await closed()
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
  },
}

/** `closeLabel` names the close button; without it, the locale's word does, here in Danish. */
export const CloseLabel: Story = {
  args: { closeLabel: 'Close the data notes' },
  play: async ({ canvasElement, args, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the close button is named by closeLabel', async () => {
      await focusedClose(await popover(), 'Close the data notes')
      await userEvent.keyboard('{Escape}')
      await closed()
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
    await step('in da with no override, it is named "Luk", and every word is known', async () => {
      const ui = (
        <PerronProvider locale="da">
          <Popover {...args} closeLabel={undefined} data-testid="popover-da" />
        </PerronProvider>
      )
      await mounted(document.body, ui, async () => {
        const da = await byTestId('popover-da')
        await expect(within(da).getByRole('button', { name: 'Luk' })).toBeInTheDocument()
        expectOwnedStrings(da.outerHTML, 'da', [TITLE, DESCRIPTION, CONTENT])
      })
      await closed()
    })
  },
}
