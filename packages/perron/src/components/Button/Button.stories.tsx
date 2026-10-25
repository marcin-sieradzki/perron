// Button's stories: one per variant of the deferred design, named as the spec's Stories table names
// them, then a toggle off and on in every variant and colour, and the play tests it asks for.
// Hover, pressed and focus render at rest; the visual stage drives them.
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import plus from '../../../icons/plus.svg?raw'
import search from '../../../icons/search.svg?raw'
import {
  forcedColourSheet,
  icon,
  pressedAfterHover,
  resolve,
  stateFill,
  stateRules,
} from '../../testing/stories.ts'
import { Button, type ButtonProps } from './Button.tsx'

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Show departures' },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>
type Play = NonNullable<Story['play']>

/**
 * A plain button is no toggle: it has no `aria-pressed` and no `data-selected`. Tab focuses it,
 * Enter and Space each fire `onClick` once, Shift+Tab returns focus.
 */
const activates: Play = async ({ args, canvasElement }) => {
  const button = within(canvasElement).getByRole('button', { name: 'Show departures' })
  await expect(button).not.toHaveAttribute('aria-pressed')
  await expect(button).not.toHaveAttribute('data-selected')
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
    // pressed changes the fill alone, so nothing moves (CR-3) and the brand edge stays (CR-10)
    for (const declarations of stateRules(button, ':active'))
      for (const property of Array.from(declarations))
        await expect(['background-color']).toContain(property)
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

/** The tokens a toggle's look takes, as `var()`s: its rest fill, edge and ink, its hover and press. */
interface Look {
  fill: string
  edge: string
  ink: string
  hover: string
  press: string
}

const v = (token: string) => `var(--perron-${token})`

/** Off: the colour's outline look, whatever the variant. */
const OFF: Record<'neutral' | 'brand', Look> = {
  neutral: {
    fill: 'transparent',
    edge: v('color-border-control'),
    ink: v('color-text-primary'),
    hover: v('color-surface-hover'),
    press: v('color-surface-selected'),
  },
  brand: {
    fill: 'transparent',
    edge: v('color-border-brand'),
    ink: v('color-text-brand'),
    hover: v('color-surface-hover'),
    press: v('color-surface-selected'),
  },
}

/** On: the colour's solid look, whatever the variant. */
const ON: Record<'neutral' | 'brand', Look> = {
  neutral: {
    fill: v('color-surface-inverse'),
    edge: 'transparent',
    ink: v('color-text-inverse'),
    hover: v('color-surface-inverse-hover'),
    press: v('color-surface-inverse-pressed'),
  },
  brand: {
    fill: v('color-surface-brand'),
    edge: v('color-border-brand'),
    ink: v('color-text-on-color-dark'),
    hover: v('color-surface-brand-hover'),
    press: v('color-surface-brand-pressed'),
  },
}

/**
 * A toggle off ("Follow") or on ("Following"): `aria-pressed` says the state and the label names
 * the button, `data-selected` is set only while on, and `data-variant` keeps the prop's value. It
 * draws `look` at rest, takes its hover fill and its press fill a step past it, written after the
 * hover rule, and keeps its edge on both. A click fires `onClick` once and leaves the state alone,
 * since the caller keeps it.
 */
const toggles =
  (on: boolean, look: Look): Play =>
  async ({ args, canvasElement }) => {
    const name = on ? 'Following' : 'Follow'
    const button = within(canvasElement).getByRole('button', { name, pressed: on })
    await expect(button).toHaveAttribute('aria-pressed', String(on))
    await expect(button).toHaveAccessibleName(name)
    await expect(button.hasAttribute('data-selected')).toBe(on)
    await expect(button).toHaveAttribute('data-variant', args.variant)
    const style = getComputedStyle(button)
    await expect(style.backgroundColor).toBe(resolve('backgroundColor', look.fill))
    await expect(style.borderColor).toBe(resolve('borderColor', look.edge))
    await expect(style.color).toBe(resolve('color', look.ink))
    await expect(stateFill(button)).toBe(look.hover)
    await expect(stateFill(button, ':active')).toBe(look.press)
    await expect(pressedAfterHover(button)).toBe(true)
    await expect(resolve('backgroundColor', look.press)).not.toBe(
      resolve('backgroundColor', look.hover),
    )
    for (const declarations of [...stateRules(button), ...stateRules(button, ':active')])
      for (const property of Array.from(declarations))
        await expect(['background-color']).toContain(property)
    await expect(style.cursor).toBe('pointer')
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledTimes(1)
    await expect(button).toHaveAttribute('aria-pressed', String(on))
    button.blur()
  }

/** The args of a toggle story: medium, labelled as Follow is, with `onClick` spied on. */
const toggle = (
  variant: 'solid' | 'outline',
  color: 'neutral' | 'brand',
  on: boolean,
): Story['args'] => ({
  variant,
  color,
  size: 'medium',
  selected: on,
  children: on ? 'Following' : 'Follow',
  onClick: fn(),
})

export const SolidNeutralToggleOff: Story = {
  args: toggle('solid', 'neutral', false),
  play: toggles(false, OFF.neutral),
}
export const SolidNeutralToggleOn: Story = {
  args: toggle('solid', 'neutral', true),
  play: async (context) => {
    await toggles(true, ON.neutral)(context)
    // CR-16: in forced colours, a toggle that is on keeps a Highlight fill, so it still shows on
    const button = within(context.canvasElement).getByRole('button', { name: 'Following' })
    const sheet = forcedColourSheet('pn-Button')
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    try {
      const style = getComputedStyle(button)
      await expect(style.backgroundColor).toBe(resolve('backgroundColor', 'Highlight'))
      await expect(style.color).toBe(resolve('color', 'HighlightText'))
    } finally {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet)
    }
  },
}
export const SolidBrandToggleOff: Story = {
  args: toggle('solid', 'brand', false),
  play: toggles(false, OFF.brand),
}
export const SolidBrandToggleOn: Story = {
  args: toggle('solid', 'brand', true),
  play: toggles(true, ON.brand),
}
export const OutlineNeutralToggleOff: Story = {
  args: toggle('outline', 'neutral', false),
  play: toggles(false, OFF.neutral),
}
export const OutlineNeutralToggleOn: Story = {
  args: toggle('outline', 'neutral', true),
  play: toggles(true, ON.neutral),
}
export const OutlineBrandToggleOff: Story = {
  args: toggle('outline', 'brand', false),
  play: toggles(false, OFF.brand),
}
export const OutlineBrandToggleOn: Story = {
  args: toggle('outline', 'brand', true),
  play: toggles(true, ON.brand),
}

