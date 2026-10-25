// NumberField's stories: the variants of the deferred design, Default, Hover, Focus, Disabled and
// Invalid, and the stories of content and behaviour the spec's Stories table names
// (docs/components/number-field.md), each in a 320 px container. Hover, focus and pressed render
// at rest; their plays drive them.
import { Form } from '@base-ui/react/form'
import { useEffect, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  colour,
  edge,
  fieldPart,
  frames,
  lines,
  mounted,
  onHover,
  pressedAfterHover,
  rendered,
  stateFill,
} from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { NumberField } from './NumberField.tsx'
import type { NumberFieldProps } from './NumberField.tsx'

const LABEL = 'Departures to show'
const DESCRIPTION = 'From 1 to 20'

const meta = {
  title: 'Components/NumberField',
  component: NumberField,
  // every word the caller gives, the bounds, the number and a handler for each event, so any
  // story renders alone
  args: {
    label: LABEL,
    description: DESCRIPTION,
    min: 1,
    max: 20,
    defaultValue: 8,
    onChange: fn(),
    onChangeCommitted: fn(),
  },
  decorators: [
    (Story) => (
      <PerronProvider locale="en">
        <div style={{ inlineSize: 320 }}>
          <Story />
        </div>
      </PerronProvider>
    ),
  ],
} satisfies Meta<typeof NumberField>

export default meta

type Story = StoryObj<typeof meta>

/** A story's mock handler, to read its calls. */
const mock = (handler: unknown) => handler as ReturnType<typeof fn>

/** The field's input, the textbox, in `scope`. */
const inputIn = (scope: HTMLElement, name: string | RegExp = LABEL) =>
  within(scope).getByRole<HTMLInputElement>('textbox', { name })

/** One of the stepper buttons in `scope`, by its name. */
const buttonIn = (scope: HTMLElement, name: string) =>
  within(scope).getByRole<HTMLButtonElement>('button', { name })

/** The box round `input`: Base UI's group. */
const groupOf = (input: HTMLElement) => input.closest<HTMLElement>('.pn-NumberField-group')!

/** The second argument of each call to a handler: the number it was given. */
const values = (handler: unknown) => mock(handler).mock.calls.map((call) => call[1])

/** The `details.reason` of each call to a handler. */
const reasons = (handler: unknown) =>
  mock(handler).mock.calls.map((call) => (call[2] as { reason: string }).reason)

/** The subject story, State default: the label, the description, and the box holding 8. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const input = inputIn(canvasElement)
    await step('the input is named by the label, described by the help, holding 8', async () => {
      await expect(input).toHaveAccessibleDescription(DESCRIPTION)
      await expect(input).toHaveAttribute('aria-roledescription', 'Number field')
      await expect(input).toHaveValue('8')
      const root = input.closest('.pn-NumberField')
      await expect(root).not.toBeNull()
      await expect(root!.parentElement).toHaveClass('pn-Field', 'pn-NumberField-field')
      await expect(fieldPart(canvasElement, 'label')).toHaveClass(
        'pn-Field-label',
        'pn-NumberField-label',
      )
      await expect(fieldPart(canvasElement, 'description')).toHaveClass(
        'pn-Field-description',
        'pn-NumberField-description',
      )
      await expect(groupOf(input)).toHaveAttribute('role', 'group')
      await expect(input).not.toHaveAttribute('aria-invalid')
    })
    await step('the buttons are named and take no tab stop', async () => {
      const decrease = buttonIn(canvasElement, 'Decrease')
      const increase = buttonIn(canvasElement, 'Increase')
      await expect(decrease).toHaveClass('pn-NumberField-decrement')
      await expect(increase).toHaveClass('pn-NumberField-increment')
      for (const button of [decrease, increase]) {
        await expect(button.tabIndex).toBe(-1)
        await expect(button).toHaveAttribute('aria-controls', input.id)
        await expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      }
    })
    const root = input.closest<HTMLElement>('.pn-NumberField')!
    const group = groupOf(input)
    await step('at first the field is filled, not focused and not touched', async () => {
      for (const element of [root, group]) {
        await expect(element).toHaveAttribute('data-filled')
        await expect(element).not.toHaveAttribute('data-focused')
        await expect(element).not.toHaveAttribute('data-touched')
      }
    })
    await step('pressing the label focuses the input, and marks the field focused', async () => {
      await userEvent.click(fieldPart(canvasElement, 'label')!)
      await expect(input).toHaveFocus()
      for (const element of [root, group]) await expect(element).toHaveAttribute('data-focused')
      input.blur()
      for (const element of [root, group])
        await waitFor(() => expect(element).not.toHaveAttribute('data-focused'))
    })
    await step('Tab focuses the input, Shift+Tab moves focus back out', async () => {
      await userEvent.tab()
      await expect(input).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(input).not.toHaveFocus()
    })
    await step('leaving the input marks the field touched', async () => {
      await expect(root).toHaveAttribute('data-touched')
      await expect(group).toHaveAttribute('data-touched')
    })
  },
}

/** State hover: the box at rest at first render; the play reads the hover rule. */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const group = groupOf(inputIn(canvasElement))
    const image = onHover(group, 'background-image')
    await expect(image).toContain('linear-gradient')
    await expect(image).toContain('var(--perron-color-surface-hover)')
    await expect(getComputedStyle(group).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
  },
}

/** State focus: the box at rest at first render; Tab gives the input focus and the box the ring. */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const input = inputIn(canvasElement)
    const group = groupOf(input)
    await userEvent.tab()
    await expect(input).toHaveFocus()
    await expect(input.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(group)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(colour('--perron-color-border-focus'))
    await expect(ring.outlineWidth).toBe(rendered('focus-width', 'outline-width'))
    await expect(ring.outlineOffset).toBe(rendered('focus-offset', 'outline-offset'))
    // the box draws the ring, the input none (CR-7)
    await expect(getComputedStyle(input).outlineStyle).toBe('none')
    await userEvent.tab({ shift: true })
    await expect(input).not.toHaveFocus()
  },
}

