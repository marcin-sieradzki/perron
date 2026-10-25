// CheckboxGroup's stories: the variants of the deferred design, Default, Disabled and Invalid, and
// the stories of content and behaviour the spec's Stories table names
// (docs/components/checkbox-group.md), each on a raised Surface in a 320 px container, in English.
// The checkboxes are Perron's Checkbox; the group draws none of their looks.
import { createRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { colour, lines, mounted, resolve, typography } from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { Checkbox } from '../Checkbox/Checkbox.tsx'
import { Fieldset } from '../Fieldset/Fieldset.tsx'
import { Section } from '../Section/Section.tsx'
import { Surface } from '../Surface/Surface.tsx'
import { CheckboxGroup, type CheckboxGroupProps } from './CheckboxGroup.tsx'

const LABEL = 'Show on the map'
const DESCRIPTION = 'The map shows vehicles of the ticked modes only'
const ERROR = 'Choose at least one mode'
const MODES = [
  { word: 'Bus', value: 'bus' },
  { word: 'Metro', value: 'metro' },
  { word: 'S-tog', value: 's-tog' },
] as const
const ALL = MODES.map((mode) => mode.value)

/** The three checkboxes, "S-tog" disabled when asked. */
const boxes = (disabledValue?: string) =>
  MODES.map(({ word, value }) => (
    <Checkbox key={value} value={value} disabled={value === disabledValue}>
      {word}
    </Checkbox>
  ))

const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup,
  // every word the caller gives and the checkboxes, so any story renders alone
  args: {
    label: LABEL,
    description: DESCRIPTION,
    defaultValue: ['bus'],
    children: boxes(),
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <PerronProvider locale="en">
        <Surface variant="raised" style={{ inlineSize: 320, maxInlineSize: '100%' }}>
          <Story />
        </Surface>
      </PerronProvider>
    ),
  ],
} satisfies Meta<typeof CheckboxGroup>

export default meta

type Story = StoryObj<typeof meta>

/** The group in `scope`, by its name. */
const groupIn = (scope: HTMLElement, name: string | RegExp = LABEL) =>
  within(scope).getByRole('group', { name })

/** One checkbox in `scope`, by its label. */
const box = (scope: HTMLElement, name: string) => within(scope).getByRole('checkbox', { name })

/** Every checkbox in `scope`. */
const allBoxes = (scope: HTMLElement) => within(scope).getAllByRole('checkbox')

/** One part of the group in `scope`, by its class, or null when it isn't rendered. */
const part = (scope: Element, name: 'legend' | 'description' | 'error') =>
  scope.querySelector<HTMLElement>(`.pn-CheckboxGroup-${name}`)

/** Whether `a` comes before `b` in the document. */
const before = (a: Node, b: Node) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

/** The values ticked, in document order. */
const ticked = (scope: HTMLElement) =>
  allBoxes(scope)
    .filter((root) => root.getAttribute('aria-checked') === 'true')
    .map((root) => root.textContent)

/** The spy the meta's args give as `onChange`, cleared. */
const spy = (args: { onChange?: unknown }) => {
  const onChange = args.onChange as ReturnType<typeof fn>
  onChange.mockClear()
  return onChange
}

