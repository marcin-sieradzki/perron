// Fieldset's stories: one per row of the spec's Stories table (docs/components/fieldset.md), with
// the design deferred, each on a raised Surface as a group sits in a panel, and their play tests.
// Checkbox is not built yet, so the controls are native checkboxes, each in its <label> with its
// word in typography.body; they move to Checkbox when it ships.
import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { colour, mounted, rendered, typography } from '../../testing/stories.ts'
import { Section } from '../Section/Section.tsx'
import { Surface } from '../Surface/Surface.tsx'
import { Fieldset } from './Fieldset.tsx'

const LEGEND = 'Show on the map'
const MODES = ['Bus', 'Metro', 'S-tog']

/**
 * One stand-in control: a native checkbox in its label, the word after the box, in the tertiary
 * ink while disabled, as Checkbox's own disabled look will set it.
 */
const option = (word: string, disabled = false) => (
  <label
    key={word}
    style={{
      ...typography('body'),
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--perron-space-200)',
      color: disabled ? 'var(--perron-color-text-tertiary)' : 'var(--perron-color-text-primary)',
    }}
  >
    <input type="checkbox" name="modes" value={word} />
    {word}
  </label>
)

const meta = {
  title: 'Components/Fieldset',
  component: Fieldset,
  args: { legend: LEGEND, children: MODES.map((word) => option(word)) },
  decorators: [
    (Story) => (
      <Surface variant="raised" style={{ maxInlineSize: '24rem' }}>
        <Story />
      </Surface>
    ),
  ],
} satisfies Meta<typeof Fieldset>

export default meta

type Story = StoryObj<typeof meta>

/** The group in the story's canvas, named by its legend. */
const groupIn = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole('group', { name: LEGEND })

/** The subject story: the legend over the three checkboxes, at rest. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const group = groupIn(canvasElement)
    const legend = group.querySelector<HTMLElement>('.pn-Fieldset-legend')!
    await step('a group named by its legend holds the three checkboxes', async () => {
      await expect(group.tagName).toBe('FIELDSET')
      await expect(group).toHaveAttribute('aria-labelledby', legend.id)
      const boxes = within(group).getAllByRole('checkbox')
      await expect(boxes.map((box) => box.closest('label')?.textContent)).toEqual(MODES)
    })
    await step('the legend comes first, in typography.label and the primary ink', async () => {
      await expect(group.firstElementChild).toBe(legend)
      await expect(legend.tagName).toBe('DIV')
      const style = getComputedStyle(legend)
      await expect(style.font).toBe(rendered('typography-label', 'font'))
      await expect(style.letterSpacing).toBe(
        rendered('typography-label-tracking', 'letter-spacing'),
      )
      await expect(style.color).toBe(colour('--perron-color-text-primary'))
      // CR-1: the browser's frame is gone
      const root = getComputedStyle(group)
      await expect(root.borderTopStyle).toBe('none')
      await expect(root.paddingTop).toBe('0px')
      await expect(root.marginTop).toBe('0px')
      await expect(root.gap).toBe(rendered('space-200', 'gap'))
    })
    await step('Tab reaches "Bus" and Shift+Tab leaves it', async () => {
      const bus = within(group).getByRole('checkbox', { name: 'Bus' })
      const before = document.activeElement
      await userEvent.tab()
      await expect(bus).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(document.activeElement).toBe(before)
    })
    await step(
      'rendered as Base UI’s RadioGroup, it is a radiogroup named by the legend (CR-5)',
      async () => {
        await mounted(
          canvasElement,
          <Fieldset render={<RadioGroup defaultValue="light" />} legend="Map style">
            {['Light', 'Dark'].map((word) => (
              <label key={word} style={typography('body')}>
                <Radio.Root value={word.toLowerCase()} />
                {word}
              </label>
            ))}
          </Fieldset>,
          async (host) => {
            const radios = await within(host).findByRole('radiogroup', { name: 'Map style' })
            await expect(radios).toHaveClass('pn-Fieldset')
            await expect(within(radios).getAllByRole('radio')).toHaveLength(2)
            await expect(radios.firstElementChild).toHaveClass('pn-Fieldset-legend')
          },
        )
      },
    )
    await step('a legend longer than its line wraps inside a 120 px column (CR-1)', async () => {
      await mounted(
        canvasElement,
        <div style={{ inlineSize: 120 }}>
          <Fieldset legend="Realtidsdataforsinkelser">{option('Bus')}</Fieldset>
        </div>,
        async (host) => {
          const root = await within(host).findByRole('group', { name: 'Realtidsdataforsinkelser' })
          const long = host.querySelector<HTMLElement>('.pn-Fieldset-legend')!
          const line = parseFloat(getComputedStyle(long).lineHeight)
          await expect(long.getBoundingClientRect().height).toBeGreaterThan(line * 1.5)
          await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(
            root.getBoundingClientRect().right,
          )
          await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
        },
      )
    })
  },
}

/** State disabled: the Default group with `disabled`, every checkbox with it. */
export const Disabled: Story = {
  args: { disabled: true, children: MODES.map((word) => option(word, true)) },
  play: async ({ canvasElement }) => {
    const group = groupIn(canvasElement)
    await expect(group).toHaveAttribute('disabled')
    await expect(group).toHaveAttribute('data-disabled')
    const boxes = within(group).getAllByRole('checkbox')
    for (const box of boxes) await expect(box).toBeDisabled()
    // Tab from before the group passes over them all, and Shift+Tab returns focus where it started
    const before = document.activeElement
    await userEvent.tab()
    await expect(group.contains(document.activeElement)).toBe(false)
    for (const box of boxes) await expect(box).not.toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(before)
    const legend = group.querySelector('.pn-Fieldset-legend')!
    await expect(legend).toHaveAttribute('data-disabled')
    await expect(getComputedStyle(legend).color).toBe(colour('--perron-color-text-tertiary'))
  },
}

/** The Default group with `hiddenLegend`, in a Section whose title names it for the eye. */
export const HiddenLegend: Story = {
  args: { hiddenLegend: true },
  render: (args) => (
    <Section title={LEGEND}>
      <Fieldset {...args} />
    </Section>
  ),
  play: async ({ canvasElement }) => {
    const group = groupIn(canvasElement)
    const legend = group.querySelector('.pn-Fieldset-legend')!
    // CR-3: the VisuallyHidden part, a span the eye never sees, still the group's name
    await expect(legend.tagName).toBe('SPAN')
    await expect(getComputedStyle(legend).position).toBe('absolute')
    await expect(legend).toHaveTextContent(LEGEND)
    await expect(legend.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    const first = within(group).getAllByRole('checkbox')[0].closest('label')!
    await expect(
      Math.abs(first.getBoundingClientRect().top - group.getBoundingClientRect().top),
    ).toBeLessThan(1)
  },
}
