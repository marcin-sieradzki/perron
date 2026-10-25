// MapTooltip's stories: the one variant of the deferred design, Default, and the behaviour the
// spec's Stories table names, each open against a point inside its own frame, with play tests for
// placement, dismissal and focus (docs/components/map-tooltip.md).
import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { Button } from '../Button/Button.tsx'
import { MapTooltip } from './MapTooltip.tsx'

const WORDS = 'Bus 5C to Husum'
const STATE = 'Live, on time'
const SHOW = 'Show the card'

/** Where a vehicle sits in the frame, away from 0, 0, which Base UI reads as a hidden anchor. */
const POINT = { x: 240, y: 240 }

/** A virtual anchor: a point with no element behind it, as the map projects a vehicle. */
const pointAt = (x: number, y: number) => ({
  getBoundingClientRect: () => DOMRect.fromRect({ x, y, width: 0, height: 0 }),
})

const meta = {
  title: 'Components/MapTooltip',
  component: MapTooltip,
  args: { anchor: pointAt(POINT.x, POINT.y), children: WORDS, onClose: fn() },
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
const closed = () => waitFor(() => expect(document.querySelector('.pn-MapTooltip')).toBeNull())

/** A token's value as it renders, as a length in pixels, through a probe that reads it. */
function pixels(token: string) {
  const probe = document.createElement('div')
  probe.style.width = `var(${token})`
  document.body.append(probe)
  const width = Number.parseFloat(getComputedStyle(probe).width)
  probe.remove()
  return width
}

/** A colour token as it renders, through a probe that reads it. */
function colour(token: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  document.body.append(probe)
  const rendered = getComputedStyle(probe).color
  probe.remove()
  return rendered
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
    await step('Esc calls onClose with escape-key, and the card leaves', async () => {
      await userEvent.keyboard('{Escape}')
      await expect(args.onClose).toHaveBeenCalledWith(
        expect.anything(),
        'escape-key',
        expect.anything(),
      )
      await closed()
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
          anchor={dot}
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
      await closed()
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
      await closed()
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
    await closed()
  },
}

/** The card over a point near the top of the frame, with no room above it, so it flips below. */
export const NearTopEdge: Story = {
  args: { defaultOpen: true, anchor: pointAt(POINT.x, 16) },
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
    await closed()
  },
}