/** The subject story, State default: the legend, the description and "Bus" ticked. */
export const Default: Story = {
  play: async ({ args, canvasElement, step }) => {
    const onChange = spy(args)
    const group = groupIn(canvasElement)
    const legend = part(group, 'legend')!
    const description = part(group, 'description')!
    await step(
      'one <div role="group">, named by the legend and described by the help',
      async () => {
        await expect(group.tagName).toBe('DIV')
        await expect(group).toHaveClass('pn-Fieldset', 'pn-CheckboxGroup')
        await expect(group).toHaveAttribute('aria-labelledby', legend.id)
        await expect(group).toHaveAccessibleDescription(DESCRIPTION)
        await expect(legend).toHaveClass('pn-Fieldset-legend', 'pn-CheckboxGroup-legend')
        await expect(description.tagName).toBe('P')
        const ref = createRef<HTMLElement>()
        await mounted(
          canvasElement,
          <CheckboxGroup ref={ref} label="Lines">
            {boxes()}
          </CheckboxGroup>,
          async (host) => {
            const other = await waitFor(() => groupIn(host, 'Lines'))
            await expect(ref.current).toBe(other)
          },
        )
      },
    )
    await step('legend, description, checkboxes, in order, and no error', async () => {
      const roots = allBoxes(group)
      await expect(group.firstElementChild).toBe(legend)
      await expect(legend.nextElementSibling).toBe(description)
      await expect(before(description, roots[0])).toBe(true)
      await expect(roots.map((root) => root.textContent)).toEqual(MODES.map((mode) => mode.word))
      for (const root of roots) await expect(root.parentElement).toBe(group)
      await expect(part(group, 'error')).toBeNull()
      // CR-6: each box at the group's start edge, not centred across it
      const start = legend.getBoundingClientRect().left
      for (const root of roots)
        await expect(
          root.querySelector('.pn-Checkbox-indicator')!.getBoundingClientRect().left,
        ).toBeLessThanOrEqual(start + 0.5)
    })
    await step('"Bus" is ticked, and a click on "Metro" adds it', async () => {
      await expect(box(group, 'Bus')).toHaveAttribute('aria-checked', 'true')
      await userEvent.click(box(group, 'Metro'))
      await expect(onChange).toHaveBeenCalledTimes(1)
      await expect(onChange).toHaveBeenLastCalledWith(
        expect.any(Event),
        ['bus', 'metro'],
        expect.objectContaining({ reason: 'none' }),
      )
      ;(document.activeElement as HTMLElement | null)?.blur()
    })
    await step('Tab to each box, Space unticks "Metro", Shift+Tab leaves', async () => {
      const start = document.activeElement
      await userEvent.tab()
      await expect(box(group, 'Bus')).toHaveFocus()
      await userEvent.tab()
      await expect(box(group, 'Metro')).toHaveFocus()
      await userEvent.keyboard(' ')
      await expect(onChange).toHaveBeenLastCalledWith(
        expect.any(Event),
        ['bus'],
        expect.objectContaining({ reason: 'none' }),
      )
      await expect(box(group, 'Metro')).toHaveAttribute('aria-checked', 'false')
      await userEvent.tab({ shift: true })
      await userEvent.tab({ shift: true })
      await expect(document.activeElement).toBe(start)
      await expect(ticked(group)).toEqual(['Bus'])
    })
  },
}

/** State disabled: the Default group with `disabled`. */
export const Disabled: Story = {
  args: { disabled: true },
  parameters: {
    // a disabled group's legend and help are color.text.tertiary, a miss Accessibility lists by
    // name (docs/foundations/accessibility.md) and WCAG 1.4.3 exempts for an inactive control, so
    // axe's contrast rule is off for this story alone
    a11y: { options: { rules: { 'color-contrast': { enabled: false } } } },
  },
  play: async ({ args, canvasElement, step }) => {
    const onChange = spy(args)
    const group = groupIn(canvasElement)
    await step('every checkbox is disabled and out of the tab order', async () => {
      await expect(group).toHaveAttribute('data-disabled')
      for (const root of allBoxes(group)) {
        await expect(root).toHaveAttribute('aria-disabled', 'true')
        await expect(root.tabIndex).toBe(-1)
      }
      const start = document.activeElement
      await userEvent.tab()
      await expect(group.contains(document.activeElement)).toBe(false)
      await userEvent.tab({ shift: true })
      await expect(document.activeElement).toBe(start)
    })
    await step('a click ticks nothing and calls no onChange', async () => {
      await userEvent.click(box(group, 'Metro'), { pointerEventsCheck: 0 })
      await expect(box(group, 'Metro')).toHaveAttribute('aria-checked', 'false')
      await expect(onChange).not.toHaveBeenCalled()
      ;(document.activeElement as HTMLElement | null)?.blur()
    })
    await step('the legend and the description take the tertiary ink', async () => {
      const tertiary = colour('--perron-color-text-tertiary')
      await expect(getComputedStyle(part(group, 'legend')!).color).toBe(tertiary)
      await expect(getComputedStyle(part(group, 'description')!).color).toBe(tertiary)
    })
    await step('a disabled Fieldset round the group disables it too (CR-9)', async () => {
      await mounted(
        canvasElement,
        <Fieldset legend="Map" disabled>
          <CheckboxGroup label={LABEL} description={DESCRIPTION} defaultValue={['bus']}>
            {boxes()}
          </CheckboxGroup>
        </Fieldset>,
        async (host) => {
          const inner = await waitFor(() => groupIn(host))
          await expect(inner).toHaveAttribute('data-disabled')
          for (const root of allBoxes(inner))
            await expect(root).toHaveAttribute('aria-disabled', 'true')
        },
      )
    })
  },
}

