// Select's stories: the variants of the deferred design, Default, Hover, Focus, Open, Disabled and
// Invalid, and the stories of content and behaviour the spec's Stories table names, each in a
// 320 px container, with play tests for the keys, the names, the forms and the long words
// (docs/components/select.md). Hover and focus render at rest; their plays drive them.
import { useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import type { Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { closed, colour, lines, mounted, onHover, rendered } from '../../testing/stories.ts'
import { Select } from './Select.tsx'
import type { SelectGroup, SelectItem, SelectProps } from './Select.tsx'

const LABEL = 'Transport mode'
const PLACEHOLDER = 'Choose a transport mode'

const ITEMS: SelectItem[] = [
  { value: 'metro', label: 'Metro' },
  { value: 's-tog', label: 'S-tog' },
  { value: 'bus', label: 'Bus' },
  { value: 'regional', label: 'Regional train' },
  { value: 'harbour-bus', label: 'Harbour bus' },
]

/** Every word the caller gives in the meta's args: the label, the placeholder and the items. */
const CALLER = [LABEL, PLACEHOLDER, ...ITEMS.map((item) => item.label)]

const meta = {
  title: 'Components/Select',
  component: Select,
  args: {
    label: LABEL,
    placeholder: PLACEHOLDER,
    items: ITEMS,
    onChange: fn(),
    onOpen: fn(),
    onClose: fn(),
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
  // The list portals to the end of <body>, placed under the box, so on the docs page each story
  // renders in its own iframe, tall enough for the tallest open list, Groups', not to scroll (CR-16).
  parameters: {
    docs: { story: { inline: false, height: '480px' } },
    // the placeholder is a hint in color.text.tertiary, a miss Accessibility lists by name
    // (docs/foundations/accessibility.md), as a native input's placeholder is, which axe never
    // checks; so in the stories that show it axe's contrast rule passes over the placeholder
    // alone, and checks the rest (CR-16)
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', selector: '*:not(.pn-Select-value[data-placeholder])' }],
      },
    },
  },
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

/** The field's trigger, the combobox, in `scope`. */
const triggerIn = (scope: HTMLElement, name: string | RegExp = LABEL) =>
  within(scope).getByRole<HTMLButtonElement>('combobox', { name })

/** One part of the field in `scope`, by its class. */
const part = (scope: Element, name: string) => scope.querySelector<HTMLElement>(`.pn-${name}`)

/** The open list, found through `screen`: it portals outside the canvas. */
const listbox = () => screen.findByRole('listbox')

/** The list's role: Base UI keeps the closed list mounted, `hidden`, so it is closed once no
 * listbox is in the accessibility tree. */
const LIST = 'listbox'

/** The open popup, the glass panel round the list. */
const popup = async () => (await listbox()).closest<HTMLElement>('.pn-Select-popup')!

/** The open list's option named `name`. */
const option = async (name: string) =>
  within(await listbox()).getByRole('option', { name, hidden: true })

/** Resolves once focus is inside the open popup, where Base UI moves it on open. */
const focusIn = async () => {
  const panel = await popup()
  await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))
  return panel
}

/** Resolves once `name`'s row holds the highlight and the focus, as the keys leave it. */
const reached = async (name: string) => {
  const row = await option(name)
  await waitFor(() => expect(row).toHaveAttribute('data-highlighted'))
  await waitFor(() => expect(row).toHaveFocus())
  return row
}

/** The subject story, State default: the label, the trigger with "Metro" chosen, the list closed.
 * The contract story Root renders these args without this file's meta, and so without its
 * placeholder exception, so they choose a value and no placeholder renders (CR-16). */
