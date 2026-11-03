// FilterChip's stories: the chip alone with every prop a control, its states side by side, a label
// alone and a row, then the behaviour tests. Hover and focus are play steps, not stories.
import { createRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { showcase } from '../../testing/Showcase.tsx'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import calendar from '../../../icons/calendar.svg?raw'
import diversion from '../../../icons/diversion.svg?raw'
import warning from '../../../icons/warning.svg?raw'
import {
  icon,
  mounted,
  pressedAfterHover,
  resolve,
  stateFill,
  stateRules,
} from '../../testing/stories.ts'
import { FilterChip, type FilterChipProps } from './FilterChip.tsx'

const meta = {
  title: 'Components/FilterChip',
  component: FilterChip,
  args: { children: 'Delays', startIcon: icon(warning), count: 3, onChange: fn() },
} satisfies Meta<typeof FilterChip>

export default meta

type Story = StoryObj<typeof meta>
/** The args a story renders with: the meta's and its own. */
type StoryArgs = Parameters<NonNullable<Story['render']>>[0]

/** The chip in `canvasElement`, by its name. */
const chip = (canvasElement: HTMLElement, name = 'Delays 3') =>
  within(canvasElement).getByRole('button', { name })

/**
 * A caller that keeps the state in its own `useState` and sets it from `onChange`, unless the
 * change was cancelled: the story's `onChange` spy stands for the caller's own handler, and may call
 * `details.cancel()`.
 */
function ControlledChip(args: FilterChipProps) {
  const [selected, setSelected] = useState(false)
  return (
    <FilterChip
      {...args}
      selected={selected}
      onChange={(event, next, details) => {
        args.onChange?.(event, next, details)
        if (!details.isCanceled) setSelected(next)
      }}
    />
  )
}

/** Off, at rest: the warning icon, "Delays" and a count of 3; the subject story. */
const _default = {
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = chip(canvasElement)
    await expect(root.tagName).toBe('BUTTON')
    await expect(root).toHaveClass('pn-FilterChip')
    await expect(root).toHaveAttribute('aria-pressed', 'false')
    await expect(root).not.toHaveAttribute('data-pressed')
    await expect(root).toHaveAccessibleName('Delays 3')
    await expect(root.querySelector('.pn-FilterChip-startIcon')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    // the ref reaches the root, in a chip rendered apart from the story
    const ref = createRef<HTMLButtonElement>()
    await mounted(canvasElement, <FilterChip ref={ref}>Delays</FilterChip>, async (host) => {
      await waitFor(() => expect(host.querySelector('button')).not.toBeNull())
      await expect(ref.current).toBe(host.querySelector('button'))
    })
    await userEvent.click(root)
    await expect(root).toHaveAttribute('aria-pressed', 'true')
    await expect(root).toHaveAttribute('data-pressed')
    await expect(onChange).toHaveBeenCalledTimes(1)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      true,
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(root).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(root).toHaveAttribute('aria-pressed', 'false')
    await expect(root).not.toHaveAttribute('data-pressed')
    await expect(onChange).toHaveBeenCalledTimes(2)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      false,
      expect.objectContaining({ reason: 'none' }),
    )
    await userEvent.keyboard('{Enter}')
    await expect(root).toHaveAttribute('aria-pressed', 'true')
    await expect(root).toHaveAttribute('data-pressed')
    await expect(onChange).toHaveBeenCalledTimes(3)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      true,
      expect.objectContaining({ reason: 'none' }),
    )
    await userEvent.keyboard('{Enter}')
    await expect(root).toHaveAttribute('aria-pressed', 'false')
    await expect(root).not.toHaveAttribute('data-pressed')
    await expect(onChange).toHaveBeenCalledTimes(4)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      false,
      expect.objectContaining({ reason: 'none' }),
    )
    root.blur()
  },
} satisfies Story

/** Off, hovered by the visual check. */
const hover = {
  play: async ({ canvasElement }) => {
    const root = chip(canvasElement)
    await expect(stateFill(root)).toBe('var(--perron-color-surface-hover)')
    await expect(stateFill(root, ':active')).toBe('var(--perron-color-surface-selected)')
    await expect(pressedAfterHover(root)).toBe(true)
    await expect(getComputedStyle(root).cursor).toBe('pointer')
    await expect(resolve('backgroundColor', 'var(--perron-color-surface-hover)')).not.toBe(
      getComputedStyle(root).backgroundColor,
    )
    await expect(stateRules(root).every((s) => !s.getPropertyValue('border-color'))).toBe(true)
    await expect(getComputedStyle(root).borderColor).toBe(
      resolve('borderColor', 'var(--perron-color-border-control)'),
    )
  },
} satisfies Story

