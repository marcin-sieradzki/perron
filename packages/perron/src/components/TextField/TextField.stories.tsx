// TextField's stories: the variants of the deferred design, Default, Hover, Focus, Disabled and
// Invalid, and the stories of content and behaviour the spec's Stories table names
// (docs/components/text-field.md), each in a 320 px container. Hover and focus render at rest;
// their plays drive them.
import { Form } from '@base-ui/react/form'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import type { Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  colour,
  edge,
  fieldPart,
  lines,
  mounted,
  onHover,
  rendered,
} from '../../testing/stories.ts'
import { TextField } from './TextField.tsx'
import type { TextFieldProps } from './TextField.tsx'

const LABEL = 'Stop name'
const DESCRIPTION = 'As written on the stop sign'
const WORDS = 'Nørreport St.'

const meta = {
  title: 'Components/TextField',
  component: TextField,
  // every word the caller gives, and a handler for the words, so any story renders alone
  args: { label: LABEL, description: DESCRIPTION, onChange: fn() },
  decorators: [
    (Story) => (
      <PerronProvider locale="en">
        <div style={{ inlineSize: 320 }}>
          <Story />
        </div>
      </PerronProvider>
    ),
  ],
} satisfies Meta<typeof TextField>

export default meta

type Story = StoryObj<typeof meta>

/** The field's input, the textbox, in `scope`. */
const inputIn = (scope: HTMLElement, name: string | RegExp = LABEL) =>
  within(scope).getByRole<HTMLInputElement>('textbox', { name })

/** The subject story, State default: the label, the description and the empty box. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const input = inputIn(canvasElement)
    await step('the input is the root, named by the label and described by the help', async () => {
      await expect(input).toHaveAccessibleDescription(DESCRIPTION)
      await expect(input).toHaveAttribute('type', 'text')
      await expect(input).toHaveClass('pn-TextField')
      const frame = input.closest('.pn-Field')
      await expect(frame).toHaveClass('pn-Field', 'pn-TextField-field')
      await expect(fieldPart(canvasElement, 'label')).toHaveClass(
        'pn-Field-label',
        'pn-TextField-label',
      )
      await expect(fieldPart(canvasElement, 'description')).toHaveClass(
        'pn-Field-description',
        'pn-TextField-description',
      )
      await expect(input).not.toHaveAttribute('aria-invalid')
    })
    await step('pressing the label focuses the input', async () => {
      await userEvent.click(fieldPart(canvasElement, 'label')!)
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

/** State hover: the empty box, at rest at first render; the play reads the hover rule. */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const input = inputIn(canvasElement)
    const image = onHover(input, 'background-image')
    await expect(image).toContain('linear-gradient')
    await expect(image).toContain('var(--perron-color-surface-hover)')
    await expect(getComputedStyle(input).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
  },
}

/** State focus: the empty box, at rest at first render; Tab gives the input itself the ring. */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const input = inputIn(canvasElement)
    await userEvent.tab()
    await expect(input).toHaveFocus()
    await expect(input.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(input)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(colour('--perron-color-border-focus'))
    await expect(ring.outlineWidth).toBe(rendered('focus-width', 'outline-width'))
    await expect(ring.outlineOffset).toBe(rendered('focus-offset', 'outline-offset'))
    await userEvent.tab({ shift: true })
    await expect(input).not.toHaveFocus()
  },
}

