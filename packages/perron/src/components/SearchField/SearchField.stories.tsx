// SearchField's stories: the variants of the deferred design, Default, Hover, Focus, Open and
// Disabled, and the stories of content and behaviour the spec's Stories table names, each in a
// 320 px container, with play tests for the keys, the clear button, the empty message and the
// names (docs/components/search-field.md). Hover and focus render at rest; their plays drive them.
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { colour, heard, mounted } from '../../testing/stories.ts'
import { LineBadge } from '../LineBadge/LineBadge.tsx'
import { StationIcon } from '../StationIcon/StationIcon.tsx'
import { SearchField } from './SearchField.tsx'
import type { SearchFieldItem, SearchFieldProps } from './SearchField.tsx'

const LABEL = 'Search lines and stops'
const PLACEHOLDER = 'Line or stop, such as 5C'

const ITEMS: SearchFieldItem[] = [
  { value: 'stop-norreport', label: 'Nørreport St.', description: 'Metro, S-tog and bus' },
  { value: 'stop-norrebro', label: 'Nørrebro St.', description: 'S-tog and bus' },
  { value: 'stop-norrebros-runddel', label: 'Nørrebros Runddel', description: 'Bus' },
  { value: 'stop-nordhavn', label: 'Nordhavn St.', description: 'S-tog' },
  { value: 'line-5c', label: '5C', description: 'Bus, Husum Torv to Lufthavnen' },
]

/** Every word the caller gives in the meta's args: the label, the placeholder and the items. */
const CALLER = [
  LABEL,
  PLACEHOLDER,
  ...ITEMS.flatMap((item) => [item.label, String(item.description)]),
]

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  args: {
    label: LABEL,
    placeholder: PLACEHOLDER,
    items: ITEMS,
    onChange: fn(),
    onOpen: fn(),
    onClose: fn(),
    onItemSelect: fn(),
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
  // renders in its own iframe, tall enough for the open list (CR-16).
  parameters: { docs: { story: { inline: false, height: '360px' } } },
} satisfies Meta<typeof SearchField>

export default meta

type Story = StoryObj<typeof meta>

/** The field's input, the combobox, in the story's canvas. */
const inputIn = (canvasElement: HTMLElement, name = LABEL) =>
  within(canvasElement).getByRole<HTMLInputElement>('combobox', { name })

/** The open list, found through `screen`: it portals outside the canvas. */
const listbox = () => screen.findByRole('listbox')

/** The open popup, the glass panel round the list. */
const popup = async () => (await listbox()).closest('.pn-SearchField-popup') as HTMLElement

/** Resolves once no list is in the document. */
const listClosed = () =>
  waitFor(() => expect(document.querySelector('.pn-SearchField-popup')).toBeNull())

/**
 * The screen-reader-only Dismiss controls Base UI 1.9.0 adds while the list is open, one before the
 * input and one after the popup, named in its own English (spec, Keyboard and ARIA).
 */
const dismissControls = () => document.querySelectorAll('[role="button"][aria-label="Dismiss"]')

/** The id of the option the input's `aria-activedescendant` names, as its text. */
const highlighted = (input: HTMLElement) => {
  const id = input.getAttribute('aria-activedescendant')
  return id
    ? document.getElementById(id)?.querySelector('.pn-SearchField-itemLabel')?.textContent
    : null
}

/** A length token as it renders, through a probe that reads it as an outline's width or offset. */
function outline(property: 'outlineWidth' | 'outlineOffset', token: `--perron-${string}`) {
  const probe = document.createElement('span')
  probe.style.outlineStyle = 'solid'
  probe.style[property] = `var(${token})`
  document.body.append(probe)
  const rendered = getComputedStyle(probe)[property]
  probe.remove()
  return rendered
}

