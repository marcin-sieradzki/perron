// Toast's stories: one per row of the spec's Stories table (docs/components/toast.md), with the
// design deferred, named as the `color` values, and Stack. Each opens its toast at first render by
// `defaultOpen`, beside a trigger that shows it again, inside a PerronProvider whose region at the
// bottom of the frame holds it; behaviour that needs a toast that hides itself is mounted beside the
// story in its play (CR-14).
import { Toast as BaseToast } from '@base-ui/react/toast'
import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, mocked, screen, userEvent, waitFor, within } from 'storybook/test'
import calendar from '../../../icons/calendar.svg?raw'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  byTestId,
  closed,
  colour,
  heard,
  icon,
  lines,
  mounted,
  pressedAfterHover,
  rendered,
  resolve,
  stateFill,
} from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { Toast } from './Toast.tsx'
import type { ToastProps } from './Toast.tsx'

const DANGER_TITLE = 'Could not copy the link'
const DANGER_SENTENCE = 'Copy it from the address bar instead.'
const NIGHT_BUSES = 'Night buses run from 01:00.'
const LINK_COPIED = 'Link copied'
const DELAYED = 'Live positions are delayed'

/** A `small` `outline` `neutral` Button, as a story's trigger and a toast's action are. */
const small = (label: string, onClick?: () => void) => (
  <Button size="small" variant="outline" color="neutral" onClick={onClick}>
    {label}
  </Button>
)

const undo = fn()

/** The Stack story's triggers, in a row a step apart. */
const triggers = { display: 'flex', gap: 'var(--perron-space-200)' }

const meta = {
  title: 'Components/Toast',
  component: Toast,
  // CR-14: open at first render, and kept while the docs page and the audits look
  args: { defaultOpen: true, autoHideDuration: null, onClose: fn() },
  decorators: [
    (Story) => (
      <PerronProvider locale="en">
        <Story />
      </PerronProvider>
    ),
  ],
  // The region is fixed to the bottom of the screen, so on the docs page each story renders in its
  // own frame rather than inline (CR-14).
  parameters: { docs: { story: { inline: false, height: '480px' } } },
} satisfies Meta<typeof Toast>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The toast beside its trigger: `open` kept in the story's state, from `defaultOpen`, set to
 * `false` in `onClose` and to `true` by the trigger, as the spec's Do and don't asks of a caller.
 */
function Shown({ trigger, ...args }: ToastProps & { trigger: string }) {
  const [open, setOpen] = useState(args.defaultOpen ?? false)
  return (
    <>
      {small(trigger, () => setOpen(true))}
      <Toast
        {...args}
        open={open}
        onClose={(event, reason, details) => {
          setOpen(false)
          args.onClose?.(event, reason, details)
        }}
      />
    </>
  )
}

/**
 * A Toast whose `open` the play sets through `setOpen`, mounted beside a story with `mounted`, so
 * a step can turn it off after it closed itself, or while it is shown.
 */
function Controlled({
  setOpen,
  ...props
}: ToastProps & { setOpen: RefObject<((open: boolean) => void) | null> }) {
  const [open, set] = useState(true)
  useEffect(() => {
    setOpen.current = set
  }, [setOpen])
  return <Toast {...props} open={open} />
}

/** Reads every toast's timeout in the list of the PerronProvider around it, into `found`. */
function TimeoutProbe({ found }: { found: (number | undefined)[] }) {
  const { toasts } = BaseToast.useToastManager()
  useEffect(() => {
    found.splice(0, found.length, ...toasts.map((toast) => toast.timeout))
  }, [toasts, found])
  return null
}

/** The region named `name`: a PerronProvider's, or a Toast's own. */
const region = (name = 'Notifications') => screen.findByRole('region', { name })

/** The open toast named `name`, anywhere in the document. */
const toastNamed = (name: string) => screen.findByRole('dialog', { name })

/** One of a toast's inner parts, by its class, or null when it isn't rendered. */
const partOf = (
  root: Element,
  name: 'icon' | 'content' | 'title' | 'description' | 'action' | 'close',
) => root.querySelector<HTMLElement>(`.pn-Toast-${name}`)

/** The story's trigger, by its words. */
const triggerIn = (canvasElement: HTMLElement, name: string) =>
  within(canvasElement).getByRole('button', { name })

/** The last call of an `onClose` spy, as its event, reason and details. */
const lastClose = (onClose: ToastProps['onClose']) => mocked(onClose!).mock.lastCall!

