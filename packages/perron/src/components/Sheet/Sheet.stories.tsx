// Sheet's stories: one per anchor, a bottom sheet at each snap point, and a modal sheet, each open
// by defaultOpen with the trigger that opens it again, with play tests for dismissal, focus and the
// keys (docs/components/sheet.md).
import { createRoot } from 'react-dom/client'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { Sheet } from './Sheet.tsx'

const TITLE = 'Nørreport St.'
const LINES = [
  'Lines 5C, 6A and 350S stop here, and the M1, M2 and S-trains.',
  'Signal fault at Danshøj. Trains between Flintholm and Ny Ellebjerg run slower than planned.',
]
const LONG = Array.from({ length: 40 }, (_, i) => `Departure ${i + 1}: line 5C to Husum Torv.`)
const TRIGGER = 'Show stop'
const NEXT = 'Zoom in'

const body = (lines: string[]) => (
  <>
    {lines.map((line) => (
      <p key={line}>{line}</p>
    ))}
  </>
)

const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  args: {
    title: TITLE,
    children: body(LINES),
    trigger: <button type="button">{TRIGGER}</button>,
    defaultOpen: true,
    onOpen: fn(),
    onClose: fn(),
  },
  // Each sheet portals to the end of <body> with position: fixed and locks the page, so on the docs
  // page each story renders in its own iframe rather than inline.
  parameters: { docs: { story: { inline: false, height: '480px' } } },
} satisfies Meta<typeof Sheet>

export default meta

type Story = StoryObj<typeof meta>

/** The open sheet, found by its role in the portal at the end of `<body>`. */
const sheet = () => screen.findByRole('dialog', { name: TITLE })

/** Resolves once no sheet is open. */
const closed = () => waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

/** The overview sheet: from the left, open, with a title and a few lines of body. */
export const Left: Story = {
  args: { anchor: 'left' },
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: TRIGGER })
    await sheet()
    await step('the open sheet holds only owned and caller words, in da (CR-12)', async () => {
      const host = document.createElement('div')
      document.body.append(host)
      const root = createRoot(host)
      root.render(
        <PerronProvider locale="da">
          <Sheet {...args} data-testid="sheet-da" />
        </PerronProvider>,
      )
      const da = await waitFor(() => {
        const found = document.querySelector('[data-testid="sheet-da"]')
        expect(found).not.toBeNull()
        return found as Element
      })
      expectOwnedStrings(da.outerHTML, 'da', [TITLE, ...LINES, TRIGGER])
      root.unmount()
      host.remove()
    })
    await step(
      'Esc closes it with reason escape-key, and focus returns to the trigger',
      async () => {
        await userEvent.keyboard('{Escape}')
        await expect(args.onClose).toHaveBeenCalledWith(
          expect.anything(),
          'escape-key',
          expect.anything(),
        )
        await closed()
        await waitFor(() => expect(trigger).toHaveFocus())
        trigger.blur()
      },
    )
  },
}

/** The detail panel: from the right, open, with the trigger that opens it again. */
export const Right: Story = {
  args: { anchor: 'right' },
  // the page goes on after the trigger, as the map's controls do, so Tab has somewhere to go
  render: (args) => (
    <>
      <Sheet {...args} />
      <button type="button">{NEXT}</button>
    </>
  ),
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: TRIGGER })
    await sheet()
    await step('Esc closes it', async () => {
      await userEvent.keyboard('{Escape}')
      await closed()
    })
    await step('Enter on the trigger opens it again, and focus moves into it', async () => {
      trigger.focus()
      await userEvent.keyboard('{Enter}')
      const dialog = await sheet()
      await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))
    })
    await step(
      'a short body takes no Tab stop: Tab leaves the sheet, which stays open; Shift+Tab comes back',
      async () => {
        const dialog = await sheet()
        const close = within(dialog).getByRole('button', { name: 'Close' })
        const content = dialog.querySelector('.pn-Sheet-content') as HTMLElement
        await expect(content.scrollHeight).toBeLessThanOrEqual(content.clientHeight)
        await expect(content).not.toHaveAttribute('tabindex')
        close.focus()
        await userEvent.tab()
        await waitFor(() =>
          expect(within(canvasElement).getByRole('button', { name: NEXT })).toHaveFocus(),
        )
        await expect(screen.getByRole('dialog', { name: TITLE })).toBeVisible()
        await userEvent.tab({ shift: true })
        await waitFor(() => expect(close).toHaveFocus())
      },
    )
    await step(
      'Enter on the close button closes it, and focus returns to the trigger',
      async () => {
        const close = within(await sheet()).getByRole('button', { name: 'Close' })
        close.focus()
        await userEvent.keyboard('{Enter}')
        await closed()
        await expect(args.onClose).toHaveBeenLastCalledWith(
          expect.anything(),
          'close-press',
          expect.anything(),
        )
        await waitFor(() => expect(trigger).toHaveFocus())
        trigger.blur()
      },
    )
  },
}