export const Default: Story = {
  args: { defaultValue: 'metro' },
  play: async ({ args, canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the trigger is a combobox named by the label, the list closed', async () => {
      await expect(trigger.tagName).toBe('BUTTON')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      const value = part(canvasElement, 'Select-value')!
      await expect(value).not.toHaveAttribute('data-placeholder')
      await expect(value).toHaveTextContent(/^Metro$/)
      await expect(getComputedStyle(value).color).toBe(colour('--perron-color-text-primary'))
    })
    await step('pressing the label focuses the trigger, the list staying closed', async () => {
      const label = part(canvasElement, 'Field-label')!
      await expect(label.tagName).toBe('DIV')
      await userEvent.click(label)
      await expect(trigger).toHaveFocus()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(screen.queryByRole('listbox')).toBeNull()
      await expect(args.onOpen).not.toHaveBeenCalled()
      trigger.blur()
    })
    await step('Tab focuses the trigger, Shift+Tab moves focus back out', async () => {
      await userEvent.tab()
      await expect(trigger).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(trigger).not.toHaveFocus()
    })
  },
}

/** State hover: the trigger, at rest at first render; the play reads the hover rule. */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const trigger = triggerIn(canvasElement)
    const image = onHover(trigger, 'background-image')
    await expect(image).toContain('linear-gradient')
    await expect(image).toContain('var(--perron-color-surface-hover)')
    await expect(getComputedStyle(trigger).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
  },
}

/** State focus: the trigger, at rest at first render; Tab gives it perron.css's ring. */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const trigger = triggerIn(canvasElement)
    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await expect(trigger.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(trigger)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(colour('--perron-color-border-focus'))
    await expect(ring.outlineWidth).toBe(rendered('focus-width', 'outline-width'))
    await expect(ring.outlineOffset).toBe(rendered('focus-offset', 'outline-offset'))
    await userEvent.tab({ shift: true })
    await expect(trigger).not.toHaveFocus()
  },
}