/** Waits `ms` milliseconds, for a timer to run or not. */
const after = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Whether a stylesheet rule with `attribute` in its selector matching `element` sets no transition. */
const stillWhile = (element: Element, attribute: string) =>
  Array.from(document.styleSheets).some((sheet) =>
    Array.from(sheet.cssRules).some(
      (rule) =>
        rule instanceof CSSStyleRule &&
        rule.selectorText.includes(attribute) &&
        element.matches(rule.selectorText) &&
        rule.style.getPropertyValue('transition-property') === 'none',
    ),
  )

/** Every part: the icon, the title, the sentence, the action and the close button. The subject. */
export const Danger: Story = {
  args: {
    color: 'danger',
    title: DANGER_TITLE,
    children: DANGER_SENTENCE,
    action: small('Try again'),
  },
  render: (args) => <Shown {...args} trigger="Copy link" />,
  play: async ({ args, canvasElement, step }) => {
    const trigger = triggerIn(canvasElement, 'Copy link')
    const words = [DANGER_TITLE, DANGER_SENTENCE, 'Try again']

    await step('one polite region holds the danger toast, named by its title', async () => {
      const notifications = await region()
      await expect(notifications).toHaveAttribute('aria-live', 'polite')
      const root = await toastNamed(DANGER_TITLE)
      await expect(notifications).toContainElement(root)
      await expect(within(notifications).getAllByRole('dialog')).toHaveLength(1)
      await expect(root).toHaveAccessibleDescription(DANGER_SENTENCE)
      await expect(root).toHaveAttribute('data-color', 'danger')
    })

    await step('the icon is hidden and draws in color.status.danger', async () => {
      const root = await toastNamed(DANGER_TITLE)
      const iconPart = partOf(root, 'icon')!
      await expect(iconPart).toHaveAttribute('aria-hidden', 'true')
      await expect(getComputedStyle(iconPart).color).toBe(colour('--perron-color-status-danger'))
      await expect(heard(root)).toBe([...words, 'Close'].join(''))
    })

    await step('the root draws shadow.panel', async () => {
      const root = await toastNamed(DANGER_TITLE)
      await expect(getComputedStyle(root).boxShadow).toBe(
        resolve('boxShadow', 'var(--perron-shadow-panel)'),
      )
    })

    await step('the close button is named "Close" and never aria-hidden (CR-7)', async () => {
      const root = await toastNamed(DANGER_TITLE)
      const close = within(root).getByRole('button', { name: 'Close' })
      await expect(close).toHaveAttribute('aria-hidden', 'false')
    })

    await step('F6 from the trigger focuses the region', async () => {
      trigger.focus()
      await userEvent.keyboard('{F6}')
      await waitFor(async () => expect(await region()).toHaveFocus())
    })

    await step(
      'Tab walks the toast, "Try again" and "Close", then back to the trigger',
      async () => {
        const root = await toastNamed(DANGER_TITLE)
        await userEvent.tab()
        await waitFor(() => expect(root).toHaveFocus())
        await userEvent.tab()
        await expect(within(root).getByRole('button', { name: 'Try again' })).toHaveFocus()
        await userEvent.tab()
        await expect(within(root).getByRole('button', { name: 'Close' })).toHaveFocus()
        await userEvent.tab()
        await waitFor(() => expect(trigger).toHaveFocus())
      },
    )

    await step('F6 then Shift+Tab from the region returns focus to the trigger', async () => {
      await userEvent.keyboard('{F6}')
      await waitFor(async () => expect(await region()).toHaveFocus())
      await userEvent.tab({ shift: true })
      await waitFor(() => expect(trigger).toHaveFocus())
    })

    await step("the close button's press renders apart from its hover", async () => {
      const close = within(await toastNamed(DANGER_TITLE)).getByRole('button', { name: 'Close' })
      const pressed = stateFill(close, ':active')
      await expect(pressed).not.toBe('')
      await expect(pressedAfterHover(close)).toBe(true)
      await expect(resolve('backgroundColor', pressed)).not.toBe(
        resolve('backgroundColor', stateFill(close)),
      )
    })

    await step('the open region passes the owned-strings check in English (CR-13)', async () => {
      expectOwnedStrings((await region()).outerHTML, 'en', words)
    })

    await step('F6, Tab and Escape close it with escape-key, and focus returns', async () => {
      await userEvent.keyboard('{F6}')
      const root = await toastNamed(DANGER_TITLE)
      await userEvent.tab()
      await waitFor(() => expect(root).toHaveFocus())
      await userEvent.keyboard('{Escape}')
      await closed()
      await expect(args.onClose).toHaveBeenCalledTimes(1)
      const [event, reason, details] = lastClose(args.onClose)
      await expect(event).toBeInstanceOf(KeyboardEvent)
      await expect(reason).toBe('escape-key')
      await expect(details).toEqual({ reason: 'escape-key', event })
      await waitFor(() => expect(trigger).toHaveFocus())
    })

    await step('the trigger shows it again', async () => {
      await userEvent.click(trigger)
      await toastNamed(DANGER_TITLE)
    })

    await step('F6, Tab to "Close" and Enter close it with close-press', async () => {
      await userEvent.keyboard('{F6}')
      const root = await toastNamed(DANGER_TITLE)
      await userEvent.tab()
      await waitFor(() => expect(root).toHaveFocus())
      await userEvent.tab()
      await userEvent.tab()
      await expect(within(root).getByRole('button', { name: 'Close' })).toHaveFocus()
      await userEvent.keyboard('{Enter}')
      await closed()
      const [event, reason, details] = lastClose(args.onClose)
      await expect(event).toBeInstanceOf(MouseEvent)
      await expect(reason).toBe('close-press')
      await expect(details).toEqual({ reason: 'close-press', event })
      await waitFor(() => expect(trigger).toHaveFocus())
    })

    await step('in Danish, the region and the close button take the Danish words', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="da">
          <Toast {...args} />
        </PerronProvider>,
        async () => {
          const notifications = await region('Notifikationer')
          await within(notifications).findByRole('button', { name: 'Luk' })
          expectOwnedStrings(notifications.outerHTML, 'da', words)
        },
      )
    })

    await step("notificationsLabel names the PerronProvider's region", async () => {
      await mounted(
        canvasElement,
        <PerronProvider notificationsLabel="Messages">
          <Toast {...args} />
        </PerronProvider>,
        async () => {
          const messages = await region('Messages')
          await within(messages).findByRole('dialog', { name: DANGER_TITLE })
        },
      )
    })

    await closed()
    trigger.blur()
  },
}

