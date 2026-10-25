// DayProfileChart's stories: one per row of the spec's Stories table (docs/patterns/day-profile-chart.md),
// with the design deferred, each a day of Copenhagen's vehicles in service in the overview sheet's
// 376 px width unless the row says otherwise, and their play tests, which read what the eye sees
// and what the ear hears, and end at rest with focus where it started.
import { renderToStaticMarkup } from 'react-dom/server'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { heard, mounted } from '../../testing/stories.ts'
import { DayProfileChart } from './DayProfileChart.tsx'
import type { DayProfileChartPoint } from './DayProfileChart.tsx'

/** Vehicles in service each hour, 00:00 to 23:00: about 90 at night, about 1 260 at each rush. */
const HOURLY = [
  210, 140, 100, 90, 120, 380, 820, 1240, 1260, 1100, 940, 960, 980, 990, 1020, 1180, 1250, 1260,
  1120, 860, 640, 520, 420, 300,
]

/** The hour's time, `HH:00`. */
const hour = (h: number) => `${String(h).padStart(2, '0')}:00`

/** A whole day of hourly points. */
const DAY: ReadonlyArray<DayProfileChartPoint> = HOURLY.map((count, h) => ({
  time: hour(h),
  count,
}))

/** The day so far: 00:00 to 14:00. */
const PART_OF_DAY = DAY.slice(0, 15)

/** The whole day with 03:00, 04:00, 11:00 and 13:00 unknown, so 12:00 stands alone. */
const UNKNOWN_HOURS: ReadonlyArray<DayProfileChartPoint> = DAY.map((point, h) =>
  [3, 4, 11, 13].includes(h) ? { time: point.time, count: null } : point,
)

const LABEL = 'Vehicles in service'

/** The container the chart sizes to: the overview sheet's 376 px, or a story's own `width`. */
const container: Decorator = (Story, { parameters }) => (
  <div style={{ inlineSize: (parameters.width as number | undefined) ?? 376 }}>
    <Story />
  </div>
)

const meta = {
  title: 'Patterns/DayProfileChart',
  component: DayProfileChart,
  args: { points: DAY, label: LABEL },
  decorators: [container],
} satisfies Meta<typeof DayProfileChart>

export default meta

type Story = StoryObj<typeof meta>

/** The chart's parts inside `canvas`. */
function parts(canvas: HTMLElement) {
  const root = canvas.querySelector<HTMLElement>('.pn-DayProfileChart')!
  const plot = root.querySelector<HTMLElement>('.pn-DayProfileChart-plot')!
  return {
    root,
    plot,
    caption: root.querySelector<HTMLElement>('.pn-DayProfileChart-caption')!,
    graph: root.querySelector<SVGSVGElement>('.pn-DayProfileChart-graph')!,
    line: root.querySelector<SVGPathElement>('.pn-DayProfileChart-line')!,
    scale: root.querySelector<HTMLElement>('.pn-DayProfileChart-scale')!,
    axis: root.querySelector<HTMLElement>('.pn-DayProfileChart-axis')!,
    ticks: [...root.querySelectorAll<HTMLElement>('.pn-DayProfileChart-tick')],
    items: within(plot).queryAllByRole('listitem'),
    tip: () => root.querySelector<HTMLElement>('.pn-DayProfileChart-tip'),
  }
}

/** The tip's two words, its time and its count, as the eye reads them. */
const tipWords = (tip: HTMLElement | null) =>
  tip ? [...tip.children].map((span) => span.textContent!.replaceAll('\u00A0', ' ')) : null

/** Which point is highlighted: its time, from the one item with `data-highlighted`. */
function highlightedTime(plot: HTMLElement) {
  const marked = plot.querySelectorAll('[data-highlighted]')
  if (marked.length === 0) return null
  if (marked.length > 1) throw new Error(`${marked.length} points highlighted`)
  return marked[0].querySelector('time')!.getAttribute('dateTime')
}

/** Expect `time` highlighted: the item marked, the plot pointing at it, the tip showing its time. */
async function expectHighlighted(plot: HTMLElement, time: string) {
  await expect(highlightedTime(plot)).toBe(time)
  const item = plot.querySelector('[data-highlighted]')!
  await expect(plot).toHaveAttribute('aria-activedescendant', item.id)
  await expect(plot.ownerDocument.getElementById(item.id)).toBe(item)
  await expect(tipWords(plot.querySelector('.pn-DayProfileChart-tip'))?.[0]).toBe(time)
}