/** State open: "S-tog" chosen and the list open, its row highlighted, with its fill and tick. */
export const Open: Story = {
  args: { defaultValue: 's-tog', defaultOpen: true },
  play: async ({ args, canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    const list = await listbox()
    await step('the list is a listbox named by the label, with five options', async () => {
      await expect(list).toHaveAccessibleName(LABEL)
      await expect(within(list).getAllByRole('option', { hidden: true })).toHaveLength(5)
      expectOwnedStrings((await popup()).outerHTML, 'en', CALLER)
    })
    await step(
      '"S-tog" is chosen, highlighted and ticked; the trigger keeps its rest look',
      async () => {
        const row = await reached('S-tog')
        await expect(row).toHaveAttribute('aria-selected', 'true')
        await expect(row.querySelector('.pn-Select-itemIndicator svg')).not.toBeNull()
        await expect(getComputedStyle(row).backgroundColor).toBe(
          colour('--perron-color-surface-selected'),
        )
        await expect(getComputedStyle(row).backgroundImage).toContain('linear-gradient')
        await expect(trigger).toHaveAttribute('data-popup-open')
        await expect(getComputedStyle(trigger).backgroundColor).toBe(
          colour('--perron-color-surface-raised'),
        )
        await expect(getComputedStyle(trigger).borderTopColor).toBe(
          colour('--perron-color-border-control'),
        )
      },
    )
    await step('ArrowDown moves the highlight and focus to "Bus"', async () => {
      await userEvent.keyboard('{ArrowDown}')
      await reached('Bus')
    })
    await step('typing "r" moves them to "Regional train", ArrowUp back to "Bus"', async () => {
      await userEvent.keyboard('r')
      await reached('Regional train')
      await userEvent.keyboard('{ArrowUp}')
      await reached('Bus')
    })
    await step('Enter chooses it, closes the list and returns focus to the trigger', async () => {
      await userEvent.keyboard('{Enter}')
      await expect(args.onChange).toHaveBeenLastCalledWith(
        expect.anything(),
        'bus',
        expect.objectContaining({ reason: 'item-press' }),
      )
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'item-press',
        expect.anything(),
      )
      await closed(LIST)
      await expect(trigger).toHaveTextContent('Bus')
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
  },
}

/** State disabled: "Metro" chosen, the trigger's words and chevron in `color.text.tertiary`. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'metro' },
  parameters: {
    // a disabled field's words are color.text.tertiary, a miss Accessibility lists by name
    // (docs/foundations/accessibility.md) and WCAG 1.4.3 exempts for an inactive control, so
    // axe's contrast rule is off for this story alone (CR-16)
    a11y: { options: { rules: { 'color-contrast': { enabled: false } } } },
  },
  play: async ({ args, canvasElement }) => {
    const trigger = triggerIn(canvasElement)
    await expect(trigger).toBeDisabled()
    await expect(part(canvasElement, 'Select')).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(trigger).not.toHaveFocus()
    await userEvent.click(trigger, { pointerEventsCheck: 0 })
    await expect(screen.queryByRole('listbox')).toBeNull()
    await expect(args.onOpen).not.toHaveBeenCalled()
    await expect(args.onChange).not.toHaveBeenCalled()
    const tertiary = colour('--perron-color-text-tertiary')
    await expect(getComputedStyle(trigger).color).toBe(tertiary)
    await expect(getComputedStyle(part(canvasElement, 'Select-icon')!).color).toBe(tertiary)
    await userEvent.tab({ shift: true })
  },
}

/** State invalid: the error under the trigger, the trigger's edge in `color.status.danger`. */
export const Invalid: Story = {
  args: { error: 'Choose a transport mode' },
  play: async ({ canvasElement }) => {
    const trigger = triggerIn(canvasElement)
    const error = part(canvasElement, 'Field-error')!
    await expect(trigger).toHaveAttribute('aria-invalid', 'true')
    await expect(trigger).toHaveAttribute('data-invalid')
    await waitFor(() => expect(trigger.getAttribute('aria-describedby')).toContain(error.id))
    await expect(trigger).toHaveAccessibleDescription('Choose a transport mode')
    await expect(getComputedStyle(error).color).toBe(colour('--perron-color-text-danger'))
    await expect(getComputedStyle(trigger).borderTopColor).toBe(
      colour('--perron-color-status-danger'),
    )
  },
}

/** "Metro" chosen by `defaultValue`. */
export const Filled: Story = {
  args: { defaultValue: 'metro' },
  play: async ({ args, canvasElement }) => {
    const trigger = triggerIn(canvasElement)
    const value = part(canvasElement, 'Select-value')!
    await expect(value).toHaveTextContent(/^Metro$/)
    await expect(value).not.toHaveAttribute('data-placeholder')
    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await userEvent.keyboard('b')
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith(
        expect.anything(),
        'bus',
        expect.objectContaining({ reason: 'none' }),
      ),
    )
    await expect(value).toHaveTextContent(/^Bus$/)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(args.onOpen).not.toHaveBeenCalled()
    await userEvent.tab({ shift: true })
  },
}

const LINES: SelectGroup[] = [
  {
    label: 'Metro',
    items: ['M1', 'M2', 'M3', 'M4'].map((line) => ({ value: `metro-${line}`, label: line })),
  },
  {
    label: 'S-tog',
    items: ['A', 'B', 'C', 'E', 'F', 'H'].map((line) => ({ value: `s-tog-${line}`, label: line })),
  },
]

/** The label "Line", the list open, with the groups "Metro" and "S-tog" and a hairline between. */
export const Groups: Story = {
  args: { label: 'Line', placeholder: 'Choose a line', items: LINES, defaultOpen: true },
  play: async ({ args, canvasElement, step }) => {
    const trigger = triggerIn(canvasElement, 'Line')
    const list = await listbox()
    await step('two groups, named by their labels, with one separator between', async () => {
      const groups = within(list).getAllByRole('group', { hidden: true })
      await expect(groups).toHaveLength(2)
      await expect(groups[0]).toHaveAccessibleName('Metro')
      await expect(groups[1]).toHaveAccessibleName('S-tog')
      const separators = list.querySelectorAll('.pn-Select-separator')
      await expect(separators).toHaveLength(1)
      await expect(separators[0].previousElementSibling).toBe(groups[0])
      await expect(separators[0].nextElementSibling).toBe(groups[1])
      expectOwnedStrings((await popup()).outerHTML, 'en', [
        'Line',
        'Choose a line',
        ...LINES.flatMap((group) => [group.label, ...group.items.map((item) => item.label)]),
      ])
    })
    await step('End moves focus to "H", Home back to "M1"', async () => {
      await focusIn()
      await userEvent.keyboard('{End}')
      await reached('H')
      await userEvent.keyboard('{Home}')
      await reached('M1')
    })
    await step('Esc closes the list and returns focus to the trigger', async () => {
      await userEvent.keyboard('{Escape}')
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'escape-key',
        expect.anything(),
      )
      await closed(LIST)
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
  },
}

/** The list open, "Harbour bus" given `disabled`. */
export const DisabledItem: Story = {
  args: {
    items: ITEMS.map((item) => (item.value === 'harbour-bus' ? { ...item, disabled: true } : item)),
    defaultOpen: true,
  },
  play: async ({ args, canvasElement }) => {
    const trigger = triggerIn(canvasElement)
    expectOwnedStrings((await popup()).outerHTML, 'en', CALLER)
    const harbour = await option('Harbour bus')
    await expect(harbour).toHaveAttribute('aria-disabled', 'true')
    await expect(getComputedStyle(harbour).color).toBe(colour('--perron-color-text-tertiary'))
    // opened by defaultOpen with nothing chosen, the popup holds focus and no row the highlight
    await focusIn()
    for (const name of ['Metro', 'S-tog', 'Bus', 'Regional train', 'Harbour bus']) {
      await userEvent.keyboard('{ArrowDown}')
      await reached(name)
    }
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(await listbox()).toBeInTheDocument()
    await expect(harbour).not.toHaveAttribute('aria-selected', 'true')
    // Tab leaves the list: Base UI closes it and puts focus back on the trigger, not past it
    await userEvent.tab()
    await expect(args.onClose).toHaveBeenLastCalledWith(
      expect.anything(),
      'focus-out',
      expect.anything(),
    )
    await closed(LIST)
    await waitFor(() => expect(trigger).toHaveFocus())
    trigger.blur()
  },
}

/** `readOnly`, "Metro" chosen: the list opens, but the value can't change. */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 'metro' },
  play: async ({ args, canvasElement }) => {
    const trigger = triggerIn(canvasElement)
    await expect(trigger).toHaveAttribute('aria-readonly', 'true')
    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await reached('Metro')
    await userEvent.keyboard('{ArrowDown}')
    await reached('S-tog')
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(part(canvasElement, 'Select-value')).toHaveTextContent(/^Metro$/)
    await expect(await listbox()).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await closed(LIST)
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.tab({ shift: true })
  },
}

