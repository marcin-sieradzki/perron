// RadioGroup's stories: the group, then the radio in each state of the deferred design, its state on
// "Light", then the group disabled, read-only, invalid in a Base UI Field, with a hidden label,
// controlled, with each shape a label takes, with a long word and in a form, one per row of the
// spec's Stories table (docs/components/radio-group.md). Each sits on a raised Surface, as a group
// sits in a panel. Hover and focus render at rest; the visual check drives them, and their play
// tests check them.
import { Field } from '@base-ui/react/field'
import { createRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  colour,
  lines,
  mounted,
  onHover,
  rendered,
  resolve,
  stateRules,
  typography,
} from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { Section } from '../Section/Section.tsx'
import { Surface } from '../Surface/Surface.tsx'
import { Radio, RadioGroup, type RadioGroupProps } from './RadioGroup.tsx'

/** The spy every story's group reports to; a play that asserts on it clears it first. */
const onChange = fn()

const LABEL = 'Theme'

/** The three themes, "Light" given the state under test. */
const themes = (light: { disabled?: boolean } = {}) => (
  <>
    <Radio value="system">Match the system</Radio>
    <Radio value="light" {...light}>
      Light
    </Radio>
    <Radio value="dark">Dark</Radio>
  </>
)

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  args: { label: LABEL, defaultValue: 'system', children: themes(), onChange },
  decorators: [
    (Story) => (
      <Surface variant="raised" style={{ maxInlineSize: '24rem' }}>
        <Story />
      </Surface>
    ),
  ],
} satisfies Meta<typeof RadioGroup>

export default meta

type Story = StoryObj<typeof meta>

/** The group in `container`, by its name. */
const groupIn = (container: HTMLElement, name = LABEL) =>
  within(container).getByRole('radiogroup', { name })

/** A radio in `container`, by its words. */
const radio = (container: HTMLElement, name: string) =>
  within(container).getByRole('radio', { name })

/** The indicator inside a radio. */
const indicatorOf = (root: HTMLElement) => root.querySelector<HTMLElement>('.pn-Radio-indicator')!

/** The label span inside a radio. */
const labelOf = (root: HTMLElement) => root.querySelector<HTMLElement>('.pn-Radio-label')!

/** A colour token as it renders as a background, to compare with an element's computed one. */
const fill = (token: string) => resolve('backgroundColor', `var(--perron-${token})`)

/** A colour token as it renders as a border. */
const edge = (token: string) => resolve('borderColor', `var(--perron-${token})`)

/** A length token as it renders as a block size. */
const length = (token: string) => parseFloat(resolve('blockSize', `var(--perron-${token})`))

/** The hover layer an unchecked indicator takes, as the CSS writes it, without its spaces. */
const HOVER_LAYER =
  'linear-gradient(var(--perron-color-surface-hover),var(--perron-color-surface-hover))'

const defaultRef = createRef<HTMLDivElement>()

