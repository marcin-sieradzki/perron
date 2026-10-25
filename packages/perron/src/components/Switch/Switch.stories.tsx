// Switch's stories: one per State value of the deferred design, named as the spec's Stories table
// names them, then the on switch disabled, read-only, invalid in a Field, controlled, beside a long
// label and in a form. Hover and focus render at rest; the visual check drives them, and their
// play tests check them.
import { Field } from '@base-ui/react/field'
import { createRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  mounted,
  onHover,
  pressedAfterHover,
  resolve,
  stateRules,
  typography,
} from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { Switch, type SwitchProps } from './Switch.tsx'

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { 'aria-label': 'Show vehicle trails', onChange: fn() },
} satisfies Meta<typeof Switch>

export default meta

type Story = StoryObj<typeof meta>

/** The switch in `canvasElement`, by its name. */
const control = (canvasElement: HTMLElement, name = 'Show vehicle trails') =>
  within(canvasElement).getByRole('switch', { name })

/** The thumb inside a switch's root. */
const thumbOf = (root: HTMLElement) => root.querySelector<HTMLElement>('.pn-Switch-thumb')!

/** A colour token as it renders as a background, to compare with an element's computed one. */
const fill = (token: string) => resolve('backgroundColor', `var(--perron-${token})`)

/** A colour token as it renders as a border. */
const edge = (token: string) => resolve('borderColor', `var(--perron-${token})`)

/** The hover layer the off track takes, as the CSS writes it. */
const HOVER_LAYER =
  'linear-gradient(var(--perron-color-surface-hover), var(--perron-color-surface-hover))'

const defaultRef = createRef<HTMLElement>()

/** Off, at rest; the subject story. */
export const Default: Story = {
  render: (args) => <Switch {...args} ref={defaultRef} />,
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = control(canvasElement)
    await expect(root.tagName).toBe('SPAN')
    await expect(root).toHaveClass('pn-Switch')
    await expect(root).toHaveAttribute('aria-checked', 'false')
    await expect(root).toHaveAttribute('data-unchecked')
    await expect(root).toHaveAccessibleName('Show vehicle trails')
    const box = root.getBoundingClientRect()
    await expect(box.width).toBe(40)
    await expect(box.height).toBe(24)
    await expect(defaultRef.current).toBe(root)
    await userEvent.click(root)
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(root).toHaveAttribute('data-checked')
    await expect(onChange).toHaveBeenCalledTimes(1)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      true,
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(root).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(root).toHaveAttribute('aria-checked', 'false')
    await expect(onChange).toHaveBeenCalledTimes(2)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      false,
      expect.objectContaining({ reason: 'none' }),
    )
    await userEvent.keyboard('{Enter}')
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(onChange).toHaveBeenCalledTimes(3)
    await userEvent.keyboard('{Enter}')
    await expect(root).toHaveAttribute('aria-checked', 'false')
    await expect(root).toHaveAttribute('data-unchecked')
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
    const root = control(canvasElement)
    const style = getComputedStyle(root)
    await expect(style.backgroundColor).toBe(fill('color-surface-inset'))
    await expect(onHover(root, 'background-image').replace(/\s+/g, '')).toBe(
      HOVER_LAYER.replace(/\s+/g, ''),
    )
    // the edge stays the control edge: no hover rule sets it
    await expect(stateRules(root).every((s) => !s.getPropertyValue('border-color'))).toBe(true)
    await expect(style.borderColor).toBe(edge('color-border-control'))
    await expect(
      stateRules(root, ':active')
        .map((s) => s.getPropertyValue('background-image'))
        .filter((value) => value !== 'none')
        .join('')
        .replace(/\s+/g, ''),
    ).toBe(
      'linear-gradient(var(--perron-color-surface-selected),var(--perron-color-surface-selected))',
    )
    await expect(pressedAfterHover(root)).toBe(true)
  },
}

/** Off, focused by the visual check. */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const root = control(canvasElement)
    await userEvent.tab()
    await expect(root).toHaveFocus()
    await expect(root.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(root)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(edge('color-border-focus'))
    await expect(ring.outlineWidth).toBe(resolve('outlineWidth', 'var(--perron-focus-width)'))
    await expect(ring.outlineOffset).toBe(resolve('outlineOffset', 'var(--perron-focus-offset)'))
    await userEvent.tab({ shift: true })
    await expect(root).not.toHaveFocus()
  },
}