/** `value` and `open` held in the story's state, the list closed at first. */
export const Controlled: Story = {
  render: function Render(args: SelectProps) {
    const [value, setValue] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    return (
      <Select
        {...args}
        value={value}
        open={open}
        onChange={(...change) => {
          args.onChange?.(...change)
          setValue(change[1])
        }}
        onOpen={(...opening) => {
          args.onOpen?.(...opening)
          setOpen(true)
        }}
        onClose={(...closing) => {
          args.onClose?.(...closing)
          setOpen(false)
        }}
      />
    )
  },
  play: async ({ args, canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    const value = part(canvasElement, 'Select-value')!
    await step('nothing chosen, the value shows the placeholder in tertiary ink', async () => {
      await expect(value).toHaveAttribute('data-placeholder')
      await expect(value).toHaveTextContent(PLACEHOLDER)
      await expect(getComputedStyle(value).color).toBe(colour('--perron-color-text-tertiary'))
    })
    await step('pressing the trigger asks to open, and the story opens the list', async () => {
      await userEvent.click(trigger)
      // Base UI opens on the press, a frame after it, once focus has settled
      await waitFor(() =>
        expect(args.onOpen).toHaveBeenLastCalledWith(
          expect.anything(),
          expect.objectContaining({ reason: 'trigger-press' }),
        ),
      )
      await listbox()
    })
    await step('a second press of the trigger asks to close, and the story closes it', async () => {
      await userEvent.click(trigger)
      await waitFor(() =>
        expect(args.onClose).toHaveBeenLastCalledWith(
          expect.anything(),
          'trigger-press',
          expect.anything(),
        ),
      )
      await closed(LIST)
    })
    await step('ArrowUp with nothing chosen opens the list on the last option', async () => {
      await waitFor(() => expect(trigger).toHaveFocus())
      await userEvent.keyboard('{ArrowUp}')
      await expect(args.onOpen).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ reason: 'list-navigation' }),
      )
      await reached('Harbour bus')
    })
    await step('choosing "Bus" changes the value and closes the list', async () => {
      await userEvent.click(await option('Bus'))
      await expect(args.onChange).toHaveBeenLastCalledWith(
        expect.anything(),
        'bus',
        expect.objectContaining({ reason: 'item-press' }),
      )
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'item-press',
        expect.anything(),
      )
      await closed(LIST)
      await expect(trigger).toHaveTextContent('Bus')
      await expect(value).not.toHaveAttribute('data-placeholder')
    })
    await step('a press outside asks to close, and the story closes the list', async () => {
      // opened again from the keys: a synthetic press releases faster than Base UI listens for
      // the release, which it would read as a cancelled open
      await waitFor(() => expect(trigger).toHaveFocus())
      await userEvent.keyboard('{ArrowDown}')
      await listbox()
      await userEvent.click(document.body)
      await waitFor(() =>
        expect(args.onClose).toHaveBeenLastCalledWith(
          expect.anything(),
          'outside-press',
          expect.anything(),
        ),
      )
      await closed(LIST)
      trigger.blur()
    })
  },
}