/** The bottom sheet on a phone, open at the `size.sheet-peek` snap point. */
export const Bottom: Story = {
  // a body taller than the peek, so the peek cuts it and a swipe up shows the rest
  args: { anchor: 'bottom', children: body([...LINES, ...LONG.slice(0, 6)]) },
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: TRIGGER })
    const dialog = await sheet()
    const content = dialog.querySelector('.pn-Sheet-content') as HTMLElement
    await step('at the peek, the body ends on screen, takes focus and scrolls', async () => {
      await waitFor(() => expect(content.scrollHeight).toBeGreaterThan(content.clientHeight))
      await waitFor(() =>
        expect(content.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight + 1),
      )
      // the Tab stop follows the overflow, on the frame after the sheet settles at its peek
      await waitFor(() => expect(content).toHaveAttribute('tabindex', '0'))
      within(dialog).getByRole('button', { name: 'Close' }).focus()
      await userEvent.tab()
      await expect(content).toHaveFocus()
      // the browser scrolls a focused scroller on its own keys; the test scrolls it to its end
      content.scrollTop = content.scrollHeight
      await waitFor(() => expect(content.scrollTop).toBeGreaterThan(0))
      const last = content.lastElementChild as HTMLElement
      await expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight + 1)
      content.scrollTop = 0
    })
    await step(
      'Esc closes it with reason escape-key, and focus returns to the trigger',
      async () => {
        await userEvent.keyboard('{Escape}')
        await expect(args.onClose).toHaveBeenCalledWith(
          expect.anything(),
          'escape-key',
          expect.anything(),
        )
        await closed()
        await waitFor(() => expect(trigger).toHaveFocus())
        trigger.blur()
      },
    )
  },
}

/** The bottom sheet at full height, with a body long enough to scroll under the header. */
export const BottomExpanded: Story = {
  args: { anchor: 'bottom', defaultSnapPoint: 1, children: body(LONG) },
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: TRIGGER })
    const dialog = await sheet()
    await step('the content scrolls and the header stays in place', async () => {
      const header = dialog.querySelector('.pn-Sheet-header') as HTMLElement
      const content = dialog.querySelector('.pn-Sheet-content') as HTMLElement
      await waitFor(() => expect(content.scrollHeight).toBeGreaterThan(content.clientHeight))
      await waitFor(() => expect(content).toHaveAttribute('tabindex', '0'))
      const top = header.getBoundingClientRect().top
      content.scrollTop = content.scrollHeight
      await waitFor(() => expect(content.scrollTop).toBeGreaterThan(0))
      await expect(header.getBoundingClientRect().top).toBe(top)
      content.scrollTop = 0
    })
    await step(
      'Esc closes it with reason escape-key, and focus returns to the trigger',
      async () => {
        await userEvent.keyboard('{Escape}')
        await expect(args.onClose).toHaveBeenCalledWith(
          expect.anything(),
          'escape-key',
          expect.anything(),
        )
        await closed()
        await waitFor(() => expect(trigger).toHaveFocus())
        trigger.blur()
      },
    )
  },
}

/** A modal sheet: from the left, over the scrim, with the trigger that opens it again. */
export const Modal: Story = {
  args: { anchor: 'left', modal: true },
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: TRIGGER, hidden: true })
    await sheet()
    await step('a click on the backdrop closes it with reason outside-press', async () => {
      const backdrop = document.querySelector('.pn-Sheet-backdrop') as HTMLElement
      await userEvent.click(backdrop)
      await closed()
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'outside-press',
        expect.anything(),
      )
    })
    await step('clicking the trigger opens it again', async () => {
      await userEvent.click(trigger)
      await sheet()
    })
    await step('Tab wraps inside the sheet', async () => {
      const dialog = await sheet()
      for (let i = 0; i < 4; i++) {
        await userEvent.tab()
        await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))
      }
    })
    await step('Esc closes it, and focus returns to the trigger', async () => {
      await userEvent.keyboard('{Escape}')
      await closed()
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
  },
}
