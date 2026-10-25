// Alert's stories: one per row of the spec's Stories table (docs/components/alert.md), with the
// design deferred, named as the `color` values, and their play tests. The close button's hover and
// pressed render at rest; the visual stage drives them, and the Danger play reads the rules they
// trigger.
import { useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, mocked, userEvent, waitFor, within } from 'storybook/test'
import calendar from '../../../icons/calendar.svg?raw'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  expectNoFocus,
  heard,
  icon,
  lines,
  mounted,
  pressedAfterHover,
  resolve,
  stateFill,
} from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { Alert } from './Alert.tsx'
import type { AlertProps } from './Alert.tsx'

const meta = {
  title: 'Components/Alert',
  component: Alert,
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

const DANGER_TITLE = 'Could not load departures'
const DANGER_SENTENCE =
  'The real-time feed stopped answering at 08:02. Departures show the timetable only.'

/** The alert's root in `scope`. */
const rootIn = (scope: Element) => scope.querySelector<HTMLElement>('.pn-Alert')!

/** One of the alert's inner parts in `scope`, by its class, or null when it isn't rendered. */
const part = (
  scope: Element,
  name: 'icon' | 'content' | 'title' | 'description' | 'action' | 'close',
) => scope.querySelector<HTMLElement>(`.pn-Alert-${name}`)

/**
 * The pattern CR-7 asks of a caller: remove the alert in `onClose` and move focus to the element
 * before it, so focus is not dropped to `<body>`.
 */
function Dismissible() {
  const [shown, setShown] = useState(true)
  const before = useRef<HTMLButtonElement>(null)
  return (
    <>
      <Button ref={before}>Send report</Button>
      {shown ? (
        <Alert
          color="success"
          title="Report sent"
          onClose={() => {
            setShown(false)
            before.current?.focus()
          }}
        />
      ) : null}
    </>
  )
}

/** Every part: the icon, the title, the sentence, a small outline action and the close button. */
export const Danger: Story = {
  args: {
    color: 'danger',
    title: DANGER_TITLE,
    children: DANGER_SENTENCE,
    action: (
      <Button size="small" variant="outline" color="neutral">
        Try again
      </Button>
    ),
    onClose: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const root = rootIn(canvasElement)
    const canvas = within(canvasElement)
    const before = document.activeElement

    await step('the root is a status, coloured danger', async () => {
      await expect(root).toHaveAttribute('role', 'status')
      await expect(root).toHaveAttribute('data-color', 'danger')
      await expect(canvas.getByRole('status')).toBe(root)
    })

    await step('the icon is hidden, and the ear hears the words', async () => {
      const iconPart = part(root, 'icon')!
      await expect(iconPart).toHaveAttribute('aria-hidden', 'true')
      await expect(iconPart.querySelector('svg')).toHaveAttribute('focusable', 'false')
      await expect(heard(root)).toBe([DANGER_TITLE, DANGER_SENTENCE, 'Try again', 'Close'].join(''))
    })

    const retry = canvas.getByRole('button', { name: 'Try again' })
    const close = canvas.getByRole('button', { name: 'Close' })

    await step('Tab reaches "Try again", then "Close"', async () => {
      await userEvent.tab()
      await expect(retry).toHaveFocus()
      await userEvent.tab()
      await expect(close).toHaveFocus()
    })

    await step('Enter and Space on "Close" each call onClose once, with close-press', async () => {
      await userEvent.keyboard('{Enter}')
      await expect(args.onClose).toHaveBeenCalledTimes(1)
      const [event, reason, details] = mocked(args.onClose!).mock.lastCall!
      await expect(event).toBeInstanceOf(MouseEvent)
      await expect(reason).toBe('close-press')
      await expect(details).toEqual({ reason: 'close-press', event })
      await userEvent.keyboard(' ')
      await expect(args.onClose).toHaveBeenCalledTimes(2)
      // CR-7: pressing close only calls onClose
      await expect(root).toBeInTheDocument()
      await expect(close).toHaveFocus()
    })

    await step('Shift+Tab moves back through them, and out of the alert', async () => {
      await userEvent.tab({ shift: true })
      await expect(retry).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(root).not.toContainElement(document.activeElement as HTMLElement)
      await expect(document.activeElement).toBe(before)
    })

    await step("the close button's press renders apart from its hover", async () => {
      const pressed = stateFill(close, ':active')
      await expect(pressed).not.toBe('')
      await expect(pressedAfterHover(close)).toBe(true)
      await expect(resolve('backgroundColor', pressed)).not.toBe(
        resolve('backgroundColor', stateFill(close)),
      )
    })

    await step('icon={null} renders no icon part (CR-3)', async () => {
      await mounted(canvasElement, <Alert {...args} icon={null} />, async (host) => {
        await waitFor(() => expect(part(host, 'title')).not.toBeNull())
        await expect(part(host, 'icon')).toBeNull()
      })
    })

    await step('the caller\'s role="alert" wins over status (CR-8)', async () => {
      await mounted(canvasElement, <Alert {...args} role="alert" />, async (host) => {
        const alert = await within(host).findByRole('alert')
        await expect(alert).toBe(rootIn(host))
        await expect(within(host).queryByRole('status')).toBeNull()
      })
    })

    await expect(document.activeElement).toBe(before)
  },
}

/** The sentence alone, in the info intent: no title, action or close. */
export const Info: Story = {
  args: {
    color: 'info',
    children: 'Departures after 01:00 follow the night timetable.',
  },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-color', 'info')
    await expect(part(root, 'icon')!.querySelector('svg')).not.toBeNull()
    await expect(part(root, 'description')).toHaveTextContent(
      'Departures after 01:00 follow the night timetable.',
    )
    for (const name of ['title', 'action', 'close'] as const)
      await expect(part(root, name)).toBeNull()
    // CR-3: the root holds the icon and the content, the content the description alone
    await expect(root.children).toHaveLength(2)
    await expect(part(root, 'content')!.children).toHaveLength(1)
    const before = document.activeElement
    await expectNoFocus(root)
    await expect(document.activeElement).toBe(before)
  },
}