/**
 * The declarations hovering `element` adds: each rule inside `(hover: hover)` whose selector,
 * without `:hover`, matches it. A script's events can't set `:hover`, so this reads the rule the
 * pointer triggers; the visual stage hovers for real.
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

/** The subject story: the empty field, its label, icon and placeholder, the list closed. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const input = inputIn(canvasElement)
    await step('the input is a combobox named by the label, the list closed', async () => {
      await expect(input).toHaveAttribute('aria-expanded', 'false')
      await expect(input).toHaveAttribute('placeholder', PLACEHOLDER)
      // Base UI sets no type, so the input is a text one, never a search one with its own cross
      await expect(input).not.toHaveAttribute('type')
      await expect(input.type).toBe('text')
      await expect(input).toHaveAttribute('enterkeyhint', 'search')
      await expect(within(canvasElement).queryByRole('button')).toBeNull()
    })
    await step('Tab focuses the input, Shift+Tab moves focus back out', async () => {
      await userEvent.tab()
      await expect(input).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(input).not.toHaveFocus()
    })
  },
}

/** State hover: the empty field, at rest at first render; the play reads the hover rule. */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('.pn-SearchField-inputGroup')!
    const images = hoverRules(group).map((s) => s.getPropertyValue('background-image'))
    await expect(images.at(-1)).toContain('var(--perron-color-surface-hover)')
    await expect(images.at(-1)).toContain('linear-gradient')
    await expect(getComputedStyle(group).backgroundColor).toBe(
      colour('--perron-color-surface-raised'),
    )
  },
}

/** State focus: the empty field, at rest at first render; Tab gives it the ring. */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const input = inputIn(canvasElement)
    const group = canvasElement.querySelector('.pn-SearchField-inputGroup')!
    await userEvent.tab()
    await expect(input).toHaveFocus()
    await expect(input.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(group)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(colour('--perron-color-border-focus'))
    await expect(ring.outlineWidth).toBe(outline('outlineWidth', '--perron-focus-width'))
    await expect(ring.outlineOffset).toBe(outline('outlineOffset', '--perron-focus-offset'))
    await expect(getComputedStyle(input).outlineStyle).toBe('none')
    await userEvent.tab({ shift: true })
    await expect(input).not.toHaveFocus()
  },
}

/** State open: the words "Nørre" and the list open, with the three items that contain them. */
export const Open: Story = {
  args: { defaultValue: 'Nørre', defaultOpen: true },
  play: async ({ args, canvasElement, step }) => {
    const input = inputIn(canvasElement)
    const list = await listbox()
    await step('the list is a listbox named by the label, with three options', async () => {
      await expect(list).toHaveAccessibleName(LABEL)
      await expect(within(list).getAllByRole('option')).toHaveLength(3)
      expectOwnedStrings((await popup()).outerHTML, 'en', CALLER)
    })
    await step('Base UI’s known exceptions hold while the list is open', async () => {
      // two screen-reader-only Dismiss controls, Base UI's own English, outside the popup
      await expect(dismissControls()).toHaveLength(2)
      // its modal focus manager hides the label and the clear button; the input keeps its name
      await expect(canvasElement.querySelector('.pn-SearchField-label')).toHaveAttribute(
        'aria-hidden',
        'true',
      )
      await expect(canvasElement.querySelector('.pn-SearchField-clear')).toHaveAttribute(
        'aria-hidden',
        'true',
      )
      await expect(input).toHaveAccessibleName(LABEL)
    })
    await step('ArrowDown moves the highlight, focus staying on the input', async () => {
      input.focus()
      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() => expect(highlighted(input)).toBe('Nørreport St.'))
      await expect(input).toHaveFocus()
      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() => expect(highlighted(input)).toBe('Nørrebro St.'))
    })
    await step('Enter chooses the row, fills the box and closes the list', async () => {
      await userEvent.keyboard('{Enter}')
      await expect(args.onItemSelect).toHaveBeenCalledTimes(1)
      await expect(args.onItemSelect).toHaveBeenCalledWith(expect.anything(), ITEMS[1])
      await expect(input).toHaveValue('Nørrebro St.')
      await expect(args.onChange).toHaveBeenLastCalledWith(
        expect.anything(),
        'Nørrebro St.',
        expect.objectContaining({ reason: 'item-press' }),
      )
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'item-press',
        expect.anything(),
      )
      await listClosed()
      await expect(input).toHaveFocus()
      await expect(dismissControls()).toHaveLength(0)
      await expect(canvasElement.querySelector('.pn-SearchField-label')).not.toHaveAttribute(
        'aria-hidden',
      )
      input.blur()
    })
  },
}

