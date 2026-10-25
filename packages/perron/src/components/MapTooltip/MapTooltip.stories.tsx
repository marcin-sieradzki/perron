// MapTooltip's stories: the one variant of the deferred design, Default, and the behaviour the
// spec's Stories table names, each open against a point inside its own frame, with play tests for
// placement, a moving and a hidden point, dismissal and focus (docs/components/map-tooltip.md).
import { useMemo, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn, mocked, screen, userEvent, waitFor, within } from 'storybook/test'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { colour } from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { MapTooltip } from './MapTooltip.tsx'

const WORDS = 'Bus 5C to Husum'
const STATE = 'Live, on time'
const SHOW = 'Show the card'
const MOVE = 'Move the bus'

/** Where a vehicle sits in the frame, away from 0, 0, which Base UI reads as a hidden anchor. */
const POINT = { x: 240, y: 240 }

/**
 * Where the bus goes on each press of "Move the bus" in `MovingPoint`: to another point in the
 * frame, then off its left edge, as when the map pans, then back to `POINT`.
 */
const ROUTE = [{ x: 200, y: 400 }, { x: -40, y: 400 }, POINT]

/** A virtual anchor: a point with no element behind it, as the map projects a vehicle. */
const pointAt = (x: number, y: number) => ({
  getBoundingClientRect: () => DOMRect.fromRect({ x, y, width: 0, height: 0 }),
})

const meta = {
  title: 'Components/MapTooltip',
  component: MapTooltip,
  args: { anchorEl: pointAt(POINT.x, POINT.y), children: WORDS, onClose: fn() },
  // The card portals to the end of <body>, placed against a point in the viewport, so on the docs
  // page each story renders in its own iframe rather than inline.
  parameters: { docs: { story: { inline: false, height: '480px' } } },
} satisfies Meta<typeof MapTooltip>

export default meta

type Story = StoryObj<typeof meta>

/** The open card, found in the portal at the end of `<body>`. */
const card = () =>
  waitFor(() => {
    const found = document.querySelector<HTMLElement>('.pn-MapTooltip')
    expect(found).not.toBeNull()
    return found as HTMLElement
  })

/** Resolves once no card is in the document. */
const gone = () => waitFor(() => expect(document.querySelector('.pn-MapTooltip')).toBeNull())

/** Resolves after the given number of frames, for a check that something has not changed. */
const frames = async (count: number) => {
  for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame)
}

/** Resolves once the card sits centred over the point, `space.200` above it (CR-5). */
const above = (popup: HTMLElement, point: { x: number; y: number }) =>
  waitFor(() => {
    const box = popup.getBoundingClientRect()
    expect(box.left + box.width / 2).toBeCloseTo(point.x, 0)
    expect(point.y - box.bottom).toBeCloseTo(pixels('--perron-space-200'), 0)
  })

/** A token's value as it renders, as a length in pixels, through a probe that reads it. */
function pixels(token: string) {
  const probe = document.createElement('div')
  probe.style.width = `var(${token})`
  document.body.append(probe)
  const width = Number.parseFloat(getComputedStyle(probe).width)
  probe.remove()
  return width
}

/** The card over a point, open from the first render, with one line of the caller's words. */
export const Default: Story = {
  args: { defaultOpen: true },
  play: async ({ args, step }) => {
    const popup = await card()
    await step('the card has its class, no role and the words, all the caller’s', async () => {
      await expect(popup).toHaveClass('pn-MapTooltip')
      await expect(popup).not.toHaveAttribute('role')
      await expect(popup).not.toHaveAttribute('aria-hidden')
      await expect(popup).toHaveTextContent(WORDS)
      for (const locale of Object.keys(dictionaries) as Locale[])
        expectOwnedStrings(popup.outerHTML, locale, [WORDS])
    })
    await step('it sits above the point, space.200 clear of it (CR-5)', async () => {
      const positioner = popup.closest('.pn-MapTooltip-positioner')
      await waitFor(() => expect(positioner).toHaveAttribute('data-side', 'top'))
      await waitFor(() => {
        const gap = POINT.y - popup.getBoundingClientRect().bottom
        expect(gap).toBeCloseTo(pixels('--perron-space-200'), 0)
      })
    })
    await step('details.cancel() in onClose keeps the card open', async () => {
      mocked(args.onClose!).mockImplementationOnce((_event, _reason, details) => details.cancel())
      await userEvent.keyboard('{Escape}')
      await expect(args.onClose).toHaveBeenCalledTimes(1)
      await frames(2)
      await expect(popup).toBeInTheDocument()
      await expect(popup).toHaveAttribute('data-open')
    })
    await step('Esc calls onClose with escape-key, and the card leaves', async () => {
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

/** The card held open by the story, against a dot standing in for a stop, beside its button. */
export const Controlled: Story = {
  render: function Render(args) {
    const dot = useRef<HTMLSpanElement>(null)
    const [open, setOpen] = useState(true)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 120, padding: '120px 24px' }}>
        <Button variant="outline" onClick={() => setOpen(true)}>
          {SHOW}
        </Button>
        <span
          ref={dot}
          data-testid="stop"
          style={{
            display: 'inline-block',
            inlineSize: 12,
            blockSize: 12,
            borderRadius: '50%',
            background: 'var(--perron-color-text-primary)',
          }}
        />
        <MapTooltip
          {...args}
          anchorEl={dot}
          open={open}
          onClose={(...close) => {
            args.onClose?.(...close)
            setOpen(false)
          }}
        />
      </div>
    )
  },
  play: async ({ args, canvasElement, step }) => {
    const button = within(canvasElement).getByRole('button', { name: SHOW })
    button.focus()
    await card()
    await step('Esc calls onClose once, and the story closes the card', async () => {
      await userEvent.keyboard('{Escape}')
      await expect(args.onClose).toHaveBeenCalledTimes(1)
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'escape-key',
        expect.anything(),
      )
      await gone()
      await expect(button).toHaveFocus()
    })
    await step('the button opens it again, and focus stays on the button', async () => {
      await userEvent.click(button)
      await card()
      await expect(button).toHaveFocus()
    })
    await step('a press outside the card calls onClose with outside-press', async () => {
      // a press on the page, which takes no focus, so the button keeps it
      fireEvent.pointerDown(document.body)
      fireEvent.mouseDown(document.body)
      fireEvent.pointerUp(document.body)
      fireEvent.mouseUp(document.body)
      fireEvent.click(document.body)
      await waitFor(() =>
        expect(args.onClose).toHaveBeenLastCalledWith(
          expect.anything(),
          'outside-press',
          expect.anything(),
        ),
      )
      await gone()
      await expect(button).toHaveFocus()
      button.blur()
    })
  },
}

