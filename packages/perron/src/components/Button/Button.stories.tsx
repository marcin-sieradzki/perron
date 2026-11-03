// Button's stories: the button alone with every prop a control, its variants and colours at each
// size, disabled, its icons, full width, and the toggle it becomes given `selected`. The `play`
// tests check each look's hover and press on every button the grid shows (docs/components/README.md,
// "Stories"); the visual stage drives hover, pressed and focus itself, from the Default story.
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import plus from '../../../icons/plus.svg?raw'
import search from '../../../icons/search.svg?raw'
import { axis, Showcase, type Axis } from '../../testing/Showcase.tsx'
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
type Variant = NonNullable<ButtonProps['variant']>
type Colour = NonNullable<ButtonProps['color']>

const v = (token: string) => `var(--perron-${token})`

/** Each variant in each colour, the rows of the grids below, in the props' order. */
const LOOKS: Axis<readonly [Variant, Colour]>[] = [
  { label: 'Solid, neutral', value: ['solid', 'neutral'] },
  { label: 'Solid, brand', value: ['solid', 'brand'] },
  { label: 'Outline, neutral', value: ['outline', 'neutral'] },
  { label: 'Outline, brand', value: ['outline', 'brand'] },
]

const SIZES = axis(['medium', 'small'] as const)

/** The hover and press fills of each look, and the edge it keeps through both when it has one. */
const STEPS: Record<`${Variant}-${Colour}`, { hover: string; press: string; edge?: string }> = {
  'solid-neutral': {
    hover: v('color-surface-inverse-hover'),
    press: v('color-surface-inverse-pressed'),
  },
  'solid-brand': {
    hover: v('color-surface-brand-hover'),
    press: v('color-surface-brand-pressed'),
    edge: v('color-border-brand'),
  },
  'outline-neutral': { hover: v('color-surface-hover'), press: v('color-surface-selected') },
  'outline-brand': {
    hover: v('color-surface-hover'),
    press: v('color-surface-selected'),
    edge: v('color-border-brand'),
  },
}

/** Hovering sets the `hover` token's background, and keeps the `edge` token's border when given. */
async function expectHover(button: HTMLElement, hover: string, edge?: string) {
  const rules = stateRules(button)
  const fills = rules.map((s) => s.getPropertyValue('background-color')).filter(Boolean)
  await expect(fills.at(-1)).toBe(hover)
  await expect(resolve('backgroundColor', hover)).not.toBe(getComputedStyle(button).backgroundColor)
  await expect(rules.every((s) => !s.getPropertyValue('border-color'))).toBe(true)
  if (edge) await expect(getComputedStyle(button).borderColor).toBe(resolve('borderColor', edge))
}

/**
 * Pressing sets the `press` token's background, written after the hover rules so it wins under the
 * pointer, and it renders apart from both the rest and the hover fill. It changes the fill alone,
 * so nothing moves (CR-3) and the brand edge stays (CR-10). The cursor is `pointer`.
 */
async function expectPress(button: HTMLElement, press: string) {
  await expect(stateFill(button, ':active')).toBe(press)
  await expect(pressedAfterHover(button)).toBe(true)
  const pressed = resolve('backgroundColor', press)
  await expect(pressed).not.toBe(getComputedStyle(button).backgroundColor)
  await expect(pressed).not.toBe(resolve('backgroundColor', stateFill(button)))
  for (const declarations of stateRules(button, ':active'))
    for (const property of Array.from(declarations))
      await expect(['background-color']).toContain(property)
  await expect(getComputedStyle(button).cursor).toBe('pointer')
}

/**
 * The button alone, every prop a control. A plain button is no toggle: it has no `aria-pressed`
 * and no `data-selected`. Tab focuses it with `:focus-visible` and the ring perron.css draws, Enter
 * and Space each fire `onClick` once, and Shift+Tab returns focus.
 */