/** The default intent: a calm grey notice with no icon. */
export const Neutral: Story = {
  args: {
    children: 'Departures update every 30 seconds.',
  },
  play: async ({ args, canvasElement, step }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-color', 'neutral')
    await expect(part(root, 'icon')).toBeNull()

    await step("a caller's icon renders in the icon part, hidden", async () => {
      await mounted(canvasElement, <Alert {...args} icon={icon(calendar)} />, async (host) => {
        const iconPart = await waitFor(() => {
          const found = part(host, 'icon')
          expect(found).not.toBeNull()
          return found!
        })
        await expect(iconPart).toHaveAttribute('aria-hidden', 'true')
        await expect(iconPart.querySelector('svg.perron-icon')).not.toBeNull()
        await expect(heard(rootIn(host))).toBe('Departures update every 30 seconds.')
      })
    })
  },
}

/** A title and the close button, in the success intent. */
export const Success: Story = {
  args: {
    color: 'success',
    title: 'Report sent',
    onClose: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-color', 'success')
    const close = within(canvasElement).getByRole('button', { name: 'Close' })

    await step('pressing "Close" calls onClose, and the alert stays (CR-7)', async () => {
      await userEvent.click(close)
      await expect(args.onClose).toHaveBeenCalledTimes(1)
      const [event, reason, details] = mocked(args.onClose!).mock.lastCall!
      await expect(event).toBeInstanceOf(MouseEvent)
      await expect(reason).toBe('close-press')
      await expect(details).toEqual({ reason: 'close-press', event })
      await expect(root).toBeInTheDocument()
      close.blur()
    })

    await step('a caller that removes it in onClose moves focus before it (CR-7)', async () => {
      await mounted(canvasElement, <Dismissible />, async (host) => {
        const button = await within(host).findByRole('button', { name: 'Close' })
        await userEvent.click(button)
        await waitFor(() => expect(rootIn(host)).toBeNull())
        await expect(within(host).getByRole('button', { name: 'Send report' })).toHaveFocus()
        ;(document.activeElement as HTMLElement).blur()
      })
    })

    await step('closeLabel="Dismiss" names the close button', async () => {
      const props: AlertProps = { ...args, closeLabel: 'Dismiss' }
      await mounted(canvasElement, <Alert {...props} />, async (host) => {
        await within(host).findByRole('button', { name: 'Dismiss' })
        await expect(within(host).queryByRole('button', { name: 'Close' })).toBeNull()
        expectOwnedStrings(
          renderToStaticMarkup(
            <PerronProvider locale="da">
              <Alert {...props} />
            </PerronProvider>,
          ),
          'da',
          ['Report sent', 'Dismiss'],
        )
      })
    })
  },
}

/** A title and the sentences, in the warning intent, with no close button. */
export const Warning: Story = {
  args: {
    color: 'warning',
    title: 'Signal fault at Danshøj',
    children:
      "Trains between Flintholm and Ny Ellebjerg run slower than planned. We don't know yet when the fault will be fixed.",
  },
  play: async ({ args, canvasElement, step }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-color', 'warning')
    await expect(part(root, 'close')).toBeNull()
    await expect(within(canvasElement).queryByRole('button')).toBeNull()

    await step('a long Danish word wraps inside a 320 px container (CR-9)', async () => {
      const longWord = 'Signalanlægsfejlretningsarbejdsplanlægningsmøde'
      await mounted(
        canvasElement,
        <div style={{ inlineSize: 320 }}>
          <Alert {...args} title={longWord} />
        </div>,
        async (host) => {
          const title = await waitFor(() => {
            const found = part(host, 'title')
            expect(found).toHaveTextContent(longWord)
            return found!
          })
          const alert = rootIn(host)
          const frame = host.firstElementChild!
          await expect(lines(title)).toBeGreaterThan(1.5)
          const box = title.getBoundingClientRect()
          const bounds = alert.getBoundingClientRect()
          await expect(box.right).toBeLessThanOrEqual(bounds.right + 0.5)
          await expect(bounds.right).toBeLessThanOrEqual(frame.getBoundingClientRect().right + 0.5)
          await expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth)
          await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth)
        },
      )
    })
  },
}