/** The card over a point, holding an element and a list: a bold line, then the data state. */
export const Content: Story = {
  args: {
    defaultOpen: true,
    children: [
      <div key="line">
        <strong>{WORDS}</strong>
      </div>,
      <div key="state">{STATE}</div>,
    ],
  },
  play: async () => {
    const popup = await card()
    const strong = within(popup).getByText(WORDS)
    const state = within(popup).getByText(STATE)
    const inverse = colour('--perron-color-text-inverse')
    await expect(getComputedStyle(strong).color).toBe(inverse)
    await expect(getComputedStyle(state).color).toBe(inverse)
    const box = popup.getBoundingClientRect()
    await expect(box.left).toBeGreaterThanOrEqual(0)
    await expect(box.top).toBeGreaterThanOrEqual(0)
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth)
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight)
    await userEvent.keyboard('{Escape}')
    await gone()
  },
}

/** The card over a point near the top of the frame, with no room above it, so it flips below. */
export const NearTopEdge: Story = {
  args: { defaultOpen: true, anchorEl: pointAt(POINT.x, 16) },
  play: async () => {
    const popup = await card()
    const positioner = popup.closest('.pn-MapTooltip-positioner')
    await waitFor(() => expect(positioner).toHaveAttribute('data-side', 'bottom'))
    await waitFor(() =>
      expect(popup.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        pixels('--perron-size-panel-gap'),
      ),
    )
    await expect(screen.getByText(WORDS)).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await gone()
  },
}

/**
 * The card held open by the story against a point the story holds, beside a button that moves the
 * bus: to another point, off the frame's left edge, and back.
 */
export const MovingPoint: Story = {
  render: function Render(args) {
    const [stop, setStop] = useState(-1)
    const [open, setOpen] = useState(true)
    const point = stop < 0 ? POINT : ROUTE[stop]
    // a new anchor when the point moves, so the card follows
    const anchorEl = useMemo(() => pointAt(point.x, point.y), [point])
    return (
      <div style={{ padding: 24 }}>
        <Button
          variant="outline"
          onClick={() => {
            setStop((stop + 1) % ROUTE.length)
            setOpen(true)
          }}
        >
          {MOVE}
        </Button>
        <MapTooltip
          {...args}
          anchorEl={anchorEl}
          open={open}
          onClose={(...close) => {
            args.onClose?.(...close)
            setOpen(false)
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement, step }) => {
    const button = within(canvasElement).getByRole('button', { name: MOVE })
    const popup = await card()
    const positioner = popup.closest('.pn-MapTooltip-positioner')
    const move = async () => {
      button.focus()
      await userEvent.keyboard('{Enter}')
    }
    await step('the card sits above the point', () => above(popup, POINT))
    await step('a new anchor moves the card with the point', async () => {
      await move()
      await above(popup, ROUTE[0])
      await expect(popup).toBeInTheDocument()
    })
    await step('a point off the frame hides the card (CR-6)', async () => {
      await move()
      await waitFor(() => expect(positioner).toHaveAttribute('data-anchor-hidden'))
      await expect(getComputedStyle(popup).visibility).toBe('hidden')
      await expect(popup).not.toBeVisible()
    })
    await step('the point back in the frame shows the card again', async () => {
      await move()
      await waitFor(() => expect(positioner).not.toHaveAttribute('data-anchor-hidden'))
      await expect(popup).toBeVisible()
      await above(popup, POINT)
    })
    await userEvent.keyboard('{Escape}')
    await gone()
    button.blur()
  },
}

/**
 * The card open against a point that measures nothing, 0 by 0 at 0, 0, as a map gives before it
 * has projected the vehicle, so Base UI marks the anchor hidden.
 */
export const AnchorHidden: Story = {
  args: { defaultOpen: true, anchorEl: pointAt(0, 0) },
  play: async ({ args }) => {
    const popup = await card()
    const positioner = popup.closest('.pn-MapTooltip-positioner')
    await waitFor(() => expect(positioner).toHaveAttribute('data-anchor-hidden'))
    await expect(getComputedStyle(popup).visibility).toBe('hidden')
    await expect(popup).not.toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect(args.onClose).toHaveBeenLastCalledWith(
      expect.anything(),
      'escape-key',
      expect.anything(),
    )
    await gone()
  },
}