export const Default: Story = {
  args: { variant: 'solid', color: 'neutral', size: 'medium', onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show departures' })
    await expect(button).not.toHaveAttribute('aria-pressed')
    await expect(button).not.toHaveAttribute('data-selected')
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await expect(button.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(button)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(resolve('borderColor', v('color-border-focus')))
    await expect(ring.outlineWidth).toBe(resolve('outlineWidth', v('focus-width')))
    await expect(ring.outlineOffset).toBe(resolve('outlineOffset', v('focus-offset')))
    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).toHaveBeenCalledTimes(1)
    await userEvent.keyboard(' ')
    await expect(args.onClick).toHaveBeenCalledTimes(2)
    await userEvent.tab({ shift: true })
    await expect(button).not.toHaveFocus()
  },
}

/**
 * Each variant in each colour, at each size. Every button takes its look's hover fill and its
 * press fill a step past it, and keeps its brand edge through both.
 */
export const Variants: Story = {
  render: (args) => (
    <Showcase
      rows={LOOKS}
      columns={SIZES}
      render={([variant, color], size) => (
        <Button {...args} variant={variant} color={color} size={size} />
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button', { name: 'Show departures' })
    const cells = LOOKS.flatMap((look) => SIZES.map(() => look.value))
    await expect(buttons).toHaveLength(cells.length)
    for (const [i, [variant, color]] of cells.entries()) {
      const { hover, press, edge } = STEPS[`${variant}-${color}`]
      await expectHover(buttons[i], hover, edge)
      await expectPress(buttons[i], press)
      if (edge)
        await expect(getComputedStyle(buttons[i]).borderColor).toBe(resolve('borderColor', edge))
    }
  },
}

/**
 * Each variant in each colour, disabled. Each has `disabled` and `data-disabled`, Tab skips it, a
 * click fires no `onClick`, and the cursor is `default`.
 */
export const Disabled: Story = {
  args: { disabled: true, onClick: fn() },
  render: (args) => (
    <Showcase
      rows={LOOKS}
      render={([variant, color]) => <Button {...args} variant={variant} color={color} />}
    />
  ),
  play: async ({ args, canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button', { name: 'Show departures' })
    await expect(buttons).toHaveLength(LOOKS.length)
    for (const button of buttons) {
      await expect(button).toBeDisabled()
      await expect(button).toHaveAttribute('data-disabled')
      await userEvent.click(button, { pointerEventsCheck: 0 })
      await expect(getComputedStyle(button).cursor).toBe('default')
    }
    await userEvent.tab()
    for (const button of buttons) await expect(button).not.toHaveFocus()
    await expect(args.onClick).not.toHaveBeenCalled()
  },
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

/** Off: the colour's outline look, whatever the variant. */
const OFF: Record<Colour, Look> = {
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
const ON: Record<Colour, Look> = {
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

/** A toggle's columns: off and on, then each disabled. */
const TOGGLE_STATES: Axis<{ selected: boolean; disabled: boolean }>[] = [
  { label: 'Off', value: { selected: false, disabled: false } },
  { label: 'On', value: { selected: true, disabled: false } },
  { label: 'Off, disabled', value: { selected: false, disabled: true } },
  { label: 'On, disabled', value: { selected: true, disabled: true } },
]

/**
 * A toggle off or on, "Follow" either way: `aria-pressed` says the state and the label, which
 * stays the same, names the button, `data-selected` is set only while on, and `data-variant` keeps
 * the prop's value. It draws `look` at rest, takes its hover fill and its press fill a step past
 * it, written after the hover rule, and keeps its edge on both. A click fires `onClick` once and
 * leaves the state alone, since the caller keeps it.
 */
async function expectToggle(
  button: HTMLElement,
  on: boolean,
  variant: Variant,
  look: Look,
  onClick: ReturnType<typeof fn>,
) {
  await expect(button).toHaveAttribute('aria-pressed', String(on))
  await expect(button).toHaveAccessibleName('Follow')
  await expect(button.hasAttribute('data-selected')).toBe(on)
  await expect(button).toHaveAttribute('data-variant', variant)
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
  onClick.mockClear()
  await userEvent.click(button)
  await expect(onClick).toHaveBeenCalledTimes(1)
  await expect(button).toHaveAttribute('aria-pressed', String(on))
  button.blur()
}

/**
 * Given `selected`, each variant in each colour is a toggle, labelled "Follow" off and on, as the
 * vehicle detail's Follow is, since `aria-pressed` says the state. Off takes its colour's outline
 * look and on its solid look, whatever the variant. A disabled toggle keeps its `aria-pressed` and
 * takes the disabled look of the variant it is drawn as, off the outline's and on the solid's. In
 * forced colours, a toggle that is on keeps a Highlight fill, so it still shows on (CR-16).
 */
export const Toggle: Story = {
  args: { children: 'Follow', onClick: fn() },
  render: (args) => (
    <Showcase
      rows={LOOKS}
      columns={TOGGLE_STATES}
      render={([variant, color], state) => (
        <Button {...args} variant={variant} color={color} {...state} />
      )}
    />
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const buttons = canvas.getAllByRole('button', { name: 'Follow' })
    await expect(buttons).toHaveLength(LOOKS.length * TOGGLE_STATES.length)
    for (const [row, { value }] of LOOKS.entries()) {
      const [variant, color] = value
      for (const [col, { value: state }] of TOGGLE_STATES.entries()) {
        const button = buttons[row * TOGGLE_STATES.length + col]
        const look = (state.selected ? ON : OFF)[color]
        if (!state.disabled) {
          await expectToggle(
            button,
            state.selected,
            variant,
            look,
            args.onClick as ReturnType<typeof fn>,
          )
          continue
        }
        await expect(button).toBeDisabled()
        await expect(button).toHaveAttribute('aria-pressed', String(state.selected))
        const style = getComputedStyle(button)
        await expect(style.color).toBe(resolve('color', v('color-text-tertiary')))
        await expect(style.backgroundColor).toBe(
          resolve('backgroundColor', state.selected ? v('color-surface-inset') : 'transparent'),
        )
        await expect(style.borderColor).toBe(
          resolve('borderColor', state.selected ? 'transparent' : v('color-border-subtle')),
        )
      }
    }
    const sheet = forcedColourSheet('pn-Button')
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    try {
      for (const button of canvas.getAllByRole('button', { name: 'Follow', pressed: true })) {
        if ((button as HTMLButtonElement).disabled) continue
        const style = getComputedStyle(button)
        await expect(style.backgroundColor).toBe(resolve('backgroundColor', 'Highlight'))
        await expect(style.color).toBe(resolve('color', 'HighlightText'))
      }
    } finally {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet)
    }
  },
}

/**
 * Follow as a screen keeps it: the caller's state, flipped in `onClick`. The label stays "Follow",
 * since `aria-pressed` says the state and a label that changed too would say it twice.
 */
function Follow(props: ButtonProps) {
  const [following, setFollowing] = useState(false)
  return (
    <Button {...props} selected={following} onClick={() => setFollowing((was) => !was)}>
      Follow
    </Button>
  )
}

/**
 * A Follow toggle the story keeps the state of: a click, Enter and Space each turn it on or off,
 * and `aria-pressed` changes with it while the accessible name stays "Follow".
 */
export const FollowToggle: Story = {
  args: { variant: 'outline', color: 'neutral', size: 'medium' },
  render: (args) => <Follow {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Follow', pressed: false })
    await userEvent.click(button)
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toHaveAccessibleName('Follow')
    await expect(button).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect(button).toHaveAccessibleName('Follow')
    await userEvent.keyboard('{Enter}')
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toHaveAccessibleName('Follow')
    button.blur()
  },
}
