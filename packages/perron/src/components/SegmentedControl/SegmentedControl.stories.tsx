// SegmentedControl's stories: the control, then the segment in each state of the deferred design,
// each in a control of its own, as Base UI's Toggle needs (CR-2), then a disabled control, a
// controlled one and a narrow one. Hover and focus render at rest; the visual check drives them,
// and their play tests check them.
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { Segment, SegmentedControl, type SegmentedControlProps } from './SegmentedControl.tsx'

/** The value a token renders as here, read from a probe that sets it on `property`. */
function rendered(token: string, property = 'color') {
  const probe = document.createElement('div')
  probe.style.setProperty(property, `var(--perron-${token})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return value
}

/**
 * What the `(hover: hover)` rules set `property` to when `element` is hovered, as written. A
 * synthetic pointer doesn't reach `:hover`, so this reads the rule the real pointer would apply.
 */
function onHover(element: Element, property: string) {
  let value = ''
  for (const sheet of Array.from(document.styleSheets))
    for (const rule of Array.from(sheet.cssRules))
      if (rule instanceof CSSMediaRule && rule.conditionText.includes('hover: hover'))
        for (const inner of Array.from(rule.cssRules))
          if (
            inner instanceof CSSStyleRule &&
            inner.selectorText.includes(':hover') &&
            element.matches(inner.selectorText.replaceAll(':hover', ''))
          )
            value = inner.style.getPropertyValue(property) || value
  return value
}

/** The spy every story's control reports to; a play that asserts on it clears it first. */
const onChange = fn()

/** A stop's departures by mode: four segments, "All" first. */
const modes = (
  <>
    <Segment value="all">All</Segment>
    <Segment value="bus">Bus</Segment>
    <Segment value="s-tog">S-tog</Segment>
    <Segment value="metro">Metro</Segment>
  </>
)

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  args: { 'aria-label': 'Mode', defaultValue: 'all', children: modes, onChange },
} satisfies Meta<typeof SegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

/** The control: four segments, "All" selected. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const canvas = within(canvasElement)
    const segment = (name: string) => canvas.getByRole('button', { name })
    await userEvent.tab()
    await expect(segment('All')).toHaveFocus()
    await expect(segment('All')).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard('{ArrowRight}')
    await expect(segment('Bus')).toHaveFocus()
    await expect(segment('Bus')).toHaveAttribute('aria-pressed', 'false')
    await expect(onChange).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    await expect(segment('Bus')).toHaveAttribute('aria-pressed', 'true')
    await expect(segment('All')).toHaveAttribute('aria-pressed', 'false')
    await expect(onChange).toHaveBeenCalledTimes(1)
    await expect(onChange).toHaveBeenCalledWith(
      expect.any(Event),
      'bus',
      expect.objectContaining({ reason: 'none' }),
    )
    // pressing the selected segment again keeps it selected, and calls nothing (CR-4)
    await userEvent.keyboard('{Enter}')
    await expect(segment('Bus')).toHaveAttribute('aria-pressed', 'true')
    await expect(onChange).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{End}')
    await expect(segment('Metro')).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect(segment('All')).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(segment('Metro')).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** Three segments, "All" selected, with the state under test on "Bus". */
const threeModes = (bus: { disabled?: boolean } = {}) => (
  <>
    <Segment value="all">All</Segment>
    <Segment value="bus" {...bus}>
      Bus
    </Segment>
    <Segment value="metro">Metro</Segment>
  </>
)

/** A segment at rest, not selected: "Bus", beside the selected "All". */
export const SegmentDefault: Story = {
  args: { children: threeModes() },
}

/** A segment, hovered by the visual check. */
export const SegmentHover: Story = {
  args: { children: threeModes() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bus = canvas.getByRole('button', { name: 'Bus' })
    const all = canvas.getByRole('button', { name: 'All' })
    await expect(getComputedStyle(bus).color).toBe(rendered('color-text-secondary'))
    await expect(onHover(bus, 'background-color')).toBe('var(--perron-color-surface-hover)')
    await expect(onHover(bus, 'color')).toBe('var(--perron-color-text-primary)')
    // the selected segment takes no hover layer
    await expect(onHover(all, 'background-color')).toBe('')
    await expect(getComputedStyle(all).backgroundColor).toBe(
      rendered('color-surface-raised', 'background-color'),
    )
  },
}

/** A segment, focused by the visual check. */
export const SegmentFocus: Story = {
  args: { children: threeModes() },
  play: async ({ canvasElement }) => {
    const bus = within(canvasElement).getByRole('button', { name: 'Bus' })
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    await expect(bus).toHaveFocus()
    await expect(bus.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(bus)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(rendered('color-border-focus'))
    await expect(ring.outlineWidth).toBe(rendered('focus-width', 'outline-width'))
    await expect(ring.outlineOffset).toBe(rendered('focus-offset', 'outline-offset'))
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** A segment, selected: "Bus", raised with `shadow.thumb`. */
export const SegmentSelected: Story = {
  args: { defaultValue: 'bus', children: threeModes() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bus = canvas.getByRole('button', { name: 'Bus' })
    await expect(bus).toHaveAttribute('aria-pressed', 'true')
    await expect(bus).toHaveAttribute('data-pressed')
    const style = getComputedStyle(bus)
    await expect(style.backgroundColor).toBe(rendered('color-surface-raised', 'background-color'))
    await expect(style.boxShadow).toBe(rendered('shadow-thumb', 'box-shadow'))
    await expect(style.color).toBe(rendered('color-text-primary'))
    for (const name of ['All', 'Metro'])
      await expect(canvas.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false')
  },
}

/** A segment, disabled: out of the tab and arrow-key order, and deaf to clicks. */
export const SegmentDisabled: Story = {
  args: { children: threeModes({ disabled: true }) },
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const canvas = within(canvasElement)
    const bus = canvas.getByRole('button', { name: 'Bus' })
    await expect(bus).toBeDisabled()
    await expect(bus).toHaveAttribute('data-disabled')
    await expect(getComputedStyle(bus).color).toBe(rendered('color-text-tertiary'))
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'All' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('button', { name: 'Metro' })).toHaveFocus()
    await userEvent.click(bus, { pointerEventsCheck: 0 })
    await expect(bus).toHaveAttribute('aria-pressed', 'false')
    await expect(onChange).not.toHaveBeenCalled()
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** The whole control disabled: "All" still raised, every label tertiary. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const segments = canvas.getAllByRole('button')
    for (const segment of segments) {
      await expect(segment).toBeDisabled()
      await expect(getComputedStyle(segment).color).toBe(rendered('color-text-tertiary'))
    }
    await userEvent.tab()
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
    const all = canvas.getByRole('button', { name: 'All' })
    await expect(all).toHaveAttribute('aria-pressed', 'true')
    await expect(getComputedStyle(all).backgroundColor).toBe(
      rendered('color-surface-raised', 'background-color'),
    )
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

/**
 * A caller that keeps the value in its own state and sets it from `onChange`, unless the story's
 * `onChange` spy returns `false`, which stands for a caller that turns the change down; and a
 * button outside the control that sets the value too.
 */
function ControlledSegmentedControl(args: SegmentedControlProps) {
  const [value, setValue] = useState('all')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 16 }}>
      <SegmentedControl
        {...args}
        defaultValue={undefined}
        value={value}
        onChange={(event, next, details) => {
          if (onChange(event, next, details) !== false) setValue(next)
        }}
      />
      <Button variant="outline" size="small" onClick={() => setValue('bus')}>
        Show buses
      </Button>
    </div>
  )
}

/** A control given `value` and `onChange` from the story's state. */
export const Controlled: Story = {
  render: (args) => <ControlledSegmentedControl {...args} />,
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const canvas = within(canvasElement)
    const segment = (name: string) => canvas.getByRole('button', { name })
    onChange.mockReturnValueOnce(false)
    await userEvent.click(segment('Metro'))
    await expect(onChange).toHaveBeenCalledWith(
      expect.any(Event),
      'metro',
      expect.objectContaining({ reason: 'none' }),
    )
    // the change turned down: the value, and so the raised fill, stays
    await expect(segment('Metro')).toHaveAttribute('aria-pressed', 'false')
    await expect(segment('All')).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(segment('Metro'))
    await expect(segment('Metro')).toHaveAttribute('aria-pressed', 'true')
    await expect(segment('All')).toHaveAttribute('aria-pressed', 'false')
    const show = segment('Show buses')
    await userEvent.click(show)
    await expect(segment('Bus')).toHaveAttribute('aria-pressed', 'true')
    await expect(segment('Metro')).toHaveAttribute('aria-pressed', 'false')
    await expect(getComputedStyle(segment('Bus')).backgroundColor).toBe(
      rendered('color-surface-raised', 'background-color'),
    )
    show.blur()
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** Three long labels in a 320 px wide container: they wrap inside their segments, and nothing scrolls. */
export const LongLabels: Story = {
  args: {
    defaultValue: 'planned-works',
    children: (
      <>
        <Segment value="planned-works">Planned works</Segment>
        <Segment value="data-feed">Data feed problems</Segment>
        <Segment value="diversions">Omkørsler</Segment>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 320 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const control = canvas.getByRole('group', { name: 'Mode' })
    const container = control.parentElement!
    await expect(control.getBoundingClientRect().width).toBeLessThanOrEqual(
      container.getBoundingClientRect().width,
    )
    await expect(container.scrollWidth).toBe(container.clientWidth)
    await expect(control.scrollWidth).toBe(control.clientWidth)
    const longest = canvas.getByRole('button', { name: 'Data feed problems' })
    await expect(longest.getBoundingClientRect().height).toBeGreaterThan(
      parseFloat(rendered('size-segment', 'height')),
    )
  },
}
