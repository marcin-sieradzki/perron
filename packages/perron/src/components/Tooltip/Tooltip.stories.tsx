// Tooltip's stories: the deferred design's one variant, Default, and the behaviour the spec's
// Stories table names, each in its own frame with an IconButton as the trigger, with play tests for
// placement, hover, the keys, control, the delay group and a disabled trigger
// (docs/components/tooltip.md).
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn, mocked, screen, userEvent, waitFor, within } from 'storybook/test'
import locate from '../../../icons/locate.svg?raw'
import minus from '../../../icons/minus.svg?raw'
import plus from '../../../icons/plus.svg?raw'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { closed, colour, frames, heard, icon, rendered } from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { IconButton } from '../IconButton/IconButton.tsx'
import { Tooltip } from './Tooltip.tsx'
import type { TooltipProps } from './Tooltip.tsx'

const ZOOM_IN = 'Zoom in'
const ZOOM_OUT = 'Zoom out'
const CENTRE = 'Centre the map'
const BEFORE = 'Before'

/** Longer than Base UI's 600 ms open delay, for a hover that has to wait it out. */
const HOVER = { timeout: 2000 }

/** Where each story's trigger sits: away from the frame's edges, so the popup has room above it. */
const frame = { display: 'flex', alignItems: 'center', gap: 16, padding: '120px 24px' }

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  args: {
    trigger: <IconButton label={ZOOM_IN}>{icon(plus)}</IconButton>,
    children: ZOOM_IN,
    onOpen: fn(),
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <div style={frame}>
        <Story />
      </div>
    ),
  ],
  // The popup portals to the end of <body>, placed against its trigger, so on the docs page each
  // story renders in its own frame rather than inline.
  parameters: { docs: { story: { inline: false, height: '480px' } } },
} satisfies Meta<typeof Tooltip>

export default meta

type Story = StoryObj<typeof meta>

/** The open popup with `words`, found through `screen` in the portal at the end of `<body>`. */
const popup = (words = ZOOM_IN, options?: { timeout: number }) =>
  screen.findByText(
    (_, element) => element?.matches('.pn-Tooltip') === true && heard(element) === words,
    undefined,
    options,
  )

/** Resolves once no popup is in the document. */
const gone = () => closed({ selector: '.pn-Tooltip' })

/** The trigger, by its accessible name. */
const button = (canvasElement: HTMLElement, name = ZOOM_IN) =>
  within(canvasElement).getByRole('button', { name })

/** One pointer for a whole `play`, which remembers where it is, so a move leaves what it was over. */
type Pointer = ReturnType<typeof userEvent.setup>

/**
 * Moves the pointer to a point, onto whatever is under it, with the coordinates Base UI's hover
 * reads to tell the trigger, the popup and the gap between them apart.
 */
async function pointAt(user: Pointer, clientX: number, clientY: number) {
  const target = document.elementFromPoint(clientX, clientY) ?? document.body
  await user.pointer({ target, coords: { clientX, clientY } })
}

/**
 * Moves the pointer onto the centre of `target`, or with none onto the frame's top-left corner, far
 * from every trigger and popup.
 */
async function pointTo(user: Pointer, target?: HTMLElement) {
  const box = target?.getBoundingClientRect()
  await (box
    ? pointAt(user, box.left + box.width / 2, box.top + box.height / 2)
    : pointAt(user, 1, 1))
}

/** A press outside the tooltip that moves no pointer, so no hover ends before it. */
function pressOutside() {
  fireEvent.pointerDown(document.body)
  fireEvent.mouseDown(document.body)
  fireEvent.pointerUp(document.body)
  fireEvent.mouseUp(document.body)
  fireEvent.click(document.body)
}

/**
 * Closes the tooltip a story opens at first (`defaultOpen`) with a press outside, and clears the
 * callbacks' calls, so the rest of the `play` starts from rest. Not with Esc: Base UI keeps focus
 * from opening a tooltip again on the trigger Esc closed it on, until the pointer leaves it or it
 * loses focus.
 */
async function closeAtFirst(args: TooltipProps) {
  await popup()
  pressOutside()
  await gone()
  await expect(args.onClose).toHaveBeenLastCalledWith(
    expect.anything(),
    'outside-press',
    expect.anything(),
  )
  mocked(args.onOpen!).mockClear()
  mocked(args.onClose!).mockClear()
}