/** State invalid: nothing ticked, and the error "Choose at least one mode" under the checkboxes. */
export const Invalid: Story = {
  args: { defaultValue: [], error: ERROR },
  play: async ({ canvasElement }) => {
    const group = groupIn(canvasElement)
    const roots = allBoxes(group)
    const error = await waitFor(() => {
      const found = part(group, 'error')
      expect(found).not.toBeNull()
      return found!
    })
    await expect(error).toHaveTextContent(/^Choose at least one mode$/)
    await expect(before(roots[roots.length - 1], error)).toBe(true)
    await expect(group.lastElementChild).toBe(error)
    await expect(getComputedStyle(error).color).toBe(colour('--perron-color-text-danger'))
    await expect(group).toHaveAttribute('data-invalid')
    // the help first, then the error
    await waitFor(() =>
      expect(group.getAttribute('aria-describedby')).toBe(
        `${part(group, 'description')!.id} ${error.id}`,
      ),
    )
    await expect(group).toHaveAccessibleDescription(`${DESCRIPTION} ${ERROR}`)
    const danger = resolve('borderColor', 'var(--perron-color-status-danger)')
    for (const root of roots) {
      await expect(root).toHaveAttribute('data-invalid')
      await expect(root).toHaveAttribute('aria-invalid', 'true')
      await expect(
        getComputedStyle(root.querySelector('.pn-Checkbox-indicator')!).borderColor,
      ).toBe(danger)
    }
    // the legend keeps its rest look: the error and the boxes' edges show it
    await expect(getComputedStyle(part(group, 'legend')!).color).toBe(
      colour('--perron-color-text-primary'),
    )
  },
}

