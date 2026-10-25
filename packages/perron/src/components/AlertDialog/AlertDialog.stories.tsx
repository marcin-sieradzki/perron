// AlertDialog's stories: the deferred design's one variant, Default, and the behaviour beside it,
// each open at first render beside the trigger that opens it again, with the play tests the spec's
// Stories table names (docs/components/alert-dialog.md).
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { closed, frames, lines } from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { AlertDialog } from './AlertDialog.tsx'
import type { AlertDialogProps } from './AlertDialog.tsx'

const TRIGGER = 'Clear all filters'
const TITLE = 'Clear all filters?'
const DESCRIPTION = 'The map shows every line again.'
const CANCEL = 'Cancel'
const CONFIRM = 'Clear filters'

const DA_TRIGGER = 'Ryd alle filtre'
const DA_TITLE = 'Ryd filtrene i trafikinformationsoversigten?'
const DA_DESCRIPTION = 'Kortet og trafikinformationsoversigten viser alle linjer igen.'
const DA_CANCEL = 'Annuller'
const DA_CONFIRM = 'Ryd alle filtre på kortet'

/** Clear filters' `onClick` in the Actions story, which the story's state closes beside. */
const onConfirm = fn()

const meta = {
  title: 'Components/AlertDialog',
  component: AlertDialog,
  args: {
    trigger: <Button>{TRIGGER}</Button>,
    title: TITLE,
    description: DESCRIPTION,
    actions: (
      <>
        <Button variant="outline">{CANCEL}</Button>
        <Button color="brand">{CONFIRM}</Button>
      </>
    ),
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
  // The alert dialog portals to the end of <body> with position: fixed and locks the page, so on
  // the docs page each story renders in its own frame rather than inline (CR-13).
  parameters: { docs: { story: { inline: false, height: '480px' } } },
} satisfies Meta<typeof AlertDialog>

export default meta

type Story = StoryObj<typeof meta>

/** The open alert dialog, found by its role in the portal. */
const alertDialog = (name = TITLE) => screen.findByRole('alertdialog', { name })

/** The trigger, found while the open alert dialog hides the page from assistive technology. */
const triggerIn = (canvasElement: HTMLElement, name = TRIGGER) =>
  within(canvasElement).getByRole('button', { name, hidden: true })

/** A button in the open alert dialog's actions. */
const action = (popup: HTMLElement, name: string) => within(popup).getByRole('button', { name })

/** The one variant: open, with a title, a description, and the actions Cancel and Clear filters. */
export const Default: Story = {
  play: async ({ canvasElement, args, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('it is an alert dialog, named by its title and described', async () => {
      const popup = await alertDialog()
      await expect(popup).toHaveAccessibleDescription(DESCRIPTION)
    })
    await step('Cancel has focus; Tab wraps through the actions, Shift+Tab goes back', async () => {
      const popup = await alertDialog()
      const cancel = action(popup, CANCEL)
      const confirm = action(popup, CONFIRM)
      await waitFor(() => expect(cancel).toHaveFocus())
      await userEvent.tab()
      await waitFor(() => expect(confirm).toHaveFocus())
      await userEvent.tab()
      await waitFor(() => expect(cancel).toHaveFocus())
      await userEvent.tab({ shift: true })
      await waitFor(() => expect(confirm).toHaveFocus())
      await userEvent.tab({ shift: true })
      await waitFor(() => expect(cancel).toHaveFocus())
    })
    await step('a press on the backdrop leaves it open and calls no onClose', async () => {
      const backdrop = document.querySelector('.pn-AlertDialog-backdrop') as HTMLElement
      await userEvent.click(backdrop)
      await frames(2)
      await expect(await alertDialog()).toBeInTheDocument()
      await expect(args.onClose).not.toHaveBeenCalled()
    })
    await step('the trigger, still focusable behind the scrim, closes it on Space', async () => {
      // the browser's Shift+Tab after a press on the backdrop lands on the trigger; user-event's Tab
      // starts from the start of <body> rather than from the press, so the step moves focus there itself
      trigger.focus()
      await expect(trigger).toHaveFocus()
      await userEvent.keyboard('[Space]')
      await closed('alertdialog')
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'trigger-press',
        expect.anything(),
      )
      await expect(trigger).toHaveFocus()
    })
    await step('Space on the trigger opens it again, with focus on Cancel', async () => {
      await userEvent.keyboard('[Space]')
      const popup = await alertDialog()
      await expect(args.onOpen).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ reason: 'trigger-press' }),
      )
      await waitFor(() => expect(action(popup, CANCEL)).toHaveFocus())
    })
    await step('Escape closes it, and focus returns to the trigger', async () => {
      await userEvent.keyboard('{Escape}')
      await closed('alertdialog')
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'escape-key',
        expect.anything(),
      )
      await waitFor(() => expect(trigger).toHaveFocus())
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    })
    await step('Enter on the trigger opens it again, with focus on Cancel', async () => {
      await userEvent.keyboard('{Enter}')
      const popup = await alertDialog()
      await expect(args.onOpen).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ reason: 'trigger-press' }),
      )
      await waitFor(() => expect(action(popup, CANCEL)).toHaveFocus())
    })
    await step('the open popup shows only the caller’s words', async () => {
      const popup = await alertDialog()
      expectOwnedStrings(popup.outerHTML, 'en', [TITLE, DESCRIPTION, CANCEL, CONFIRM])
    })
    await step('Escape closes it again', async () => {
      await userEvent.keyboard('{Escape}')
      await closed('alertdialog')
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
  },
}

