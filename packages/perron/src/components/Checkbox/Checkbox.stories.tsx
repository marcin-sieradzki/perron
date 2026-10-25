// Checkbox's stories: one per variant of the deferred design, named as the spec's Stories table
// names them, then a ticked and disabled box, a read-only one, a controlled one, two in a form, a
// long Danish label and a box with no label. Hover and focus render at rest; the visual check
// drives them, and their play tests check them.
import { Field } from '@base-ui/react/field'
import { createRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { colour, mounted, onHover, resolve, stateFill, stateRules } from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { Checkbox, type CheckboxProps } from './Checkbox.tsx'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { children: 'Show planned works on the map', onChange: fn() },
} satisfies Meta<typeof Checkbox>

export default meta

type Story = StoryObj<typeof meta>

/** The checkbox in `element`, by its name. */
const checkbox = (element: HTMLElement, name = 'Show planned works on the map') =>
  within(element).getByRole('checkbox', { name })

/** The box of a checkbox: Base UI's indicator, rendered as the CheckboxIndicator part. */
const box = (root: Element) => root.querySelector<HTMLElement>('.pn-Checkbox-indicator')!

/** The mark inside a box, the tick or the dash, or null for none. */
const mark = (root: Element) => box(root).querySelector('svg')

/** The checkbox rendered apart from the story in `host`, once it has rendered. */
const inHost = (host: HTMLElement) =>
  waitFor(() => {
    const found = host.querySelector<HTMLElement>('[role="checkbox"]')
    expect(found).not.toBeNull()
    return found!
  })

/** Unticked, at rest, "Show planned works on the map"; the subject story. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = checkbox(canvasElement)
    await expect(root.tagName).toBe('SPAN')
    await expect(root).toHaveClass('pn-Checkbox')
    await expect(root).toHaveAttribute('aria-checked', 'false')
    await expect(root).toHaveAttribute('data-unchecked')
    await expect(root).toHaveAccessibleName('Show planned works on the map')
    // perron-allow(shared-parts): the play reads the class to check the box is the part; it draws nothing
    await expect(box(root)).toHaveClass('pn-Checkbox-indicator', 'pn-CheckboxIndicator')
    await expect(mark(root)).toBeNull()
    // the ref reaches the root, in a checkbox rendered apart from the story
    const ref = createRef<HTMLSpanElement>()
    await mounted(canvasElement, <Checkbox ref={ref}>Show bus routes</Checkbox>, async (host) => {
      const other = await inHost(host)
      await expect(ref.current).toBe(other)
    })
    // a click on the label ticks the box
    await userEvent.click(root.querySelector('.pn-Checkbox-label')!)
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(root).toHaveAttribute('data-checked')
    await expect(mark(root)).toHaveAttribute('aria-hidden', 'true')
    await expect(onChange).toHaveBeenCalledTimes(1)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      true,
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(root).toHaveFocus()
    // Space unticks it
    await userEvent.keyboard(' ')
    await expect(root).toHaveAttribute('aria-checked', 'false')
    await expect(mark(root)).toBeNull()
    await expect(onChange).toHaveBeenCalledTimes(2)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      false,
      expect.objectContaining({ reason: 'none' }),
    )
    // Enter never toggles
    await userEvent.keyboard('{Enter}')
    await expect(root).toHaveAttribute('aria-checked', 'false')
    await expect(onChange).toHaveBeenCalledTimes(2)
    root.blur()
  },
}

/** Unticked, hovered by the visual check. */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const indicator = box(checkbox(canvasElement))
    // the hover layer over the raised fill, and the control edge kept
    await expect(onHover(indicator, 'background-image')).toMatch(
      /^linear-gradient\(\s*var\(--perron-color-surface-hover\),\s*var\(--perron-color-surface-hover\)\s*\)$/,
    )
    await expect(getComputedStyle(indicator).backgroundColor).toBe(
      resolve('backgroundColor', 'var(--perron-color-surface-raised)'),
    )
    await expect(stateRules(indicator).every((s) => !s.getPropertyValue('border-color'))).toBe(true)
    await expect(getComputedStyle(indicator).borderColor).toBe(
      resolve('borderColor', 'var(--perron-color-border-control)'),
    )
    // pressed lays the same layer, outside (hover: hover)
    await expect(
      stateRules(indicator, ':active').some((s) =>
        s.getPropertyValue('background-image').includes('--perron-color-surface-hover'),
      ),
    ).toBe(true)
  },
}

