// Tabs' stories: the tab set, then the tab in each state of the deferred design, each in a set of
// its own, as Base UI's parts need (CR-2), then counts, a controlled set and a narrow one. Hover
// and focus render at rest; the visual check drives them, and their play tests check them.
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { colour, onHover, rendered, stateFill } from '../../testing/stories.ts'
import { Tab, Tabs, TabsList, TabsPanel, type TabsProps } from './Tabs.tsx'

/** The underline of the list in `canvasElement`, once Base UI has measured the selected tab. */
async function measuredIndicator(canvasElement: HTMLElement) {
  const indicator = canvasElement.querySelector<HTMLElement>('.pn-TabsList-indicator')
  await waitFor(() => expect(indicator).not.toBeNull())
  await waitFor(() => expect(indicator!.hidden).toBe(false))
  return indicator!
}

/**
 * Whether the underline spans `tab` to the pixel and, with the tab on the list's last row, covers
 * the hairline: it overlaps the tab's block end and ends at the list's.
 */
async function expectUnder(indicator: HTMLElement, tab: HTMLElement) {
  const line = indicator.getBoundingClientRect()
  const box = tab.getBoundingClientRect()
  const list = indicator.parentElement!.getBoundingClientRect()
  await expect(Math.abs(line.left - box.left)).toBeLessThan(1)
  await expect(Math.abs(line.width - box.width)).toBeLessThan(1)
  await expect(Math.abs(line.bottom - list.bottom)).toBeLessThan(1)
  await expect(line.top).toBeLessThan(box.bottom)
}

/** The stop's three views, the first selected by Base UI's fallback, the third with a count. */
const stopTabs = (
  <>
    <TabsList aria-label="Stop">
      <Tab value="departures">Departures</Tab>
      <Tab value="lines">Lines</Tab>
      <Tab value="disruptions" count={2}>
        Disruptions
      </Tab>
    </TabsList>
    <TabsPanel value="departures">The next departures from this stop.</TabsPanel>
    <TabsPanel value="lines">The lines that call at this stop.</TabsPanel>
    <TabsPanel value="disruptions">The disruptions on this stop's lines.</TabsPanel>
  </>
)

/** The spy every story's Tabs reports to; a play that asserts on it clears it first. */
const onChange = fn()

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  args: { children: stopTabs, onChange },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

/** The tab set: three tabs, the first selected, the third with a count of 2, and the first panel. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tab = (name: RegExp) => canvas.getByRole('tab', { name })
    // left out, defaultValue falls to the first enabled tab, which onChange hears (CR-4)
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.anything(),
        'departures',
        expect.objectContaining({ reason: 'initial' }),
      ),
    )
    onChange.mockClear()
    await userEvent.tab()
    await expect(tab(/^Departures$/)).toHaveFocus()
    await expect(tab(/^Departures$/)).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowRight}')
    await expect(tab(/^Lines$/)).toHaveFocus()
    await expect(tab(/^Lines$/)).toHaveAttribute('aria-selected', 'false')
    await expect(onChange).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    await expect(tab(/^Lines$/)).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent(
      'The lines that call at this stop.',
    )
    await expect(onChange).toHaveBeenCalledTimes(1)
    await expect(onChange).toHaveBeenCalledWith(
      expect.any(Event),
      'lines',
      expect.objectContaining({ reason: 'none' }),
    )
    await userEvent.keyboard('{End}')
    await expect(tab(/^Disruptions/)).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect(tab(/^Departures$/)).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(tab(/^Disruptions/)).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(tab(/^Lines$/)).toHaveFocus()
    await userEvent.tab()
    await expect(canvas.getByRole('tabpanel')).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(tab(/^Lines$/)).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** A list of two tabs, "Departures" and "Lines", with the state under test on "Lines". */
const twoTabs = (lines: { disabled?: boolean } = {}) => (
  <>
    <TabsList aria-label="Stop">
      <Tab value="departures">Departures</Tab>
      <Tab value="lines" {...lines}>
        Lines
      </Tab>
    </TabsList>
    <TabsPanel value="departures">The next departures from this stop.</TabsPanel>
    <TabsPanel value="lines">The lines that call at this stop.</TabsPanel>
  </>
)

/** A tab at rest, not selected: "Lines", beside the selected "Departures". */
export const TabDefault: Story = {
  args: { defaultValue: 'departures', children: twoTabs() },
}

/** A tab, hovered by the visual check. */
export const TabHover: Story = {
  args: { defaultValue: 'departures', children: twoTabs() },
  play: async ({ canvasElement }) => {
    const lines = within(canvasElement).getByRole('tab', { name: 'Lines' })
    await expect(getComputedStyle(lines).color).toBe(colour('--perron-color-text-secondary'))
    await expect(onHover(lines, 'color')).toBe('var(--perron-color-text-primary)')
    // pressed lays the hover layer behind the inked label, a step past hover
    await expect(stateFill(lines, ':active')).toBe('var(--perron-color-surface-hover)')
  },
}

