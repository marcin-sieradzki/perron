// Field's stories: the variants of the deferred design, Default, Disabled and Invalid, and the
// stories of content and behaviour the spec's Stories table names (docs/components/field.md), each
// in a 320 px container. The control is Base UI's Input, which registers with the field (CR-10),
// styled here with the Fields family's tokens until TextField ships; Field's own CSS draws no box.
import { Form } from '@base-ui/react/form'
import { Input } from '@base-ui/react/input'
import type { CSSProperties } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import type { Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { colour, heard, lines, mounted, rendered, typography } from '../../testing/stories.ts'
import { Kbd } from '../Kbd/Kbd.tsx'
import { Field } from './Field.tsx'
import type { FieldProps } from './Field.tsx'

const LABEL = 'Stop name'
const DESCRIPTION = 'As written on the stop sign'

/** The Fields family's box, for the story's control: TextField will draw it. */
const box = (state: Input.State): CSSProperties => ({
  ...typography('body'),
  boxSizing: 'border-box',
  inlineSize: '100%',
  blockSize: 'var(--perron-size-input)',
  paddingInline: 'var(--perron-space-300)',
  border: 'var(--perron-border-width-025) solid',
  borderColor:
    state.valid === false
      ? 'var(--perron-color-status-danger)'
      : 'var(--perron-color-border-control)',
  borderRadius: 'var(--perron-radius-md)',
  backgroundColor: 'var(--perron-color-surface-raised)',
  color: state.disabled ? 'var(--perron-color-text-tertiary)' : 'var(--perron-color-text-primary)',
})

const meta = {
  title: 'Components/Field',
  component: Field,
  // every word the caller gives and the control, so any story renders alone
  args: { label: LABEL, description: DESCRIPTION, children: <Input style={box} /> },
  decorators: [
    (Story) => (
      <PerronProvider locale="en">
        <div style={{ inlineSize: 320 }}>
          <Story />
        </div>
      </PerronProvider>
    ),
  ],
} satisfies Meta<typeof Field>

export default meta

type Story = StoryObj<typeof meta>

/** The field's control, the textbox, in `scope`. */
const controlIn = (scope: HTMLElement, name: string | RegExp = LABEL) =>
  within(scope).getByRole<HTMLInputElement>('textbox', { name })

/** One part of the field in `scope`, by its class, or null when it isn't rendered. */
const part = (scope: Element, name: 'label' | 'optional' | 'description' | 'error') =>
  scope.querySelector<HTMLElement>(`.pn-Field-${name}`)

/** The subject story, State default: the label, the description and an empty control. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const control = controlIn(canvasElement)
    await step('the control is named by the label and described by the help', async () => {
      await expect(control).toHaveAccessibleDescription(DESCRIPTION)
      await expect(part(canvasElement, 'label')!.tagName).toBe('LABEL')
      await expect(part(canvasElement, 'error')).toBeNull()
      await expect(control).not.toHaveAttribute('aria-invalid')
    })
    await step('pressing the label focuses the control', async () => {
      await userEvent.click(part(canvasElement, 'label')!)
      await expect(control).toHaveFocus()
      control.blur()
    })
    await step('Tab focuses the control, Shift+Tab moves focus back out', async () => {
      await userEvent.tab()
      await expect(control).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(control).not.toHaveFocus()
    })
  },
}

/** State disabled: the label and the description in `color.text.tertiary`. */
export const Disabled: Story = {
  args: { disabled: true },
  parameters: {
    // a disabled field's words are color.text.tertiary, a miss Accessibility lists by name
    // (docs/foundations/accessibility.md) and WCAG 1.4.3 exempts for an inactive control, so
    // axe's contrast rule is off for this story alone
    a11y: { options: { rules: { 'color-contrast': { enabled: false } } } },
  },
  play: async ({ canvasElement }) => {
    const control = controlIn(canvasElement)
    await expect(control).toBeDisabled()
    await expect(canvasElement.querySelector('.pn-Field')).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(control).not.toHaveFocus()
    const tertiary = colour('--perron-color-text-tertiary')
    await expect(getComputedStyle(part(canvasElement, 'label')!).color).toBe(tertiary)
    await expect(getComputedStyle(part(canvasElement, 'description')!).color).toBe(tertiary)
    await userEvent.tab({ shift: true })
  },
}

/** State invalid: the error "Enter a stop name" under the control, in `color.text.danger`. */
export const Invalid: Story = {
  args: { error: 'Enter a stop name' },
  play: async ({ canvasElement }) => {
    const control = controlIn(canvasElement)
    const error = part(canvasElement, 'error')!
    const description = part(canvasElement, 'description')!
    await expect(heard(error)).toBe('Enter a stop name')
    await expect(getComputedStyle(error).color).toBe(colour('--perron-color-text-danger'))
    await expect(control).toHaveAttribute('aria-invalid', 'true')
    // the help first, then the error, whatever their place
    await waitFor(() =>
      expect(control.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`),
    )
    await expect(control).toHaveAccessibleDescription(`${DESCRIPTION} Enter a stop name`)
    await expect(canvasElement.querySelector('.pn-Field')).toHaveAttribute('data-invalid')
    // the label keeps its rest look: the error and the control's edge show it
    await expect(getComputedStyle(part(canvasElement, 'label')!).color).toBe(
      colour('--perron-color-text-primary'),
    )
  },
}

/** Base UI's own checks: a `validate` on blur, its message shown while one letter is typed. */
export const Validation: Story = {
  args: {
    validationMode: 'onBlur',
    validate: (value) =>
      typeof value === 'string' && value.trim().length === 1 ? 'Enter at least 2 letters' : null,
    children: <Input required style={box} />,
  },
  play: async ({ canvasElement, step }) => {
    const control = controlIn(canvasElement)
    const start = document.activeElement
    await step('the field is valid at first, with no error', async () => {
      await expect(part(canvasElement, 'error')).toBeNull()
      await expect(control).not.toHaveAttribute('aria-invalid')
    })
    await step('one letter, then Tab out, shows the message', async () => {
      await userEvent.tab()
      await userEvent.type(control, 'N')
      await userEvent.tab()
      await waitFor(() =>
        expect(part(canvasElement, 'error')).toHaveTextContent(/^Enter at least 2 letters$/),
      )
      await expect(control).toHaveAttribute('aria-invalid', 'true')
      await expect(control).toHaveAccessibleDescription(`${DESCRIPTION} Enter at least 2 letters`)
    })
    await step('a second letter, then Tab out, removes it', async () => {
      await userEvent.tab({ shift: true })
      await expect(control).toHaveFocus()
      await userEvent.type(control, 'ø')
      await userEvent.tab()
      await waitFor(() => expect(part(canvasElement, 'error')).toBeNull())
      await expect(control).not.toHaveAttribute('aria-invalid')
      await expect(document.activeElement).toBe(start)
    })
  },
}

/** `hiddenLabel`: the description and the control, no label in view. */
export const HiddenLabel: Story = {
  args: { hiddenLabel: true },
  parameters: {
    // axe's label-title-only fails a control with no visible label text that has a title or an
    // aria-describedby, and here the description's aria-describedby trips it on the hidden label,
    // the point of the story; so the rule is off for it alone: the control is still named by the
    // label, through aria-labelledby (CR-6)
    a11y: { options: { rules: { 'label-title-only': { enabled: false } } } },
  },
  play: async ({ canvasElement }) => {
    const label = part(canvasElement, 'label')!
    // the VisuallyHidden part: a span, not a <label>, in a box the eye never sees (CR-6)
    await expect(label.tagName).toBe('SPAN')
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    await expect(controlIn(canvasElement)).toHaveAccessibleName(LABEL)
  },
}

/** Renders `args` in `locale` on the server, as the owned-strings check reads a render. */
const markup = (args: FieldProps, locale: Locale) =>
  renderToStaticMarkup(
    <PerronProvider locale={locale}>
      <Field {...args} />
    </PerronProvider>,
  )

/** `optional`: the label reads "Stop name (optional)", the mark in `color.text.secondary`. */
export const Optional: Story = {
  args: { optional: true },
  play: async ({ args, canvasElement, step }) => {
    await step('the mark is part of the control’s name, in the quieter colour', async () => {
      const control = controlIn(canvasElement, 'Stop name (optional)')
      await expect(control).toBeInTheDocument()
      const mark = part(canvasElement, 'optional')!
      await expect(part(canvasElement, 'label')!.contains(mark)).toBe(true)
      await expect(getComputedStyle(mark).color).toBe(colour('--perron-color-text-secondary'))
      await expect(getComputedStyle(mark).font).toBe(
        getComputedStyle(part(canvasElement, 'label')!).font,
      )
    })
    await step('optionalLabel replaces the mark', async () => {
      await mounted(canvasElement, <Field {...args} optionalLabel="(if known)" />, async (host) => {
        await waitFor(() => expect(controlIn(host, 'Stop name (if known)')).toBeInTheDocument())
      })
    })
    await step('its render says only the dictionary’s and the caller’s words (CR-12)', async () => {
      for (const locale of ['en', 'da', 'sv', 'nb'] as const)
        expectOwnedStrings(markup(args, locale), locale, [LABEL, DESCRIPTION])
    })
  },
}

/** The label and the control alone, with no `description`. */
export const NoDescription: Story = {
  args: { description: undefined },
  play: async ({ canvasElement }) => {
    const control = controlIn(canvasElement)
    await expect(part(canvasElement, 'description')).toBeNull()
    await expect(control).not.toHaveAttribute('aria-describedby')
  },
}

/** The label, the description and the error each given as an element, the help with a Kbd. */
export const RichContent: Story = {
  args: {
    label: <span>Stop name</span>,
    description: (
      <span>
        As written on the stop sign. Press <Kbd>Tab</Kbd> to move on.
      </span>
    ),
    error: (
      <span>
        Enter <strong>at least 2 letters</strong> of the stop name
      </span>
    ),
  },
  play: async ({ canvasElement, step }) => {
    const heardAs = async (scope: HTMLElement) => {
      const control = controlIn(scope)
      await expect(part(scope, 'label')).toHaveTextContent(/^Stop name$/)
      await expect(part(scope, 'description')!.querySelector('kbd')).toHaveTextContent('Tab')
      await expect(part(scope, 'error')!.querySelector('strong')).toHaveTextContent(
        'at least 2 letters',
      )
      await expect(control).toHaveAccessibleDescription(
        'As written on the stop sign. Press Tab to move on. Enter at least 2 letters of the stop name',
      )
    }
    await step('each part renders its element, and the control hears its text', async () => {
      await expect(part(canvasElement, 'label')!.querySelector('span')).toHaveTextContent(LABEL)
      await heardAs(canvasElement)
    })
    await step('each part renders a list of strings and elements alike', async () => {
      await mounted(
        canvasElement,
        <Field
          label={['Stop ', <span key="name">name</span>]}
          description={[
            'As written on the stop sign. Press ',
            <Kbd key="tab">Tab</Kbd>,
            ' to move on.',
          ]}
          error={['Enter ', <strong key="letters">at least 2 letters</strong>, ' of the stop name']}
        >
          <Input style={box} />
        </Field>,
        async (host) => {
          await waitFor(() => expect(part(host, 'error')).not.toBeNull())
          await expect(part(host, 'label')!.querySelector('span')).toHaveTextContent(/^name$/)
          await heardAs(host)
        },
      )
    })
  },
}

// two messages from the server after a submit, given through Base UI's Form, and two from the
// field's own checks: Base UI shows each pair as a list
const SERVER_MESSAGES = ['No stop has this name', 'Check the spelling on the stop sign']
const CHECK_MESSAGES = ['Enter at least 2 letters', 'Use letters, not digits']

/** Base UI's several messages, as a list: two from the server, then two from `validate`. */
export const SeveralMessages: Story = {
  args: {
    name: 'stop',
    validationMode: 'onBlur',
    validate: (value) => (typeof value === 'string' && /^\d$/.test(value) ? CHECK_MESSAGES : null),
  },
  decorators: [
    (Story) => (
      <Form errors={{ stop: SERVER_MESSAGES }}>
        <Story />
      </Form>
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const control = controlIn(canvasElement)
    const start = document.activeElement
    /** The error's list, its items' text, and the list's own spacing (Tokens). */
    const listed = async (messages: string[]) => {
      const list = await waitFor(() => {
        const found = part(canvasElement, 'error')?.querySelector('ul')
        expect(found).toBeTruthy()
        return found!
      })
      await expect(Array.from(list.querySelectorAll('li'), (item) => item.textContent)).toEqual(
        messages,
      )
      await expect(getComputedStyle(list).marginBlockStart).toBe('0px')
      await expect(getComputedStyle(list).marginBlockEnd).toBe('0px')
      await expect(getComputedStyle(list).paddingInlineStart).toBe(
        rendered('space-400', 'padding-inline-start'),
      )
      await expect(control).toHaveAttribute('aria-invalid', 'true')
      await expect(control).toHaveAccessibleDescription(`${DESCRIPTION} ${messages.join(' ')}`)
    }
    await step('the server’s two messages show as a list', async () => {
      await listed(SERVER_MESSAGES)
    })
    await step('a digit, then Tab out, shows the two messages of the checks', async () => {
      await userEvent.tab()
      await userEvent.type(control, '4')
      await userEvent.tab()
      await listed(CHECK_MESSAGES)
      await expect(document.activeElement).toBe(start)
    })
  },
}

const COMPOUND = 'Hovedstadsområdetsbuslinjestoppestedsoversigtskortudgivelsen'

/** Whether `word`, inside `element`'s text, breaks across more than one line itself. */
const breaks = (element: Element, word: string) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const start = node.textContent!.indexOf(word)
    if (start === -1) continue
    const range = document.createRange()
    range.setStart(node, start)
    range.setEnd(node, start + word.length)
    return range.getClientRects().length > 1
  }
  return false
}

/** A Danish compound longer than its line in the label, the description and the error (CR-8). */
export const LongWords: Story = {
  args: {
    label: COMPOUND,
    description: `Som skrevet i ${COMPOUND}`,
    error: `Skriv navnet fra ${COMPOUND}`,
  },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector('.pn-Field')!.getBoundingClientRect()
    for (const name of ['label', 'description', 'error'] as const) {
      const element = part(canvasElement, name)!
      await expect(lines(element)).toBeGreaterThan(1.5)
      // the compound itself breaks, inside the word, not only at the space before it
      await expect(breaks(element, COMPOUND)).toBe(true)
      await expect(element.getBoundingClientRect().right).toBeLessThanOrEqual(field.right + 0.5)
      await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth)
    }
  },
}
