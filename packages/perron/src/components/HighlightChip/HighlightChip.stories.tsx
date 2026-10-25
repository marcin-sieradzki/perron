// HighlightChip's stories: one per value of the deferred design's State property, named by its
// variant name, each with the label "Line 5C", and the play tests the spec's Stories table asks
// for. Hover, focus and the press render at rest; the visual stage drives them, and the play tests
// read the rules they trigger.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { LineBadge } from '../LineBadge/LineBadge.tsx'
import {
  colour,
  mounted,
  onHover,
  pressedAfterHover,
  rendered,
  stateRules,
} from '../../testing/stories.ts'
import { HighlightChip } from './HighlightChip.tsx'

const meta = {
  title: 'Components/HighlightChip',
  component: HighlightChip,
  args: { children: 'Line 5C', onChange: fn() },
} satisfies Meta<typeof HighlightChip>

export default meta

type Story = StoryObj<typeof meta>

/** The chip a story renders, by its name. */
const chipIn = (canvasElement: HTMLElement, name = 'Line 5C') =>
  within(canvasElement).getByRole('button', { name })

/** The chip a host rendered apart from the story holds, once it has rendered. */
const chipFound = (host: HTMLElement, name: string) => within(host).findByRole('button', { name })

/** Focus is outside the story's canvas. */
const focusLeft = (canvasElement: HTMLElement) =>
  expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)

/** At rest, not selected: glass, "Line 5C". The subject story: its args render the chip alone. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange!
    const chip = chipIn(canvasElement)
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
    await expect(chip).not.toHaveAttribute('data-pressed')

    await userEvent.tab()
    await expect(chip).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await expect(chip).toHaveAttribute('data-pressed')
    await expect(onChange).toHaveBeenCalledTimes(1)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      true,
      expect.objectContaining({ reason: 'none' }),
    )
    await userEvent.keyboard('{Enter}')
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
    await expect(chip).not.toHaveAttribute('data-pressed')
    await expect(onChange).toHaveBeenCalledTimes(2)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      false,
      expect.objectContaining({ reason: 'none' }),
    )
    await userEvent.tab({ shift: true })
    await focusLeft(canvasElement)

    // a change turned down with details.cancel(), controlled and uncontrolled: the chip stays off
    const cancel = (_: Event, __: boolean, details: { cancel: () => void }) => details.cancel()
    for (const state of [{ selected: false }, { defaultSelected: false }])
      await mounted(
        canvasElement,
        <HighlightChip {...state} onChange={cancel}>
          Delayed vehicles
        </HighlightChip>,
        async (host) => {
          const other = await chipFound(host, 'Delayed vehicles')
          await userEvent.click(other)
          await expect(other).toHaveAttribute('aria-pressed', 'false')
          await expect(other).not.toHaveAttribute('data-pressed')
          other.blur()
        },
      )

    // narrowed to a few characters' width, the chip wraps inside itself, grows taller and stays
    // inside the canvas (CR-7); then the canvas is restored
    const oneLine = chip.getBoundingClientRect().height
    canvasElement.style.inlineSize = '4ch'
    try {
      const box = chip.getBoundingClientRect()
      const canvas = canvasElement.getBoundingClientRect()
      await expect(box.height).toBeGreaterThan(oneLine)
      await expect(box.left).toBeGreaterThanOrEqual(canvas.left)
      await expect(box.right).toBeLessThanOrEqual(canvas.right)
      await expect(chip.scrollWidth).toBe(chip.clientWidth)
    } finally {
      canvasElement.style.removeProperty('inline-size')
    }
    await expect(chip.getBoundingClientRect().height).toBe(oneLine)

    // a single word longer than the line breaks within the chip, which stays inside its
    // container (CR-7)
    const longWord = 'Trafikinformationsforsinkelsesoversigten'
    await mounted(canvasElement, <HighlightChip>{longWord}</HighlightChip>, async (host) => {
      host.style.inlineSize = '12ch'
      const long = await chipFound(host, longWord)
      const box = long.getBoundingClientRect()
      const container = host.getBoundingClientRect()
      await expect(box.left).toBeGreaterThanOrEqual(container.left)
      await expect(box.right).toBeLessThanOrEqual(container.right)
      await expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth)
    })

    // children as an element, and as a list of an element and a string, inside the one root
    await mounted(
      canvasElement,
      <>
        <HighlightChip>
          <LineBadge line="bus">5C</LineBadge>
        </HighlightChip>
        <HighlightChip>
          <LineBadge line="bus" aria-hidden="true">
            5C
          </LineBadge>
          Line 5C
        </HighlightChip>
      </>,
      async (host) => {
        const element = await chipFound(host, '5C')
        await expect(element.querySelector('.pn-LineBadge')).not.toBeNull()
        const list = await chipFound(host, 'Line 5C')
        await expect(list.querySelector('.pn-LineBadge')).not.toBeNull()
        for (const root of [element, list]) {
          await expect(root).toHaveClass('pn-HighlightChip')
          const badge = root.querySelector('.pn-LineBadge')!.getBoundingClientRect()
          const box = root.getBoundingClientRect()
          await expect(badge.left).toBeGreaterThanOrEqual(box.left)
          await expect(badge.right).toBeLessThanOrEqual(box.right)
        }
      },
    )
  },
}

/** At rest, hovered by the visual stage. */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const chip = chipIn(canvasElement)
    const layer = onHover(chip, 'background-image')
    await expect(layer).toContain('linear-gradient')
    await expect(layer).toContain('var(--perron-color-surface-hover)')
    await expect(
      stateRules(chip, ':active')
        .map((s) => s.getPropertyValue('background-image'))
        .filter((value) => value !== 'none')
        .join('')
        .replace(/\s+/g, ''),
    ).toBe(
      'linear-gradient(var(--perron-color-surface-selected),var(--perron-color-surface-selected))',
    )
    await expect(pressedAfterHover(chip)).toBe(true)
    await expect(getComputedStyle(chip).cursor).toBe('pointer')
    // the layer lies over the glass, which stays
    await expect(onHover(chip, 'background-color')).toBe('')
    await expect(getComputedStyle(chip).backgroundColor).toBe(
      rendered('color-surface-overlay', 'background-color'),
    )
  },
}

