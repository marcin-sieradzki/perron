// NumberField's stories: the variants of the deferred design, Default, Hover, Focus, Disabled and
// Invalid, and the stories of content and behaviour the spec's Stories table names
// (docs/components/number-field.md), each in a 320 px container. Hover, focus and pressed render
// at rest; their plays drive them.
import { Form } from '@base-ui/react/form'
import { useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  colour,
  lines,
  mounted,
  onHover,
  pressedAfterHover,
  rendered,
  resolve,
  stateFill,
} from '../../testing/stories.ts'
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

/** One of Field's parts in `scope`, by its class, or null when it isn't rendered. */
const part = (scope: Element, name: 'field' | 'label' | 'description' | 'error') =>
  scope.querySelector<HTMLElement>(name === 'field' ? '.pn-Field' : `.pn-Field-${name}`)

/** A colour token as it renders on an edge, to compare with an element's `border-color`. */
const edge = (token: string) => resolve('borderColor', `var(--perron-color-${token})`)

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
      await expect(part(canvasElement, 'label')).toHaveClass(
        'pn-Field-label',
        'pn-NumberField-label',
      )
      await expect(part(canvasElement, 'description')).toHaveClass(
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
    await step('pressing the label focuses the input', async () => {
      await userEvent.click(part(canvasElement, 'label')!)
      await expect(input).toHaveFocus()
      input.blur()
    })
    await step('Tab focuses the input, Shift+Tab moves focus back out', async () => {
      await userEvent.tab()
      await expect(input).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(input).not.toHaveFocus()
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
    for (const element of [group, input, part(canvasElement, 'label')!])
      await expect(element).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(input).not.toHaveFocus()
    const tertiary = colour('--perron-color-text-tertiary')
    await expect(getComputedStyle(input).color).toBe(tertiary)
    await expect(getComputedStyle(part(canvasElement, 'label')!).color).toBe(tertiary)
    await expect(getComputedStyle(part(canvasElement, 'description')!).color).toBe(tertiary)
    for (const button of buttons) {
      await expect(button).toHaveAttribute('aria-disabled', 'true')
      await expect(getComputedStyle(button.querySelector('svg')!).color).toBe(tertiary)
    }
    await expect(getComputedStyle(group).borderColor).toBe(edge('border-control'))
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
    const description = part(canvasElement, 'description')!
    const error = part(canvasElement, 'error')!
    await expect(error).toHaveClass('pn-Field-error', 'pn-NumberField-error')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(group).toHaveAttribute('data-invalid')
    await expect(getComputedStyle(group).borderColor).toBe(edge('status-danger'))
    // the help first, then the error
    await waitFor(() =>
      expect(input.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`),
    )
    await expect(input).toHaveAccessibleDescription(`${DESCRIPTION} Enter a number from 1 to 20`)
  },
}

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
    const start = document.activeElement
    await userEvent.tab()
    await userEvent.keyboard('{ArrowUp}')
    await expect(input).toHaveValue('1')
    await expect(values(args.onChange)).toEqual([1])
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(start)
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
      await expect(onHover(atBound, 'background-color')).toBe('')
      await userEvent.click(atBound, { pointerEventsCheck: 0 })
      await expect(inputIn(field, name)).toHaveValue(value)
      await expect(buttonIn(field, other)).not.toHaveAttribute('aria-disabled', 'true')
      await expect(buttonIn(field, other)).not.toHaveAttribute('data-disabled')
      inputIn(field, name).blur()
    }
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

/** The box holding 8, with `largeStep` 5: the arrow keys, Shift, Home and End step it. */
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
      ['{End}', '20'],
      ['{Home}', '1'],
    ] as const
    for (const [keys, shown] of steps) {
      await userEvent.keyboard(keys)
      await expect(input).toHaveValue(shown)
    }
    await expect(values(args.onChange)).toEqual([9, 8, 13, 20, 1])
    await expect(new Set(reasons(args.onChange))).toEqual(new Set(['keyboard']))
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(start)
  },
}

/** The box holding 8: typing replaces the number, clamped to `max`, and leaving commits it. */
export const Typing: Story = {
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    const start = document.activeElement
    await userEvent.type(input, '25', { initialSelectionStart: 0, initialSelectionEnd: 1 })
    await expect(values(args.onChange)).toEqual([2, 20])
    await expect(reasons(args.onChange)).toEqual(['input-change', 'input-change'])
    const shown = input.value
    await userEvent.keyboard('x')
    await expect(input).toHaveValue(shown)
    await expect(mock(args.onChange)).toHaveBeenCalledTimes(2)
    await userEvent.tab()
    await expect(input).toHaveValue('20')
    await expect(values(args.onChangeCommitted).at(-1)).toBe(20)
    await expect(document.activeElement).toBe(start)
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
    await userEvent.tab({ shift: true })
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
    const label = part(canvasElement, 'label')!
    await expect(label.tagName).toBe('SPAN')
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    await expect(inputIn(canvasElement)).toHaveAccessibleName(LABEL)
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
      await expect(onHover(button, 'background-color')).toBe('')
    }
    await expect(getComputedStyle(input).color).toBe(colour('--perron-color-text-primary'))
    await expect(getComputedStyle(group).borderColor).toBe(edge('border-control'))
    await expect(getComputedStyle(group).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
    await userEvent.tab({ shift: true })
    await expect(input).not.toHaveFocus()
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

/** The number held in the story's state, set from each change's `value`. */
function ControlledField(props: NumberFieldProps) {
  const [value, setValue] = useState<number | null>(8)
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
  },
}

/** With `name` "departures", inside a native `<form>`. */
export const InForm: Story = {
  args: { name: 'departures' },
  decorators: [
    (Story) => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Story />
      </form>
    ),
  ],
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!
    await expect(new FormData(form).get('departures')).toBe('8')
    await userEvent.click(buttonIn(canvasElement, 'Increase'))
    await waitFor(() => expect(new FormData(form).get('departures')).toBe('9'))
    inputIn(canvasElement).blur()
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
    await step('the field is valid at first, with no error', async () => {
      await expect(part(canvasElement, 'error')).toBeNull()
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
        await waitFor(() => expect(part(canvasElement, 'error')).not.toBeNull())
        await expect(part(canvasElement, 'error')!.textContent!.trim()).not.toBe('')
        await expect(input).toHaveAttribute('aria-invalid', 'true')
        await expect(getComputedStyle(group).borderColor).toBe(edge('status-danger'))
      },
    )
    await step('typing 8, then Tab out, removes it', async () => {
      await userEvent.tab({ shift: true })
      await expect(input).toHaveFocus()
      await userEvent.keyboard('8')
      await userEvent.tab()
      await waitFor(() => expect(part(canvasElement, 'error')).toBeNull())
      await expect(input).not.toHaveAttribute('aria-invalid')
      await expect(getComputedStyle(group).borderColor).toBe(edge('border-control'))
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
    const frame = part(canvasElement, 'field')!
    const bounds = frame.getBoundingClientRect()
    for (const name of ['label', 'description', 'error'] as const) {
      const element = part(canvasElement, name)!
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