/** The subject story: open above its trigger, an IconButton labelled "Zoom in". */
export const Default: Story = {
  args: { defaultOpen: true },
  play: async ({ canvasElement, args, step }) => {
    const trigger = button(canvasElement)
    const open = await popup()
    await step('the popup has its class, no role and the trigger’s name as its words', async () => {
      await expect(open).toHaveClass('pn-Tooltip')
      await expect(open).not.toHaveAttribute('role')
      await expect(open).toHaveTextContent(ZOOM_IN)
      await expect(trigger).toHaveAccessibleName(heard(open))
      expectOwnedStrings(open.outerHTML, 'en', [ZOOM_IN])
    })
    await step('the trigger has its class and no description', async () => {
      await expect(trigger).toHaveClass('pn-Tooltip-trigger')
      await expect(trigger).toHaveClass('pn-IconButton')
      await expect(trigger).not.toHaveAttribute('aria-describedby')
    })
    await step('it sits above the trigger, space.200 clear of it', async () => {
      const positioner = open.closest('.pn-Tooltip-positioner')
      await waitFor(() => expect(positioner).toHaveAttribute('data-side', 'top'))
      await waitFor(() => {
        const gap = trigger.getBoundingClientRect().top - open.getBoundingClientRect().bottom
        expect(gap).toBeCloseTo(Number.parseFloat(rendered('space-200', 'width')), 0)
      })
    })
    await step('details.cancel() in onClose keeps it open', async () => {
      mocked(args.onClose!).mockImplementationOnce((_event, _reason, details) => details.cancel())
      await userEvent.keyboard('{Escape}')
      await expect(args.onClose).toHaveBeenCalledTimes(1)
      await frames(2)
      await expect(open).toBeInTheDocument()
      await expect(open).toHaveAttribute('data-open')
    })
    await step('Esc calls onClose with escape-key, and the popup leaves', async () => {
      await userEvent.keyboard('{Escape}')
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'escape-key',
        expect.anything(),
      )
      await gone()
    })
  },
}

/** Open at first, beside its trigger, which a resting pointer opens it from again. */
export const Hover: Story = {
  args: { defaultOpen: true },
  play: async ({ canvasElement, args, step }) => {
    const user = userEvent.setup()
    const trigger = button(canvasElement)
    await step('a press outside closes the tooltip open at first', () => closeAtFirst(args))
    await step('hovering the trigger opens it, with trigger-hover', async () => {
      await pointTo(user, trigger)
      await popup(ZOOM_IN, HOVER)
      await expect(args.onOpen).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ reason: 'trigger-hover' }),
      )
    })
    await step('moving the pointer onto the popup keeps it open', async () => {
      const open = await popup()
      // through the gap between them, as a pointer travels, then onto the popup
      const box = trigger.getBoundingClientRect()
      await pointAt(user, box.left + box.width / 2, box.top - 2)
      await pointTo(user, open)
      await frames(2)
      await expect(open).toBeInTheDocument()
      await expect(args.onClose).not.toHaveBeenCalled()
    })
    await step('moving it off both closes it, with trigger-hover', async () => {
      await pointTo(user)
      await gone()
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'trigger-hover',
        expect.anything(),
      )
    })
  },
}

/** Open at first, after a button "Before" that holds focus at the start. */
export const Keyboard: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <>
      <Button variant="outline">{BEFORE}</Button>
      <Tooltip {...args} />
    </>
  ),
  play: async ({ canvasElement, args, step }) => {
    const before = button(canvasElement, BEFORE)
    const trigger = button(canvasElement)
    before.focus()
    await step('a press outside closes the tooltip open at first', () => closeAtFirst(args))
    await step('Tab focuses the trigger and opens it, with trigger-focus', async () => {
      await userEvent.tab()
      await expect(trigger).toHaveFocus()
      await popup()
      await expect(args.onOpen).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ reason: 'trigger-focus' }),
      )
    })
    await step('Esc closes it, with escape-key, and focus stays on the trigger', async () => {
      await userEvent.keyboard('{Escape}')
      await gone()
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'escape-key',
        expect.anything(),
      )
      await expect(trigger).toHaveFocus()
    })
    await step('Shift+Tab moves focus back to Before, with the tooltip closed', async () => {
      await userEvent.tab({ shift: true })
      await expect(before).toHaveFocus()
      await expect(document.querySelector('.pn-Tooltip')).toBeNull()
    })
  },
}

/** Open from the story's state at first, which `onOpen` and `onClose` keep. */
function ControlledTooltip(args: TooltipProps) {
  const [open, setOpen] = useState(true)
  return (
    <Tooltip
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
    />
  )
}

/** Open from the story's state at first, which `onOpen` and `onClose` keep. */
export const Controlled: Story = {
  render: (args) => <ControlledTooltip {...args} />,
  play: async ({ canvasElement, args, step }) => {
    const user = userEvent.setup()
    const trigger = button(canvasElement)
    await popup()
    await step('a click on the trigger closes it, with trigger-press', async () => {
      await user.click(trigger)
      await gone()
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'trigger-press',
        expect.anything(),
      )
      trigger.blur()
    })
    await step('hovering opens it again', async () => {
      await pointTo(user)
      await pointTo(user, trigger)
      await popup(ZOOM_IN, HOVER)
      await expect(args.onOpen).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ reason: 'trigger-hover' }),
      )
    })
    await step('a press outside closes it, with outside-press', async () => {
      pressOutside()
      await gone()
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'outside-press',
        expect.anything(),
      )
      await pointTo(user)
    })
  },
}