/** The group: "Theme" over three radios, "Match the system" checked; the subject story. */
export const Default: Story = {
  render: (args) => <RadioGroup {...args} ref={defaultRef} />,
  play: async ({ canvasElement, step }) => {
    onChange.mockClear()
    const group = groupIn(canvasElement)
    const system = radio(canvasElement, 'Match the system')
    const light = radio(canvasElement, 'Light')
    const dark = radio(canvasElement, 'Dark')
    await step(
      'a radiogroup named by its label, holding three radios named by their words',
      async () => {
        await expect(group).toHaveClass('pn-RadioGroup')
        await expect(group).toHaveClass('pn-Fieldset')
        await expect(group.tagName).toBe('DIV')
        await expect(defaultRef.current).toBe(group)
        await expect(group.firstElementChild).toHaveClass('pn-RadioGroup-legend')
        await expect(group.firstElementChild).toHaveClass('pn-Fieldset-legend')
        for (const root of [system, light, dark]) {
          await expect(root.tagName).toBe('SPAN')
          await expect(root).toHaveClass('pn-Radio')
        }
        await expect(system).toHaveAttribute('aria-checked', 'true')
      },
    )
    await step('Tab and the arrow keys move and check, wrapping at the ends', async () => {
      await userEvent.tab()
      await expect(system).toHaveFocus()
      await userEvent.keyboard('{ArrowDown}')
      await expect(light).toHaveFocus()
      await expect(light).toHaveAttribute('aria-checked', 'true')
      await expect(system).toHaveAttribute('aria-checked', 'false')
      await expect(onChange).toHaveBeenCalledTimes(1)
      await expect(onChange).toHaveBeenLastCalledWith(
        expect.any(Event),
        'light',
        expect.objectContaining({ reason: 'none' }),
      )
      await userEvent.keyboard('{ArrowRight}')
      await expect(dark).toHaveFocus()
      await expect(dark).toHaveAttribute('aria-checked', 'true')
      await userEvent.keyboard('{ArrowDown}')
      await expect(system).toHaveFocus()
      await expect(system).toHaveAttribute('aria-checked', 'true')
      await userEvent.keyboard('{ArrowUp}')
      await expect(dark).toHaveFocus()
      await expect(dark).toHaveAttribute('aria-checked', 'true')
      await userEvent.keyboard('{ArrowLeft}')
      await expect(light).toHaveFocus()
      await expect(light).toHaveAttribute('aria-checked', 'true')
    })
    await step('Enter changes nothing; a click on the words checks', async () => {
      const calls = onChange.mock.calls.length
      await userEvent.keyboard('{Enter}')
      await expect(light).toHaveAttribute('aria-checked', 'true')
      await expect(onChange).toHaveBeenCalledTimes(calls)
      await userEvent.click(labelOf(system))
      await expect(system).toHaveAttribute('aria-checked', 'true')
      await expect(light).toHaveAttribute('aria-checked', 'false')
      await expect(onChange).toHaveBeenLastCalledWith(
        expect.any(Event),
        'system',
        expect.objectContaining({ reason: 'none' }),
      )
    })
    await step('Shift+Tab leaves the group', async () => {
      await userEvent.tab({ shift: true })
      await expect(group).not.toContainElement(document.activeElement as HTMLElement)
    })
  },
}

/** State default: "Light" at rest, unchecked. */
export const RadioDefault: Story = {
  play: async ({ canvasElement }) => {
    const light = radio(canvasElement, 'Light')
    await expect(light).toHaveAttribute('aria-checked', 'false')
    await expect(light).toHaveAttribute('data-unchecked')
    const indicator = indicatorOf(light)
    const box = indicator.getBoundingClientRect()
    await expect(box.width).toBe(length('icon-size-400'))
    await expect(box.height).toBe(length('icon-size-400'))
    const style = getComputedStyle(indicator)
    await expect(style.borderTopWidth).toBe(
      resolve('borderTopWidth', 'var(--perron-border-width-025)'),
    )
    await expect(style.borderTopStyle).toBe('solid')
    await expect(style.borderColor).toBe(edge('color-border-control'))
    await expect(style.backgroundColor).toBe(fill('color-surface-raised'))
    await expect(light.getBoundingClientRect().height).toBe(length('size-target-min'))
    const words = getComputedStyle(labelOf(light))
    await expect(words.font).toBe(rendered('typography-body', 'font'))
    await expect(words.letterSpacing).toBe(rendered('typography-body-tracking', 'letter-spacing'))
    await expect(words.color).toBe(colour('--perron-color-text-primary'))
    await expect(getComputedStyle(light).cursor).toBe('pointer')
  },
}

/** State hover: "Light", hovered by the visual check. */
export const RadioHover: Story = {
  play: async ({ canvasElement }) => {
    const light = indicatorOf(radio(canvasElement, 'Light'))
    await expect(onHover(light, 'background-image').replace(/\s+/g, '')).toBe(HOVER_LAYER)
    // the edge stays the control edge: no hover rule sets it on an unchecked radio
    await expect(stateRules(light).every((s) => !s.getPropertyValue('border-color'))).toBe(true)
    await expect(getComputedStyle(light).borderColor).toBe(edge('color-border-control'))
    // the checked radio darkens its ink and takes no layer
    const system = indicatorOf(radio(canvasElement, 'Match the system'))
    await expect(onHover(system, 'background-color')).toBe(
      'var(--perron-color-surface-inverse-hover)',
    )
    await expect(onHover(system, 'border-color')).toBe('var(--perron-color-surface-inverse-hover)')
    await expect(onHover(system, 'background-image')).toBe('')
    // a press shows the same, outside (hover: hover); the forced-colours reset (CR-11) sets `none`
    await expect(
      stateRules(light, ':active')
        .map((s) => s.getPropertyValue('background-image'))
        .filter((value) => value !== 'none')
        .join('')
        .replace(/\s+/g, ''),
    ).toBe(HOVER_LAYER)
  },
}