/** Unticked, focused by the visual check. */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const root = checkbox(canvasElement)
    await userEvent.tab()
    await expect(root).toHaveFocus()
    await expect(root.matches(':focus-visible')).toBe(true)
    // the ring is perron.css's, on the root, round the box and the label together
    const ring = getComputedStyle(root)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(resolve('borderColor', 'var(--perron-color-border-focus)'))
    await expect(ring.outlineWidth).toBe(resolve('outlineWidth', 'var(--perron-focus-width)'))
    await expect(ring.outlineOffset).toBe(resolve('outlineOffset', 'var(--perron-focus-offset)'))
    await expect(root).toContainElement(box(root))
    await expect(root).toContainElement(root.querySelector<HTMLElement>('.pn-Checkbox-label'))
    await userEvent.tab({ shift: true })
    await expect(root).not.toHaveFocus()
  },
}

/** Ticked, with `defaultChecked`. */
export const Checked: Story = {
  args: { defaultChecked: true },
  play: async ({ args, canvasElement }) => {
    const root = checkbox(canvasElement)
    const indicator = box(root)
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(root).toHaveAttribute('data-checked')
    await expect(getComputedStyle(indicator).backgroundColor).toBe(
      resolve('backgroundColor', 'var(--perron-color-surface-inverse)'),
    )
    await expect(getComputedStyle(mark(root)!).color).toBe(colour('--perron-color-text-inverse'))
    await expect(stateFill(indicator)).toBe('var(--perron-color-surface-inverse-hover)')
    await expect(
      stateRules(indicator, ':active').some(
        (s) =>
          s.getPropertyValue('background-color') === 'var(--perron-color-surface-inverse-hover)',
      ),
    ).toBe(true)
    // CR-8: ticked and unticked share one box, and the label doesn't move
    const on = indicator.getBoundingClientRect()
    const onLabel = root.querySelector('.pn-Checkbox-label')!.getBoundingClientRect()
    const onRoot = root.getBoundingClientRect()
    await mounted(canvasElement, <Checkbox>{args.children}</Checkbox>, async (host) => {
      const off = await inHost(host)
      await expect(off).toHaveAttribute('aria-checked', 'false')
      const offBox = box(off).getBoundingClientRect()
      const offLabel = off.querySelector('.pn-Checkbox-label')!.getBoundingClientRect()
      const offRoot = off.getBoundingClientRect()
      await expect(offBox.width).toBe(on.width)
      await expect(offBox.height).toBe(on.height)
      await expect(offRoot.height).toBe(onRoot.height)
      await expect(offLabel.left - offRoot.left).toBe(onLabel.left - onRoot.left)
      await expect(offLabel.top - offRoot.top).toBe(onLabel.top - onRoot.top)
    })
  },
}

/** Indeterminate, "Show all lines", with `indeterminate`. */
export const Indeterminate: Story = {
  args: { indeterminate: true, children: 'Show all lines' },
  play: async ({ canvasElement }) => {
    const root = checkbox(canvasElement, 'Show all lines')
    await expect(root).toHaveAttribute('aria-checked', 'mixed')
    await expect(root).toHaveAttribute('data-indeterminate')
    await expect(root).not.toHaveAttribute('data-checked')
    // the dash, a flat line, where the tick has height
    const dash = mark(root)!
    await expect(dash).toHaveAttribute('aria-hidden', 'true')
    await expect(dash.querySelectorAll('path')).toHaveLength(1)
    await expect(dash.querySelector('path')!.getBBox().height).toBe(0)
    await mounted(
      canvasElement,
      <Checkbox defaultChecked>Show all lines</Checkbox>,
      async (host) => {
        const ticked = await inHost(host)
        await expect(mark(ticked)!.querySelector('path')!.getBBox().height).toBeGreaterThan(0)
      },
    )
    await expect(getComputedStyle(box(root)).backgroundColor).toBe(
      resolve('backgroundColor', 'var(--perron-color-surface-inverse)'),
    )
  },
}

