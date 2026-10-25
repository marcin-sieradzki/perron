// Button's stories: one per variant of the deferred design, named as the spec's Stories table names
// them, and the play tests it asks for. Hover, pressed and focus render at rest; the visual stage
// drives them.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import plus from '../../../icons/plus.svg?raw'
import search from '../../../icons/search.svg?raw'
import { icon, pressedAfterHover, resolve, stateFill, stateRules } from '../../testing/stories.ts'
import { Button } from './Button.tsx'

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Show departures' },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>
type Play = NonNullable<Story['play']>

/** Tab focuses the button, Enter and Space each fire `onClick` once, Shift+Tab returns focus. */
const activates: Play = async ({ args, canvasElement }) => {
  const button = within(canvasElement).getByRole('button', { name: 'Show departures' })
  await userEvent.tab()
  await expect(button).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await expect(args.onClick).toHaveBeenCalledTimes(1)
  await userEvent.keyboard(' ')
  await expect(args.onClick).toHaveBeenCalledTimes(2)
  await userEvent.tab({ shift: true })
  await expect(button).not.toHaveFocus()
}

/** Hovering sets the `fill` token's background, and keeps the `edge` token's border when given. */
const hoverFill =
  (fill: string, edge?: string): Play =>
  async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show departures' })
    const hover = stateRules(button)
    const fills = hover.map((s) => s.getPropertyValue('background-color')).filter(Boolean)
    await expect(fills.at(-1)).toBe(fill)
    await expect(resolve('backgroundColor', fill)).not.toBe(
      getComputedStyle(button).backgroundColor,
    )
    await expect(hover.every((s) => !s.getPropertyValue('border-color'))).toBe(true)
    if (edge) await expect(getComputedStyle(button).borderColor).toBe(resolve('borderColor', edge))
  }

/**
 * Pressing sets the `fill` token's background, written after the hover rules so it wins under the
 * pointer, and it renders apart from both the rest and the hover fill. The cursor is `pointer`, and
 * the `edge` token's border stays when given.
 */
const pressFill =
  (fill: string, edge?: string): Play =>
  async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show departures' })
    await expect(stateFill(button, ':active')).toBe(fill)
    await expect(pressedAfterHover(button)).toBe(true)
    const pressed = resolve('backgroundColor', fill)
    await expect(pressed).not.toBe(getComputedStyle(button).backgroundColor)
    await expect(pressed).not.toBe(resolve('backgroundColor', stateFill(button)))
    await expect(
      stateRules(button, ':active').every((s) => !s.getPropertyValue('border-color')),
    ).toBe(true)
    await expect(getComputedStyle(button).cursor).toBe('pointer')
    if (edge) await expect(getComputedStyle(button).borderColor).toBe(resolve('borderColor', edge))
  }