/** Off, focused by the visual check. */
const focus = {
  play: async ({ canvasElement }) => {
    const root = chip(canvasElement)
    await userEvent.tab()
    await expect(root).toHaveFocus()
    await expect(root.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(root)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(resolve('borderColor', 'var(--perron-color-border-focus)'))
    await expect(ring.outlineWidth).toBe(resolve('outlineWidth', 'var(--perron-focus-width)'))
    await expect(ring.outlineOffset).toBe(resolve('outlineOffset', 'var(--perron-focus-offset)'))
    await userEvent.tab({ shift: true })
    await expect(root).not.toHaveFocus()
  },
} satisfies Story

/** On, with `defaultSelected`. */
const selected = {
  args: { defaultSelected: true },
  play: async ({ args, canvasElement }) => {
    const root = chip(canvasElement)
    await expect(root).toHaveAttribute('aria-pressed', 'true')
    await expect(root).toHaveAttribute('data-pressed')
    await expect(getComputedStyle(root).backgroundColor).toBe(
      resolve('backgroundColor', 'var(--perron-color-surface-inverse)'),
    )
    await expect(stateFill(root)).toBe('var(--perron-color-surface-inverse-hover)')
    await expect(stateFill(root, ':active')).toBe('var(--perron-color-surface-inverse-pressed)')
    await expect(pressedAfterHover(root)).toBe(true)
    // CR-5: on and off share one box
    const on = root.getBoundingClientRect()
    await mounted(
      canvasElement,
      <FilterChip startIcon={args.startIcon} count={args.count}>
        {args.children}
      </FilterChip>,
      async (host) => {
        await waitFor(() => expect(host.querySelector('button')).not.toBeNull())
        const off = host.querySelector('button')!
        await expect(off).toHaveAttribute('aria-pressed', 'false')
        const box = off.getBoundingClientRect()
        await expect(box.height).toBe(on.height)
        await expect(box.width).toBe(on.width)
      },
    )
  },
} satisfies Story

/** Off, disabled. */
const disabled = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = chip(canvasElement)
    await expect(root).toBeDisabled()
    await expect(root).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(root).not.toHaveFocus()
    await userEvent.click(root, { pointerEventsCheck: 0 })
    await expect(root).toHaveAttribute('aria-pressed', 'false')
    await expect(onChange).not.toHaveBeenCalled()
  },
} satisfies Story

/** On and disabled. */
const selectedDisabled = {
  args: { defaultSelected: true, disabled: true },
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = chip(canvasElement)
    await expect(root).toHaveAttribute('aria-pressed', 'true')
    await expect(root).toHaveAttribute('data-pressed')
    await expect(root).toHaveAttribute('data-disabled')
    await expect(getComputedStyle(root).backgroundColor).toBe(
      resolve('backgroundColor', 'var(--perron-color-surface-inset)'),
    )
    await userEvent.click(root, { pointerEventsCheck: 0 })
    await expect(root).toHaveAttribute('aria-pressed', 'true')
    await expect(onChange).not.toHaveBeenCalled()
  },
} satisfies Story

/** Off, at rest: the warning icon, "Delays" and a count of 3, every prop a control; the subject story. Its play reads the hover rule and gives the chip the ring. */
export const Default: Story = {
  play: async (context) => {
    await hover.play(context)
    await focus.play(context)
    await _default.play(context)
  },
}

/** Each state a prop reaches, one chip apiece. */
export const States: Story = {
  parameters: {
    // a disabled chip's words are color.text.tertiary, a miss Accessibility lists by name
    // (docs/foundations/accessibility.md) and WCAG 1.4.3 exempts for an inactive control, so axe
    // leaves it out
    a11y: {
      context: {
        include: ['body'],
        exclude: ['[data-row="Disabled"]', '[data-row="Selected, disabled"]'],
      },
    },
  },
  ...showcase<StoryArgs>(
    [
      { label: 'Selected', story: selected },
      { label: 'Disabled', story: disabled },
      { label: 'Selected, disabled', story: selectedDisabled },
    ],
    (args) => <FilterChip {...args} />,
  ),
}