/** State disabled: the words "5C" in the tertiary ink, no clear button, no keys. */
export const Disabled: Story = {
  args: { defaultValue: '5C', disabled: true },
  play: async ({ args, canvasElement }) => {
    const input = inputIn(canvasElement)
    await expect(input).toBeDisabled()
    await expect(within(canvasElement).queryByRole('button')).toBeNull()
    await userEvent.tab()
    await expect(input).not.toHaveFocus()
    await userEvent.type(input, 'N', { pointerEventsCheck: 0 })
    await expect(input).toHaveValue('5C')
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(args.onOpen).not.toHaveBeenCalled()
  },
}

/** The field holding the words "5C", with the clear button. */
export const Filled: Story = {
  args: { defaultValue: '5C' },
  play: async ({ args, canvasElement, step }) => {
    const input = inputIn(canvasElement)
    const clear = within(canvasElement).getByRole('button', { name: 'Clear' })
    await step('the clear button is named "Clear" and is not a tab stop', async () => {
      await expect(clear).toHaveAttribute('tabindex', '-1')
      await userEvent.tab()
      await expect(input).toHaveFocus()
      await userEvent.tab()
      await expect(clear).not.toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(input).toHaveFocus()
    })
    await step('pressing it empties the box and leaves focus on the input', async () => {
      await userEvent.click(clear)
      await expect(input).toHaveValue('')
      await expect(args.onChange).toHaveBeenLastCalledWith(
        expect.anything(),
        '',
        expect.objectContaining({ reason: 'clear-press' }),
      )
      await waitFor(() => expect(within(canvasElement).queryByRole('button')).toBeNull())
      await expect(input).toHaveFocus()
    })
    await step('Esc with the list closed empties it again', async () => {
      await userEvent.type(input, '5C')
      await listbox()
      await userEvent.keyboard('{Escape}')
      await listClosed()
      await expect(input).toHaveValue('5C')
      await userEvent.keyboard('{Escape}')
      await expect(input).toHaveValue('')
      await expect(args.onChange).toHaveBeenLastCalledWith(
        expect.anything(),
        '',
        expect.objectContaining({ reason: 'escape-key' }),
      )
      input.blur()
    })
  },
}