/** Tab gives the root `:focus-visible` and the ring perron.css draws; Shift+Tab leaves it. */
const focusRing: Play = async ({ canvasElement }) => {
  const button = within(canvasElement).getByRole('button', { name: 'Show departures' })
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

/**
 * The button has `disabled` and `data-disabled`, Tab skips it, a click fires no `onClick`, and the
 * cursor is `default`.
 */
const disabledSkipped: Play = async ({ args, canvasElement }) => {
  const button = within(canvasElement).getByRole('button', { name: 'Show departures' })
  await expect(button).toBeDisabled()
  await expect(button).toHaveAttribute('data-disabled')
  await userEvent.tab()
  await expect(button).not.toHaveFocus()
  await userEvent.click(button, { pointerEventsCheck: 0 })
  await expect(args.onClick).not.toHaveBeenCalled()
  await expect(getComputedStyle(button).cursor).toBe('default')
}

export const SolidNeutralMediumDefault: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'medium', onClick: fn() },
  play: activates,
}
export const SolidNeutralMediumHover: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'medium' },
  play: hoverFill('var(--perron-color-surface-inverse-hover)'),
}
export const SolidNeutralMediumPressed: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'medium' },
  play: pressFill('var(--perron-color-surface-inverse-pressed)'),
}
export const SolidNeutralMediumFocus: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'medium' },
  play: focusRing,
}
export const SolidNeutralMediumDisabled: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'medium', disabled: true, onClick: fn() },
  play: disabledSkipped,
}
export const SolidNeutralSmallDefault: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'small' },
}
export const SolidNeutralSmallHover: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'small' },
}
export const SolidNeutralSmallPressed: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'small' },
}
export const SolidNeutralSmallFocus: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'small' },
}
export const SolidNeutralSmallDisabled: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'small', disabled: true },
}
export const SolidBrandMediumDefault: Story = {
  args: { variant: 'solid', color: 'brand', size: 'medium' },
}
export const SolidBrandMediumHover: Story = {
  args: { variant: 'solid', color: 'brand', size: 'medium' },
  play: hoverFill('var(--perron-color-surface-brand-hover)', 'var(--perron-color-border-brand)'),
}
export const SolidBrandMediumPressed: Story = {
  args: { variant: 'solid', color: 'brand', size: 'medium' },
  play: pressFill('var(--perron-color-surface-brand-pressed)', 'var(--perron-color-border-brand)'),
}
export const SolidBrandMediumFocus: Story = {
  args: { variant: 'solid', color: 'brand', size: 'medium' },
}
export const SolidBrandMediumDisabled: Story = {
  args: { variant: 'solid', color: 'brand', size: 'medium', disabled: true },
}
export const SolidBrandSmallDefault: Story = {
  args: { variant: 'solid', color: 'brand', size: 'small' },
}
export const SolidBrandSmallHover: Story = {
  args: { variant: 'solid', color: 'brand', size: 'small' },
}
export const SolidBrandSmallPressed: Story = {
  args: { variant: 'solid', color: 'brand', size: 'small' },
}
export const SolidBrandSmallFocus: Story = {
  args: { variant: 'solid', color: 'brand', size: 'small' },
}
export const SolidBrandSmallDisabled: Story = {
  args: { variant: 'solid', color: 'brand', size: 'small', disabled: true },
}
export const OutlineNeutralMediumDefault: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'medium' },
}
export const OutlineNeutralMediumHover: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'medium' },
  play: hoverFill('var(--perron-color-surface-hover)'),
}
export const OutlineNeutralMediumPressed: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'medium' },
  play: pressFill('var(--perron-color-surface-selected)'),
}
export const OutlineNeutralMediumFocus: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'medium' },
}
export const OutlineNeutralMediumDisabled: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'medium', disabled: true },
}
export const OutlineNeutralSmallDefault: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'small' },
}
export const OutlineNeutralSmallHover: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'small' },
}
export const OutlineNeutralSmallPressed: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'small' },
}
export const OutlineNeutralSmallFocus: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'small' },
}
export const OutlineNeutralSmallDisabled: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'small', disabled: true },
}
export const OutlineBrandMediumDefault: Story = {
  args: { variant: 'outline', color: 'brand', size: 'medium' },
}
export const OutlineBrandMediumHover: Story = {
  args: { variant: 'outline', color: 'brand', size: 'medium' },
  play: hoverFill('var(--perron-color-surface-hover)', 'var(--perron-color-border-brand)'),
}
export const OutlineBrandMediumPressed: Story = {
  args: { variant: 'outline', color: 'brand', size: 'medium' },
  play: pressFill('var(--perron-color-surface-selected)', 'var(--perron-color-border-brand)'),
}
export const OutlineBrandMediumFocus: Story = {
  args: { variant: 'outline', color: 'brand', size: 'medium' },
}
export const OutlineBrandMediumDisabled: Story = {
  args: { variant: 'outline', color: 'brand', size: 'medium', disabled: true },
}
export const OutlineBrandSmallDefault: Story = {
  args: { variant: 'outline', color: 'brand', size: 'small' },
}
export const OutlineBrandSmallHover: Story = {
  args: { variant: 'outline', color: 'brand', size: 'small' },
}
export const OutlineBrandSmallPressed: Story = {
  args: { variant: 'outline', color: 'brand', size: 'small' },
}
export const OutlineBrandSmallFocus: Story = {
  args: { variant: 'outline', color: 'brand', size: 'small' },
}
export const OutlineBrandSmallDisabled: Story = {
  args: { variant: 'outline', color: 'brand', size: 'small', disabled: true },
}

/** A start icon and an end icon from packages/perron/icons, hidden from screen readers. */
export const WithIcons: Story = {
  args: {
    variant: 'solid',
    color: 'neutral',
    size: 'medium',
    startIcon: icon(search),
    endIcon: icon(plus),
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show departures' })
    const icons = button.querySelectorAll('.pn-Button-startIcon, .pn-Button-endIcon')
    await expect(icons).toHaveLength(2)
    for (const span of Array.from(icons)) await expect(span).toHaveAttribute('aria-hidden', 'true')
    await expect(button).toHaveAccessibleName('Show departures')
  },
}

/** `fullWidth` in a narrow container, as a bottom sheet's main action on a phone. */
export const FullWidth: Story = {
  args: { variant: 'solid', color: 'brand', size: 'medium', fullWidth: true },
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: 320 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show departures' })
    await expect(button).toHaveAttribute('data-full-width')
    const container = button.parentElement!
    await expect(button.getBoundingClientRect().width).toBe(container.getBoundingClientRect().width)
  },
}