/** The alert dialog open from the story's state, each action closing it in its `onClick`. */
function ActionsAlertDialog(args: AlertDialogProps) {
  const [open, setOpen] = useState(true)
  return (
    <AlertDialog
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
          <Button
            color="brand"
            onClick={(event) => {
              onConfirm(event)
              setOpen(false)
            }}
          >
            {CONFIRM}
          </Button>
        </>
      }
    />
  )
}

/** Open from the story's state: Cancel and Clear filters each close it by setting `open`. */
export const Actions: Story = {
  args: { defaultOpen: undefined },
  render: (args) => <ActionsAlertDialog {...args} />,
  play: async ({ canvasElement, args, step }) => {
    onConfirm.mockClear()
    const trigger = triggerIn(canvasElement)
    await step('a click on Clear filters closes it with no onClose', async () => {
      const popup = await alertDialog()
      await waitFor(() => expect(action(popup, CANCEL)).toHaveFocus())
      await userEvent.click(action(popup, CONFIRM))
      await closed('alertdialog')
      await expect(onConfirm).toHaveBeenCalledTimes(1)
      await expect(args.onClose).not.toHaveBeenCalled()
      await waitFor(() => expect(trigger).toHaveFocus())
    })
    await step('a click on the trigger opens it again, with focus on Cancel', async () => {
      await userEvent.click(trigger)
      const popup = await alertDialog()
      await waitFor(() => expect(action(popup, CANCEL)).toHaveFocus())
    })
    await step('a click on Cancel closes it, and focus returns to the trigger', async () => {
      await userEvent.click(action(await alertDialog(), CANCEL))
      await closed('alertdialog')
      await expect(onConfirm).toHaveBeenCalledTimes(1)
      await expect(args.onClose).not.toHaveBeenCalled()
      await waitFor(() => expect(trigger).toHaveFocus())
    })
    await step('Enter on the trigger opens it; Space on Cancel closes it', async () => {
      await userEvent.keyboard('{Enter}')
      const popup = await alertDialog()
      await waitFor(() => expect(action(popup, CANCEL)).toHaveFocus())
      await userEvent.keyboard('[Space]')
      await closed('alertdialog')
      await expect(onConfirm).toHaveBeenCalledTimes(1)
      await waitFor(() => expect(trigger).toHaveFocus())
    })
    await step(
      'Enter on Clear filters calls its onClick and closes it with no onClose',
      async () => {
        await userEvent.keyboard('{Enter}')
        const popup = await alertDialog()
        await waitFor(() => expect(action(popup, CANCEL)).toHaveFocus())
        await userEvent.tab()
        await waitFor(() => expect(action(popup, CONFIRM)).toHaveFocus())
        await userEvent.keyboard('{Enter}')
        await closed('alertdialog')
        await expect(onConfirm).toHaveBeenCalledTimes(2)
        await expect(args.onClose).not.toHaveBeenCalled()
        await waitFor(() => expect(trigger).toHaveFocus())
        trigger.blur()
      },
    )
  },
}