/** At rest, focused from the keyboard by the visual stage. */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const chip = chipIn(canvasElement)
    await userEvent.tab()
    await expect(chip).toHaveFocus()
    await expect(chip.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(chip)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(colour('--perron-color-border-focus'))
    await expect(ring.outlineWidth).toBe(rendered('focus-width', 'outline-width'))
    await expect(ring.outlineOffset).toBe(rendered('focus-offset', 'outline-offset'))
    await userEvent.tab({ shift: true })
    await focusLeft(canvasElement)
  },
}

/** At rest, disabled: out of the tab order and deaf to clicks, the words in tertiary. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const chip = chipIn(canvasElement)
    await expect(chip).toBeDisabled()
    await expect(chip).toHaveAttribute('data-disabled')
    await expect(getComputedStyle(chip).color).toBe(colour('--perron-color-text-tertiary'))
    await userEvent.tab()
    await focusLeft(canvasElement)
    await userEvent.click(chip, { pointerEventsCheck: 0 })
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
  },
}

/** Selected (`defaultSelected`): `color.surface.inverse` with `color.text.inverse`. */
export const Selected: Story = {
  args: { defaultSelected: true },
  play: async ({ canvasElement }) => {
    const chip = chipIn(canvasElement)
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await expect(chip).toHaveAttribute('data-pressed')
    const style = getComputedStyle(chip)
    await expect(style.backgroundColor).toBe(rendered('color-surface-inverse', 'background-color'))
    await expect(style.color).toBe(colour('--perron-color-text-inverse'))
    await expect(style.boxShadow).toBe(rendered('shadow-panel', 'box-shadow'))
    // one geometry in every state: the unselected chip with the same words has the same box (CR-4)
    const box = chip.getBoundingClientRect()
    await mounted(canvasElement, <HighlightChip>Line 5C</HighlightChip>, async (host) => {
      const rest = await chipFound(host, 'Line 5C')
      await expect(rest).toHaveAttribute('aria-pressed', 'false')
      const other = rest.getBoundingClientRect()
      await expect(other.width).toBe(box.width)
      await expect(other.height).toBe(box.height)
    })
  },
}

/** Selected, hovered by the visual stage. */
export const SelectedHover: Story = {
  args: { defaultSelected: true },
  play: async ({ canvasElement }) => {
    const chip = chipIn(canvasElement)
    await expect(chip).toHaveAttribute('data-pressed')
    await expect(onHover(chip, 'background-color')).toBe(
      'var(--perron-color-surface-inverse-hover)',
    )
    await expect(onHover(chip, 'background-image')).toBe('none')
    // the forced-colours rules after it set a system colour, so the theme's press is read alone
    await expect(
      stateRules(chip, ':active').some(
        (s) =>
          s.getPropertyValue('background-color') === 'var(--perron-color-surface-inverse-pressed)',
      ),
    ).toBe(true)
    await expect(pressedAfterHover(chip)).toBe(true)
  },
}

/** Selected and disabled: `color.surface.inset` with `color.text.tertiary`. */
export const SelectedDisabled: Story = {
  args: { defaultSelected: true, disabled: true },
  play: async ({ args, canvasElement }) => {
    const chip = chipIn(canvasElement)
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await expect(chip).toBeDisabled()
    const style = getComputedStyle(chip)
    await expect(style.backgroundColor).toBe(rendered('color-surface-inset', 'background-color'))
    await expect(style.color).toBe(colour('--perron-color-text-tertiary'))
    await userEvent.click(chip, { pointerEventsCheck: 0 })
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
  },
}