/** State disabled: the number, both icons, the label and the description in the tertiary ink. */
export const Disabled: Story = {
  args: { disabled: true },
  parameters: {
    // a disabled field's words are color.text.tertiary, a miss Accessibility lists by name
    // (docs/foundations/accessibility.md) and WCAG 1.4.3 exempts for an inactive control, so
    // axe's contrast rule is off for this story alone
    a11y: { options: { rules: { 'color-contrast': { enabled: false } } } },
  },
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    const group = groupOf(input)
    const buttons = [buttonIn(canvasElement, 'Decrease'), buttonIn(canvasElement, 'Increase')]
    await expect(input).toBeDisabled()
    for (const element of [group, input, fieldPart(canvasElement, 'label')!])
      await expect(element).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(input).not.toHaveFocus()
    const tertiary = colour('--perron-color-text-tertiary')
    await expect(getComputedStyle(input).color).toBe(tertiary)
    await expect(getComputedStyle(fieldPart(canvasElement, 'label')!).color).toBe(tertiary)
    await expect(getComputedStyle(fieldPart(canvasElement, 'description')!).color).toBe(tertiary)
    for (const button of buttons) {
      await expect(button).toHaveAttribute('aria-disabled', 'true')
      await expect(getComputedStyle(button.querySelector('svg')!).color).toBe(tertiary)
    }
    await expect(getComputedStyle(group).borderColor).toBe(edge('color-border-control'))
    await expect(getComputedStyle(group).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    for (const button of buttons) await userEvent.click(button, { pointerEventsCheck: 0 })
    await expect(input).toHaveValue('8')
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(args.onChangeCommitted).not.toHaveBeenCalled()
    await userEvent.tab({ shift: true })
  },
}