/** State focus: "Light", checked, as focus rests on the checked radio, focused by the visual check. */
export const RadioFocus: Story = {
  args: { defaultValue: 'light' },
  play: async ({ canvasElement }) => {
    const light = radio(canvasElement, 'Light')
    await userEvent.tab()
    await expect(light).toHaveFocus()
    await expect(light.matches(':focus-visible')).toBe(true)
    // CR-10: perron.css's ring round the whole row, following its radius
    const ring = getComputedStyle(light)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(edge('color-border-focus'))
    await expect(ring.outlineWidth).toBe(resolve('outlineWidth', 'var(--perron-focus-width)'))
    await expect(ring.outlineOffset).toBe(resolve('outlineOffset', 'var(--perron-focus-offset)'))
    await expect(ring.borderTopLeftRadius).toBe(
      resolve('borderTopLeftRadius', 'var(--perron-radius-md)'),
    )
    await expect(getComputedStyle(indicatorOf(light)).outlineStyle).toBe('none')
    await userEvent.tab({ shift: true })
    await expect(light).not.toHaveFocus()
    await expect(light).toHaveAttribute('aria-checked', 'true')
  },
}

/** State checked: "Light", with `defaultValue` `'light'`. */
export const RadioChecked: Story = {
  args: { defaultValue: 'light' },
  play: async ({ canvasElement }) => {
    const light = radio(canvasElement, 'Light')
    await expect(light).toHaveAttribute('aria-checked', 'true')
    const indicator = indicatorOf(light)
    await expect(indicator).toHaveAttribute('data-checked')
    const style = getComputedStyle(indicator)
    await expect(style.backgroundColor).toBe(fill('color-surface-inverse'))
    await expect(style.borderColor).toBe(edge('color-surface-inverse'))
    const dot = getComputedStyle(indicator, '::before')
    await expect(dot.backgroundColor).toBe(fill('color-surface-raised'))
    await expect(parseFloat(dot.width)).toBe(length('icon-size-400') / 2)
    await expect(parseFloat(dot.height)).toBe(length('icon-size-400') / 2)
    // CR-6: the same circle as an unchecked radio's, with the same edge
    const checked = indicator.getBoundingClientRect()
    const dark = indicatorOf(radio(canvasElement, 'Dark'))
    const unchecked = dark.getBoundingClientRect()
    await expect(checked.width).toBe(unchecked.width)
    await expect(checked.height).toBe(unchecked.height)
    await expect(style.borderTopWidth).toBe(getComputedStyle(dark).borderTopWidth)
    await expect(getComputedStyle(dark, '::before').content).toBe('none')
  },
}

/** State disabled: "Light", disabled. */
export const RadioDisabled: Story = {
  args: { children: themes({ disabled: true }) },
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const system = radio(canvasElement, 'Match the system')
    const light = radio(canvasElement, 'Light')
    const dark = radio(canvasElement, 'Dark')
    await expect(light).toHaveAttribute('aria-disabled', 'true')
    await expect(light).toHaveAttribute('data-disabled')
    await expect(getComputedStyle(labelOf(light)).color).toBe(
      colour('--perron-color-text-tertiary'),
    )
    const indicator = getComputedStyle(indicatorOf(light))
    await expect(indicator.borderColor).toBe(edge('color-border-subtle'))
    await expect(indicator.backgroundColor).toBe(fill('color-surface-inset'))
    await expect(getComputedStyle(light).cursor).toBe('default')
    // CR-8: no hover or pressed layer on a disabled radio
    for (const pseudo of [':hover', ':active'] as const)
      await expect(stateRules(indicatorOf(light), pseudo)).toHaveLength(0)
    // the arrow keys pass it by
    await userEvent.tab()
    await expect(system).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(dark).toHaveFocus()
    await expect(dark).toHaveAttribute('aria-checked', 'true')
    onChange.mockClear()
    await userEvent.click(light, { pointerEventsCheck: 0 })
    await expect(light).toHaveAttribute('aria-checked', 'false')
    await expect(onChange).not.toHaveBeenCalled()
    // back to rest
    dark.focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(system).toHaveAttribute('aria-checked', 'true')
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** The whole group disabled, "Match the system" checked, with a Button after it for Tab to reach. */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--perron-space-300)' }}>
      <RadioGroup {...args} />
      <div>
        <Button>Save</Button>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const group = groupIn(canvasElement)
    const radios = within(group).getAllByRole('radio')
    for (const root of radios) {
      await expect(root).toHaveAttribute('aria-disabled', 'true')
      await expect(root).toHaveAttribute('data-disabled')
    }
    const save = within(canvasElement).getByRole('button', { name: 'Save' })
    const system = radio(canvasElement, 'Match the system')
    // CR-1: Base UI keeps the group's one stop, heard as dimmed and checked, and Perron forces no
    // tabIndex; the next Tab leaves for the Button
    await userEvent.tab()
    await expect(system).toHaveFocus()
    await expect(system).toHaveAttribute('aria-disabled', 'true')
    await expect(system).toHaveAttribute('aria-checked', 'true')
    await userEvent.tab()
    await expect(save).toHaveFocus()
    await expect(system).toHaveAttribute('aria-checked', 'true')
    const indicator = indicatorOf(system)
    await expect(getComputedStyle(indicator).backgroundColor).toBe(fill('color-text-tertiary'))
    await expect(getComputedStyle(indicator).borderColor).toBe(edge('color-text-tertiary'))
    await expect(getComputedStyle(indicator, '::before').backgroundColor).toBe(
      fill('color-surface-raised'),
    )
    await expect(group.querySelector('.pn-RadioGroup-legend')).toHaveAttribute('data-disabled')
    // back to rest: Shift+Tab returns to the group's stop, then leaves it
    await userEvent.tab({ shift: true })
    await expect(system).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** The group read-only, "Match the system" checked. */