/** The Default group with `hiddenLabel`, in a Section whose title names it for the eye. */
export const HiddenLabel: Story = {
  args: { hiddenLabel: true },
  render: (args) => (
    <Section title={LABEL}>
      <CheckboxGroup {...args} />
    </Section>
  ),
  play: async ({ canvasElement }) => {
    const group = groupIn(canvasElement)
    const legend = part(group, 'legend')!
    await expect(legend.tagName).toBe('SPAN')
    await expect(legend.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    await expect(group).toHaveAccessibleName(LABEL)
    // the description sits at the root's top edge, with no gap above it
    await expect(
      Math.abs(
        part(group, 'description')!.getBoundingClientRect().top - group.getBoundingClientRect().top,
      ),
    ).toBeLessThan(1)
  },
}

/**
 * A caller that keeps the list in its own `useState` and sets it from `onChange`, unless the
 * change was cancelled, with a line that lists the ticked values. The story's `onChange` spy
 * stands for the caller's own handler, and may call `details.cancel()`.
 */
function ControlledGroup({ defaultValue, ...args }: CheckboxGroupProps) {
  const [value, setValue] = useState<string[]>(defaultValue ?? [])
  return (
    <>
      <CheckboxGroup
        {...args}
        value={value}
        onChange={(event, next, details) => {
          args.onChange?.(event, next, details)
          if (!details.isCanceled) setValue(next)
        }}
      />
      <p
        data-testid="ticked"
        style={{ ...typography('body-sm'), marginBlockStart: 'var(--perron-space-400)' }}
      >
        Ticked: {value.join(', ') || 'none'}
      </p>
    </>
  )
}

/** A group given `value` and `onChange` from the story's state, beside the list it holds. */
export const Controlled: Story = {
  render: (args) => <ControlledGroup {...args} />,
  play: async ({ args, canvasElement, step }) => {
    const onChange = spy(args)
    const group = groupIn(canvasElement)
    const metro = box(group, 'Metro')
    await step('a click asks the caller, and the box ticks once it sets `value`', async () => {
      await userEvent.click(metro)
      await expect(onChange).toHaveBeenLastCalledWith(
        expect.any(Event),
        ['bus', 'metro'],
        expect.objectContaining({ reason: 'none' }),
      )
      await expect(metro).toHaveAttribute('aria-checked', 'true')
      await expect(within(canvasElement).getByTestId('ticked')).toHaveTextContent(
        'Ticked: bus, metro',
      )
    })
    await step('an onChange that cancels keeps the list', async () => {
      onChange.mockImplementationOnce((_event, _value, details) => details.cancel())
      await userEvent.click(metro)
      await expect(onChange).toHaveBeenLastCalledWith(
        expect.any(Event),
        ['bus'],
        expect.objectContaining({ reason: 'none' }),
      )
      await expect(metro).toHaveAttribute('aria-checked', 'true')
    })
    await step('the caller sets the list back to "Bus" alone', async () => {
      await userEvent.click(metro)
      await expect(metro).toHaveAttribute('aria-checked', 'false')
      await expect(ticked(group)).toEqual(['Bus'])
      metro.blur()
    })
    await step('a caller that ignores the change keeps the group as it was', async () => {
      const ignored = fn()
      await mounted(
        canvasElement,
        <CheckboxGroup label="Lines" value={['bus']} onChange={ignored}>
          {boxes()}
        </CheckboxGroup>,
        async (host) => {
          const other = await waitFor(() => groupIn(host, 'Lines'))
          await userEvent.click(box(other, 'Metro'))
          await expect(ignored).toHaveBeenCalledTimes(1)
          await expect(box(other, 'Metro')).toHaveAttribute('aria-checked', 'false')
          await expect(ticked(other)).toEqual(['Bus'])
          ;(document.activeElement as HTMLElement | null)?.blur()
        },
      )
    })
  },
}

/** The story's submit handler, which stops the form from leaving the page. */
const onSubmit = fn((event: { preventDefault: () => void }) => event.preventDefault())

/** The group with `name="modes"` in a `<form>` with a submit button, "S-tog" disabled. */
export const InForm: Story = {
  args: { name: 'modes', children: boxes('s-tog') },
  render: (args) => (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--perron-space-400)',
      }}
    >
      <CheckboxGroup {...args} />
      <Button type="submit">Save</Button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    onSubmit.mockClear()
    const form = canvasElement.querySelector('form')!
    const group = groupIn(canvasElement)
    const modes = () => new FormData(form).getAll('modes')
    await expect(modes()).toEqual(['bus'])
    await userEvent.click(box(group, 'Metro'))
    await expect(modes()).toEqual(['bus', 'metro'])
    await expect(modes()).not.toContain('s-tog')
    // Enter on a checkbox clicks the form's submit button, which the story stops
    await expect(box(group, 'Metro')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    await expect(box(group, 'Metro')).toHaveAttribute('aria-checked', 'true')
    // as it started
    await userEvent.click(box(group, 'Metro'))
    await expect(modes()).toEqual(['bus'])
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

/** Base UI's own check: a `validate` on every change that asks for at least one mode. */
export const Validation: Story = {
  args: {
    validationMode: 'onChange',
    validate: (value) => (Array.isArray(value) && value.length === 0 ? ERROR : null),
  },
  play: async ({ canvasElement, step }) => {
    const group = groupIn(canvasElement)
    await step('valid at first, with no error', async () => {
      await expect(part(group, 'error')).toBeNull()
      for (const root of allBoxes(group)) await expect(root).not.toHaveAttribute('aria-invalid')
    })
    await step('unticking "Bus" shows the message', async () => {
      await userEvent.click(box(group, 'Bus'))
      await waitFor(() =>
        expect(part(group, 'error')).toHaveTextContent(/^Choose at least one mode$/),
      )
      await expect(before(allBoxes(group).at(-1)!, part(group, 'error')!)).toBe(true)
      for (const root of allBoxes(group)) await expect(root).toHaveAttribute('aria-invalid', 'true')
    })
    await step('ticking "Metro" removes it', async () => {
      await userEvent.click(box(group, 'Metro'))
      await waitFor(() => expect(part(group, 'error')).toBeNull())
      for (const root of allBoxes(group)) await expect(root).not.toHaveAttribute('aria-invalid')
    })
    await step('back to "Bus" alone, with no error', async () => {
      await userEvent.click(box(group, 'Bus'))
      await userEvent.click(box(group, 'Metro'))
      await expect(ticked(group)).toEqual(['Bus'])
      await waitFor(() => expect(part(group, 'error')).toBeNull())
      ;(document.activeElement as HTMLElement | null)?.blur()
    })
  },
}

/** A parent "All modes" first, then the three, under `allValues`. */
const withParent = (disabledValue?: string): ReactNode => [
  <Checkbox key="all" parent>
    All modes
  </Checkbox>,
  ...boxes(disabledValue),
]

/** The group with a parent checkbox "All modes" that ticks or unticks the set. */
export const SelectAll: Story = {
  args: { allValues: ALL, name: 'modes', children: withParent() },
  render: (args) => (
    <form onSubmit={onSubmit}>
      <CheckboxGroup {...args} />
    </form>
  ),
  play: async ({ args, canvasElement, step }) => {
    const onChange = spy(args)
    const form = canvasElement.querySelector('form')!
    const group = groupIn(canvasElement)
    const all = box(group, 'All modes')
    const modes = () => new FormData(form).getAll('modes')
    await step('some ticked: the parent is mixed, controlling the three', async () => {
      await expect(all).toHaveAttribute('aria-checked', 'mixed')
      await expect(all).toHaveAttribute('data-indeterminate')
      await expect(all).toHaveAttribute('data-parent')
      // the dash, a flat line, where the tick has height
      const dash = all.querySelector('.pn-Checkbox-indicator svg path') as SVGPathElement
      await expect(dash.getBBox().height).toBe(0)
      const ids = MODES.map(({ word }) => box(group, word).id)
      await expect(all.getAttribute('aria-controls')?.split(' ').sort()).toEqual(ids.sort())
      await expect(modes()).toEqual(['bus'])
    })
    await step('a click ticks all three', async () => {
      await userEvent.click(all)
      await expect(onChange).toHaveBeenCalledTimes(1)
      await expect(onChange).toHaveBeenLastCalledWith(
        expect.any(Event),
        ALL,
        expect.objectContaining({ reason: 'none' }),
      )
      await expect(all).toHaveAttribute('aria-checked', 'true')
      await expect(modes()).toEqual(ALL)
    })
    await step('Space unticks them all', async () => {
      await expect(all).toHaveFocus()
      await userEvent.keyboard(' ')
      await expect(onChange).toHaveBeenLastCalledWith(
        expect.any(Event),
        [],
        expect.objectContaining({ reason: 'none' }),
      )
      await expect(all).toHaveAttribute('aria-checked', 'false')
      await expect(modes()).toEqual([])
    })
    await step('a third click gives "Bus" back, the parent mixed again', async () => {
      await userEvent.click(all)
      await expect(onChange).toHaveBeenLastCalledWith(expect.any(Event), ['bus'], expect.anything())
      await expect(all).toHaveAttribute('aria-checked', 'mixed')
    })
    await step('ticking the rest by hand ticks the parent', async () => {
      await userEvent.click(box(group, 'Metro'))
      await userEvent.click(box(group, 'S-tog'))
      await expect(all).toHaveAttribute('aria-checked', 'true')
      // the parent never reaches the form
      await expect(modes()).toEqual(['bus', 'metro', 's-tog'])
      await userEvent.click(box(group, 'Metro'))
      await userEvent.click(box(group, 'S-tog'))
      await expect(all).toHaveAttribute('aria-checked', 'mixed')
      await expect(ticked(group)).toEqual(['Bus'])
      ;(document.activeElement as HTMLElement | null)?.blur()
    })
    await step('a disabled, unticked box keeps its state when the parent ticks', async () => {
      await mounted(
        canvasElement,
        <CheckboxGroup label="Lines" allValues={ALL} defaultValue={['bus']}>
          {withParent('s-tog')}
        </CheckboxGroup>,
        async (host) => {
          const other = await waitFor(() => groupIn(host, 'Lines'))
          const parent = box(other, 'All modes')
          await userEvent.click(parent)
          await expect(ticked(other)).toEqual(['Bus', 'Metro'])
          await expect(parent).toHaveAttribute('aria-checked', 'mixed')
          ;(document.activeElement as HTMLElement | null)?.blur()
        },
      )
    })
  },
}

/** The label, the description and the error each given as an element, then as a list. */
export const RichContent: Story = {
  args: {
    label: (
      <span>
        Show on the <strong>map</strong>
      </span>
    ),
    description: (
      <span>
        The map shows vehicles of the <strong>ticked</strong> modes only
      </span>
    ),
    error: (
      <span>
        Choose <strong>at least one</strong> mode
      </span>
    ),
  },
  play: async ({ canvasElement, step }) => {
    const heardAs = async (scope: HTMLElement) => {
      const group = await waitFor(() => groupIn(scope))
      await waitFor(() => expect(part(group, 'error')).not.toBeNull())
      await expect(part(group, 'legend')!.querySelector('strong')).toHaveTextContent('map')
      await expect(part(group, 'description')!.querySelector('strong')).toHaveTextContent('ticked')
      await expect(part(group, 'error')!.querySelector('strong')).toHaveTextContent('at least one')
      await expect(group).toHaveAccessibleDescription(`${DESCRIPTION} ${ERROR}`)
    }
    await step('each part renders its element, and the group hears its text', async () => {
      await heardAs(canvasElement)
    })
    await step('each part renders a list of a string and an element alike', async () => {
      await mounted(
        canvasElement,
        <CheckboxGroup
          label={['Show on the ', <strong key="map">map</strong>]}
          description={[
            'The map shows vehicles of the ',
            <strong key="ticked">ticked</strong>,
            ' modes only',
          ]}
          error={['Choose ', <strong key="one">at least one</strong>, ' mode']}
        >
          {boxes()}
        </CheckboxGroup>,
        heardAs,
      )
    })
  },
}

/** Danish words longer than their line in the label, the description and the error. */
export const LongWords: Story = {
  args: {
    label: 'Realtidsdataforsinkelser',
    description: 'Vis driftsforstyrrelsesmeddelelser for alle linjer i hovedstadsområdet',
    error: 'Vælg mindst én transportform',
  },
  render: (args) => (
    <div style={{ inlineSize: 120 }}>
      <CheckboxGroup {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const group = groupIn(canvasElement, 'Realtidsdataforsinkelser')
    const edge = group.getBoundingClientRect().right
    await waitFor(() => expect(part(group, 'error')).not.toBeNull())
    for (const name of ['legend', 'description', 'error'] as const) {
      const element = part(group, name)!
      await expect(lines(element)).toBeGreaterThan(1.5)
      await expect(element.getBoundingClientRect().right).toBeLessThanOrEqual(edge + 0.5)
      await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth)
    }
    await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth)
  },
}