/** A `validate` that asks for a choice, checked on blur; valid at first. */
export const Validation: Story = {
  args: {
    validationMode: 'onBlur',
    validate: (value) => (value ? null : 'Choose a transport mode'),
  },
  play: async ({ args, canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    const start = document.activeElement
    await step('the field is valid at first, with no error', async () => {
      await expect(part(canvasElement, 'Field-error')).toBeNull()
      await expect(trigger).not.toHaveAttribute('aria-invalid')
    })
    await step('Tab to the trigger and out shows the message', async () => {
      await userEvent.tab()
      await expect(trigger).toHaveFocus()
      await userEvent.tab()
      await waitFor(() =>
        expect(part(canvasElement, 'Field-error')).toHaveTextContent(/^Choose a transport mode$/),
      )
      await expect(trigger).toHaveAttribute('aria-invalid', 'true')
    })
    await step('choosing "Metro" and Tab out removes it', async () => {
      await userEvent.tab({ shift: true })
      await expect(trigger).toHaveFocus()
      await userEvent.keyboard('m')
      await expect(part(canvasElement, 'Select-value')).toHaveTextContent(/^Metro$/)
      await userEvent.tab()
      await waitFor(() => expect(part(canvasElement, 'Field-error')).toBeNull())
      await expect(trigger).not.toHaveAttribute('aria-invalid')
      await expect(document.activeElement).toBe(start)
    })
    await step('`required` reaches the trigger and the hidden input', async () => {
      await mounted(canvasElement, <Select {...args} required name="mode" />, async (host) => {
        const required = await waitFor(() => triggerIn(host))
        await expect(required).toHaveAttribute('aria-required', 'true')
        const input = host.querySelector<HTMLInputElement>('input[name="mode"]')!
        await expect(input.required).toBe(true)
        await expect(input).toHaveAttribute('aria-hidden', 'true')
        // Base UI holds back a required field's valueMissing until its value has changed, so a
        // Tab past it with nothing chosen leaves it valid
        required.focus()
        await userEvent.tab()
        await expect(required).not.toHaveAttribute('aria-invalid')
      })
    })
  },
}

/** `hiddenLabel`: the trigger alone, no label in view, still named "Transport mode". */
export const HiddenLabel: Story = {
  args: { hiddenLabel: true },
  play: async ({ canvasElement }) => {
    const label = part(canvasElement, 'Field-label')!
    // the VisuallyHidden part, through Field: a span the eye never sees
    await expect(label.tagName).toBe('SPAN')
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    const trigger = triggerIn(canvasElement)
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(await listbox()).toHaveAccessibleName(LABEL)
    await userEvent.keyboard('{Escape}')
    await closed(LIST)
    trigger.blur()
  },
}

/** Renders `args` in `locale` on the server, as the owned-strings check reads a render. */
const markup = (args: SelectProps, locale: Locale) =>
  renderToStaticMarkup(
    <PerronProvider locale={locale}>
      <Select {...args} />
    </PerronProvider>,
  )

/** `optional`: the label reads "Transport mode (optional)". */
export const Optional: Story = {
  args: { optional: true },
  play: async ({ args, canvasElement, step }) => {
    await step('the mark is part of the trigger’s name', async () => {
      await expect(triggerIn(canvasElement, 'Transport mode (optional)')).toBeInTheDocument()
    })
    await step('optionalLabel replaces the mark', async () => {
      await mounted(canvasElement, <Select {...args} optionalLabel="(if any)" />, async (host) => {
        await waitFor(() => expect(triggerIn(host, 'Transport mode (if any)')).toBeInTheDocument())
      })
    })
    await step('its render says only the dictionary’s and the caller’s words (CR-15)', async () => {
      for (const locale of ['en', 'da', 'sv', 'nb'] as const)
        expectOwnedStrings(markup(args, locale), locale, CALLER)
    })
  },
}

const COMPOUND = 'Hovedstadsområdetsbuslinjestoppestedsoversigten'
const LONG_GROUPS: SelectGroup[] = [
  {
    label: `Busser i ${COMPOUND}`,
    items: [
      { value: 'long', label: `Nør${COMPOUND}` },
      { value: 'bus', label: 'Bus' },
    ],
  },
]

/** Danish compounds longer than their line in the label, an option and a group label. */
export const LongWords: Story = {
  args: {
    label: `Transport i ${COMPOUND}`,
    items: LONG_GROUPS,
    defaultValue: 'long',
    defaultOpen: true,
  },
  play: async ({ canvasElement }) => {
    const trigger = triggerIn(canvasElement, `Transport i ${COMPOUND}`)
    const panel = await popup()
    expectOwnedStrings(panel.outerHTML, 'en', [
      `Transport i ${COMPOUND}`,
      PLACEHOLDER,
      ...LONG_GROUPS.flatMap((group) => [group.label, ...group.items.map((item) => item.label)]),
    ])
    const text = panel.querySelector('.pn-Select-itemText')!
    const groupLabel = panel.querySelector('.pn-Select-groupLabel')!
    for (const element of [text, groupLabel]) {
      await expect(lines(element)).toBeGreaterThan(1.5)
      await expect(element.getBoundingClientRect().right).toBeLessThanOrEqual(
        panel.getBoundingClientRect().right,
      )
    }
    await expect(panel.getBoundingClientRect().width).toBeLessThanOrEqual(
      trigger.getBoundingClientRect().width + 0.5,
    )
    const list = panel.querySelector('.pn-Select-list')!
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth)
    const value = part(canvasElement, 'Select-value')!
    await expect(lines(value)).toBeLessThan(1.5)
    await expect(value.scrollWidth).toBeGreaterThan(value.clientWidth)
    await expect(getComputedStyle(value).textOverflow).toBe('ellipsis')
    await expect(trigger).toHaveTextContent(`Nør${COMPOUND}`)
    await expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth)
    await userEvent.keyboard('{Escape}')
    await closed(LIST)
    trigger.blur()
  },
}
