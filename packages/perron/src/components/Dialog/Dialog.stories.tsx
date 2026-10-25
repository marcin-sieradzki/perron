// Dialog's stories: the deferred design's one variant, Default, and the content's shapes beside it,
// each open at first render beside the trigger that opens it again, with the play tests the spec's
// Stories table names (docs/components/dialog.md).
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { closed, focusedClose, mounted } from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { Text } from '../Text/Text.tsx'
import { Dialog } from './Dialog.tsx'
import type { DialogProps } from './Dialog.tsx'

const TRIGGER = 'Show keys'
const TITLE = 'Keys'
const DESCRIPTION = 'Move around the map without a mouse.'
const CONTENT = 'Keys: + and − zoom, arrows pan, Esc closes panels.'

const CLEAR_TRIGGER = 'Clear all filters'
const CLEAR_TITLE = 'Clear all filters?'
const CLEAR_DESCRIPTION = 'The map shows every line again.'
const CANCEL = 'Cancel'
const CONFIRM = 'Clear filters'

const PARAGRAPHS = Array.from(
  { length: 20 },
  (_, i) => `Tip ${i + 1}: the keys work on the map, in every panel and in every list of stops.`,
)

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
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
  // The dialog portals to the end of <body> with position: fixed and locks the page, so on the docs
  // page each story renders in its own frame rather than inline (CR-14).
  parameters: { docs: { story: { inline: false, height: '480px' } } },
} satisfies Meta<typeof Dialog>

export default meta

type Story = StoryObj<typeof meta>

/** The open dialog, found by its role in the portal at the end of `<body>`. */
const dialog = (name = TITLE) => screen.findByRole('dialog', { name })

/** The trigger, found while the open dialog hides the page from assistive technology. */
const triggerIn = (canvasElement: HTMLElement, name = TRIGGER) =>
  within(canvasElement).getByRole('button', { name, hidden: true })

/** The one variant: open, with a title, a description and a sentence of content. */
export const Default: Story = {
  play: async ({ canvasElement, args, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the dialog is named by its title and described by its description', async () => {
      const popup = await dialog()
      await expect(popup).toHaveAccessibleDescription(DESCRIPTION)
      expectOwnedStrings(popup.outerHTML, 'en', [TITLE, DESCRIPTION, CONTENT])
    })
    await step('the close button has focus, and Tab keeps it there', async () => {
      const close = await focusedClose(await dialog())
      await userEvent.tab()
      await waitFor(() => expect(close).toHaveFocus())
      await userEvent.tab({ shift: true })
      await waitFor(() => expect(close).toHaveFocus())
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
      await dialog()
      await expect(args.onOpen).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ reason: 'trigger-press' }),
      )
    })
    await step('a click on the close button closes it, and focus returns', async () => {
      const close = await focusedClose(await dialog())
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

/** A question with its answers, open from the story's state: Cancel, and the brand action last. */
function ActionsDialog(args: DialogProps) {
  const [open, setOpen] = useState(true)
  return (
    <Dialog
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
      actions={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {CANCEL}
          </Button>
          <Button color="brand" onClick={() => setOpen(false)}>
            {CONFIRM}
          </Button>
        </>
      }
    />
  )
}

/** Open from the story's state, with the actions "Cancel" and a brand "Clear filters". */
export const Actions: Story = {
  args: {
    trigger: <Button>{CLEAR_TRIGGER}</Button>,
    title: CLEAR_TITLE,
    description: CLEAR_DESCRIPTION,
    children: undefined,
    defaultOpen: undefined,
  },
  render: (args) => <ActionsDialog {...args} />,
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement, CLEAR_TRIGGER)
    const popup = await dialog(CLEAR_TITLE)
    const close = await focusedClose(popup)
    const cancel = within(popup).getByRole('button', { name: CANCEL })
    const confirm = within(popup).getByRole('button', { name: CONFIRM })
    await step(
      'Tab goes from the close button to Cancel and Clear filters, and wraps',
      async () => {
        await userEvent.tab()
        await waitFor(() => expect(cancel).toHaveFocus())
        await userEvent.tab()
        await waitFor(() => expect(confirm).toHaveFocus())
        await userEvent.tab()
        await waitFor(() => expect(close).toHaveFocus())
      },
    )
    await step('Shift+Tab goes back', async () => {
      await userEvent.tab({ shift: true })
      await waitFor(() => expect(confirm).toHaveFocus())
      await userEvent.tab({ shift: true })
      await waitFor(() => expect(cancel).toHaveFocus())
    })
    await step('a click on Cancel closes it, and focus returns to the trigger', async () => {
      await userEvent.click(cancel)
      await closed()
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
  },
}

/** A title and content, with no description and no actions. */
export const TitleOnly: Story = {
  args: { description: undefined },
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    const popup = await dialog()
    await step('no description and no actions render', async () => {
      await expect(popup).not.toHaveAttribute('aria-describedby')
      await expect(popup.querySelector('.pn-Dialog-description')).toBeNull()
      await expect(popup.querySelector('.pn-Dialog-actions')).toBeNull()
      await expect(popup.querySelector('.pn-Dialog-content')).toHaveTextContent(CONTENT)
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

/** Content taller than the frame: the popup stops short of the viewport's ends and scrolls. */
export const LongContent: Story = {
  args: {
    children: (
      <div style={{ display: 'grid', gap: 'var(--perron-space-200)' }}>
        {PARAGRAPHS.map((tip) => (
          <Text key={tip}>{tip}</Text>
        ))}
      </div>
    ),
  },
  play: async ({ canvasElement, args, step }) => {
    const trigger = triggerIn(canvasElement)
    const popup = await dialog()
    await step(
      'the popup fits the viewport less size.panel-gap at each end, and scrolls',
      async () => {
        const gap = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--perron-size-panel-gap'),
        )
        const box = popup.getBoundingClientRect()
        await expect(box.height).toBeLessThanOrEqual(window.innerHeight - 2 * gap + 0.5)
        await expect(box.top).toBeGreaterThanOrEqual(gap - 0.5)
        await expect(popup.scrollHeight).toBeGreaterThan(popup.clientHeight)
      },
    )
    await step('a press on the backdrop closes it, and focus returns to the trigger', async () => {
      await focusedClose(popup)
      const backdrop = document.querySelector('.pn-Dialog-backdrop') as HTMLElement
      await userEvent.click(backdrop)
      await closed()
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'outside-press',
        expect.anything(),
      )
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
  },
}

/** `closeLabel` names the close button; without it, the locale's word does, here in Danish. */
export const CloseLabel: Story = {
  args: { closeLabel: 'Close the keys' },
  play: async ({ canvasElement, args, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the close button is named by closeLabel', async () => {
      await focusedClose(await dialog(), 'Close the keys')
      await userEvent.keyboard('{Escape}')
      await closed()
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
    await step('in da with no override, it is named "Luk", and every word is known', async () => {
      const ui = (
        <PerronProvider locale="da">
          <Dialog {...args} closeLabel={undefined} data-testid="dialog-da" />
        </PerronProvider>
      )
      await mounted(document.body, ui, async () => {
        const da = await waitFor(() => {
          const found = document.querySelector('[data-testid="dialog-da"]')
          expect(found).not.toBeNull()
          return found as HTMLElement
        })
        await expect(within(da).getByRole('button', { name: 'Luk' })).toBeInTheDocument()
        expectOwnedStrings(da.outerHTML, 'da', [TITLE, DESCRIPTION, CONTENT])
      })
      await closed()
    })
  },
}
