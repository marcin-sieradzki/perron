// Progress's stories: one per row of the spec's Stories table (docs/components/progress.md), with
// the design deferred, each the `State` value the drawing will name, in PascalCase.
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { colour, rendered } from '../../testing/stories.ts'
import { Progress } from './Progress.tsx'

const meta = {
  title: 'Components/Progress',
  component: Progress,
  // The required props and every caller word, so any story renders alone; each story sets its own
  args: { label: 'Exporting the report', value: 100 },
  // A progress bar takes its container's width: here a detail panel's
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: 'var(--perron-size-detail-width)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>

export default meta

type Story = StoryObj<typeof meta>

/** The parts of the Progress rendered inside `canvas`. */
function partsIn(canvas: HTMLElement) {
  const root = canvas.querySelector<HTMLElement>('.pn-Progress')!
  return {
    root,
    value: root.querySelector<HTMLElement>('.pn-Progress-value')!,
    indicator: root.querySelector<HTMLElement>('.pn-Progress-indicator')!,
  }
}

/**
 * The style rules inside `@media (prefers-reduced-motion: reduce)` blocks of the loaded
 * stylesheets whose selector is `selector`.
 */
function reducedMotionRules(selector: string) {
  const found: CSSStyleRule[] = []
  for (const sheet of document.styleSheets)
    for (const rule of sheet.cssRules)
      if (
        rule instanceof CSSMediaRule &&
        rule.conditionText.includes('prefers-reduced-motion: reduce')
      )
        for (const inner of rule.cssRules)
          if (inner instanceof CSSStyleRule && inner.selectorText === selector) found.push(inner)
  return found
}

/** The ref the Progressing story hands Progress, to prove it reaches the root. */
const progressingRef = createRef<HTMLDivElement>()

/** The subject story: the export done, "100%" over a full fill, in the progressing look. */
export const Complete: Story = {
  args: { label: 'Exporting the report', value: 100 },
  play: async ({ canvasElement }) => {
    const { root, indicator } = partsIn(canvasElement)
    const bar = within(canvasElement).getByRole('progressbar', { name: 'Exporting the report' })
    await expect(bar).toBe(root)
    await expect(root).toHaveAttribute('aria-valuenow', '100')
    await expect(root).toHaveAttribute('aria-valuetext', '100%')
    await expect(root).toHaveAttribute('data-complete', '')
    await expect(indicator.style.width).toBe('100%')
    await expect(getComputedStyle(indicator).backgroundColor).toBe(
      colour('--perron-color-text-primary'),
    )
    // Progress is not a control: Tab passes it by
    await userEvent.tab()
    await expect(root.contains(document.activeElement)).toBe(false)
    await userEvent.tab({ shift: true })
  },
}

/** How far the network's load has got is not known: a segment sweeps along the track (CR-5, CR-6). */
export const Indeterminate: Story = {
  args: { label: 'Loading the network', value: null },
  play: async ({ canvasElement }) => {
    const { root, value, indicator } = partsIn(canvasElement)
    await expect(root).toHaveAttribute('data-indeterminate', '')
    await expect(root).not.toHaveAttribute('aria-valuenow')
    await expect(root).toHaveAttribute('aria-valuetext', 'In progress')
    await expect(value).toBeEmptyDOMElement()
    const style = getComputedStyle(indicator)
    await expect(style.animationName).toBe('pn-Progress-sweep')
    await expect(style.animationDuration).toBe(
      rendered('duration-progress-sweep', 'animation-duration'),
    )
    // The loop stops when the system asks for less motion
    const stops = reducedMotionRules('.pn-Progress-indicator[data-indeterminate]')
    await expect(stops.map((rule) => rule.style.getPropertyValue('animation-name'))).toContain(
      'none',
    )
    for (const locale of Object.keys(dictionaries) as Locale[])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <Progress label="Loading the network" value={null} />
          </PerronProvider>,
        ),
        locale,
        ['Loading the network'],
      )
  },
}

/** The export under way: 9 of 20 parts written, "45%". */
export const Progressing: Story = {
  args: { label: 'Exporting the report', value: 9, max: 20 },
  render: (args) => <Progress {...args} ref={progressingRef} />,
  play: async ({ canvasElement }) => {
    const { root, value, indicator } = partsIn(canvasElement)
    await expect(root).toHaveClass('pn-Progress')
    await expect(root).toHaveAttribute('data-progressing', '')
    await expect(progressingRef.current).toBe(root)
    await expect(root).toHaveAttribute('aria-valuenow', '9')
    await expect(root).toHaveAttribute('aria-valuemax', '20')
    await expect(root).toHaveAttribute('aria-valuetext', '45%')
    await expect(value).toHaveTextContent(/^45%$/)
    await expect(value).toHaveAttribute('aria-hidden', 'true')
    await expect(indicator.style.width).toBe('45%')
    // CR-6: the fill eases over duration.meter
    await expect(getComputedStyle(indicator).transitionDuration).toBe(
      rendered('duration-meter', 'transition-duration'),
    )
    // The name comes first in reading order, then the figure, then the track
    await expect(root.firstElementChild).toHaveClass('pn-Progress-label')
  },
}