/** The sentence alone, in the info intent: no title and no action. */
export const Info: Story = {
  args: { color: 'info', children: NIGHT_BUSES },
  render: (args) => <Shown {...args} trigger="Show night buses" />,
  play: async ({ args, canvasElement, step }) => {
    const root = await toastNamed(NIGHT_BUSES)

    await step(
      'no title and no action; the sentence names it and describes nothing (CR-9)',
      async () => {
        await expect(root).toHaveAttribute('data-color', 'info')
        await expect(partOf(root, 'title')).toBeNull()
        await expect(partOf(root, 'action')).toBeNull()
        await expect(root).toHaveAttribute('aria-labelledby', partOf(root, 'description')!.id)
        await expect(root).not.toHaveAttribute('aria-describedby')
      },
    )

    await step('with no PerronProvider, a Toast brings a region of its own (CR-2)', async () => {
      const ref: RefObject<HTMLDivElement | null> = { current: null }
      await mounted(
        canvasElement,
        <Toast {...args} ref={ref} data-testid="toast-alone" />,
        async () => {
          const alone = await byTestId('toast-alone')
          await expect(ref.current).toBe(alone)
          const own = alone.closest('.pn-Toast-viewport')
          await expect(own).toHaveAttribute('role', 'region')
          await expect(own).toHaveAccessibleName('Notifications')
          await expect(own).not.toContainElement(root)
        },
      )
    })
  },
}