/** A tab, focused by the visual check. */
export const TabFocus: Story = {
  args: { defaultValue: 'departures', children: twoTabs() },
  play: async ({ canvasElement }) => {
    const lines = within(canvasElement).getByRole('tab', { name: 'Lines' })
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    await expect(lines).toHaveFocus()
    await expect(lines.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(lines)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(colour('--perron-color-border-focus'))
    await expect(ring.outlineWidth).toBe(rendered('focus-width', 'outline-width'))
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** A tab, selected, with the underline under it. */
export const TabSelected: Story = {
  args: { defaultValue: 'lines', children: twoTabs() },
  play: async ({ canvasElement }) => {
    const lines = within(canvasElement).getByRole('tab', { name: 'Lines' })
    await expect(lines).toHaveAttribute('aria-selected', 'true')
    await expect(lines).toHaveAttribute('data-active')
    await expect(getComputedStyle(lines).color).toBe(colour('--perron-color-text-primary'))
    await expectUnder(await measuredIndicator(canvasElement), lines)
  },
}

/** A tab, disabled: still focusable and in the arrow-key order, so it can be heard. */
export const TabDisabled: Story = {
  args: { defaultValue: 'departures', children: twoTabs({ disabled: true }) },
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const canvas = within(canvasElement)
    const lines = canvas.getByRole('tab', { name: 'Lines' })
    await expect(lines).toHaveAttribute('aria-disabled', 'true')
    await expect(lines).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    await expect(lines).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(lines)
    await expect(lines).toHaveAttribute('aria-selected', 'false')
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent(
      'The next departures from this stop.',
    )
    await expect(onChange).not.toHaveBeenCalled()
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** Three tabs with counts of 12, 0 and 2: each is heard after its label. */
export const Count: Story = {
  args: {
    defaultValue: 'departures',
    children: (
      <>
        <TabsList aria-label="Stop">
          <Tab value="departures" count={12}>
            Departures
          </Tab>
          <Tab value="lines" count={0}>
            Lines
          </Tab>
          <Tab value="disruptions" count={2}>
            Disruptions
          </Tab>
        </TabsList>
        <TabsPanel value="departures">The next departures from this stop.</TabsPanel>
        <TabsPanel value="lines">The lines that call at this stop.</TabsPanel>
        <TabsPanel value="disruptions">The disruptions on this stop's lines.</TabsPanel>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const name of ['Departures 12', 'Lines 0', 'Disruptions 2'])
      await expect(canvas.getByRole('tab', { name })).toBeVisible()
    const zero = canvas.getByRole('tab', { name: 'Lines 0' }).querySelector('.pn-Tab-count')
    await expect(zero).toHaveTextContent('0')
    await expect(zero).toBeVisible()
  },
}

/**
 * A caller that keeps the value in its own state and sets it from `onChange`, unless the story's
 * `onChange` spy returns `false`, which stands for a caller that turns the change down; and a
 * button outside the tabs that sets the value too.
 */
function ControlledTabs(args: TabsProps) {
  const [value, setValue] = useState<string | null>('departures')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 16 }}>
      <Tabs
        {...args}
        value={value}
        onChange={(event, next, details) => {
          if (onChange(event, next, details) !== false) setValue(next)
        }}
      />
      <Button variant="outline" size="small" onClick={() => setValue('disruptions')}>
        Show disruptions
      </Button>
    </div>
  )
}

/** Tabs given `value` and `onChange` from the story's state. */
export const Controlled: Story = {
  render: (args) => <ControlledTabs {...args} />,
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const canvas = within(canvasElement)
    const lines = canvas.getByRole('tab', { name: 'Lines' })
    onChange.mockReturnValueOnce(false)
    await userEvent.click(lines)
    await expect(onChange).toHaveBeenCalledWith(
      expect.any(Event),
      'lines',
      expect.objectContaining({ reason: 'none' }),
    )
    // the change turned down: the value, and so the panel, stays
    await expect(lines).toHaveAttribute('aria-selected', 'false')
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent(
      'The next departures from this stop.',
    )
    await userEvent.click(lines)
    await expect(lines).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent(
      'The lines that call at this stop.',
    )
    const show = canvas.getByRole('button', { name: 'Show disruptions' })
    await userEvent.click(show)
    const disruptions = canvas.getByRole('tab', { name: 'Disruptions 2' })
    await expect(disruptions).toHaveAttribute('aria-selected', 'true')
    await waitFor(async () => expectUnder(await measuredIndicator(canvasElement), disruptions))
    show.blur()
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** Five tabs in a 320 px wide container: they wrap onto a second row, and nothing scrolls. */
export const Wrapping: Story = {
  args: {
    defaultValue: 'facilities',
    children: (
      <>
        <TabsList aria-label="Stop">
          <Tab value="departures">Departures</Tab>
          <Tab value="lines">Lines</Tab>
          <Tab value="disruptions" count={2}>
            Disruptions
          </Tab>
          <Tab value="planned-works">Planned works</Tab>
          <Tab value="facilities">Facilities</Tab>
        </TabsList>
        <TabsPanel value="departures">The next departures from this stop.</TabsPanel>
        <TabsPanel value="lines">The lines that call at this stop.</TabsPanel>
        <TabsPanel value="disruptions">The disruptions on this stop's lines.</TabsPanel>
        <TabsPanel value="planned-works">The planned works on this stop's lines.</TabsPanel>
        <TabsPanel value="facilities">The lifts, toilets and ticket machines here.</TabsPanel>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 320 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const list = canvas.getByRole('tablist')
    const first = canvas.getByRole('tab', { name: 'Departures' })
    const selected = canvas.getByRole('tab', { name: 'Facilities' })
    await expect(selected.getBoundingClientRect().top).toBeGreaterThan(
      first.getBoundingClientRect().bottom - 1,
    )
    await expect(list.scrollWidth).toBe(list.clientWidth)
    await expectUnder(await measuredIndicator(canvasElement), selected)
  },
}