/** On, with `defaultChecked`. */
export const Checked: Story = {
  args: { defaultChecked: true },
  play: async ({ canvasElement }) => {
    const root = control(canvasElement)
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(root).toHaveAttribute('data-checked')
    await expect(getComputedStyle(root).backgroundColor).toBe(fill('color-surface-inverse'))
    await expect(getComputedStyle(root).borderColor).toBe(edge('color-surface-inverse'))
    const thumb = thumbOf(root)
    await expect(getComputedStyle(thumb).backgroundColor).toBe(fill('color-surface-raised'))
    await expect(onHover(root, 'background-color')).toBe(
      'var(--perron-color-surface-inverse-hover)',
    )
    await expect(onHover(root, 'border-color')).toBe('var(--perron-color-surface-inverse-hover)')
    // the forced-colours rules after it set a system colour, so the theme's press is read alone
    await expect(
      stateRules(root, ':active').some(
        (s) =>
          s.getPropertyValue('background-color') === 'var(--perron-color-surface-inverse-pressed)',
      ),
    ).toBe(true)
    await expect(pressedAfterHover(root)).toBe(true)
    // CR-5, CR-6: the thumb sits space.400 further along than an off switch's, at the same size
    const travel = parseFloat(resolve('blockSize', 'var(--perron-space-400)'))
    const on = thumb.getBoundingClientRect()
    const onStart = on.left - root.getBoundingClientRect().left
    await mounted(canvasElement, <Switch aria-label="Show stations" />, async (host) => {
      await waitFor(() => expect(host.querySelector('[role="switch"]')).not.toBeNull())
      const offRoot = host.querySelector<HTMLElement>('[role="switch"]')!
      const off = thumbOf(offRoot).getBoundingClientRect()
      await expect(onStart - (off.left - offRoot.getBoundingClientRect().left)).toBe(travel)
      await expect(off.width).toBe(on.width)
      await expect(off.height).toBe(on.height)
      await expect(offRoot.getBoundingClientRect().width).toBe(root.getBoundingClientRect().width)
    })
  },
}

/** Off, disabled, with a Button after it for Tab to reach. */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--perron-space-300)' }}>
      <Switch {...args} />
      <Button>Save</Button>
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = control(canvasElement)
    await expect(root).toHaveAttribute('aria-disabled', 'true')
    await expect(root).toHaveAttribute('data-disabled')
    await expect(getComputedStyle(root).borderColor).toBe(edge('color-border-subtle'))
    await expect(getComputedStyle(thumbOf(root)).backgroundColor).toBe(fill('color-text-tertiary'))
    // Tab skips the switch and lands on the Button after it
    const after = within(canvasElement).getByRole('button', { name: 'Save' })
    await userEvent.tab()
    await expect(after).toHaveFocus()
    await expect(root).not.toHaveFocus()
    after.blur()
    await userEvent.click(root, { pointerEventsCheck: 0 })
    root.focus()
    await userEvent.keyboard(' ')
    await expect(root).toHaveAttribute('aria-checked', 'false')
    await expect(onChange).not.toHaveBeenCalled()
    root.blur()
  },
}

/** On and disabled. */
export const CheckedDisabled: Story = {
  args: { defaultChecked: true, disabled: true },
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = control(canvasElement)
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(root).toHaveAttribute('data-disabled')
    await expect(getComputedStyle(root).backgroundColor).toBe(fill('color-text-tertiary'))
    await expect(getComputedStyle(thumbOf(root)).backgroundColor).toBe(fill('color-surface-raised'))
    await userEvent.click(root, { pointerEventsCheck: 0 })
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(onChange).not.toHaveBeenCalled()
  },
}

/** On and read-only. */
export const ReadOnly: Story = {
  args: { defaultChecked: true, readOnly: true },
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = control(canvasElement)
    await expect(root).toHaveAttribute('aria-readonly', 'true')
    await expect(root).toHaveAttribute('data-readonly')
    // CR-8: the rest look of an on switch, and no hover or pressed layer
    await expect(getComputedStyle(root).backgroundColor).toBe(fill('color-surface-inverse'))
    await expect(getComputedStyle(root).cursor).toBe('default')
    for (const pseudo of [':hover', ':active'] as const)
      await expect(
        stateRules(root, pseudo).every(
          (s) => !s.getPropertyValue('background-color') && !s.getPropertyValue('background-image'),
        ),
      ).toBe(true)
    await userEvent.tab()
    await expect(root).toHaveFocus()
    await userEvent.click(root)
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Enter}')
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(onChange).not.toHaveBeenCalled()
    root.blur()
  },
}

/** Off, in a Base UI Field marked invalid, named by the field's label, with its error below. */
export const Invalid: Story = {
  args: { 'aria-label': undefined },
  render: (args) => (
    <Field.Root
      invalid
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--perron-space-100)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--perron-space-200)' }}>
        <Field.Label style={typography('label')}>Use my location</Field.Label>
        <Switch {...args} />
      </div>
      <Field.Error
        match
        style={{ ...typography('caption'), color: 'var(--perron-color-text-danger)' }}
      >
        Turn this on to show the stops near you
      </Field.Error>
    </Field.Root>
  ),
  play: async ({ canvasElement }) => {
    const root = control(canvasElement, 'Use my location')
    await expect(root).toHaveAttribute('aria-invalid', 'true')
    await expect(root).toHaveAttribute('data-invalid')
    await expect(root).toHaveAttribute('aria-checked', 'false')
    await expect(getComputedStyle(root).borderColor).toBe(edge('color-status-danger'))
    await expect(getComputedStyle(root).backgroundColor).toBe(fill('color-surface-inset'))
  },
}