/** "Planned works", with no icon and no count. */
export const LabelOnly: Story = {
  args: { children: 'Planned works', startIcon: undefined, count: undefined },
  play: async ({ canvasElement }) => {
    const root = chip(canvasElement, 'Planned works')
    await expect(root.querySelector('.pn-FilterChip-startIcon')).toBeNull()
    await expect(root.querySelector('.pn-FilterChip-count')).toBeNull()
    await expect(root).toHaveAccessibleName('Planned works')
    const min = parseFloat(resolve('blockSize', 'var(--perron-size-target-min)'))
    const box = root.getBoundingClientRect()
    await expect(box.height).toBeGreaterThanOrEqual(min)
    await expect(box.width).toBeGreaterThanOrEqual(min)
    // a count that is not a finite number renders nothing, as `undefined` does
    for (const count of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])
      await mounted(
        canvasElement,
        <FilterChip count={count}>Planned works</FilterChip>,
        async (host) => {
          await waitFor(() => expect(host.querySelector('button')).not.toBeNull())
          const other = host.querySelector('button')!
          await expect(other.querySelector('.pn-FilterChip-count')).toBeNull()
          await expect(other).toHaveAccessibleName('Planned works')
        },
      )
  },
}

/** Three chips in a 320 px container that wraps, the last with a count of 0. */
export const Row: Story = {
  render: (args) => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--perron-space-200)',
        inlineSize: 320,
      }}
    >
      <FilterChip {...args} startIcon={icon(warning)} count={3}>
        Delays
      </FilterChip>
      <FilterChip {...args} startIcon={icon(diversion)} count={2}>
        Diversions
      </FilterChip>
      <FilterChip {...args} startIcon={icon(calendar)} count={0}>
        Planned works
      </FilterChip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const chips = ['Delays 3', 'Diversions 2', 'Planned works 0'].map((name) =>
      chip(canvasElement, name),
    )
    const labels = chips.map((c) => c.querySelector('.pn-FilterChip-label')!)
    // one line each: every label as tall as the one-word "Delays"
    const line = labels[0].getBoundingClientRect().height
    for (const label of labels) await expect(label.getBoundingClientRect().height).toBe(line)
    // the row wraps onto a second line rather than overflow
    await expect(chips[2].getBoundingClientRect().top).toBeGreaterThan(
      chips[0].getBoundingClientRect().bottom - 1,
    )
    const row = chips[0].parentElement!
    await expect(row.scrollWidth).toBe(row.clientWidth)
    const zero = chips[2].querySelector('.pn-FilterChip-count')
    await expect(zero).toHaveTextContent('0')
    await expect(zero).toBeVisible()
    for (const c of chips) {
      await userEvent.tab()
      await expect(c).toHaveFocus()
    }
    await userEvent.tab({ shift: true })
    await userEvent.tab({ shift: true })
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** A chip given `selected` and `onChange` from the story's state. */
export const Controlled: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => <ControlledChip {...args} />,
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = chip(canvasElement)
    // a handler that cancels: the caller sets nothing, and the state stays
    onChange.mockImplementationOnce((_event, _selected, details) => details.cancel())
    await userEvent.click(root)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      true,
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(root).toHaveAttribute('aria-pressed', 'false')
    // the caller sets `selected`, and only then does the chip turn on
    await userEvent.click(root)
    await expect(onChange).toHaveBeenCalledTimes(2)
    await expect(root).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(root)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      false,
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(root).toHaveAttribute('aria-pressed', 'false')
    root.blur()
    // a caller that ignores the change without cancelling it: `selected` stays false, and so does
    // the chip, which follows `selected` rather than its own state
    const ignored = fn()
    await mounted(
      canvasElement,
      <FilterChip selected={false} onChange={ignored}>
        Diversions
      </FilterChip>,
      async (host) => {
        await waitFor(() => expect(host.querySelector('button')).not.toBeNull())
        const off = host.querySelector('button')!
        await userEvent.click(off)
        await expect(ignored).toHaveBeenCalledTimes(1)
        await expect(ignored).toHaveBeenLastCalledWith(
          expect.any(Event),
          true,
          expect.objectContaining({ reason: 'none', isCanceled: false }),
        )
        await expect(off).toHaveAttribute('aria-pressed', 'false')
        await expect(off).not.toHaveAttribute('data-pressed')
        off.blur()
      },
    )
  },
}