/** State invalid: the error "Enter a number from 1 to 20" under the box, its edge in danger. */
export const Invalid: Story = {
  args: { error: 'Enter a number from 1 to 20' },
  play: async ({ canvasElement }) => {
    const input = inputIn(canvasElement)
    const group = groupOf(input)
    const description = fieldPart(canvasElement, 'description')!
    const error = fieldPart(canvasElement, 'error')!
    await expect(error).toHaveClass('pn-Field-error', 'pn-NumberField-error')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(group).toHaveAttribute('data-invalid')
    await expect(getComputedStyle(group).borderColor).toBe(edge('color-status-danger'))
    // the help first, then the error
    await waitFor(() =>
      expect(input.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`),
    )
    await expect(input).toHaveAccessibleDescription(`${DESCRIPTION} Enter a number from 1 to 20`)
  },
}

/** The label of a field whose placeholder comes from `slotProps.input`. */
const STOPS = 'Stops to show'

/** No value, and the placeholder "Such as 8". */
export const Empty: Story = {
  args: { defaultValue: undefined, placeholder: 'Such as 8' },
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    await expect(input).toHaveValue('')
    await expect(input).toHaveAttribute('placeholder', 'Such as 8')
    const hint = getComputedStyle(input, '::placeholder')
    await expect(hint.color).toBe(colour('--perron-color-text-tertiary'))
    await expect(hint.opacity).toBe('1')
    await expect(input).toHaveAccessibleName(LABEL)
    // an empty box is not filled
    await expect(groupOf(input)).not.toHaveAttribute('data-filled')
    const start = document.activeElement
    await userEvent.tab()
    await userEvent.keyboard('{ArrowUp}')
    await expect(input).toHaveValue('1')
    await expect(values(args.onChange)).toEqual([1])
    await expect(groupOf(input)).toHaveAttribute('data-filled')
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(start)
    // without placeholder, slotProps.input's own reaches the input
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <NumberField label={STOPS} slotProps={{ input: { placeholder: 'Such as 3' } }} />
      </PerronProvider>,
      async (host) => {
        const stops = await waitFor(() => inputIn(host, STOPS))
        await expect(stops).toHaveAttribute('placeholder', 'Such as 3')
      },
    )
  },
}

/** The box holding 8, its two buttons at rest; the play drives hover, pressed and the presses. */
export const Steppers: Story = {
  play: async ({ args, canvasElement, step }) => {
    const input = inputIn(canvasElement)
    const decrease = buttonIn(canvasElement, 'Decrease')
    const increase = buttonIn(canvasElement, 'Increase')
    await step('a button at rest is the secondary ink on no fill', async () => {
      for (const button of [decrease, increase]) {
        await expect(getComputedStyle(button).color).toBe(colour('--perron-color-text-secondary'))
        await expect(getComputedStyle(button).backgroundColor).toBe('rgba(0, 0, 0, 0)')
        const box = button.getBoundingClientRect()
        const control = Number.parseFloat(rendered('size-control', 'block-size'))
        await expect(box.width).toBe(control)
        await expect(box.height).toBe(control)
      }
    })
    await step(
      'hover gives the hover fill and the primary ink; pressed the selected, in a rule after it',
      async () => {
        for (const button of [decrease, increase]) {
          await expect(onHover(button, 'background-color')).toBe(
            'var(--perron-color-surface-hover)',
          )
          await expect(onHover(button, 'color')).toBe('var(--perron-color-text-primary)')
          await expect(stateFill(button, ':active')).toBe('var(--perron-color-surface-selected)')
          await expect(pressedAfterHover(button)).toBe(true)
        }
      },
    )
    await step('a press on Increase makes it 9, and leaves focus on the input', async () => {
      await userEvent.click(increase)
      await expect(input).toHaveValue('9')
      await expect(input).toHaveFocus()
      await expect(values(args.onChange)).toEqual([9])
      await expect(reasons(args.onChange)).toEqual(['increment-press'])
      await expect(values(args.onChangeCommitted)).toEqual([9])
    })
    await step('a press on Decrease makes it 8 again', async () => {
      await userEvent.click(decrease)
      await expect(input).toHaveValue('8')
      await expect(values(args.onChange)).toEqual([9, 8])
      await expect(reasons(args.onChange)).toEqual(['increment-press', 'decrement-press'])
      await expect(values(args.onChangeCommitted)).toEqual([9, 8])
    })
    await step(
      'a held press steps again every 60 ms after 400 ms, and commits once on release',
      async () => {
        mock(args.onChange).mockClear()
        mock(args.onChangeCommitted).mockClear()
        // when each step reached onChange
        const at: number[] = []
        mock(args.onChange).mockImplementation(() => at.push(performance.now()))
        // one session, so the release lifts the button the press held down
        const user = userEvent.setup()
        await user.pointer({ keys: '[MouseLeft>]', target: increase })
        await waitFor(() => expect(at.length).toBeGreaterThanOrEqual(4), { timeout: 2000 })
        await expect(args.onChangeCommitted).not.toHaveBeenCalled()
        await user.pointer({ keys: '[/MouseLeft]', target: increase })
        const stepped = values(args.onChange) as number[]
        await expect(stepped).toEqual(stepped.map((_, index) => 9 + index))
        await expect(new Set(reasons(args.onChange))).toEqual(new Set(['increment-press']))
        // the second step waits out the 400 ms hold and the first 60 ms tick, the rest one tick
        await expect(at[1] - at[0]).toBeGreaterThanOrEqual(455)
        for (let index = 2; index < at.length; index++)
          await expect(at[index] - at[index - 1]).toBeGreaterThanOrEqual(55)
        await expect(values(args.onChangeCommitted)).toEqual([stepped.at(-1)])
        await expect(reasons(args.onChangeCommitted)).toEqual(['increment-press'])
        await expect(input).toHaveValue(String(stepped.at(-1)))
        mock(args.onChange).mockReset()
      },
    )
    await userEvent.tab({ shift: true })
    await expect(input).not.toHaveFocus()
  },
}

const MOST = 'Departures to show'
const FEWEST = 'Stops to show'

/** Two fields, one holding 20, at `max`, and one holding 1, at `min`. */
export const Bounds: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--perron-space-400)' }}>
      <NumberField {...args} label={MOST} defaultValue={20} />
      <NumberField {...args} label={FEWEST} defaultValue={1} />
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const tertiary = colour('--perron-color-text-tertiary')
    for (const [name, value, bound, other] of [
      [MOST, '20', 'Increase', 'Decrease'],
      [FEWEST, '1', 'Decrease', 'Increase'],
    ] as const) {
      const field = inputIn(canvasElement, name).closest<HTMLElement>('.pn-Field')!
      const atBound = buttonIn(field, bound)
      await expect(atBound).toHaveAttribute('aria-disabled', 'true')
      await expect(atBound).toHaveAttribute('data-disabled')
      await expect(getComputedStyle(atBound.querySelector('svg')!).color).toBe(tertiary)
      // no hover and no pressed look on a button that can't step (CR-15)
      await expect(onHover(atBound, 'background-color')).toBe('')
      await expect(stateFill(atBound, ':active')).toBe('')
      await userEvent.click(atBound, { pointerEventsCheck: 0 })
      await expect(inputIn(field, name)).toHaveValue(value)
      await expect(buttonIn(field, other)).not.toHaveAttribute('aria-disabled', 'true')
      await expect(buttonIn(field, other)).not.toHaveAttribute('data-disabled')
      inputIn(field, name).blur()
    }
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

/** The label of a second field the plays mount beside the story's. */
const UNBOUNDED = 'Stops to skip'

/** The label of a field whose `onChange` cancels every change. */
const HELD = 'Departures held'

/** The label of a field whose `min` is below zero. */
const DELAY = 'Delay in minutes'

/** The label of a field written as a percentage. */
const SHARE = 'Share of late departures'

/** The label of a field written in euros. */
const FARE = 'Fare in euros'

/** The label of a controlled field the plays mount beside the story's. */
const SET_OUTSIDE = 'Departures set elsewhere'

/** The box holding 8, with `largeStep` 5: the arrow keys, Shift, Alt, Home and End step it. */
export const Keyboard: Story = {
  args: { largeStep: 5 },
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    const start = document.activeElement
    await userEvent.tab()
    await expect(input).toHaveFocus()
    const steps = [
      ['{ArrowUp}', '9'],
      ['{ArrowDown}', '8'],
      ['{Shift>}{ArrowUp}{/Shift}', '13'],
      ['{Shift>}{ArrowDown}{/Shift}', '8'],
      ['{End}', '20'],
      // at max, ArrowUp is clamped: the number stays, and no handler is called
      ['{ArrowUp}', '20'],
      ['{Home}', '1'],
      // at min, the same for ArrowDown
      ['{ArrowDown}', '1'],
      // Alt steps by smallStep, 0.1 by default
      ['{Alt>}{ArrowUp}{/Alt}', '1.1'],
      ['{Alt>}{ArrowDown}{/Alt}', '1'],
    ] as const
    for (const [keys, shown] of steps) {
      await userEvent.keyboard(keys)
      await expect(input).toHaveValue(shown)
    }
    await expect(values(args.onChange)).toEqual([9, 8, 13, 8, 20, 1, 1.1, 1])
    await expect(new Set(reasons(args.onChange))).toEqual(new Set(['keyboard']))
    // each key step is a settled number, committed as it lands
    await expect(values(args.onChangeCommitted)).toEqual([9, 8, 13, 8, 20, 1, 1.1, 1])
    await expect(new Set(reasons(args.onChangeCommitted))).toEqual(new Set(['keyboard']))
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(start)
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <NumberField label={UNBOUNDED} defaultValue={1500} onChange={args.onChange} />
      </PerronProvider>,
      async (host) => {
        // without min and max, Home and End move the caret, as the browser's own input does
        mock(args.onChange).mockClear()
        const unbounded = await waitFor(() => inputIn(host, UNBOUNDED))
        await userEvent.click(unbounded)
        await userEvent.keyboard('{Home}')
        await expect(unbounded.selectionStart).toBe(0)
        await userEvent.keyboard('{End}')
        await expect(unbounded.selectionStart).toBe(unbounded.value.length)
        await expect(unbounded).toHaveValue('1,500')
        await expect(args.onChange).not.toHaveBeenCalled()
        // with no min, a minus sign is typed; a second decimal point is not
        await userEvent.type(unbounded, '-1.5.', {
          initialSelectionStart: 0,
          initialSelectionEnd: unbounded.value.length,
        })
        await expect(unbounded).toHaveValue('-1.5')
        await expect(values(args.onChange).at(-1)).toBe(-1.5)
        // one sign only: with the minus there, neither a plus nor a second minus is typed
        await userEvent.keyboard('+-')
        await expect(unbounded).toHaveValue('-1.5')
        // a plus sign is typed, and then no minus after it
        await userEvent.type(unbounded, '+2-', {
          initialSelectionStart: 0,
          initialSelectionEnd: unbounded.value.length,
        })
        await expect(unbounded).toHaveValue('+2')
        await expect(values(args.onChange).at(-1)).toBe(2)
        unbounded.blur()
      },
    )
    // details.cancel() keeps the number as it was (CR-4)
    const cancelled = fn()
    const committed = fn()
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <NumberField
          label={HELD}
          defaultValue={8}
          onChange={(_event, value, details) => {
            cancelled(value)
            details.cancel()
          }}
          onChangeCommitted={committed}
        />
      </PerronProvider>,
      async (host) => {
        const held = await waitFor(() => inputIn(host, HELD))
        await userEvent.click(held)
        await userEvent.keyboard('{ArrowUp}')
        await expect(cancelled).toHaveBeenCalledWith(9)
        await expect(held).toHaveValue('8')
        await expect(committed).not.toHaveBeenCalled()
        held.blur()
      },
    )
  },
}

/**
 * The box holding 8: a paste is spliced in at the caret, typing replaces the number, clamped to
 * `max`, and leaving commits it.
 */
export const Typing: Story = {
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    const start = document.activeElement
    // a paste goes in at the caret, before the 8
    await userEvent.click(input)
    input.setSelectionRange(0, 0)
    await userEvent.paste('1')
    await expect(input).toHaveValue('18')
    await expect(values(args.onChange)).toEqual([18])
    await expect(reasons(args.onChange)).toEqual(['input-paste'])
    // a paste that wouldn't parse, "two" over the whole box, isn't spliced in
    input.setSelectionRange(0, input.value.length)
    await userEvent.paste('two')
    await expect(input).toHaveValue('18')
    await expect(values(args.onChange)).toEqual([18])
    await userEvent.type(input, '25', { initialSelectionStart: 0, initialSelectionEnd: 2 })
    await expect(values(args.onChange)).toEqual([18, 2, 20])
    await expect(reasons(args.onChange)).toEqual(['input-paste', 'input-change', 'input-change'])
    const shown = input.value
    // a letter, and a minus sign while min is 0 or above, are not typed
    await userEvent.keyboard('x')
    await userEvent.keyboard('-')
    await expect(input).toHaveValue(shown)
    await expect(mock(args.onChange)).toHaveBeenCalledTimes(3)
    await userEvent.tab()
    await expect(input).toHaveValue('20')
    // the typed 25 is clamped as the box is left
    await expect(values(args.onChange)).toEqual([18, 2, 20, 20])
    await expect(reasons(args.onChange).at(-1)).toBe('input-blur')
    await expect(values(args.onChangeCommitted).at(-1)).toBe(20)
    await expect(reasons(args.onChangeCommitted).at(-1)).toBe('input-blur')
    await expect(document.activeElement).toBe(start)
    // a format that rounds: leaving writes the rounded number and commits it
    mock(args.onChange).mockClear()
    mock(args.onChangeCommitted).mockClear()
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <NumberField
          {...args}
          label={UNBOUNDED}
          defaultValue={undefined}
          format={{ maximumFractionDigits: 0 }}
        />
      </PerronProvider>,
      async (host) => {
        const rounded = await waitFor(() => inputIn(host, UNBOUNDED))
        // the number is rounded as it is typed, the text only once the box is left
        await userEvent.type(rounded, '2.6')
        await expect(rounded).toHaveValue('2.6')
        await expect(values(args.onChange).at(-1)).toBe(3)
        await expect(args.onChangeCommitted).not.toHaveBeenCalled()
        rounded.blur()
        await waitFor(() => expect(rounded).toHaveValue('3'))
        await expect(values(args.onChangeCommitted)).toEqual([3])
        await expect(reasons(args.onChangeCommitted)).toEqual(['input-blur'])
      },
    )
    // with min below zero, a minus sign is typed
    mock(args.onChange).mockClear()
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <NumberField
          label={DELAY}
          min={-10}
          max={10}
          defaultValue={undefined}
          onChange={args.onChange}
        />
      </PerronProvider>,
      async (host) => {
        const delay = await waitFor(() => inputIn(host, DELAY))
        await userEvent.type(delay, '-4')
        await expect(delay).toHaveValue('-4')
        await expect(values(args.onChange)).toEqual([-4])
        delay.blur()
      },
    )
  },
}

/** A wheel turn over the input, with the focus in it. */
const wheel = (input: HTMLElement, deltaY: number) => {
  const turn = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true })
  input.dispatchEvent(turn)
  return turn
}

/** The box holding 8, with `allowWheelScrub`: the mouse wheel steps it while the input has focus. */
export const Wheel: Story = {
  args: { allowWheelScrub: true },
  play: async ({ args, canvasElement, step }) => {
    const input = inputIn(canvasElement)
    await step('without focus, the wheel changes nothing', async () => {
      await expect(wheel(input, -100).defaultPrevented).toBe(false)
      await expect(input).toHaveValue('8')
    })
    await step('with focus, a turn up makes it 9 and a turn down 8 again', async () => {
      await userEvent.tab()
      await expect(input).toHaveFocus()
      // the page doesn't scroll under the turn
      await expect(wheel(input, -100).defaultPrevented).toBe(true)
      await waitFor(() => expect(input).toHaveValue('9'))
      wheel(input, 100)
      await waitFor(() => expect(input).toHaveValue('8'))
      await expect(values(args.onChange)).toEqual([9, 8])
      await expect(reasons(args.onChange)).toEqual(['wheel', 'wheel'])
      await expect(values(args.onChangeCommitted)).toEqual([9, 8])
      await expect(reasons(args.onChangeCommitted)).toEqual(['wheel', 'wheel'])
      await userEvent.tab({ shift: true })
    })
    await step('without allowWheelScrub, the wheel changes nothing', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="en">
          <NumberField {...args} allowWheelScrub={false} label={UNBOUNDED} />
        </PerronProvider>,
        async (host) => {
          mock(args.onChange).mockClear()
          const still = await waitFor(() => inputIn(host, UNBOUNDED))
          still.focus()
          await expect(wheel(still, -100).defaultPrevented).toBe(false)
          await expect(still).toHaveValue('8')
          await expect(args.onChange).not.toHaveBeenCalled()
          still.blur()
        },
      )
    })
  },
}

/** Base UI's hidden `<input type="number">`, which the browser's checks run on. */
const hiddenInput = (scope: HTMLElement) =>
  scope.querySelector<HTMLInputElement>('input[type="number"]')!

/**
 * The box holding 8, with `allowOutOfRange` and checked on blur: a number outside the bounds stays
 * as typed, and the browser's own checks on the hidden input mark the field invalid.
 */
export const OutOfRange: Story = {
  args: { allowOutOfRange: true, slotProps: { field: { validationMode: 'onBlur' } } },
  play: async ({ args, canvasElement, step }) => {
    const input = inputIn(canvasElement)
    const group = groupOf(input)
    const hidden = hiddenInput(canvasElement)
    const start = document.activeElement
    /** Types `text` over the whole box, leaves it, and expects the browser's message for `check`. */
    const fails = async (
      text: string,
      check: 'rangeOverflow' | 'rangeUnderflow' | 'stepMismatch',
    ) => {
      await userEvent.type(input, text, {
        initialSelectionStart: 0,
        initialSelectionEnd: input.value.length,
      })
      await userEvent.tab()
      await waitFor(() => expect(hidden.validity[check]).toBe(true))
      const error = await waitFor(() => {
        const shown = fieldPart(canvasElement, 'error')
        expect(shown).not.toBeNull()
        return shown!
      })
      await expect(error.textContent).toBe(hidden.validationMessage)
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      await expect(getComputedStyle(group).borderColor).toBe(edge('color-status-danger'))
    }
    await step('a typed 25 stays 25, and leaving shows the rangeOverflow message', async () => {
      await fails('25', 'rangeOverflow')
      await expect(input).toHaveValue('25')
      await expect(values(args.onChangeCommitted).at(-1)).toBe(25)
    })
    await step('a typed 0 shows the rangeUnderflow message', async () => {
      await fails('0', 'rangeUnderflow')
      await expect(input).toHaveValue('0')
    })
    await step('a typed 2.5, off the step of 1, shows the stepMismatch message', async () => {
      await fails('2.5', 'stepMismatch')
    })
    await step('with allowOutOfRange, a minus sign is typed: -3 shows rangeUnderflow', async () => {
      await fails('-3', 'rangeUnderflow')
      await expect(input).toHaveValue('-3')
      await expect(values(args.onChangeCommitted).at(-1)).toBe(-3)
    })
    await step('a typed 8 removes the error', async () => {
      await userEvent.type(input, '8', {
        initialSelectionStart: 0,
        initialSelectionEnd: input.value.length,
      })
      await userEvent.tab()
      await waitFor(() => expect(fieldPart(canvasElement, 'error')).toBeNull())
      await expect(input).not.toHaveAttribute('aria-invalid')
      await expect(document.activeElement).toBe(start)
    })
  },
}

/** A field labelled "Walking time", its number written with the minute unit. */
export const Units: Story = {
  args: {
    label: 'Walking time',
    description: 'From the door to the stop',
    format: { style: 'unit', unit: 'minute' },
    min: 0,
    defaultValue: 4,
  },
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement, 'Walking time')
    // a space before the unit, as content design writes it
    await expect(input).toHaveValue('4 min')
    await userEvent.tab()
    await userEvent.keyboard('{ArrowUp}')
    await expect(input).toHaveValue('5 min')
    await expect(values(args.onChange)).toEqual([5])
    // the unit the format writes is typed, and a letter outside it is not
    await userEvent.type(input, '6 minx', {
      initialSelectionStart: 0,
      initialSelectionEnd: input.value.length,
    })
    await expect(input).toHaveValue('6 min')
    await expect(values(args.onChange).at(-1)).toBe(6)
    await userEvent.tab({ shift: true })
    // a percent sign is typed once, and a second one is not
    mock(args.onChange).mockClear()
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <NumberField label={SHARE} format={{ style: 'percent' }} onChange={args.onChange} />
      </PerronProvider>,
      async (host) => {
        const share = await waitFor(() => inputIn(host, SHARE))
        await userEvent.type(share, '25%%')
        await expect(share).toHaveValue('25%')
        await expect(values(args.onChange).at(-1)).toBe(0.25)
        share.blur()
      },
    )
    // a currency symbol the same: once, and not a second time
    mock(args.onChange).mockClear()
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <NumberField
          label={FARE}
          format={{ style: 'currency', currency: 'EUR' }}
          onChange={args.onChange}
        />
      </PerronProvider>,
      async (host) => {
        const fare = await waitFor(() => inputIn(host, FARE))
        await userEvent.type(fare, '€€25')
        await expect(fare).toHaveValue('€25')
        await expect(values(args.onChange).at(-1)).toBe(25)
        fare.blur()
      },
    )
  },
}

const DANISH_LABEL = 'Gangafstand i meter'
const DANISH_DESCRIPTION = 'Fra 100 til 5.000'

/** Renders `args` in `locale` on the server, as the owned-strings check reads a render. */
const markup = (args: NumberFieldProps, locale: Locale) =>
  renderToStaticMarkup(
    <PerronProvider locale={locale}>
      <NumberField {...args} />
    </PerronProvider>,
  )

/** A field in a Danish PerronProvider: the number written as Danish writes it, "1.500". */
export const Danish: Story = {
  args: {
    label: DANISH_LABEL,
    description: DANISH_DESCRIPTION,
    min: 100,
    max: 5000,
    step: 100,
    defaultValue: 1500,
  },
  decorators: [
    (Story) => (
      <PerronProvider locale="da">
        <Story />
      </PerronProvider>
    ),
  ],
  play: async ({ args, canvasElement, step }) => {
    const da = dictionaries.da
    const input = inputIn(canvasElement, DANISH_LABEL)
    await step('the number, the buttons and the role description are Danish', async () => {
      await expect(input).toHaveValue('1.500')
      await expect(input).toHaveAttribute('aria-roledescription', da.numberField)
      await expect(buttonIn(canvasElement, da.decrease)).toBeInTheDocument()
      await expect(buttonIn(canvasElement, da.increase)).toBeInTheDocument()
    })
    await step('ArrowUp writes 1.600', async () => {
      await userEvent.tab()
      await userEvent.keyboard('{ArrowUp}')
      await expect(input).toHaveValue('1.600')
      await userEvent.tab({ shift: true })
    })
    await step('a typed "2.000" is read in Danish, as 2000', async () => {
      await userEvent.type(input, '2.000', {
        initialSelectionStart: 0,
        initialSelectionEnd: input.value.length,
      })
      await expect(values(args.onChange).at(-1)).toBe(2000)
      await userEvent.tab()
      await expect(input).toHaveValue('2.000')
      await expect(values(args.onChangeCommitted).at(-1)).toBe(2000)
    })
    await step('a given locale writes the number in its own way', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="da">
          <NumberField {...args} locale="en" defaultValue={1600} />
        </PerronProvider>,
        async (host) => {
          await waitFor(() => expect(inputIn(host, DANISH_LABEL)).toHaveValue('1,600'))
        },
      )
    })
    await step('its render says only the dictionary’s and the caller’s words', async () => {
      expectOwnedStrings(markup(args, 'da'), 'da', [DANISH_LABEL, DANISH_DESCRIPTION])
    })
  },
}

/** `optional`: the label reads "Departures to show (optional)". */
export const Optional: Story = {
  args: { optional: true },
  play: async ({ args, canvasElement, step }) => {
    await step('the mark is part of the input’s name', async () => {
      await expect(inputIn(canvasElement, 'Departures to show (optional)')).toBeInTheDocument()
    })
    await step('optionalLabel replaces the mark', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="en">
          <NumberField {...args} optionalLabel="(if wanted)" />
        </PerronProvider>,
        async (host) => {
          await waitFor(() =>
            expect(inputIn(host, 'Departures to show (if wanted)')).toBeInTheDocument(),
          )
        },
      )
    })
    await step('its render says only the dictionary’s and the caller’s words (CR-13)', async () => {
      for (const locale of ['en', 'da', 'sv', 'nb'] as const)
        expectOwnedStrings(markup(args, locale), locale, [LABEL, DESCRIPTION])
    })
  },
}

/** `hiddenLabel`: the description and the box, no label in view. */
export const HiddenLabel: Story = {
  args: { hiddenLabel: true },
  parameters: {
    // axe's label-title-only fails a control with no visible label text that has a title or an
    // aria-describedby, and here the description's aria-describedby trips it on the hidden label,
    // the point of the story; so the rule is off for it alone: the input is still named by the
    // label, through aria-labelledby
    a11y: { options: { rules: { 'label-title-only': { enabled: false } } } },
  },
  play: async ({ canvasElement }) => {
    const label = fieldPart(canvasElement, 'label')!
    await expect(label.tagName).toBe('SPAN')
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    const input = inputIn(canvasElement)
    await expect(input).toHaveAccessibleName(LABEL)
    // a press on the hidden label focuses the input, through Base UI's own handler
    await userEvent.click(label)
    await expect(input).toHaveFocus()
    input.blur()
  },
}

/** `readOnly`, holding 8: the box at rest, both icons in the tertiary ink. */
export const ReadOnly: Story = {
  args: { readOnly: true },
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    const group = groupOf(input)
    const buttons = [buttonIn(canvasElement, 'Decrease'), buttonIn(canvasElement, 'Increase')]
    await expect(input).toHaveAttribute('readonly')
    await userEvent.tab()
    await expect(input).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    await userEvent.keyboard('5')
    for (const button of buttons) await userEvent.click(button, { pointerEventsCheck: 0 })
    await expect(input).toHaveValue('8')
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(args.onChangeCommitted).not.toHaveBeenCalled()
    const tertiary = colour('--perron-color-text-tertiary')
    for (const button of buttons) {
      await expect(button).toHaveAttribute('aria-disabled', 'true')
      await expect(button).toHaveAttribute('data-readonly')
      await expect(getComputedStyle(button.querySelector('svg')!).color).toBe(tertiary)
      // no hover and no pressed look on a button that can't step (CR-15)
      await expect(onHover(button, 'background-color')).toBe('')
      await expect(stateFill(button, ':active')).toBe('')
    }
    await expect(getComputedStyle(input).color).toBe(colour('--perron-color-text-primary'))
    await expect(getComputedStyle(group).borderColor).toBe(edge('color-border-control'))
    await expect(getComputedStyle(group).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
    await userEvent.tab({ shift: true })
    await expect(input).not.toHaveFocus()
    // leaving a read-only field only marks it touched
    await expect(input.closest('.pn-NumberField')).toHaveAttribute('data-touched')
    await expect(group).toHaveAttribute('data-touched')
    await expect(input).toHaveValue('8')
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(args.onChangeCommitted).not.toHaveBeenCalled()
  },
}

/** The three owned strings overridden on one instance. */
export const Labels: Story = {
  args: {
    increaseLabel: 'More departures',
    decreaseLabel: 'Fewer departures',
    numberFieldLabel: 'Counter',
  },
  play: async ({ canvasElement }) => {
    await expect(buttonIn(canvasElement, 'Fewer departures')).toHaveClass(
      'pn-NumberField-decrement',
    )
    await expect(buttonIn(canvasElement, 'More departures')).toHaveClass('pn-NumberField-increment')
    await expect(inputIn(canvasElement)).toHaveAttribute('aria-roledescription', 'Counter')
  },
}

/**
 * The number held in the story's state, from `start`, set from each change's `value`; `expose`
 * hands a play the setter, to change the number from outside.
 */
function ControlledField({
  start = 8,
  expose,
  ...props
}: NumberFieldProps & {
  start?: number
  expose?: (set: (value: number | null) => void) => void
}) {
  const [value, setValue] = useState<number | null>(start)
  useEffect(() => expose?.(setValue), [expose])
  return (
    <NumberField
      {...props}
      defaultValue={undefined}
      value={value}
      onChange={(event, next, details) => {
        props.onChange?.(event, next, details)
        setValue(next)
      }}
    />
  )
}

/** `value` held in the story's state, starting at 8. */
export const Controlled: Story = {
  render: (args) => <ControlledField {...args} />,
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    const start = document.activeElement
    await userEvent.click(buttonIn(canvasElement, 'Increase'))
    await expect(values(args.onChange)).toEqual([9])
    await expect(input).toHaveValue('9')
    await waitFor(() => expect(groupOf(input)).toHaveAttribute('data-dirty'))
    await userEvent.clear(input)
    await expect(values(args.onChange).at(-1)).toBeNull()
    await expect(reasons(args.onChange).at(-1)).toBe('input-clear')
    await expect(input).toHaveValue('')
    await userEvent.tab()
    await expect(document.activeElement).toBe(start)
    const changed = fn()
    const committed = fn()
    // a change to value from outside while the input has focus
    let setOutside: (value: number | null) => void = () => {}
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <ControlledField
          label={SET_OUTSIDE}
          expose={(set) => (setOutside = set)}
          onChange={changed}
          onChangeCommitted={committed}
        />
      </PerronProvider>,
      async (host) => {
        const outside = await waitFor(() => inputIn(host, SET_OUTSIDE))
        await userEvent.click(outside)
        setOutside(12)
        await waitFor(() => expect(outside).toHaveValue('12'))
        outside.blur()
        await frames(2)
        await expect(changed).not.toHaveBeenCalled()
        await expect(committed).not.toHaveBeenCalled()
      },
    )
    // a format that rounds a value set from outside: leaving writes and commits the rounded number
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <ControlledField
          label={SET_OUTSIDE}
          start={2.6}
          format={{ maximumFractionDigits: 0 }}
          onChange={changed}
          onChangeCommitted={committed}
        />
      </PerronProvider>,
      async (host) => {
        const rounded = await waitFor(() => inputIn(host, SET_OUTSIDE))
        await expect(rounded).toHaveValue('3')
        await userEvent.click(rounded)
        rounded.blur()
        await waitFor(() => expect(values(committed)).toEqual([3]))
        await expect(values(changed)).toEqual([3])
        await expect(reasons(changed)).toEqual(['input-blur'])
        await expect(reasons(committed)).toEqual(['input-blur'])
        await expect(rounded).toHaveValue('3')
      },
    )
  },
}

/** The story's submit handler: it keeps the number the form submits and stays on the page. */
const onSubmit = fn((event: { preventDefault: () => void; currentTarget: HTMLFormElement }) => {
  event.preventDefault()
  return new FormData(event.currentTarget).get('departures')
})

/** With `name` "departures", inside a native `<form>` with a submit button. */
export const InForm: Story = {
  args: { name: 'departures' },
  decorators: [
    (Story) => (
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 'var(--perron-space-400)' }}>
        <Story />
        {/* the button at the start, the field as wide as the others */}
        <div>
          <Button type="submit">Save</Button>
        </div>
      </form>
    ),
  ],
  play: async ({ args, canvasElement }) => {
    onSubmit.mockClear()
    const form = canvasElement.querySelector('form')!
    const input = inputIn(canvasElement)
    await expect(new FormData(form).get('departures')).toBe('8')
    await userEvent.click(buttonIn(canvasElement, 'Increase'))
    await waitFor(() => expect(new FormData(form).get('departures')).toBe('9'))
    // Enter in the input clicks the form's submit button, and the form submits the number
    await expect(input).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    await expect(onSubmit.mock.results[0].value).toBe('9')
    await expect(input).toHaveValue('9')
    input.blur()
    // a browser autofill sets Base UI's hidden input, as the browser does, through the native
    // value setter and an `input` event; the box shows the number and onChange gets it
    mock(args.onChange).mockClear()
    mock(args.onChangeCommitted).mockClear()
    const hidden = form.querySelector<HTMLInputElement>('input[type="number"][name="departures"]')!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(hidden, '15')
    hidden.dispatchEvent(new Event('input', { bubbles: true }))
    await waitFor(() => expect(input).toHaveValue('15'))
    await expect(values(args.onChange)).toEqual([15])
    await expect(reasons(args.onChange)).toEqual(['none'])
    await expect(new FormData(form).get('departures')).toBe('15')
    await frames(2)
    await expect(args.onChangeCommitted).not.toHaveBeenCalled()
    // a form with no submit button isn't submitted on Enter: the hidden input is a second field
    const unsent = fn((event: { preventDefault: () => void }) => event.preventDefault())
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <form onSubmit={unsent}>
          <NumberField label={UNBOUNDED} name="stops" defaultValue={8} />
        </form>
      </PerronProvider>,
      async (host) => {
        const lone = await waitFor(() => inputIn(host, UNBOUNDED))
        await userEvent.click(lone)
        await userEvent.keyboard('{Enter}')
        await frames(2)
        await expect(unsent).not.toHaveBeenCalled()
        lone.blur()
      },
    )
  },
}

/** A `required` field with no value in Base UI's `Form`, checked on blur. */
export const Validation: Story = {
  args: {
    defaultValue: undefined,
    required: true,
    slotProps: { field: { validationMode: 'onBlur' } },
  },
  decorators: [
    (Story) => (
      <Form>
        <Story />
      </Form>
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const input = inputIn(canvasElement)
    const group = groupOf(input)
    const start = document.activeElement
    await step('the input is required, and valid at first, with no error', async () => {
      await expect(input).toBeRequired()
      await expect(fieldPart(canvasElement, 'error')).toBeNull()
      await expect(input).not.toHaveAttribute('aria-invalid')
    })
    // Base UI marks an empty required field invalid only once its value has changed
    await step(
      'typing, clearing, then Tab out, shows the message and the danger edge',
      async () => {
        await userEvent.tab()
        await expect(input).toHaveFocus()
        await userEvent.keyboard('8')
        await userEvent.clear(input)
        await userEvent.tab()
        await waitFor(() => expect(fieldPart(canvasElement, 'error')).not.toBeNull())
        await expect(fieldPart(canvasElement, 'error')!.textContent!.trim()).not.toBe('')
        await expect(input).toHaveAttribute('aria-invalid', 'true')
        await expect(getComputedStyle(group).borderColor).toBe(edge('color-status-danger'))
      },
    )
    await step('typing 8, then Tab out, removes it', async () => {
      await userEvent.tab({ shift: true })
      await expect(input).toHaveFocus()
      await userEvent.keyboard('8')
      await userEvent.tab()
      await waitFor(() => expect(fieldPart(canvasElement, 'error')).toBeNull())
      await expect(input).not.toHaveAttribute('aria-invalid')
      await expect(getComputedStyle(group).borderColor).toBe(edge('color-border-control'))
      await expect(document.activeElement).toBe(start)
    })
  },
}

const COMPOUND = 'Hovedstadsområdetsbuslinjestoppestedsoversigtskortudgivelsen'

/** A Danish compound longer than its line in every part, and a number longer than the box. */
export const LongWords: Story = {
  args: {
    label: COMPOUND,
    description: `Som skrevet i ${COMPOUND}`,
    error: `Skriv antallet fra ${COMPOUND}`,
    max: 1e40,
    defaultValue: 1e35,
  },
  play: async ({ canvasElement }) => {
    const frame = fieldPart(canvasElement, 'field')!
    const bounds = frame.getBoundingClientRect()
    for (const name of ['label', 'description', 'error'] as const) {
      const element = fieldPart(canvasElement, name)!
      await expect(lines(element)).toBeGreaterThan(1.5)
      await expect(element.getBoundingClientRect().right).toBeLessThanOrEqual(bounds.right + 0.5)
      await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth)
    }
    const input = canvasElement.querySelector<HTMLInputElement>('.pn-NumberField-input')!
    const group = groupOf(input)
    const box = group.getBoundingClientRect()
    // one line that scrolls inside the box, which keeps size.input and the frame's width
    await expect(box.height).toBe(Number.parseFloat(rendered('size-input', 'block-size')))
    await expect(box.right).toBeLessThanOrEqual(bounds.right + 0.5)
    await expect(input.scrollWidth).toBeGreaterThan(input.clientWidth)
    for (const button of group.querySelectorAll('button')) {
      const rect = button.getBoundingClientRect()
      await expect(rect.left).toBeGreaterThanOrEqual(box.left)
      await expect(rect.right).toBeLessThanOrEqual(box.right)
    }
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth)
    await expect(bounds.width).toBeLessThanOrEqual(320)
  },
}
