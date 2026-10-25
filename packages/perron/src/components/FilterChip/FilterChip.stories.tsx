// FilterChip's stories: one per variant of the deferred design, named as the spec's Stories table
// names them, then the selected chip disabled, a controlled chip, a chip with words only and a row
// that wraps. Hover and focus render at rest; the visual check drives them, and their play tests
// check them.
import { createRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import calendar from '../../../icons/calendar.svg?raw'
import diversion from '../../../icons/diversion.svg?raw'
import warning from '../../../icons/warning.svg?raw'
import { mounted } from '../../testing/stories.ts'
import { FilterChip, type FilterChipProps } from './FilterChip.tsx'

/** An icon file from packages/perron/icons, inline, sized by `.perron-icon`. */
const icon = (svg: string) => (
  <span
    style={{ display: 'contents' }}
    dangerouslySetInnerHTML={{ __html: svg.replace('<svg ', '<svg class="perron-icon" ') }}
  />
)

const meta = {
  title: 'Components/FilterChip',
  component: FilterChip,
  args: { children: 'Delays', startIcon: icon(warning), count: 3, onChange: fn() },
} satisfies Meta<typeof FilterChip>

export default meta

type Story = StoryObj<typeof meta>

/** A value as it renders, through a probe that reads it as `property`. */
function resolve(
  property: 'backgroundColor' | 'borderColor' | 'outlineWidth' | 'outlineOffset' | 'blockSize',
  value: string,
) {
  const probe = document.createElement('span')
  probe.style.display = 'block'
  probe.style.borderStyle = 'solid'
  probe.style.outlineStyle = 'solid'
  probe.style[property] = value
  document.body.append(probe)
  const rendered = getComputedStyle(probe)[property]
  probe.remove()
  return rendered
}

/**
 * The declarations hovering `element` adds: each rule inside `(hover: hover)` whose selector,
 * without `:hover`, matches it. A script's events can't set `:hover`, so this reads the rule the
 * pointer triggers; the visual check hovers for real.
 */
function hoverRules(element: Element) {
  const found: CSSStyleDeclaration[] = []
  const visit = (rules: CSSRuleList, inQuery: boolean) => {
    for (const rule of Array.from(rules))
      if (rule instanceof CSSMediaRule)
        visit(rule.cssRules, inQuery || rule.conditionText.includes('(hover: hover)'))
      else if (
        rule instanceof CSSStyleRule &&
        inQuery &&
        rule.selectorText.includes(':hover') &&
        element.matches(rule.selectorText.replaceAll(':hover', ''))
      )
        found.push(rule.style)
  }
  for (const sheet of Array.from(document.styleSheets)) visit(sheet.cssRules, false)
  return found
}

/** The background hovering `element` sets, as written: the last `(hover: hover)` rule's. */
const hoverFill = (element: Element) =>
  hoverRules(element)
    .map((s) => s.getPropertyValue('background-color'))
    .filter(Boolean)
    .at(-1)

/** The chip in `canvasElement`, by its name. */
const chip = (canvasElement: HTMLElement, name = 'Delays 3') =>
  within(canvasElement).getByRole('button', { name })

/** Off, at rest: the warning icon, "Delays" and a count of 3; the subject story. */
export const Default: Story = {
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
}

/** Off, hovered by the visual check. */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const root = chip(canvasElement)
    await expect(hoverFill(root)).toBe('var(--perron-color-surface-hover)')
    await expect(resolve('backgroundColor', 'var(--perron-color-surface-hover)')).not.toBe(
      getComputedStyle(root).backgroundColor,
    )
    await expect(hoverRules(root).every((s) => !s.getPropertyValue('border-color'))).toBe(true)
    await expect(getComputedStyle(root).borderColor).toBe(
      resolve('borderColor', 'var(--perron-color-border-control)'),
    )
  },
}

/** Off, focused by the visual check. */
export const Focus: Story = {
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
}

/** On, with `defaultSelected`. */
export const Selected: Story = {
  args: { defaultSelected: true },
  play: async ({ args, canvasElement }) => {
    const root = chip(canvasElement)
    await expect(root).toHaveAttribute('aria-pressed', 'true')
    await expect(root).toHaveAttribute('data-pressed')
    await expect(getComputedStyle(root).backgroundColor).toBe(
      resolve('backgroundColor', 'var(--perron-color-surface-inverse)'),
    )
    await expect(hoverFill(root)).toBe('var(--perron-color-surface-inverse-hover)')
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
}

/** Off, disabled. */
export const Disabled: Story = {
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
}

/** On and disabled. */
export const SelectedDisabled: Story = {
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
}

/**
 * A caller that keeps the state in its own `useState` and sets it from `onChange`, unless the
 * change was canceled: the story's `onChange` spy stands for the caller's own handler, and may call
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

/** A chip given `selected` and `onChange` from the story's state. */
export const Controlled: Story = {
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
  },
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