/** The default intent, with no icon, a title, a sentence and an action. */
export const Neutral: Story = {
  args: {
    title: 'Filters cleared',
    children: 'The map shows every line again.',
    action: small('Undo', undo),
  },
  render: (args) => <Shown {...args} trigger="Clear filters" />,
  play: async ({ args, canvasElement, step }) => {
    const root = await toastNamed('Filters cleared')

    await step('it is neutral, with no icon part', async () => {
      await expect(root).toHaveAttribute('data-color', 'neutral')
      await expect(partOf(root, 'icon')).toBeNull()
    })

    await step("a caller's icon renders in the icon part, hidden", async () => {
      await mounted(
        canvasElement,
        <Toast {...args} title="With an icon" icon={icon(calendar)} />,
        async () => {
          const withIcon = await toastNamed('With an icon')
          const iconPart = partOf(withIcon, 'icon')!
          await expect(iconPart).toHaveAttribute('aria-hidden', 'true')
          await expect(iconPart.querySelector('svg.perron-icon')).not.toBeNull()
        },
      )
    })

    await step('pressing "Undo" runs its onClick and closes nothing', async () => {
      await userEvent.click(within(root).getByRole('button', { name: 'Undo' }))
      await expect(undo).toHaveBeenCalledTimes(1)
      await expect(args.onClose).not.toHaveBeenCalled()
      await expect(root).toBeInTheDocument()
      ;(document.activeElement as HTMLElement).blur()
    })

    await step('an action toast with no autoHideDuration never hides itself (CR-5)', async () => {
      const timeouts: (number | undefined)[] = []
      await mounted(
        canvasElement,
        <PerronProvider>
          <Toast defaultOpen title="Stays" action={small('Undo')} />
          <TimeoutProbe found={timeouts} />
        </PerronProvider>,
        async () => {
          await toastNamed('Stays')
          await waitFor(() => expect(timeouts).toEqual([0]))
        },
      )
    })

    await step('an action toast with autoHideDuration closes with timeout', async () => {
      const onClose = fn()
      await mounted(
        canvasElement,
        <Toast
          defaultOpen
          title="Leaves"
          action={small('Undo')}
          autoHideDuration={300}
          onClose={onClose}
        />,
        async () => {
          await toastNamed('Leaves')
          await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
          await expect(onClose.mock.lastCall![1]).toBe('timeout')
        },
      )
    })
  },
}

/** Three toasts in one region, newest first, and a fourth, closed, that its trigger shows. */
export const Stack: Story = {
  render: (args) => (
    <div style={triggers}>
      <Shown {...args} color="success" title={LINK_COPIED} trigger="Copy link" />
      <Shown {...args} color="info" trigger="Show night buses">
        {NIGHT_BUSES}
      </Shown>
      <Shown {...args} color="warning" title={DELAYED} trigger="Show delays" />
      <Shown {...args} defaultOpen={false} title="Filters cleared" trigger="Clear filters" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const order = [DELAYED, NIGHT_BUSES, LINK_COPIED]
    const notifications = await region()
    // each toast's name, from the part its aria-labelledby points at
    const names = () =>
      within(notifications)
        .queryAllByRole('dialog')
        .map((root) => document.getElementById(root.getAttribute('aria-labelledby')!)!.textContent)

    await step('one region holds the three, newest first, the newest highest', async () => {
      await waitFor(() => expect(names()).toEqual(order))
      const roots = within(notifications).getAllByRole('dialog')
      const tops = roots.map((root) => root.getBoundingClientRect().top)
      await expect([...tops].sort((a, b) => a - b)).toEqual(tops)
    })

    await step('Tab from the region walks them in that order', async () => {
      triggerIn(canvasElement, 'Copy link').focus()
      await userEvent.keyboard('{F6}')
      await waitFor(() => expect(notifications).toHaveFocus())
      for (const name of order) {
        const root = await toastNamed(name)
        await userEvent.tab()
        await waitFor(() => expect(root).toHaveFocus())
        await userEvent.tab()
        await expect(within(root).getByRole('button', { name: 'Close' })).toHaveFocus()
      }
      await userEvent.tab()
      await waitFor(() => expect(triggerIn(canvasElement, 'Copy link')).toHaveFocus())
    })

    await step('a fourth stands at the top; the oldest is limited, inert and hidden', async () => {
      await userEvent.click(triggerIn(canvasElement, 'Clear filters'))
      await toastNamed('Filters cleared')
      // a hidden toast has no accessible name, so the oldest is found by its colour
      const oldest = notifications.querySelector<HTMLElement>('.pn-Toast[data-color="success"]')!
      await waitFor(() => expect(oldest).toHaveAttribute('data-limited'))
      await expect(oldest).toHaveAttribute('inert')
      await expect(getComputedStyle(oldest).display).toBe('none')
      await expect(within(notifications).getAllByRole('dialog')[0]).toHaveAccessibleName(
        'Filters cleared',
      )
    })

    await step('closing the fourth brings the oldest back', async () => {
      const fourth = await toastNamed('Filters cleared')
      await userEvent.click(within(fourth).getByRole('button', { name: 'Close' }))
      await waitFor(() => expect(names()).toEqual(order))
      const oldest = await toastNamed(LINK_COPIED)
      await expect(oldest).not.toHaveAttribute('data-limited')
      await expect(oldest).not.toHaveAttribute('inert')
      ;(document.activeElement as HTMLElement).blur()
    })

    await step('translate and opacity move on duration.toast (CR-11)', async () => {
      const duration = rendered('duration-toast', 'transition-duration')
      for (const name of order) {
        const style = getComputedStyle(await toastNamed(name))
        await expect(style.transitionProperty).toBe('translate, opacity')
        await expect(style.transitionDuration).toBe(`${duration}, ${duration}`)
      }
    })

    await step('reduced motion takes duration.toast to 0.01 ms (CR-11)', async () => {
      const reduced = Array.from(document.styleSheets)
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .filter(
          (rule): rule is CSSMediaRule =>
            rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion'),
        )
        .flatMap((rule) => Array.from(rule.cssRules) as CSSStyleRule[])
        .map((rule) => rule.style.getPropertyValue('--perron-duration-toast').trim())
      await expect(reduced).toContain('0.01ms')
    })

    await step('while swiped it follows the pointer by translate alone', async () => {
      const root = await toastNamed(DELAYED)
      const box = root.getBoundingClientRect()
      const start = { clientX: box.left + 8, clientY: box.top + box.height / 2 }
      // one session, so the button pressed in the first call is the one released in the second
      const user = userEvent.setup()
      await user.pointer([
        { keys: '[MouseLeft>]', target: root, coords: start },
        { target: root, coords: { ...start, clientY: start.clientY + 6 } },
        { target: root, coords: { ...start, clientY: start.clientY + 12 } },
      ])
      await waitFor(() => expect(root).toHaveAttribute('data-swiping'))
      await expect(stillWhile(root, '[data-swiping]')).toBe(true)
      await expect(getComputedStyle(root).transform).toBe('none')
      await expect(getComputedStyle(root).translate).not.toBe('none')
      await user.pointer({ keys: '[/MouseLeft]', target: root })
      await waitFor(() => expect(root).not.toHaveAttribute('data-swiping'))
      await expect(root).toBeInTheDocument()
      await expect(names()).toEqual(order)
    })
  },
}