/**
 * A caller that keeps the state in its own `useState` and sets it from `onChange`, unless the
 * change was cancelled: the story's `onChange` spy stands for the caller's own handler.
 */
function ControlledSwitch(args: SwitchProps) {
  const [checked, setChecked] = useState(false)
  return (
    <Switch
      {...args}
      checked={checked}
      onChange={(event, next, details) => {
        args.onChange?.(event, next, details)
        if (!details.isCanceled) setChecked(next)
      }}
    />
  )
}

/** A switch given `checked` and `onChange` from the story's state. */
export const Controlled: Story = {
  render: (args) => <ControlledSwitch {...args} />,
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const root = control(canvasElement)
    // the caller sets `checked`, and only then does the switch turn on
    await userEvent.click(root)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      true,
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(root)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      false,
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(root).toHaveAttribute('aria-checked', 'false')
    root.blur()
    // a caller that ignores the change: `checked` stays false, and so does the switch
    const ignored = fn()
    await mounted(
      canvasElement,
      <Switch checked={false} onChange={ignored} aria-label="Show stations" />,
      async (host) => {
        await waitFor(() => expect(host.querySelector('[role="switch"]')).not.toBeNull())
        const off = host.querySelector<HTMLElement>('[role="switch"]')!
        await userEvent.click(off)
        await expect(ignored).toHaveBeenCalledTimes(1)
        await expect(ignored).toHaveBeenLastCalledWith(
          expect.any(Event),
          true,
          expect.objectContaining({ reason: 'none', isCanceled: false }),
        )
        await expect(off).toHaveAttribute('aria-checked', 'false')
        off.blur()
      },
    )
    // an uncontrolled switch whose handler cancels the change stays off
    const cancelling = fn((_event: Event, _checked: boolean, details: { cancel(): void }) =>
      details.cancel(),
    )
    await mounted(
      canvasElement,
      <Switch onChange={cancelling} aria-label="Show stations" />,
      async (host) => {
        await waitFor(() => expect(host.querySelector('[role="switch"]')).not.toBeNull())
        const off = host.querySelector<HTMLElement>('[role="switch"]')!
        await userEvent.click(off)
        await expect(cancelling).toHaveBeenCalledTimes(1)
        await expect(off).toHaveAttribute('aria-checked', 'false')
        await expect(off).toHaveAttribute('data-unchecked')
        off.blur()
      },
    )
  },
}

/** A wrapping `<label>`, its long text before the switch, in a 320 px wide flex row. */
export const WithLabel: Story = {
  args: { 'aria-label': undefined },
  render: (args) => (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--perron-space-300)',
        inlineSize: 320,
        maxInlineSize: '100%',
      }}
    >
      <span style={typography('label')}>Show planned works and diversions on the map</span>
      <Switch {...args} />
    </label>
  ),
  play: async ({ args, canvasElement }) => {
    const onChange = args.onChange as ReturnType<typeof fn>
    onChange.mockClear()
    const name = 'Show planned works and diversions on the map'
    const root = control(canvasElement, name)
    await expect(root).toHaveAttribute('aria-labelledby')
    const text = within(canvasElement).getByText(name)
    // CR-5: the text wraps, and the track keeps its size
    const line = parseFloat(getComputedStyle(text).lineHeight)
    await expect(text.getBoundingClientRect().height).toBeGreaterThan(line * 1.5)
    const box = root.getBoundingClientRect()
    await expect(box.width).toBe(40)
    await expect(box.height).toBe(24)
    const row = root.parentElement!
    await expect(row.scrollWidth).toBe(row.clientWidth)
    // a click on the text turns it on
    await userEvent.click(text)
    await expect(root).toHaveAttribute('aria-checked', 'true')
    await expect(onChange).toHaveBeenCalledTimes(1)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      true,
      expect.objectContaining({ reason: 'none' }),
    )
    await userEvent.click(root)
    await expect(root).toHaveAttribute('aria-checked', 'false')
    root.blur()
  },
}

/** A native `<form>` with two switches, the second submitting "off" when it is off. */
export const InForm: Story = {
  render: (args) => (
    <form
      onSubmit={(event) => event.preventDefault()}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--perron-space-300)' }}
    >
      <Switch {...args} name="trails" />
      <Switch {...args} aria-label="Show stations" name="stations" uncheckedValue="off" />
      <Button type="submit">Save</Button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!
    const trails = control(canvasElement)
    const stations = control(canvasElement, 'Show stations')
    let data = new FormData(form)
    await expect(data.has('trails')).toBe(false)
    await expect(data.get('stations')).toBe('off')
    await userEvent.click(trails)
    await userEvent.click(stations)
    data = new FormData(form)
    await expect(data.get('trails')).toBe('on')
    await expect(data.getAll('stations')).toEqual(['on'])
    await userEvent.click(trails)
    await userEvent.click(stations)
    await expect(trails).toHaveAttribute('aria-checked', 'false')
    await expect(stations).toHaveAttribute('aria-checked', 'false')
    stations.blur()
  },
}
