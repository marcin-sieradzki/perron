// TextArea's stories: the variants of the deferred design, Default, Hover, Focus, Disabled and
// Invalid, and the stories of content and behaviour the spec's Stories table names
// (docs/components/text-area.md), each in a 320 px container. Hover and focus render at rest;
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
import { colour, lines, mounted, onHover, rendered, resolve } from '../../testing/stories.ts'
import { TextArea } from './TextArea.tsx'
import type { TextAreaProps } from './TextArea.tsx'

const LABEL = 'What happened'
const DESCRIPTION = 'Say where and when, such as the stop and the time'
const WORDS = 'The 5C waited at Nørreport for 10 minutes.\nThe display showed no delay.'
const PLACEHOLDER = 'Such as: the 5C waited at Nørreport for 10 minutes'

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
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
} satisfies Meta<typeof TextArea>

export default meta

type Story = StoryObj<typeof meta>

/** The field's textarea, the textbox, in `scope`. */
const boxIn = (scope: HTMLElement, name: string | RegExp = LABEL) =>
  within(scope).getByRole<HTMLTextAreaElement>('textbox', { name })

/** One of Field's parts in `scope`, by its class, or null when it isn't rendered. */
const part = (scope: Element, name: 'field' | 'label' | 'description' | 'error') =>
  scope.querySelector<HTMLElement>(name === 'field' ? '.pn-Field' : `.pn-Field-${name}`)

/** A colour token as it renders on an edge, to compare with an element's `border-color`. */
const edge = (token: string) => resolve('borderColor', `var(--perron-color-${token})`)

/** `size.input` in pixels, as it renders on a block size. */
const inputHeight = () => Number.parseFloat(rendered('size-input', 'block-size'))

/** The subject story, State default: the label, the description and the empty box, three rows. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const box = boxIn(canvasElement)
    await step(
      'the textarea is the root, named by the label and described by the help',
      async () => {
        await expect(box.tagName).toBe('TEXTAREA')
        await expect(box).toHaveAccessibleDescription(DESCRIPTION)
        await expect(box).toHaveAttribute('rows', '3')
        await expect(box).toHaveClass('pn-TextArea')
        const frame = box.closest('.pn-Field')
        await expect(frame).toHaveClass('pn-Field', 'pn-TextArea-field')
        await expect(part(canvasElement, 'label')).toHaveClass(
          'pn-Field-label',
          'pn-TextArea-label',
        )
        await expect(part(canvasElement, 'description')).toHaveClass(
          'pn-Field-description',
          'pn-TextArea-description',
        )
        await expect(box).not.toHaveAttribute('aria-invalid')
      },
    )
    await step('pressing the label focuses the textarea', async () => {
      await userEvent.click(part(canvasElement, 'label')!)
      await expect(box).toHaveFocus()
      box.blur()
    })
    await step('Tab focuses the textarea, Shift+Tab moves focus back out', async () => {
      await userEvent.tab()
      await expect(box).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(box).not.toHaveFocus()
    })
  },
}

/** State hover: the empty box, at rest at first render; the play reads the hover rule. */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const box = boxIn(canvasElement)
    const image = onHover(box, 'background-image')
    await expect(image).toContain('linear-gradient')
    await expect(image).toContain('var(--perron-color-surface-hover)')
    await expect(getComputedStyle(box).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
  },
}

/** State focus: the empty box, at rest at first render; Tab gives the textarea itself the ring. */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const box = boxIn(canvasElement)
    await userEvent.tab()
    await expect(box).toHaveFocus()
    await expect(box.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(box)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(colour('--perron-color-border-focus'))
    await expect(ring.outlineWidth).toBe(rendered('focus-width', 'outline-width'))
    await expect(ring.outlineOffset).toBe(rendered('focus-offset', 'outline-offset'))
    await userEvent.tab({ shift: true })
    await expect(box).not.toHaveFocus()
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
    const box = boxIn(canvasElement)
    await expect(box).toBeDisabled()
    await expect(box).toHaveAttribute('data-disabled')
    await expect(part(canvasElement, 'label')).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(box).not.toHaveFocus()
    const tertiary = colour('--perron-color-text-tertiary')
    await expect(getComputedStyle(box).color).toBe(tertiary)
    await expect(getComputedStyle(part(canvasElement, 'label')!).color).toBe(tertiary)
    await expect(getComputedStyle(part(canvasElement, 'description')!).color).toBe(tertiary)
    await expect(getComputedStyle(box).borderColor).toBe(edge('border-control'))
    await expect(getComputedStyle(box).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
    await expect(getComputedStyle(box).resize).toBe('none')
    await userEvent.type(box, 'x', { pointerEventsCheck: 0 })
    await expect(box).toHaveValue(WORDS)
    await expect(args.onChange).not.toHaveBeenCalled()
    await userEvent.tab({ shift: true })
  },
}

