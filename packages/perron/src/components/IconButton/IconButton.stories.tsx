// IconButton's stories: one per variant of the deferred design, named as the spec's Stories table
// names them, and the play tests it asks for. Hover and focus render at rest; the visual stage
// drives them.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import info from '../../../icons/info.svg?raw'
import plus from '../../../icons/plus.svg?raw'
import { icon, pressedAfterHover, resolve, stateFill, stateRules } from '../../testing/stories.ts'
import { IconButton } from './IconButton.tsx'

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { label: 'Zoom in', children: icon(plus) },
} satisfies Meta<typeof IconButton>

export default meta

type Story = StoryObj<typeof meta>
type Play = NonNullable<Story['play']>

/** A `large` button's words and icon: `info`, drawn on the 18 px grid. */
const help = { label: 'Show help', children: icon(info) }

/**
 * The button is named by its label and its icon span is `aria-hidden`; Tab focuses it, Enter and
 * Space each fire `onClick` once, Shift+Tab returns focus to the element before it.
 */
const activates: Play = async ({ args, canvasElement }) => {
  const button = within(canvasElement).getByRole('button', { name: 'Zoom in' })
  const before = document.activeElement
  await expect(button).toHaveAccessibleName('Zoom in')
  await expect(button.querySelector('.pn-IconButton-icon')).toHaveAttribute('aria-hidden', 'true')
  await userEvent.tab()
  await expect(button).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await expect(args.onClick).toHaveBeenCalledTimes(1)
  await userEvent.keyboard(' ')
  await expect(args.onClick).toHaveBeenCalledTimes(2)
  await userEvent.tab({ shift: true })
  await expect(button).not.toHaveFocus()
  await expect(document.activeElement).toBe(before)
}

/**
 * Hovering sets the `fill` token's background, and keeps the `edge` token's border when given;
 * pressing sets the `pressed` token's, a step past it, after the hover rule; the cursor is `pointer`.
 */
const hoverFill =
  (fill: string, pressed: string, edge?: string): Play =>
  async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: args.label })
    const hover = stateRules(button)
    const fills = hover.map((s) => s.getPropertyValue('background-color')).filter(Boolean)
    await expect(fills.at(-1)).toBe(fill)
    await expect(resolve('backgroundColor', fill)).not.toBe(
      getComputedStyle(button).backgroundColor,
    )
    await expect(hover.every((s) => !s.getPropertyValue('border-color'))).toBe(true)
    await expect(stateFill(button, ':active')).toBe(pressed)
    await expect(resolve('backgroundColor', pressed)).not.toBe(resolve('backgroundColor', fill))
    await expect(pressedAfterHover(button)).toBe(true)
    await expect(getComputedStyle(button).cursor).toBe('pointer')
    if (edge) await expect(getComputedStyle(button).borderColor).toBe(resolve('borderColor', edge))
  }

/** Tab gives the root `:focus-visible` and the ring perron.css draws; Shift+Tab leaves it. */
const focusRing: Play = async ({ args, canvasElement }) => {
  const button = within(canvasElement).getByRole('button', { name: args.label })
  await userEvent.tab()
  await expect(button).toHaveFocus()
  await expect(button.matches(':focus-visible')).toBe(true)
  const ring = getComputedStyle(button)
  await expect(ring.outlineStyle).toBe('solid')
  await expect(ring.outlineColor).toBe(resolve('borderColor', 'var(--perron-color-border-focus)'))
  await expect(ring.outlineWidth).toBe(resolve('outlineWidth', 'var(--perron-focus-width)'))
  await expect(ring.outlineOffset).toBe(resolve('outlineOffset', 'var(--perron-focus-offset)'))
  await userEvent.tab({ shift: true })
  await expect(button).not.toHaveFocus()
}

/** The button has `disabled` and `data-disabled`, Tab skips it, and a click fires no `onClick`. */
const disabledSkipped: Play = async ({ args, canvasElement }) => {
  const button = within(canvasElement).getByRole('button', { name: args.label })
  await expect(button).toBeDisabled()
  await expect(button).toHaveAttribute('data-disabled')
  await userEvent.tab()
  await expect(button).not.toHaveFocus()
  await userEvent.click(button, { pointerEventsCheck: 0 })
  await expect(args.onClick).not.toHaveBeenCalled()
}

/** The root is a `size.control` square, as in `medium`, and the icon renders at `icon.size.450`. */
const largeSquare: Play = async ({ args, canvasElement }) => {
  const button = within(canvasElement).getByRole('button', { name: args.label })
  const control = Number.parseFloat(resolve('width', 'var(--perron-size-control)'))
  const box = button.getBoundingClientRect()
  await expect(box.width).toBe(control)
  await expect(box.height).toBe(control)
  const svg = button.querySelector('svg')!.getBoundingClientRect()
  const step = Number.parseFloat(resolve('width', 'var(--perron-icon-size-450)'))
  await expect(svg.width).toBe(step)
  await expect(svg.height).toBe(step)
}

/** The disabled brand button has the `color.surface.inset` fill and a transparent edge. */
const brandDisabled: Play = async ({ args, canvasElement }) => {
  const button = within(canvasElement).getByRole('button', { name: args.label })
  const style = getComputedStyle(button)
  await expect(style.backgroundColor).toBe(
    resolve('backgroundColor', 'var(--perron-color-surface-inset)'),
  )
  await expect(style.borderColor).toBe(resolve('borderColor', 'transparent'))
}

export const NeutralMediumDefault: Story = {
  args: { color: 'neutral', size: 'medium', onClick: fn() },
  play: activates,
}
export const NeutralMediumHover: Story = {
  args: { color: 'neutral', size: 'medium' },
  play: hoverFill('var(--perron-color-surface-hover)', 'var(--perron-color-surface-selected)'),
}
export const NeutralMediumFocus: Story = {
  args: { color: 'neutral', size: 'medium' },
  play: focusRing,
}
export const NeutralMediumDisabled: Story = {
  args: { color: 'neutral', size: 'medium', disabled: true, onClick: fn() },
  play: disabledSkipped,
}
export const NeutralLargeDefault: Story = {
  args: { ...help, color: 'neutral', size: 'large' },
  play: largeSquare,
}
export const NeutralLargeHover: Story = {
  args: { ...help, color: 'neutral', size: 'large' },
}
export const NeutralLargeFocus: Story = {
  args: { ...help, color: 'neutral', size: 'large' },
}
export const NeutralLargeDisabled: Story = {
  args: { ...help, color: 'neutral', size: 'large', disabled: true },
}
export const BrandMediumDefault: Story = {
  args: { color: 'brand', size: 'medium' },
}
export const BrandMediumHover: Story = {
  args: { color: 'brand', size: 'medium' },
  play: hoverFill(
    'var(--perron-color-surface-brand-hover)',
    'var(--perron-color-surface-brand-pressed)',
    'var(--perron-color-border-brand)',
  ),
}
export const BrandMediumFocus: Story = {
  args: { color: 'brand', size: 'medium' },
}
export const BrandMediumDisabled: Story = {
  args: { color: 'brand', size: 'medium', disabled: true },
  play: brandDisabled,
}
export const BrandLargeDefault: Story = {
  args: { ...help, color: 'brand', size: 'large' },
}
export const BrandLargeHover: Story = {
  args: { ...help, color: 'brand', size: 'large' },
}
export const BrandLargeFocus: Story = {
  args: { ...help, color: 'brand', size: 'large' },
}
export const BrandLargeDisabled: Story = {
  args: { ...help, color: 'brand', size: 'large', disabled: true },
}
