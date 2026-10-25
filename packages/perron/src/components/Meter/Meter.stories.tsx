// Meter's stories: one per row of the spec's Stories table (docs/components/meter.md), with the
// design deferred, each the `color` value in PascalCase, and Unknown for the value no data gives.
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { colour, rendered } from '../../testing/stories.ts'
import { Meter } from './Meter.tsx'

const meta = {
  title: 'Components/Meter',
  component: Meter,
  // The required props and every caller word, so any story renders alone; each story sets its own
  args: { label: 'Reporting live', value: 31, color: 'danger' },
  // A meter takes its container's width: here a detail panel's, where Mylder shows one
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: 'var(--perron-size-detail-width)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Meter>

export default meta

type Story = StoryObj<typeof meta>

/** The parts of the Meter rendered inside `canvas`. */
function partsIn(canvas: HTMLElement) {
  const root = canvas.querySelector<HTMLElement>('.pn-Meter')!
  return {
    root,
    value: root.querySelector<HTMLElement>('.pn-Meter-value')!,
    indicator: root.querySelector<HTMLElement>('.pn-Meter-indicator')!,
  }
}

/** The ref the Neutral story hands Meter, to prove it reaches the root. */
const neutralRef = createRef<HTMLDivElement>()

/** The subject story: the live share at 31%, below the 40% the foundations mark as danger. */
export const Danger: Story = {
  args: { color: 'danger', label: 'Reporting live', value: 31 },
  play: async ({ canvasElement }) => {
    const { root, value, indicator } = partsIn(canvasElement)
    const meter = within(canvasElement).getByRole('meter', { name: 'Reporting live' })
    await expect(meter).toBe(root)
    await expect(root).toHaveAttribute('aria-valuenow', '31')
    await expect(root).toHaveAttribute('aria-valuemin', '0')
    await expect(root).toHaveAttribute('aria-valuemax', '100')
    await expect(root).toHaveAttribute('aria-valuetext', '31%')
    await expect(root).toHaveAttribute('data-color', 'danger')
    await expect(value).toHaveTextContent(/^31%$/)
    await expect(value).toHaveAttribute('aria-hidden', 'true')
    await expect(indicator.style.width).toBe('31%')
    // Meter is not a control: Tab passes it by
    await userEvent.tab()
    await expect(root.contains(document.activeElement)).toBe(false)
    await userEvent.tab({ shift: true })
  },
}

/** The share of trips running early, which the foundations give the info intent. */
export const Info: Story = {
  args: { color: 'info', label: 'Running early', value: 8 },
  play: async ({ canvasElement }) => {
    await expect(partsIn(canvasElement).root).toHaveAttribute('data-color', 'info')
  },
}

/** The default intent, a plain measure: 1046 of 1204 trips run today, "87%". */
export const Neutral: Story = {
  args: { color: 'neutral', label: 'Trips run today', value: 1046, max: 1204 },
  render: (args) => <Meter {...args} ref={neutralRef} />,
  play: async ({ canvasElement }) => {
    const { root, indicator } = partsIn(canvasElement)
    await expect(root).toHaveClass('pn-Meter')
    await expect(root).toHaveAttribute('data-color', 'neutral')
    await expect(root).not.toHaveAttribute('data-unknown')
    await expect(neutralRef.current).toBe(root)
    await expect(root).toHaveAttribute('aria-valuetext', '87%')
    // CR-6: the fill eases over duration.meter
    await expect(getComputedStyle(indicator).transitionDuration).toBe(
      rendered('duration-meter', 'transition-duration'),
    )
    // The name comes first in reading order, then the figure, then the track
    await expect(root.firstElementChild).toHaveClass('pn-Meter-label')
  },
}

/** The live share at 82%, above the 70% the foundations mark as success. */
export const Success: Story = {
  args: { color: 'success', label: 'Reporting live', value: 82 },
  play: async ({ canvasElement }) => {
    const { root, indicator } = partsIn(canvasElement)
    await expect(root).toHaveAttribute('data-color', 'success')
    await expect(getComputedStyle(indicator).backgroundColor).toBe(
      colour('--perron-color-status-success'),
    )
  },
}

/** No data gives the live share: "—" over an empty track, heard as "Unknown" (CR-5). */
export const Unknown: Story = {
  args: { color: 'neutral', label: 'Reporting live', value: null },
  play: async ({ canvasElement }) => {
    const { root, value, indicator } = partsIn(canvasElement)
    await expect(root).toHaveAttribute('data-unknown', '')
    await expect(value).toHaveAttribute('data-unknown', '')
    await expect(value).toHaveTextContent(/^—$/)
    await expect(root).toHaveAttribute('aria-valuetext', 'Unknown')
    await expect(root).toHaveAttribute('aria-valuenow', '0')
    await expect(indicator.style.width).toBe('0%')
    for (const locale of Object.keys(dictionaries) as Locale[])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <Meter label="Reporting live" value={null} />
          </PerronProvider>,
        ),
        locale,
        ['Reporting live'],
      )
  },
}

/** The live share at 55%, between the 40% and 70% the foundations mark as warning. */
export const Warning: Story = {
  args: { color: 'warning', label: 'Reporting live', value: 55 },
  play: async ({ canvasElement }) => {
    await expect(partsIn(canvasElement).root).toHaveAttribute('data-color', 'warning')
  },
}