/** State invalid: the error "Say what happened" under the box, its edge in `color.status.danger`. */
export const Invalid: Story = {
  args: { error: 'Say what happened' },
  play: async ({ canvasElement }) => {
    const box = boxIn(canvasElement)
    const description = part(canvasElement, 'description')!
    const error = part(canvasElement, 'error')!
    await expect(error).toHaveClass('pn-Field-error', 'pn-TextArea-error')
    await expect(box).toHaveAttribute('aria-invalid', 'true')
    await expect(box).toHaveAttribute('data-invalid')
    await expect(getComputedStyle(box).borderColor).toBe(edge('status-danger'))
    // the help first, then the error
    await waitFor(() =>
      expect(box.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`),
    )
    await expect(box).toHaveAccessibleDescription(`${DESCRIPTION} Say what happened`)
  },
}

/** The field with the two-line `defaultValue`. */
export const Filled: Story = {
  args: { defaultValue: WORDS },
  play: async ({ args, canvasElement }) => {
    const box = boxIn(canvasElement)
    const onChange = args.onChange as ReturnType<typeof fn>
    await expect(box).toHaveValue(WORDS)
    await expect(box.value.split('\n')).toHaveLength(2)
    await expect(getComputedStyle(box).color).toBe(colour('--perron-color-text-primary'))
    await expect(box).toHaveAttribute('data-filled')
    await userEvent.type(box, ' Ok')
    await expect(onChange).toHaveBeenCalledTimes(3)
    const [event] = onChange.mock.calls[2] as [ChangeEvent<HTMLTextAreaElement>]
    await expect(event.type).toBe('change')
    await expect(event.nativeEvent).toBeInstanceOf(Event)
    await expect(event.target).toBe(box)
    await expect(event.target.value).toBe(`${WORDS} Ok`)
    box.blur()
  },
}

/** The empty field with the placeholder "Such as: the 5C waited at Nørreport for 10 minutes". */
export const Placeholder: Story = {
  args: { placeholder: PLACEHOLDER },
  play: async ({ canvasElement }) => {
    const box = boxIn(canvasElement)
    await expect(box).toHaveAttribute('placeholder', PLACEHOLDER)
    const hint = getComputedStyle(box, '::placeholder')
    await expect(hint.color).toBe(colour('--perron-color-text-tertiary'))
    await expect(hint.opacity).toBe('1')
    await expect(box).toHaveAccessibleName(LABEL)
  },
}

/** Renders `args` in `locale` on the server, as the owned-strings check reads a render. */
const markup = (args: TextAreaProps, locale: Locale) =>
  renderToStaticMarkup(
    <PerronProvider locale={locale}>
      <TextArea {...args} />
    </PerronProvider>,
  )

/** `optional`: the label reads "What happened (optional)". */
export const Optional: Story = {
  args: { optional: true },
  play: async ({ args, canvasElement, step }) => {
    await step('the mark is part of the textarea’s name', async () => {
      await expect(boxIn(canvasElement, 'What happened (optional)')).toBeInTheDocument()
    })
    await step('optionalLabel replaces the mark', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="en">
          <TextArea {...args} optionalLabel="(if you like)" />
        </PerronProvider>,
        async (host) => {
          await waitFor(() =>
            expect(boxIn(host, 'What happened (if you like)')).toBeInTheDocument(),
          )
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
  args: { hiddenLabel: true, placeholder: PLACEHOLDER },
  parameters: {
    // axe's label-title-only fails a control with no visible label text that has a title or an
    // aria-describedby, and here the description's aria-describedby trips it on the hidden label,
    // the point of the story; so the rule is off for it alone: the textarea is still named by the
    // label, through aria-labelledby
    a11y: { options: { rules: { 'label-title-only': { enabled: false } } } },
  },
  play: async ({ canvasElement }) => {
    const label = part(canvasElement, 'label')!
    await expect(label.tagName).toBe('SPAN')
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    await expect(boxIn(canvasElement)).toHaveAccessibleName(LABEL)
  },
}

/** The two fields of the `Rows` story, each with its own label. */
const ROWS = [
  { rows: 1, label: 'Where it happened' },
  { rows: 6, label: 'What happened' },
] as const

/** Two fields, one with `rows` 1 and one with `rows` 6, each with its own label. */
export const Rows: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--perron-space-400)' }}>
      {ROWS.map((r) => (
        // each its own field, with no help: the meta's description fits a note
        <TextArea key={r.rows} {...args} {...r} description={undefined} />
      ))}
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const one = boxIn(canvasElement, 'Where it happened')
    const six = boxIn(canvasElement, 'What happened')
    await expect(one).toHaveAttribute('rows', '1')
    await expect(six).toHaveAttribute('rows', '6')
    // one row is a text field's height, to the sub-pixel the line height rounds to
    await expect(Math.abs(one.getBoundingClientRect().height - inputHeight())).toBeLessThan(1)
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <TextArea {...args} label="A three-row note" />
      </PerronProvider>,
      async (host) => {
        const three = await waitFor(() => boxIn(host, 'A three-row note'))
        await expect(six.getBoundingClientRect().height).toBeGreaterThan(
          three.getBoundingClientRect().height,
        )
      },
    )
  },
}

/** `readOnly` with the two-line words, in the rest look. */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: WORDS },
  play: async ({ args, canvasElement }) => {
    const box = boxIn(canvasElement)
    await expect(box).toHaveAttribute('readonly')
    await userEvent.tab()
    await expect(box).toHaveFocus()
    await userEvent.keyboard('x')
    await expect(box).toHaveValue(WORDS)
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(getComputedStyle(box).borderColor).toBe(edge('border-control'))
    await expect(getComputedStyle(box).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
    await expect(getComputedStyle(box).color).toBe(colour('--perron-color-text-primary'))
    await userEvent.tab({ shift: true })
    await expect(box).not.toHaveFocus()
  },
}

/** What the `NewLines` story's form is sent, which Enter in the textarea must never call. */
const submitted = fn()

/** The empty field inside a native `<form>` with an `onSubmit` handler. */
export const NewLines: Story = {
  decorators: [
    (Story) => (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitted()
        }}
      >
        <Story />
      </form>
    ),
  ],
  play: async ({ canvasElement }) => {
    submitted.mockClear()
    const box = boxIn(canvasElement)
    await userEvent.click(box)
    await userEvent.keyboard('The 5C waited{Enter}The display')
    await expect(box).toHaveValue('The 5C waited\nThe display')
    await expect(submitted).not.toHaveBeenCalled()
    // Base UI's Enter handling runs on an <input> only, so Enter marks nothing touched
    await expect(box).not.toHaveAttribute('data-touched')
    box.blur()
  },
}

const FIVE_LINES = [
  'The 5C waited at Nørreport for 10 minutes.',
  'The display showed no delay.',
  'The driver said a lorry blocked the lane.',
  'We left 12 minutes late.',
  'I missed my train at Valby.',
].join('\n')

/** Five lines of words in a three-row box. */
export const Scrolling: Story = {
  args: { defaultValue: FIVE_LINES },
  play: async ({ canvasElement }) => {
    const box = boxIn(canvasElement)
    const frame = part(canvasElement, 'field')!
    // the box keeps its three rows, and the words scroll inside it
    await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight)
    await expect(lines(box)).toBeLessThan(5)
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth)
    await expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(320)
    await expect(getComputedStyle(box).resize).toBe('vertical')
  },
}

/** The words held in the story's state, set from each change event's `target.value`. */
function ControlledArea(props: TextAreaProps) {
  const [value, setValue] = useState('')
  return (
    <TextArea
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
  render: (args) => <ControlledArea {...args} />,
  play: async ({ args, canvasElement }) => {
    const box = boxIn(canvasElement)
    const onChange = args.onChange as ReturnType<typeof fn>
    const start = document.activeElement
    await userEvent.type(box, 'Nø')
    await expect(onChange).toHaveBeenCalledTimes(2)
    const [event] = onChange.mock.calls[1] as [ChangeEvent<HTMLTextAreaElement>]
    await expect(event.nativeEvent).toBeInstanceOf(Event)
    await expect(box).toHaveValue('Nø')
    await waitFor(() => expect(box).toHaveAttribute('data-filled'))
    await expect(box).toHaveAttribute('data-dirty')
    await userEvent.tab()
    await expect(document.activeElement).toBe(start)
  },
}

/** Inside a native `<form>`, spread with the shape React Hook Form's `register('note')` returns. */
export const Registered: Story = {
  args: { name: 'note', ref: fn(), onChange: fn(), onBlur: fn() },
  decorators: [
    (Story) => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Story />
      </form>
    ),
  ],
  play: async ({ args, canvasElement }) => {
    const box = boxIn(canvasElement)
    await expect(args.ref).toHaveBeenCalledWith(box)
    await userEvent.type(box, 'Nørreport')
    const onChange = args.onChange as ReturnType<typeof fn>
    await expect(onChange).toHaveBeenCalledTimes('Nørreport'.length)
    for (const [event] of onChange.mock.calls as [ChangeEvent<HTMLTextAreaElement>][])
      await expect(event.nativeEvent).toBeInstanceOf(Event)
    await userEvent.tab()
    await expect(args.onBlur).toHaveBeenCalledTimes(1)
    const form = canvasElement.querySelector('form')!
    await expect(new FormData(form).get('note')).toBe('Nørreport')
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
          typeof value === 'string' && value.trim().length < 10
            ? 'Write at least 10 letters'
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
    const box = boxIn(canvasElement)
    const start = document.activeElement
    await step('the field is valid at first, with no error', async () => {
      await expect(part(canvasElement, 'error')).toBeNull()
      await expect(box).not.toHaveAttribute('aria-invalid')
    })
    await step('"Late", then Tab out, shows the message and the danger edge', async () => {
      await userEvent.tab()
      await userEvent.type(box, 'Late')
      await userEvent.tab()
      await waitFor(() =>
        expect(part(canvasElement, 'error')).toHaveTextContent(/^Write at least 10 letters$/),
      )
      await expect(box).toHaveAttribute('aria-invalid', 'true')
      await expect(getComputedStyle(box).borderColor).toBe(edge('status-danger'))
    })
    await step('" at Nørreport", then Tab out, removes it', async () => {
      await userEvent.tab({ shift: true })
      await expect(box).toHaveFocus()
      await userEvent.type(box, ' at Nørreport')
      await userEvent.tab()
      await waitFor(() => expect(part(canvasElement, 'error')).toBeNull())
      await expect(box).not.toHaveAttribute('aria-invalid')
      await expect(getComputedStyle(box).borderColor).toBe(edge('border-control'))
      await expect(document.activeElement).toBe(start)
    })
  },
}

const COMPOUND = 'Hovedstadsområdetsbuslinjestoppestedsoversigtskortudgivelsen'

/** A Danish compound longer than its line in every part, and a word longer than the box (CR-7). */
export const LongWords: Story = {
  args: {
    label: COMPOUND,
    description: `Sig hvor og hvornår, som i ${COMPOUND}`,
    error: `Skriv hvad der skete ved ${COMPOUND}`,
    // one word longer than the box's three rows, so it can only fit by breaking
    defaultValue: COMPOUND.repeat(3),
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
    const box = canvasElement.querySelector<HTMLTextAreaElement>('.pn-TextArea')!
    // the word breaks onto more lines than the box shows, and none runs past its edge
    await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight)
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
    await expect(box.getBoundingClientRect().right).toBeLessThanOrEqual(bounds.right + 0.5)
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth)
    await expect(bounds.width).toBeLessThanOrEqual(320)
  },
}