export const ReadOnly: Story = {
  args: { readOnly: true },
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const group = groupIn(canvasElement)
    await expect(group).toHaveAttribute('aria-readonly', 'true')
    const system = radio(canvasElement, 'Match the system')
    const light = radio(canvasElement, 'Light')
    await userEvent.tab()
    await expect(system).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(light).toHaveFocus()
    await expect(light).toHaveAttribute('aria-checked', 'false')
    await userEvent.keyboard(' ')
    await userEvent.click(light)
    await expect(light).toHaveAttribute('aria-checked', 'false')
    await expect(system).toHaveAttribute('aria-checked', 'true')
    await expect(onChange).not.toHaveBeenCalled()
    // CR-9: the rest look, the default cursor, and no hover or pressed layer
    await expect(getComputedStyle(light).cursor).toBe('default')
    await expect(getComputedStyle(indicatorOf(light)).backgroundColor).toBe(
      fill('color-surface-raised'),
    )
    for (const root of [system, light])
      for (const pseudo of [':hover', ':active'] as const)
        await expect(stateRules(indicatorOf(root), pseudo)).toHaveLength(0)
    await userEvent.tab({ shift: true })
    await expect(group).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** Nothing checked and `required`, in a Base UI Field marked invalid, with its error below. */
export const Invalid: Story = {
  args: { defaultValue: undefined, required: true },
  render: (args) => (
    <Field.Root
      invalid
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--perron-space-100)' }}
    >
      <RadioGroup {...args} />
      <Field.Error
        match
        style={{ ...typography('caption'), color: 'var(--perron-color-text-danger)' }}
      >
        Choose a theme
      </Field.Error>
    </Field.Root>
  ),
  play: async ({ canvasElement }) => {
    const group = groupIn(canvasElement)
    await expect(group).toHaveAttribute('aria-required', 'true')
    // the group too is invalid and described by the error, and still named by its legend
    await expect(group).toHaveAttribute('aria-invalid', 'true')
    await expect(group).toHaveAccessibleDescription('Choose a theme')
    for (const name of ['Match the system', 'Light', 'Dark']) {
      const root = radio(canvasElement, name)
      await expect(root).toHaveAttribute('aria-invalid', 'true')
      await expect(root).toHaveAttribute('aria-checked', 'false')
      await expect(root).toHaveAccessibleName(name)
      await expect(root).toHaveAccessibleDescription('Choose a theme')
      const indicator = indicatorOf(root)
      await expect(indicator).toHaveAttribute('data-invalid')
      await expect(getComputedStyle(indicator).borderColor).toBe(edge('color-status-danger'))
      await expect(getComputedStyle(indicator).backgroundColor).toBe(fill('color-surface-raised'))
    }
  },
}