/**
 * Danish words with long compounds, in a 320 px frame: the frame contains layout, so the fixed
 * popup and its scrim size to it as to a phone's narrowest screen.
 */
function NarrowAlertDialog(args: AlertDialogProps) {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  return (
    <PerronProvider locale="da">
      <div
        ref={setFrame}
        data-testid="frame"
        style={{ inlineSize: 320, blockSize: 440, contain: 'layout' }}
      >
        {frame ? (
          <AlertDialog {...args} slotProps={{ ...args.slotProps, portal: { container: frame } }} />
        ) : null}
      </div>
    </PerronProvider>
  )
}

/** Long Danish compounds in the title and the description, and actions that wrap, in 320 px. */
export const LongWords: Story = {
  args: {
    trigger: <Button>{DA_TRIGGER}</Button>,
    title: DA_TITLE,
    description: DA_DESCRIPTION,
    actions: (
      <>
        <Button variant="outline">{DA_CANCEL}</Button>
        <Button color="brand">{DA_CONFIRM}</Button>
      </>
    ),
  },
  render: (args) => <NarrowAlertDialog {...args} />,
  play: async ({ canvasElement, step }) => {
    // the alert dialog mounts once the frame has, so the popup comes first; the trigger, beside the
    // portal in the frame, is itself aria-hidden while open, which leaves it no name to find it by
    const popup = await alertDialog(DA_TITLE)
    const trigger = canvasElement.querySelector('.pn-AlertDialog-trigger') as HTMLElement
    await expect(trigger).toHaveTextContent(DA_TRIGGER)
    const box = popup.getBoundingClientRect()
    await step('the title and the description wrap inside the popup', async () => {
      for (const part of ['title', 'description']) {
        const element = popup.querySelector(`.pn-AlertDialog-${part}`) as HTMLElement
        await expect(lines(element)).toBeGreaterThan(1.5)
        await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth)
        await expect(element.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5)
      }
    })
    await step('the actions row wraps, both buttons inside the popup', async () => {
      const [cancel, confirm] = [action(popup, DA_CANCEL), action(popup, DA_CONFIRM)].map((b) =>
        b.getBoundingClientRect(),
      )
      await expect(confirm.top).toBeGreaterThanOrEqual(cancel.bottom)
      for (const button of [cancel, confirm]) {
        await expect(button.left).toBeGreaterThanOrEqual(box.left - 0.5)
        await expect(button.right).toBeLessThanOrEqual(box.right + 0.5)
      }
    })
    await step('nothing overflows the popup or the 320 px frame', async () => {
      const frame = canvasElement.querySelector('[data-testid="frame"]') as HTMLElement
      await expect(popup.scrollWidth).toBeLessThanOrEqual(popup.clientWidth)
      await expect(box.width).toBeLessThanOrEqual(320)
      await expect(box.right).toBeLessThanOrEqual(frame.getBoundingClientRect().right + 0.5)
    })
    await step('the open popup shows only the caller’s words, in Danish', async () => {
      expectOwnedStrings(popup.outerHTML, 'da', [DA_TITLE, DA_DESCRIPTION, DA_CANCEL, DA_CONFIRM])
    })
    await step('Escape closes it, and focus returns to the trigger', async () => {
      await userEvent.keyboard('{Escape}')
      await closed('alertdialog')
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
  },
}