/** Unticked, disabled. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = checkbox(canvasElement)
    await expect(root).toHaveAttribute('aria-disabled', 'true')
    await expect(root).toHaveAttribute('data-disabled')
    await expect(root.tabIndex).toBe(-1)
    await userEvent.tab()
    await expect(root).not.toHaveFocus()
    await userEvent.click(root, { pointerEventsCheck: 0 })
    await expect(root).toHaveAttribute('aria-checked', 'false')
    await expect(onChange).not.toHaveBeenCalled()
    await expect(getComputedStyle(root.querySelector('.pn-Checkbox-label')!).color).toBe(
      colour('--perron-color-text-tertiary'),
    )
    await expect(getComputedStyle(box(root)).borderColor).toBe(
      resolve('borderColor', 'var(--perron-color-border-subtle)'),
    )
    await expect(stateFill(box(root))).toBe('')
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

/** Unticked and `required`, inside a Base UI `Field.Root` with `invalid`. */
export const Invalid: Story = {
  args: { required: true },
  render: (args) => (
    <Field.Root invalid>
      <Checkbox {...args} />
    </Field.Root>
  ),
  play: async ({ canvasElement }) => {
    const root = checkbox(canvasElement)
    await expect(root).toHaveAttribute('data-invalid')
    await expect(root).toHaveAttribute('aria-invalid', 'true')
    await expect(root).toHaveAttribute('aria-required', 'true')
    await expect(getComputedStyle(box(root)).borderColor).toBe(
      resolve('borderColor', 'var(--perron-color-status-danger)'),
    )
  },
}

/** Ticked and disabled. */
export const CheckedDisabled: Story = {
  args: { defaultChecked: true, disabled: true },
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = checkbox(canvasElement)
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(root).toHaveAttribute('data-disabled')
    await expect(getComputedStyle(box(root)).backgroundColor).toBe(
      resolve('backgroundColor', 'var(--perron-color-surface-inset)'),
    )
    await expect(getComputedStyle(mark(root)!).color).toBe(colour('--perron-color-text-tertiary'))
    await expect(stateFill(box(root))).toBe('')
    await userEvent.click(root, { pointerEventsCheck: 0 })
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(onChange).not.toHaveBeenCalled()
  },
}

/** Ticked and `readOnly`. */
export const ReadOnly: Story = {
  args: { defaultChecked: true, readOnly: true },
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = checkbox(canvasElement)
    await expect(root).toHaveAttribute('aria-readonly', 'true')
    await expect(root).toHaveAttribute('data-readonly')
    await userEvent.tab()
    await expect(root).toHaveFocus()
    await userEvent.click(root)
    await userEvent.keyboard(' ')
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(onChange).not.toHaveBeenCalled()
    // no hover or press colour, and the default cursor
    await expect(stateFill(box(root))).toBe('')
    await expect(stateFill(box(root), ':active')).toBe('')
    await expect(onHover(box(root), 'background-image')).toBe('')
    await expect(getComputedStyle(root).cursor).toBe('default')
    root.blur()
  },
}

/**
 * A caller that keeps the state in its own `useState` and sets it from `onChange`, unless the
 * change was cancelled: the story's `onChange` spy stands for the caller's own handler, and may call
 * `details.cancel()`.
 */
function ControlledCheckbox(args: CheckboxProps) {
  const [checked, setChecked] = useState(false)
  return (
    <Checkbox
      {...args}
      checked={checked}
      onChange={(event, next, details) => {
        args.onChange?.(event, next, details)
        if (!details.isCanceled) setChecked(next)
      }}
    />
  )
}