/** State disabled: the words, the label and the description in `color.text.tertiary`. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: WORDS },
  parameters: {
    // a disabled field's words are color.text.tertiary, a miss Accessibility lists by name
    // (docs/foundations/accessibility.md) and WCAG 1.4.3 exempts for an inactive control, so
    // axe's contrast rule is off for this story alone
    a11y: { options: { rules: { 'color-contrast': { enabled: false } } } },
  },
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    await expect(input).toBeDisabled()
    await expect(input).toHaveAttribute('data-disabled')
    await expect(fieldPart(canvasElement, 'label')).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(input).not.toHaveFocus()
    const tertiary = colour('--perron-color-text-tertiary')
    await expect(getComputedStyle(input).color).toBe(tertiary)
    await expect(getComputedStyle(fieldPart(canvasElement, 'label')!).color).toBe(tertiary)
    await expect(getComputedStyle(fieldPart(canvasElement, 'description')!).color).toBe(tertiary)
    await expect(getComputedStyle(input).borderColor).toBe(edge('color-border-control'))
    await expect(getComputedStyle(input).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
    await userEvent.type(input, 'x', { pointerEventsCheck: 0 })
    await expect(input).toHaveValue(WORDS)
    await expect(args.onChange).not.toHaveBeenCalled()
    await userEvent.tab({ shift: true })
  },
}

/** State invalid: the error "Enter a stop name" under the box, its edge in `color.status.danger`. */
export const Invalid: Story = {
  args: { error: 'Enter a stop name' },
  play: async ({ canvasElement }) => {
    const input = inputIn(canvasElement)
    const description = fieldPart(canvasElement, 'description')!
    const error = fieldPart(canvasElement, 'error')!
    await expect(error).toHaveClass('pn-Field-error', 'pn-TextField-error')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute('data-invalid')
    await expect(getComputedStyle(input).borderColor).toBe(edge('color-status-danger'))
    // the help first, then the error
    await waitFor(() =>
      expect(input.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`),
    )
    await expect(input).toHaveAccessibleDescription(`${DESCRIPTION} Enter a stop name`)
  },
}

/** The field with `defaultValue` "Nørreport St.". */
export const Filled: Story = {
  args: { defaultValue: WORDS },
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    const onChange = args.onChange as ReturnType<typeof fn>
    await expect(input).toHaveValue(WORDS)
    await expect(getComputedStyle(input).color).toBe(colour('--perron-color-text-primary'))
    await expect(input).toHaveAttribute('data-filled')
    await userEvent.type(input, ' 1')
    await expect(onChange).toHaveBeenCalledTimes(2)
    const [event] = onChange.mock.calls[1] as [ChangeEvent<HTMLInputElement>]
    await expect(event.type).toBe('change')
    await expect(event.nativeEvent).toBeInstanceOf(Event)
    await expect(event.target).toBe(input)
    await expect(event.target.value).toBe(`${WORDS} 1`)
    input.blur()
  },
}

/** The empty field with the placeholder "Such as Nørreport St.". */
export const Placeholder: Story = {
  args: { placeholder: 'Such as Nørreport St.' },
  play: async ({ canvasElement }) => {
    const input = inputIn(canvasElement)
    await expect(input).toHaveAttribute('placeholder', 'Such as Nørreport St.')
    const hint = getComputedStyle(input, '::placeholder')
    await expect(hint.color).toBe(colour('--perron-color-text-tertiary'))
    await expect(hint.opacity).toBe('1')
    await expect(input).toHaveAccessibleName(LABEL)
  },
}

/** Renders `args` in `locale` on the server, as the owned-strings check reads a render. */
const markup = (args: TextFieldProps, locale: Locale) =>
  renderToStaticMarkup(
    <PerronProvider locale={locale}>
      <TextField {...args} />
    </PerronProvider>,
  )

/** `optional`: the label reads "Stop name (optional)". */
export const Optional: Story = {
  args: { optional: true },
  play: async ({ args, canvasElement, step }) => {
    await step('the mark is part of the input’s name', async () => {
      await expect(inputIn(canvasElement, 'Stop name (optional)')).toBeInTheDocument()
    })
    await step('optionalLabel replaces the mark', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="en">
          <TextField {...args} optionalLabel="(if known)" />
        </PerronProvider>,
        async (host) => {
          await waitFor(() => expect(inputIn(host, 'Stop name (if known)')).toBeInTheDocument())
        },
      )
    })
    await step('its render says only the dictionary’s and the caller’s words (CR-12)', async () => {
      for (const locale of ['en', 'da', 'sv', 'nb'] as const)
        expectOwnedStrings(markup(args, locale), locale, [LABEL, DESCRIPTION])
    })
  },
}

/** `hiddenLabel` with a placeholder: the description and the box, no label in view. */
export const HiddenLabel: Story = {
  args: { hiddenLabel: true, placeholder: 'Such as Nørreport St.' },
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
    await expect(inputIn(canvasElement)).toHaveAccessibleName(LABEL)
  },
}

/** Each `type`, with its label and the `autoComplete` a person's own details take. */
const TYPES = [
  { type: 'text', label: 'Stop name' },
  { type: 'email', label: 'Email address', autoComplete: 'email' },
  { type: 'password', label: 'Password', autoComplete: 'current-password' },
  { type: 'tel', label: 'Phone number', autoComplete: 'tel' },
  { type: 'url', label: 'Web address', autoComplete: 'url' },
] as const

/** Five fields, one per `type`, each with its own label and no description. */
export const Types: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--perron-space-400)' }}>
      {TYPES.map((t) => (
        // each its own field, with no help: the meta's description names a stop
        <TextField key={t.type} {...args} {...t} description={undefined} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const { type, label } of TYPES) {
      const input = within(canvasElement)
        .getByText(label, { selector: 'label' })
        .closest('.pn-Field')!
        .querySelector('input')!
      await expect(input).toHaveAttribute('type', type)
      if (type !== 'password') await expect(inputIn(canvasElement, label)).toBe(input)
    }
    const password = within(canvasElement)
      .getByText('Password', { selector: 'label' })
      .closest('.pn-Field')!
      .querySelector('input')!
    // the browser masks a password input's words as dots, and exposes it as no textbox
    await expect(within(canvasElement).queryByRole('textbox', { name: 'Password' })).toBeNull()
    await userEvent.type(password, 'Nø')
    await expect(password).toHaveValue('Nø')
    password.blur()
  },
}

/** `readOnly` with the words "Nørreport St.", in the rest look. */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: WORDS },
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    await expect(input).toHaveAttribute('readonly')
    await userEvent.tab()
    await expect(input).toHaveFocus()
    await userEvent.keyboard('x')
    await expect(input).toHaveValue(WORDS)
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(getComputedStyle(input).borderColor).toBe(edge('color-border-control'))
    await expect(getComputedStyle(input).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
    await expect(getComputedStyle(input).color).toBe(colour('--perron-color-text-primary'))
    await userEvent.tab({ shift: true })
    await expect(input).not.toHaveFocus()
  },
}

/** The words held in the story's state, set from each change event's `target.value`. */
function ControlledField(props: TextFieldProps) {
  const [value, setValue] = useState('')
  return (
    <TextField
      {...props}
      value={value}
      onChange={(event) => {
        props.onChange?.(event)
        setValue(event.target.value)
      }}
    />
  )
}

/** `value` held in the story's state, starting empty. */
export const Controlled: Story = {
  render: (args) => <ControlledField {...args} />,
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    const onChange = args.onChange as ReturnType<typeof fn>
    const start = document.activeElement
    await userEvent.type(input, 'Nø')
    await expect(onChange).toHaveBeenCalledTimes(2)
    const [event] = onChange.mock.calls[1] as [ChangeEvent<HTMLInputElement>]
    await expect(event.nativeEvent).toBeInstanceOf(Event)
    await expect(input).toHaveValue('Nø')
    await waitFor(() => expect(input).toHaveAttribute('data-filled'))
    await expect(input).toHaveAttribute('data-dirty')
    await userEvent.tab()
    await expect(document.activeElement).toBe(start)
  },
}

/** Inside a native `<form>`, spread with the shape React Hook Form's `register('stop')` returns. */
export const Registered: Story = {
  args: { name: 'stop', ref: fn(), onChange: fn(), onBlur: fn() },
  decorators: [
    (Story) => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Story />
      </form>
    ),
  ],
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    await expect(args.ref).toHaveBeenCalledWith(input)
    await userEvent.type(input, 'Nørreport')
    const onChange = args.onChange as ReturnType<typeof fn>
    await expect(onChange).toHaveBeenCalledTimes('Nørreport'.length)
    for (const [event] of onChange.mock.calls as [ChangeEvent<HTMLInputElement>][])
      await expect(event.nativeEvent).toBeInstanceOf(Event)
    await userEvent.tab()
    await expect(args.onBlur).toHaveBeenCalledTimes(1)
    const form = canvasElement.querySelector('form')!
    await expect(new FormData(form).get('stop')).toBe('Nørreport')
  },
}

/** A `required` field in Base UI's `Form`, checked on blur by the caller's `validate`. */
export const Validation: Story = {
  args: {
    required: true,
    slotProps: {
      field: {
        validationMode: 'onBlur',
        validate: (value) =>
          typeof value === 'string' && value.trim().length === 1
            ? 'Enter at least 2 letters'
            : null,
      },
    },
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
    const start = document.activeElement
    await step('the field is valid at first, with no error', async () => {
      await expect(fieldPart(canvasElement, 'error')).toBeNull()
      await expect(input).not.toHaveAttribute('aria-invalid')
    })
    await step('one letter, then Tab out, shows the message and the danger edge', async () => {
      await userEvent.tab()
      await userEvent.type(input, 'N')
      await userEvent.tab()
      await waitFor(() =>
        expect(fieldPart(canvasElement, 'error')).toHaveTextContent(/^Enter at least 2 letters$/),
      )
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      await expect(getComputedStyle(input).borderColor).toBe(edge('color-status-danger'))
    })
    await step('a second letter, then Tab out, removes it', async () => {
      await userEvent.tab({ shift: true })
      await expect(input).toHaveFocus()
      await userEvent.type(input, 'ø')
      await userEvent.tab()
      await waitFor(() => expect(fieldPart(canvasElement, 'error')).toBeNull())
      await expect(input).not.toHaveAttribute('aria-invalid')
      await expect(getComputedStyle(input).borderColor).toBe(edge('color-border-control'))
      await expect(document.activeElement).toBe(start)
    })
  },
}

const COMPOUND = 'Hovedstadsområdetsbuslinjestoppestedsoversigtskortudgivelsen'

/** A Danish compound longer than its line in every part, and a value longer than the box (CR-7). */
export const LongWords: Story = {
  args: {
    label: COMPOUND,
    description: `Som skrevet i ${COMPOUND}`,
    error: `Skriv navnet fra ${COMPOUND}`,
    defaultValue: `${COMPOUND} ${COMPOUND}`,
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
    const input = canvasElement.querySelector<HTMLInputElement>('.pn-TextField')!
    const box = input.getBoundingClientRect()
    // one line that scrolls inside the box, which keeps size.input and the frame's width
    await expect(box.height).toBe(Number.parseFloat(rendered('size-input', 'block-size')))
    await expect(box.right).toBeLessThanOrEqual(bounds.right + 0.5)
    await expect(input.scrollWidth).toBeGreaterThan(input.clientWidth)
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth)
    await expect(bounds.width).toBeLessThanOrEqual(320)
  },
}