/** Open, with an element and a string as its words, read as the trigger's name. */
export const Content: Story = {
  args: { defaultOpen: true, children: [<strong key="zoom">Zoom</strong>, ' in'] },
  play: async ({ canvasElement, step }) => {
    const trigger = button(canvasElement)
    const open = await popup()
    await step('both take color.text.inverse and read as the trigger’s name', async () => {
      const inverse = colour('--perron-color-text-inverse')
      await expect(getComputedStyle(open).color).toBe(inverse)
      await expect(getComputedStyle(open.querySelector('strong')!).color).toBe(inverse)
      await expect(heard(open)).toBe(ZOOM_IN)
      await expect(trigger).toHaveAccessibleName(heard(open))
    })
    await step('it stays inside the viewport', async () => {
      const box = open.getBoundingClientRect()
      await expect(box.left).toBeGreaterThanOrEqual(0)
      await expect(box.top).toBeGreaterThanOrEqual(0)
      await expect(box.right).toBeLessThanOrEqual(window.innerWidth)
      await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight)
    })
    await step('Esc closes it', async () => {
      await userEvent.keyboard('{Escape}')
      await gone()
    })
  },
}

/** Three triggers in a row, each in its own Tooltip, inside one PerronProvider, the first open. */
export const Group: Story = {
  render: (args) => (
    <PerronProvider locale="en">
      <div data-testid="row" style={{ display: 'flex', gap: 'var(--perron-space-200)' }}>
        <Tooltip {...args} defaultOpen />
        <Tooltip {...args} trigger={<IconButton label={ZOOM_OUT}>{icon(minus)}</IconButton>}>
          {ZOOM_OUT}
        </Tooltip>
        <Tooltip {...args} trigger={<IconButton label={CENTRE}>{icon(locate)}</IconButton>}>
          {CENTRE}
        </Tooltip>
      </div>
    </PerronProvider>
  ),
  play: async ({ canvasElement, args, step }) => {
    const user = userEvent.setup()
    const first = button(canvasElement)
    const second = button(canvasElement, ZOOM_OUT)
    const popups = () => [...document.querySelectorAll<HTMLElement>('.pn-Tooltip')]
    await step('a press outside closes the first’s tooltip, open at first', () =>
      closeAtFirst(args),
    )
    await step('hovering the first opens its tooltip again', async () => {
      await pointTo(user, first)
      await waitFor(() => expect(popups().map(heard)).toEqual([ZOOM_IN]), HOVER)
    })
    await step('the second opens at once, marked instant, and the first closes', async () => {
      await pointTo(user, second)
      await waitFor(() => expect(popups().map(heard)).toEqual([ZOOM_OUT]))
      await expect(popups()[0]).toHaveAttribute('data-instant', 'delay')
    })
    await step('leaving the row closes it', async () => {
      await pointTo(user)
      await gone()
    })
  },
}

/** Open on a trigger at the top of the frame, with no room above it. */
export const NearTopEdge: Story = {
  args: { defaultOpen: true },
  decorators: [
    (Story) => (
      <div style={{ position: 'fixed', insetBlockStart: 0, insetInlineStart: 120 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const trigger = button(canvasElement)
    const open = await popup()
    await step('it flips below the trigger', async () => {
      const positioner = open.closest('.pn-Tooltip-positioner')
      await waitFor(() => expect(positioner).toHaveAttribute('data-side', 'bottom'))
      await waitFor(() =>
        expect(open.getBoundingClientRect().top).toBeGreaterThan(
          trigger.getBoundingClientRect().bottom,
        ),
      )
    })
    await step('Esc closes it', async () => {
      await userEvent.keyboard('{Escape}')
      await gone()
    })
  },
}

/** A disabled IconButton that keeps its focus, its tooltip open at first: the keys open it again. */
export const DisabledTrigger: Story = {
  args: {
    defaultOpen: true,
    trigger: (
      <IconButton label={ZOOM_IN} disabled focusableWhenDisabled>
        {icon(plus)}
      </IconButton>
    ),
  },
  play: async ({ canvasElement, args, step }) => {
    const trigger = button(canvasElement)
    const look = getComputedStyle(trigger).backgroundColor
    await step('a press outside closes the tooltip open at first', () => closeAtFirst(args))
    await step('Tab focuses the disabled trigger, and its tooltip opens', async () => {
      await userEvent.tab()
      await expect(trigger).toHaveFocus()
      await popup()
    })
    await step('Esc closes it', async () => {
      await userEvent.keyboard('{Escape}')
      await gone()
    })
    await step('the trigger keeps data-disabled and its own look', async () => {
      await expect(trigger).toHaveAttribute('data-disabled')
      await expect(trigger).toHaveAttribute('aria-disabled', 'true')
      await expect(getComputedStyle(trigger).backgroundColor).toBe(look)
      trigger.blur()
    })
  },
}