/** A title alone, in the success intent. */
export const Success: Story = {
  args: { color: 'success', title: LINK_COPIED },
  render: (args) => <Shown {...args} trigger="Copy link" />,
  play: async ({ args, canvasElement, step }) => {
    const trigger = triggerIn(canvasElement, 'Copy link')

    await step('it is success, and Space on "Close" closes it with close-press', async () => {
      const root = await toastNamed(LINK_COPIED)
      await expect(root).toHaveAttribute('data-color', 'success')
      trigger.focus()
      await userEvent.keyboard('{F6}')
      await userEvent.tab()
      await waitFor(() => expect(root).toHaveFocus())
      await userEvent.tab()
      await expect(within(root).getByRole('button', { name: 'Close' })).toHaveFocus()
      await userEvent.keyboard(' ')
      await closed()
      await expect(lastClose(args.onClose)[1]).toBe('close-press')
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })

    await step('closeLabel="Dismiss" names the close button', async () => {
      await mounted(canvasElement, <Toast {...args} closeLabel="Dismiss" />, async () => {
        const root = await toastNamed(LINK_COPIED)
        await within(root).findByRole('button', { name: 'Dismiss' })
        await expect(within(root).queryByRole('button', { name: 'Close' })).toBeNull()
      })
    })

    await step('it closes itself with timeout, and open false calls onClose no more', async () => {
      const onClose = fn()
      const setOpen: RefObject<((open: boolean) => void) | null> = { current: null }
      await mounted(
        canvasElement,
        <Controlled title="Leaves" autoHideDuration={300} onClose={onClose} setOpen={setOpen} />,
        async () => {
          await toastNamed('Leaves')
          await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
          const [event, reason, details] = onClose.mock.lastCall!
          await expect(reason).toBe('timeout')
          await expect(event).toBeInstanceOf(Event)
          await expect(event.type).toBe('timeout')
          await expect(details).toEqual({ reason: 'timeout', event })
          await closed()
          setOpen.current!(false)
          await after(50)
          await expect(onClose).toHaveBeenCalledTimes(1)
        },
      )
    })

    await step('it stays while the pointer is over the region, and leaves after', async () => {
      const onClose = fn()
      await mounted(
        canvasElement,
        <Toast defaultOpen title="Hovered" autoHideDuration={300} onClose={onClose} />,
        async () => {
          const notifications = (await toastNamed('Hovered')).closest<HTMLElement>(
            '.pn-Toast-viewport',
          )!
          await userEvent.hover(notifications)
          await after(600)
          await expect(onClose).not.toHaveBeenCalled()
          await expect(await toastNamed('Hovered')).toBeInTheDocument()
          await userEvent.unhover(notifications)
          await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
          await expect(onClose.mock.lastCall![1]).toBe('timeout')
        },
      )
    })

    await step('it stays while focus is in the region, and leaves after', async () => {
      const onClose = fn()
      await mounted(
        canvasElement,
        <Toast defaultOpen title="Focused" autoHideDuration={300} onClose={onClose} />,
        async () => {
          await toastNamed('Focused')
          trigger.focus()
          await userEvent.keyboard('{F6}')
          await after(600)
          await expect(onClose).not.toHaveBeenCalled()
          await userEvent.tab({ shift: true })
          await waitFor(() => expect(trigger).toHaveFocus())
          await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
          trigger.blur()
        },
      )
    })

    await step('dragged down 60 px, it closes with swipe', async () => {
      const onClose = fn()
      await mounted(
        canvasElement,
        <Toast defaultOpen title="Swiped" onClose={onClose} />,
        async () => {
          const root = await toastNamed('Swiped')
          const box = root.getBoundingClientRect()
          const start = { clientX: box.left + 8, clientY: box.top + box.height / 2 }
          await userEvent.pointer([
            { keys: '[MouseLeft>]', target: root, coords: start },
            // Base UI takes the first move as the swipe's start, so the drag runs 60 px past it
            { target: root, coords: { ...start, clientY: start.clientY + 1 } },
            { target: root, coords: { ...start, clientY: start.clientY + 31 } },
            { target: root, coords: { ...start, clientY: start.clientY + 61 } },
            { keys: '[/MouseLeft]', target: root },
          ])
          await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
          const [event, reason] = onClose.mock.lastCall!
          await expect(reason).toBe('swipe')
          await expect(event).toBeInstanceOf(PointerEvent)
          await expect(root).toHaveAttribute('data-swipe-direction', 'down')
        },
      )
    })

    await step('open false closes a shown toast without calling onClose', async () => {
      const onClose = fn()
      const setOpen: RefObject<((open: boolean) => void) | null> = { current: null }
      await mounted(
        canvasElement,
        <Controlled title="Turned off" onClose={onClose} setOpen={setOpen} />,
        async () => {
          await toastNamed('Turned off')
          setOpen.current!(false)
          await closed()
          await expect(onClose).not.toHaveBeenCalled()
          setOpen.current!(true)
          await toastNamed('Turned off')
          setOpen.current!(false)
          await closed()
        },
      )
    })
  },
}