/** Expect nothing highlighted: no item marked, no active descendant and no tip. */
async function expectAtRest(plot: HTMLElement) {
  await expect(highlightedTime(plot)).toBeNull()
  await expect(plot).not.toHaveAttribute('aria-activedescendant')
  await expect(plot.querySelector('.pn-DayProfileChart-tip')).toBeNull()
}

/** Where along the plot an element's left edge sits, as a share of the plot's width. */
const shareOf = (plot: HTMLElement, element: Element) => {
  const box = plot.getBoundingClientRect()
  return (element.getBoundingClientRect().left - box.left) / box.width
}

/** The whole day: 24 hourly points, the scale's top "1 500", the five ticks and no tip. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const { root, plot, caption, graph, scale, axis, ticks, items, tip } = parts(canvasElement)
    // the figure is named by its figcaption, natively: Chromium reads it, and the testing
    // library's name computation doesn't, so the play reads the caption's place
    await expect(canvas.getByRole('figure')).toBe(root)
    await expect(root.firstElementChild).toBe(caption)
    await expect(caption.tagName).toBe('FIGCAPTION')
    await expect(caption).toHaveTextContent(LABEL)
    await expect(canvas.getByRole('group', { name: LABEL })).toBe(plot)
    await expect(plot).toHaveAttribute('tabindex', '0')
    await expect(within(plot).getByRole('list')).toHaveClass('pn-DayProfileChart-points')
    await expect(items).toHaveLength(24)
    await expect(heard(items[0])).toBe('00:00 210')
    await expect(heard(items[7])).toBe('07:00 1 240')
    // CR-3: grouped by a no-break space
    await expect(items[7].textContent).toBe('07:00 1\u00A0240')
    await expect(items[7].querySelector('time')).toHaveAttribute('dateTime', '07:00')
    for (const hidden of [graph, scale, axis])
      await expect(hidden).toHaveAttribute('aria-hidden', 'true')
    await expect(scale.textContent).toBe('1\u00A0500')
    await expect(ticks.map((tick) => tick.textContent)).toEqual([
      '00:00',
      '06:00',
      '12:00',
      '18:00',
      '24:00',
    ])
    await expect(tip()).toBeNull()
    await expectAtRest(plot)
    // CR-10: nothing is a live region
    await expect(root.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull()
  },
}

/** The day so far: 00:00 to 14:00, the line ending at 14:00 and the right of the plot empty. */
export const PartOfDay: Story = {
  args: { points: PART_OF_DAY },
  play: async ({ canvasElement }) => {
    const { plot, items } = parts(canvasElement)
    await expect(items).toHaveLength(15)
    // CR-1: 14:00 sits at 14 / 24 of the plot's width
    await expect(shareOf(plot, items[14])).toBeCloseTo(14 / 24, 2)
    const start = document.activeElement
    await userEvent.tab()
    await expect(plot).toHaveFocus()
    await userEvent.keyboard('{End}')
    await expectHighlighted(plot, '14:00')
    await expect(tipWords(parts(canvasElement).tip())).toEqual(['14:00', '1 020'])
    await userEvent.tab({ shift: true })
    await expectAtRest(plot)
    await expect(document.activeElement).toBe(start)
  },
}

/** The day with 03:00 and 04:00 unknown, and a lone count at 12:00 between unknown 11:00 and 13:00. */
export const UnknownHours: Story = {
  args: { points: UNKNOWN_HOURS },
  play: async ({ canvasElement }) => {
    const { plot, line, items } = parts(canvasElement)
    // CR-4: one subpath per run of known counts: 00–02, 05–10, 12 and 14–23
    await expect(line.getAttribute('d')!.match(/M/g)).toHaveLength(4)
    await expect(items).toHaveLength(24)
    await expect(heard(items[3])).toBe('03:00 Unknown')
    await expect(heard(items[12])).toBe('12:00 980')
    const start = document.activeElement
    await userEvent.tab()
    await userEvent.keyboard('{Home}{ArrowRight}{ArrowRight}{ArrowRight}')
    await expectHighlighted(plot, '03:00')
    const tip = parts(canvasElement).tip()
    await expect(tipWords(tip)).toEqual(['03:00', '—'])
    await expect(tip).toHaveAttribute('aria-hidden', 'true')
    await userEvent.tab({ shift: true })
    await expectAtRest(plot)
    await expect(document.activeElement).toBe(start)
    // "Unknown" is a word the Default render doesn't show: in every locale, it is the dictionary's
    for (const locale of Object.keys(dictionaries) as Locale[])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <DayProfileChart points={UNKNOWN_HOURS} label={LABEL} />
          </PerronProvider>,
        ),
        locale,
        [LABEL],
      )
  },
}