/** The words "Xyz" and the list open, with nothing matching: "No matches". */
export const NoMatches: Story = {
  args: { defaultValue: 'Xyz', defaultOpen: true },
  play: async ({ args, canvasElement, step }) => {
    const input = inputIn(canvasElement)
    await step('the status region holds "No matches", the list no option', async () => {
      const panel = await popup()
      // Base UI marks the first announcement with a word joiner for 200 ms; the words are its own
      await waitFor(() => expect(within(panel).getByRole('status').textContent).toBe('No matches'))
      await expect(within(panel).queryAllByRole('option')).toHaveLength(0)
      expectOwnedStrings(panel.outerHTML, 'en', CALLER)
    })
    await step('in Danish, with no override, it says the Danish dictionary’s word', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="da">
          <SearchField {...args} defaultValue="Xyz" defaultOpen />
        </PerronProvider>,
        async (host) => {
          const danish = (await within(host).findAllByRole('combobox'))[0]
          const panel = await waitFor(() => {
            const found = document
              .getElementById(danish.getAttribute('aria-controls') ?? '')
              ?.closest<HTMLElement>('.pn-SearchField-popup')
            expect(found).toBeTruthy()
            return found!
          })
          await waitFor(() =>
            expect(within(panel).getByRole('status').textContent).toBe(dictionaries.da.noMatches),
          )
          expectOwnedStrings(panel.outerHTML, 'da', CALLER)
        },
      )
    })
    await step('noMatchesLabel replaces it', async () => {
      await mounted(
        canvasElement,
        <SearchField
          {...args}
          defaultValue="Xyz"
          defaultOpen
          noMatchesLabel="No lines or stops match"
        />,
        async (host) => {
          const own = (await within(host).findAllByRole('combobox'))[0]
          await waitFor(() => {
            const status = document
              .getElementById(own.getAttribute('aria-controls') ?? '')
              ?.closest('.pn-SearchField-popup')
              ?.querySelector('[role="status"]')
            expect(status).toHaveTextContent('No lines or stops match')
          })
        },
      )
    })
    await step('Esc closes the list', async () => {
      input.focus()
      await userEvent.keyboard('{Escape}')
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'escape-key',
        expect.anything(),
      )
      await listClosed()
      input.blur()
    })
  },
}

/** The field with `hiddenLabel`, as in the top bar: the icon and the placeholder only. */
export const HiddenLabel: Story = {
  args: { hiddenLabel: true },
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('.pn-SearchField-label')!
    // the VisuallyHidden part: a span, not a <label>, in a box the eye never sees
    await expect(label.tagName).toBe('SPAN')
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    await expect(label).toHaveTextContent(LABEL)
    const input = inputIn(canvasElement)
    input.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(await listbox()).toHaveAccessibleName(LABEL)
    await userEvent.keyboard('{Escape}')
    await listClosed()
    input.blur()
  },
}

/** Rows with marks: a LineBadge before a line, a StationIcon before a stop, the list open on "5". */
const MARKED: SearchFieldItem[] = [
  {
    value: 'line-5c',
    label: '5C',
    description: 'Bus, Husum Torv to Lufthavnen',
    startIcon: <LineBadge line="bus">5C</LineBadge>,
  },
  {
    value: 'line-250s',
    label: '250S',
    description: 'Bus, Buddinge St. to Ishøj St.',
    startIcon: <LineBadge line="bus">250S</LineBadge>,
  },
  {
    value: 'stop-husum-torv-5c',
    label: 'Husum Torv, stop for 5C',
    description: 'Bus',
    startIcon: <StationIcon line="bus" />,
  },
]

export const WithMarks: Story = {
  args: { items: MARKED, defaultValue: '5', defaultOpen: true },
  play: async ({ canvasElement }) => {
    const list = await listbox()
    const options = within(list).getAllByRole('option')
    await expect(options).toHaveLength(3)
    for (const [i, option] of options.entries()) {
      const item = MARKED[i]
      await expect(heard(option)).toContain(item.label)
      await expect(heard(option)).toContain(item.description as string)
      const mark = option.querySelector('.pn-SearchField-startIcon')!
      await expect(heard(option)).toContain(heard(mark))
      const text = option.querySelector('.pn-SearchField-text')!
      await expect(mark.getBoundingClientRect().right).toBeLessThanOrEqual(
        text.getBoundingClientRect().left,
      )
    }
    await expect(options[0]).toHaveAccessibleName('5C 5C Bus, Husum Torv to Lufthavnen')
    const input = inputIn(canvasElement)
    input.focus()
    await userEvent.keyboard('{Escape}')
    await listClosed()
    input.blur()
  },
}

/** `filter={null}`: every item as given, though none contains the words "zz". */
export const CallerFilter: Story = {
  args: { filter: null, defaultValue: 'zz', defaultOpen: true },
  play: async ({ canvasElement }) => {
    const list = await listbox()
    await expect(within(list).getAllByRole('option')).toHaveLength(ITEMS.length)
    const input = inputIn(canvasElement)
    input.focus()
    await userEvent.keyboard('{Escape}')
    await listClosed()
    input.blur()
  },
}