/**
 * A disabled toggle, off and on: each keeps its `aria-pressed` and takes the disabled look of the
 * variant it is drawn as, off the outline's and on the solid's, whatever its own variant.
 */
export const ToggleDisabled: Story = {
  args: { variant: 'solid', color: 'brand', size: 'medium', disabled: true },
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--perron-space-200)' }}>
      <Button {...args} selected={false}>
        Follow
      </Button>
      <Button {...args} selected>
        Following
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const off = canvas.getByRole('button', { name: 'Follow', pressed: false })
    const on = canvas.getByRole('button', { name: 'Following', pressed: true })
    for (const button of [off, on]) {
      await expect(button).toBeDisabled()
      await expect(getComputedStyle(button).color).toBe(resolve('color', v('color-text-tertiary')))
    }
    await expect(getComputedStyle(off).backgroundColor).toBe(
      resolve('backgroundColor', 'transparent'),
    )
    await expect(getComputedStyle(off).borderColor).toBe(
      resolve('borderColor', v('color-border-subtle')),
    )
    await expect(getComputedStyle(on).backgroundColor).toBe(
      resolve('backgroundColor', v('color-surface-inset')),
    )
    await expect(getComputedStyle(on).borderColor).toBe(resolve('borderColor', 'transparent'))
  },
}

/** Follow as a screen keeps it: the caller's state, flipped in `onClick`, and the label with it. */
function Follow(props: ButtonProps) {
  const [following, setFollowing] = useState(false)
  return (
    <Button {...props} selected={following} onClick={() => setFollowing((was) => !was)}>
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}

/**
 * A Follow toggle the story keeps the state of: a click, Enter and Space each turn it on or off,
 * and `aria-pressed` and the accessible name change with it.
 */
export const FollowToggle: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'medium' },
  render: (args) => <Follow {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Follow', pressed: false })
    await userEvent.click(button)
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toHaveAccessibleName('Following')
    await expect(button).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect(button).toHaveAccessibleName('Follow')
    await userEvent.keyboard('{Enter}')
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toHaveAccessibleName('Following')
    button.blur()
  },
}