/** A checkbox given `checked` and `onChange` from the story's state. */
export const Controlled: Story = {
  render: (args) => <ControlledCheckbox {...args} />,
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = checkbox(canvasElement)
    // a handler that cancels: the caller sets nothing, and the state stays
    onChange.mockImplementationOnce((_event, _checked, details) => details.cancel())
    await userEvent.click(root)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      true,
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(root).toHaveAttribute('aria-checked', 'false')
    // the caller sets `checked`, and only then does the box tick
    await userEvent.click(root)
    await expect(onChange).toHaveBeenCalledTimes(2)
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(root)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      false,
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(root).toHaveAttribute('aria-checked', 'false')
    root.blur()
    // a caller that ignores the change without cancelling it: `checked` stays false, and so does
    // the box, which follows `checked` rather than its own state
    const ignored = fn()
    await mounted(
      canvasElement,
      <Checkbox checked={false} onChange={ignored}>
        Show bus routes
      </Checkbox>,
      async (host) => {
        const off = await inHost(host)
        await userEvent.click(off)
        await expect(ignored).toHaveBeenCalledTimes(1)
        await expect(ignored).toHaveBeenLastCalledWith(
          expect.any(Event),
          true,
          expect.objectContaining({ reason: 'none', isCanceled: false }),
        )
        await expect(off).toHaveAttribute('aria-checked', 'false')
        await expect(off).not.toHaveAttribute('data-checked')
        off.blur()
      },
    )
  },
}

/** The story's submit handler, which stops the form from leaving the page. */
const onSubmit = fn((event: { preventDefault: () => void }) => event.preventDefault())

/** Two checkboxes in a `<form>`, the second ticked, with a submit button. */
export const InForm: Story = {
  render: (args) => (
    <form onSubmit={onSubmit} style={{ display: 'grid', justifyItems: 'start' }}>
      <Checkbox {...args} name="planned" />
      <Checkbox
        onChange={args.onChange}
        name="routes"
        value="bus"
        uncheckedValue="none"
        defaultChecked
      >
        Show bus routes
      </Checkbox>
      <Button type="submit">Save</Button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    onSubmit.mockClear()
    const form = canvasElement.querySelector('form')!
    const planned = checkbox(canvasElement)
    const routes = checkbox(canvasElement, 'Show bus routes')
    const data = () => new FormData(form)
    await expect(data().has('planned')).toBe(false)
    await expect(data().get('routes')).toBe('bus')
    await userEvent.click(planned)
    await expect(data().get('planned')).toBe('on')
    await userEvent.click(routes)
    await expect(data().get('routes')).toBe('none')
    // Enter clicks the form's submit button, which the story stops, and toggles nothing
    await expect(routes).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    await expect(routes).toHaveAttribute('aria-checked', 'false')
    // both as they started
    await userEvent.click(planned)
    await userEvent.click(routes)
    await expect(data().has('planned')).toBe(false)
    await expect(data().get('routes')).toBe('bus')
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

/** A 320 px container holding a long Danish label. */
export const LongLabel: Story = {
  args: {
    children: 'Vis driftsforstyrrelsesmeddelelser for alle linjer i hele hovedstadsområdet',
  },
  render: (args) => (
    <div style={{ inlineSize: 320 }}>
      <Checkbox {...args} />
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const root = checkbox(canvasElement, args.children as string)
    const label = root.querySelector<HTMLElement>('.pn-Checkbox-label')!
    const line = parseFloat(getComputedStyle(label).lineHeight)
    const text = label.getBoundingClientRect()
    // it wraps onto more than one line, and stays inside the container
    await expect(text.height).toBeGreaterThan(line)
    await expect(label.scrollWidth).toBe(label.clientWidth)
    const container = root.parentElement!
    await expect(container.scrollWidth).toBe(container.clientWidth)
    await expect(root.getBoundingClientRect().right).toBeLessThanOrEqual(
      container.getBoundingClientRect().right,
    )
    // the box stays on the first line
    await expect(box(root).getBoundingClientRect().top).toBeLessThan(text.top + line)
  },
}

/** The box alone, named by `aria-label`. */
export const WithoutLabel: Story = {
  args: { children: undefined, 'aria-label': 'Show planned works on the map' },
  play: async ({ canvasElement }) => {
    const root = checkbox(canvasElement)
    await expect(root.querySelector('.pn-Checkbox-label')).toBeNull()
    await expect(root).toHaveAccessibleName('Show planned works on the map')
    const min = parseFloat(resolve('blockSize', 'var(--perron-size-target-min)'))
    const target = root.getBoundingClientRect()
    await expect(target.height).toBeGreaterThanOrEqual(min)
    await expect(target.width).toBeGreaterThanOrEqual(min)
    await userEvent.click(root)
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(root)
    await expect(root).toHaveAttribute('aria-checked', 'false')
    root.blur()
  },
}