/** `Default`'s args, driven by the keys. */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const { plot } = parts(canvasElement)
    const start = document.activeElement
    // CR-6: focus highlights the last point
    await userEvent.tab()
    await expect(plot).toHaveFocus()
    await expectHighlighted(plot, '23:00')
    await userEvent.keyboard('{ArrowLeft}')
    await expectHighlighted(plot, '22:00')
    await userEvent.keyboard('{Home}')
    await expectHighlighted(plot, '00:00')
    await userEvent.keyboard('{ArrowLeft}')
    await expectHighlighted(plot, '00:00')
    await userEvent.keyboard('{End}')
    await expectHighlighted(plot, '23:00')
    await userEvent.keyboard('{Escape}')
    await expectAtRest(plot)
    await expect(plot).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(plot).not.toHaveFocus()
    await expect(document.activeElement).toBe(start)
  },
}

/** `Default`'s args, driven by the pointer. */
export const Pointer: Story = {
  play: async ({ canvasElement }) => {
    const { plot } = parts(canvasElement)
    const box = plot.getBoundingClientRect()
    const clientY = box.top + box.height / 2
    // CR-7: the point nearest the pointer in time
    await userEvent.pointer({
      target: plot,
      coords: { clientX: box.left + box.width / 2, clientY },
    })
    await expectHighlighted(plot, '12:00')
    await userEvent.pointer({ target: plot, coords: { clientX: box.left, clientY } })
    await expectHighlighted(plot, '00:00')
    // CR-8: left-aligned inside the plot at 00:00
    const tip = parts(canvasElement).tip()!
    await expect(tip.getBoundingClientRect().left).toBeCloseTo(box.left, 0)
    await userEvent.unhover(plot)
    await expectAtRest(plot)
  },
}

/** An empty `points`: the caption, the baseline, the five ticks and nothing else. */
export const NoPoints: Story = {
  args: { points: [] },
  play: async ({ canvasElement }) => {
    const { root, plot, scale, line, ticks, items } = parts(canvasElement)
    await expect(items).toHaveLength(0)
    await expect(plot).not.toHaveAttribute('tabindex')
    await expect(scale.textContent).toBe('')
    await expect(line).not.toHaveAttribute('d')
    await expect(root.querySelector('.pn-DayProfileChart-gridline')).toBeNull()
    await expect(root.querySelector('.pn-DayProfileChart-baseline')).not.toBeNull()
    await expect(ticks).toHaveLength(5)
    const start = document.activeElement
    await userEvent.tab()
    await expect(plot).not.toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(start)
  },
}

/** `Default`'s args in a 320 px container, with a long Danish `label`. */
export const Narrow: Story = {
  args: { label: 'Køretøjer i drift i hele Hovedstadsområdets kollektivtrafiknetværk' },
  parameters: { width: 320 },
  play: async ({ canvasElement }) => {
    const { root, plot, caption, ticks } = parts(canvasElement)
    const holder = root.parentElement!.getBoundingClientRect()
    // the caption wraps, and stays inside the container
    const lineHeight = parseFloat(getComputedStyle(caption).lineHeight)
    await expect(caption.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5)
    await expect(caption.getBoundingClientRect().right).toBeLessThanOrEqual(holder.right)
    // nothing overflows the root
    await expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(holder.width)
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    // the plot keeps its shape, so it is shorter than at the sheet's 376 px
    const wide = await mounted(
      canvasElement,
      <div style={{ inlineSize: 376 }}>
        <DayProfileChart points={DAY} label={LABEL} />
      </div>,
      async (host) => {
        const sheetPlot = await waitFor(() => {
          const found = host.querySelector('.pn-DayProfileChart-plot')
          expect(found).not.toBeNull()
          return found!
        })
        return sheetPlot.getBoundingClientRect().height
      },
    )
    await expect(plot.getBoundingClientRect().height).toBeLessThan(wide)
    // the five ticks don't overlap, and none passes the plot's edges
    const box = plot.getBoundingClientRect()
    const edges = ticks.map((tick) => tick.getBoundingClientRect())
    await expect(edges[0].left).toBeGreaterThanOrEqual(box.left - 0.5)
    await expect(edges[4].right).toBeLessThanOrEqual(box.right + 0.5)
    for (let i = 1; i < edges.length; i++)
      await expect(edges[i].left).toBeGreaterThan(edges[i - 1].right)
  },
}