/** A title and a sentence, in the warning intent. */
export const Warning: Story = {
  args: {
    color: 'warning',
    title: DELAYED,
    children: 'Positions are up to 2 min old.',
  },
  render: (args) => <Shown {...args} trigger="Show delays" />,
  play: async ({ args, canvasElement, step }) => {
    await expect(await toastNamed(DELAYED)).toHaveAttribute('data-color', 'warning')

    await step('a long Danish word wraps inside the toast (CR-10)', async () => {
      const longWord = 'Signalanlægsfejlretningsarbejdsplanlægningsmøde'
      await mounted(canvasElement, <Toast {...args} title={longWord} />, async () => {
        const root = await toastNamed(longWord)
        const title = partOf(root, 'title')!
        await expect(lines(title)).toBeGreaterThan(1.5)
        const box = title.getBoundingClientRect()
        const bounds = root.getBoundingClientRect()
        await expect(box.right).toBeLessThanOrEqual(bounds.right + 0.5)
        const close = partOf(root, 'close')!.getBoundingClientRect()
        await expect(close.left).toBeGreaterThanOrEqual(box.right - 0.5)
        await expect(close.right).toBeLessThanOrEqual(bounds.right + 0.5)
        await expect(close.top).toBeLessThan(box.top + box.height / 2)
        await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
      })
    })
  },
}