/** The Default group with `hiddenLabel`, in a Section whose title names it for the eye. */
export const HiddenLabel: Story = {
  args: { hiddenLabel: true },
  render: (args) => (
    <Section title={LABEL}>
      <RadioGroup {...args} />
    </Section>
  ),
  play: async ({ canvasElement }) => {
    const group = groupIn(canvasElement)
    const legend = group.querySelector<HTMLElement>('.pn-RadioGroup-legend')!
    await expect(legend.tagName).toBe('SPAN')
    // the VisuallyHidden part, a span the eye never sees, still the group's name
    await expect(getComputedStyle(legend).position).toBe('absolute')
    await expect(legend).toHaveTextContent(LABEL)
    await expect(legend.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    const first = radio(canvasElement, 'Match the system')
    await expect(
      Math.abs(first.getBoundingClientRect().top - group.getBoundingClientRect().top),
    ).toBeLessThan(1)
  },
}

/**
 * A caller that keeps the value in its own `useState` and sets it from `onChange`, unless the
 * change was cancelled: the story's `onChange` spy stands for the caller's own handler.
 */
function ControlledGroup(args: RadioGroupProps) {
  const [value, setValue] = useState('system')
  return (
    <RadioGroup
      {...args}
      defaultValue={undefined}
      value={value}
      onChange={(event, next, details) => {
        args.onChange?.(event, next, details)
        if (!details.isCanceled) setValue(next)
      }}
    />
  )
}

/** A group given `value` and `onChange` from the story's state. */
export const Controlled: Story = {
  render: (args) => <ControlledGroup {...args} />,
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const system = radio(canvasElement, 'Match the system')
    const dark = radio(canvasElement, 'Dark')
    // the caller sets `value`, and only then does the check move
    await userEvent.click(dark)
    await expect(onChange).toHaveBeenCalledTimes(1)
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.any(Event),
      'dark',
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(dark).toHaveAttribute('aria-checked', 'true')
    // a click on the checked radio calls nothing (CR-3)
    await userEvent.click(dark)
    await expect(onChange).toHaveBeenCalledTimes(1)
    await userEvent.click(system)
    await expect(system).toHaveAttribute('aria-checked', 'true')
    system.blur()
    // a caller that ignores the change: `value` stays, and so does the check
    const ignored = fn()
    await mounted(
      canvasElement,
      <RadioGroup label="Map style" value="system" onChange={ignored}>
        {themes()}
      </RadioGroup>,
      async (host) => {
        await waitFor(() => expect(groupIn(host, 'Map style')).toBeInTheDocument())
        await userEvent.click(radio(host, 'Dark'))
        await expect(ignored).toHaveBeenCalledTimes(1)
        await expect(ignored).toHaveBeenLastCalledWith(
          expect.any(Event),
          'dark',
          expect.objectContaining({ reason: 'none', isCanceled: false }),
        )
        await expect(radio(host, 'Dark')).toHaveAttribute('aria-checked', 'false')
        await expect(radio(host, 'Match the system')).toHaveAttribute('aria-checked', 'true')
        radio(host, 'Dark').blur()
      },
    )
    // an uncontrolled group whose handler cancels the change stays as it was
    const cancelling = fn((_event: Event, _value: string, details: { cancel(): void }) =>
      details.cancel(),
    )
    await mounted(
      canvasElement,
      <RadioGroup label="Map style" defaultValue="system" onChange={cancelling}>
        {themes()}
      </RadioGroup>,
      async (host) => {
        await waitFor(() => expect(groupIn(host, 'Map style')).toBeInTheDocument())
        await userEvent.click(radio(host, 'Dark'))
        await expect(cancelling).toHaveBeenCalledTimes(1)
        await expect(radio(host, 'Dark')).toHaveAttribute('aria-checked', 'false')
        await expect(radio(host, 'Match the system')).toHaveAttribute('aria-checked', 'true')
        radio(host, 'Dark').blur()
      },
    )
  },
}

/**
 * Words as a string, an element and a list, in a 320 px wide group named by a list, "Show on" then
 * "map" in a `<span>`.
 */