/** `value` and `open` held in the story's state, the list closed at first. */
export const Controlled: Story = {
  render: function Render(args: SearchFieldProps) {
    const [value, setValue] = useState('')
    const [open, setOpen] = useState(false)
    return (
      <SearchField
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
    const input = inputIn(canvasElement)
    await step('typing "N" changes the words and opens the list', async () => {
      await userEvent.click(input)
      await userEvent.keyboard('N')
      await expect(args.onChange).toHaveBeenLastCalledWith(
        expect.anything(),
        'N',
        expect.objectContaining({ reason: 'input-change' }),
      )
      await expect(args.onOpen).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ reason: 'input-change' }),
      )
      await expect(input).toHaveValue('N')
      await listbox()
    })
    await step('ArrowDown moves the highlight', async () => {
      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() => expect(highlighted(input)).toBe('Nørreport St.'))
    })
    await step('Esc calls onClose with escape-key, and the story closes the list', async () => {
      await userEvent.keyboard('{Escape}')
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'escape-key',
        expect.anything(),
      )
      await listClosed()
    })
    await step('a press outside calls onClose with outside-press', async () => {
      await userEvent.keyboard('{ArrowDown}')
      await listbox()
      // a press on the page, which takes no focus, so the input keeps it
      fireEvent.pointerDown(document.body)
      fireEvent.mouseDown(document.body)
      fireEvent.pointerUp(document.body)
      fireEvent.mouseUp(document.body)
      fireEvent.click(document.body)
      await waitFor(() =>
        expect(args.onClose).toHaveBeenLastCalledWith(
          expect.anything(),
          'outside-press',
          expect.anything(),
        ),
      )
      await listClosed()
      await expect(input).toHaveFocus()
    })
  },
}

const COMPOUND = 'Hovedstadsområdetsbuslinjestoppestedsoversigten'

/** Long Danish compounds in the label and a row, the list open, in the 320 px container. */
export const LongWords: Story = {
  args: {
    label: `Søg ${COMPOUND}`,
    items: [
      {
        value: 'stop-long',
        label: `Nør${COMPOUND}`,
        description: `Trafikinformationsformidlingssystemet${COMPOUND}`,
      },
    ],
    defaultValue: 'Nør',
    defaultOpen: true,
  },
  play: async ({ canvasElement }) => {
    const lines = (element: Element) => {
      const { lineHeight } = getComputedStyle(element)
      return element.getBoundingClientRect().height / Number.parseFloat(lineHeight)
    }
    const field = canvasElement.querySelector('.pn-SearchField')!
    const label = canvasElement.querySelector('.pn-SearchField-label')!
    const group = canvasElement.querySelector('.pn-SearchField-inputGroup')!
    await expect(lines(label)).toBeGreaterThan(1.5)
    await expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(
      field.getBoundingClientRect().right + 0.5,
    )
    const panel = await popup()
    const itemLabel = panel.querySelector('.pn-SearchField-itemLabel')!
    const description = panel.querySelector('.pn-SearchField-description')!
    await expect(lines(itemLabel)).toBeGreaterThan(1.5)
    await expect(lines(description)).toBeGreaterThan(1.5)
    const box = panel.getBoundingClientRect()
    await expect(box.width).toBeLessThanOrEqual(group.getBoundingClientRect().width + 0.5)
    for (const part of [itemLabel, description])
      await expect(part.getBoundingClientRect().right).toBeLessThanOrEqual(box.right)
    await expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth)
    const input = inputIn(canvasElement, `Søg ${COMPOUND}`)
    input.focus()
    await userEvent.keyboard('{Escape}')
    await listClosed()
    input.blur()
  },
}