export const LabelShapes: Story = {
  args: {
    label: (
      <>
        Show on <span>map</span>
      </>
    ),
    defaultValue: 'planned',
    style: { inlineSize: 320, maxInlineSize: '100%' },
    children: (
      <>
        <Radio value="planned">Planned works</Radio>
        <Radio value="diversions">
          <span>Diversions</span>
        </Radio>
        <Radio value="data-feed">
          Data feed <span>problems</span>
        </Radio>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    // the group's label as a list reads as one run in the legend and the group's name
    const group = groupIn(canvasElement, 'Show on map')
    await expect(group.querySelector('.pn-RadioGroup-legend')).toHaveTextContent('Show on map')
    const radios = within(group).getAllByRole('radio')
    await expect(radios).toHaveLength(3)
    for (const root of radios) {
      await expect(root.children).toHaveLength(2)
      await expect(root.children[0]).toHaveClass('pn-Radio-indicator')
      await expect(root.children[1]).toHaveClass('pn-Radio-label')
    }
    await expect(radio(canvasElement, 'Diversions')).toBeInTheDocument()
    const list = radio(canvasElement, 'Data feed problems')
    await expect(labelOf(list)).toHaveTextContent('Data feed problems')
    await expect(lines(labelOf(list))).toBeLessThan(1.5)
    // the group's label as an element names the group as its text does
    await mounted(
      canvasElement,
      <RadioGroup label={<span>Show on map</span>} defaultValue="planned">
        <Radio value="planned">Planned works</Radio>
        <Radio value="diversions">Diversions</Radio>
      </RadioGroup>,
      async (host) => {
        const named = await within(host).findByRole('radiogroup', { name: 'Show on map' })
        const legend = named.querySelector('.pn-RadioGroup-legend')!
        await expect(legend.querySelector('span')).toHaveTextContent('Show on map')
      },
    )
  },
}

/**
 * Three radios in Danish, "Vis på kort" over "Omkørsler", "Planlagt arbejde" and
 * "Realtidsdataforsinkelser", in a 120 px wide group.
 */
export const LongLabels: Story = {
  args: {
    label: 'Vis på kort',
    lang: 'da',
    defaultValue: 'diversions',
    style: { inlineSize: 120 },
    children: (
      <>
        <Radio value="diversions">Omkørsler</Radio>
        <Radio value="planned">Planlagt arbejde</Radio>
        <Radio value="long">Realtidsdataforsinkelser</Radio>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const group = groupIn(canvasElement, 'Vis på kort')
    const long = radio(canvasElement, 'Realtidsdataforsinkelser')
    const words = labelOf(long)
    // CR-7: the long word wraps inside its radio, which is no wider than the group
    await expect(lines(words)).toBeGreaterThan(1.5)
    await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(
      group.getBoundingClientRect().right,
    )
    await expect(group.scrollWidth).toBe(group.clientWidth)
    // CR-6: the circle keeps its size and stays on the first line
    const circle = indicatorOf(long).getBoundingClientRect()
    await expect(circle.width).toBe(length('icon-size-400'))
    await expect(circle.height).toBe(length('icon-size-400'))
    const top = words.getBoundingClientRect().top
    const line = parseFloat(getComputedStyle(words).lineHeight)
    await expect(circle.top).toBeGreaterThanOrEqual(top)
    await expect(circle.bottom).toBeLessThanOrEqual(top + line)
  },
}

/** A native `<form>` holding the group with `name` "theme" and a submit button. */
export const InForm: Story = {
  args: { name: 'theme' },
  render: (args) => (
    <form
      onSubmit={(event) => event.preventDefault()}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--perron-space-300)' }}
    >
      <RadioGroup {...args} />
      <div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!
    await expect(new FormData(form).get('theme')).toBe('system')
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}')
    await expect(new FormData(form).get('theme')).toBe('light')
    // with `required` and nothing checked, the form is invalid until a radio is checked
    await mounted(
      canvasElement,
      <form>
        <RadioGroup label="Map style" name="style" required>
          {themes()}
        </RadioGroup>
      </form>,
      async (host) => {
        await waitFor(() => expect(groupIn(host, 'Map style')).toBeInTheDocument())
        const required = host.querySelector('form')!
        await expect(required.checkValidity()).toBe(false)
        await userEvent.click(radio(host, 'Dark'))
        await expect(required.checkValidity()).toBe(true)
        await expect(new FormData(required).get('style')).toBe('dark')
        radio(host, 'Dark').blur()
      },
    )
    // back to rest
    const light = radio(canvasElement, 'Light')
    light.focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(radio(canvasElement, 'Match the system')).toHaveAttribute('aria-checked', 'true')
    await expect(new FormData(form).get('theme')).toBe('system')
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}
