// KioskBar's stories: one per row of the spec's Stories table (docs/patterns/kiosk-bar.md), with the
// design deferred, each over a busy map-like backdrop that shows the glass, and their play tests,
// which read what the eye sees and what the ear hears.
import type { CSSProperties } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { KioskBar } from './KioskBar.tsx'
import type { KioskBarStat } from './KioskBar.tsx'

/**
 * A busy, map-like backdrop of land, water, a park, streets and a metro line, as Surface's `Glass`
 * story sets its panels on, so the blur has something to soften.
 */
const BACKDROP: CSSProperties = {
  background: [
    'linear-gradient(90deg, transparent 0 24%, var(--perron-color-transit-line-m2) 24% 26%, transparent 26%)',
    'repeating-linear-gradient(35deg, var(--perron-color-map-street) 0 var(--perron-space-100), transparent var(--perron-space-100) var(--perron-space-600))',
    'radial-gradient(circle at 40% 10%, var(--perron-color-map-water) 0 25%, transparent 25%)',
    'radial-gradient(circle at 5% 80%, var(--perron-color-map-park) 0 20%, transparent 20%)',
    'var(--perron-color-map-land)',
  ].join(', '),
  padding: 'var(--perron-size-panel-gap)',
}

/** The map the bar floats over, `size.panel-gap` from its edges, as its screen places it. */
const overTheMap: Decorator = (Story) => (
  <div style={BACKDROP}>
    <Story />
  </div>
)

/** Three key figures about the network, as a kiosk shows them. */
const STATS: ReadonlyArray<KioskBarStat> = [
  { label: 'Vehicles on the map', figure: '1 204' },
  { label: 'Reporting live', figure: '1 046' },
  { label: 'Average delay', figure: '2 min' },
]

/** The same figures with "Average delay" given no figure. */
const UNKNOWN_DELAY: ReadonlyArray<KioskBarStat> = [STATS[0], STATS[1], { label: 'Average delay' }]

const meta = {
  title: 'Patterns/KioskBar',
  component: KioskBar,
  args: { time: '08:14', stats: STATS },
  decorators: [overTheMap],
} satisfies Meta<typeof KioskBar>

export default meta

type Story = StoryObj<typeof meta>

/** The bar rendered inside `canvas`. */
const rootIn = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('.pn-KioskBar')!

/** What a screen reader reads of `element`: its text outside `aria-hidden`. */
function heard(element: Element) {
  const copy = element.cloneNode(true) as HTMLElement
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove()
  return copy.textContent!.replace(/\s+/g, ' ').trim()
}

/** What the ear hears of each figure, its label then its figure. */
const heardFigures = (canvas: HTMLElement) =>
  within(canvas)
    .getAllByRole('listitem')
    .map((item) => [...item.children].map(heard))

/** Tab once, and expect focus to land nowhere inside `root`, then go back. */
async function expectNoFocus(root: HTMLElement) {
  await userEvent.tab()
  await expect(root.contains(document.activeElement)).toBe(false)
  await userEvent.tab({ shift: true })
}

/** The clock at 08:14 with three figures about the network; the contract story renders it. */
export const Default: Story = {
  args: { time: '08:14', stats: STATS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = rootIn(canvasElement)
    await expect(root).toHaveClass('pn-Surface')
    await expect(root).toHaveAttribute('data-variant', 'glass')
    await expect(root.className).toBe('pn-Surface pn-KioskBar')
    await expect(canvas.getByRole('list')).toHaveClass('pn-KioskBar-stats')
    await expect(heardFigures(canvasElement)).toEqual([
      ['Vehicles on the map', '1 204'],
      ['Reporting live', '1 046'],
      ['Average delay', '2 min'],
    ])
    for (const item of canvas.getAllByRole('listitem')) {
      await expect(item).toHaveClass('pn-Stat')
      await expect(item).toHaveClass('pn-KioskBar-stat')
    }
    const time = canvas.getByRole('time')
    await expect(time).toHaveAttribute('dateTime', '08:14')
    await expect(time).toHaveTextContent(/^08:14$/)
    await expect(getComputedStyle(time).fontVariantNumeric).toBe('tabular-nums')
    // CR-3: brand, figures, clock, in the DOM
    await expect(root.children).toHaveLength(3)
    await expect(root.children[0]).toHaveClass('pn-Brand', 'pn-KioskBar-brand')
    // the mark beside the wordmark, named "Mylder"
    await expect(root.children[0]).toHaveAttribute('data-variant', 'full')
    await expect(heard(root.children[0])).toBe('Mylder')
    await expect(root.children[1]).toBe(canvas.getByRole('list'))
    await expect(root.children[2]).toBe(time)
    // CR-8: no live region, no focus
    await expect(root.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull()
    await expectNoFocus(root)
  },
}

/** `Default`'s figures with "Average delay" given no figure: "—", heard as "Unknown". */
export const UnknownFigure: Story = {
  args: { time: '08:14', stats: UNKNOWN_DELAY },
  play: async ({ canvasElement }) => {
    await expect(heardFigures(canvasElement)[2]).toEqual(['Average delay', 'Unknown'])
    const third = within(canvasElement).getAllByRole('listitem')[2]
    await expect(third).toHaveAttribute('data-unknown', '')
    await expect(third.querySelector('.pn-Stat-value [aria-hidden="true"]')).toHaveTextContent(
      /^—$/,
    )
    // "Unknown" is a word the Default render doesn't show: in every locale, it is the dictionary's
    const words = ['Vehicles on the map', 'Reporting live', 'Average delay', '1 204', '1 046']
    for (const locale of Object.keys(dictionaries) as Locale[])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <KioskBar time="08:14" stats={UNKNOWN_DELAY} />
          </PerronProvider>,
        ),
        locale,
        words,
      )
  },
}

/** The clock at 23:59 and no figures: the brand and the clock alone. */
export const NoStats: Story = {
  args: { time: '23:59', stats: undefined },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    // CR-4: no empty list is announced
    await expect(within(canvasElement).queryByRole('list')).toBeNull()
    const time = within(canvasElement).getByRole('time')
    await expect(time).toHaveTextContent(/^23:59$/)
    await expect(root.lastElementChild).toBe(time)
    // CR-3: the clock ends the row, at the end of the root's content box
    const style = getComputedStyle(root)
    const end =
      root.getBoundingClientRect().right -
      parseFloat(style.paddingInlineEnd) -
      parseFloat(style.borderInlineEndWidth)
    await expect(time.getBoundingClientRect().right).toBeCloseTo(end, 0)
    await expectNoFocus(root)
  },
}

/** `Default`'s figures with the brand's mark alone, in a 320 px wide container. */
export const Narrow: Story = {
  args: { time: '08:14', stats: STATS, slotProps: { brand: { variant: 'mark' } } },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 320 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    const container = root.parentElement!.getBoundingClientRect()
    const box = root.getBoundingClientRect()
    // nothing overflows: the root is no wider than its container, and no part is wider than it
    await expect(box.width).toBeLessThanOrEqual(container.width)
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    for (const part of root.querySelectorAll('.pn-KioskBar-stat, .pn-KioskBar-time')) {
      await expect(part.getBoundingClientRect().left).toBeGreaterThanOrEqual(box.left)
      await expect(part.getBoundingClientRect().right).toBeLessThanOrEqual(box.right)
    }
    // the row wraps: the clock is on a line below the brand's
    const brand = root.querySelector('.pn-KioskBar-brand')!
    const time = within(canvasElement).getByRole('time')
    await expect(time.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      brand.getBoundingClientRect().bottom,
    )
    // the mark alone, still named "Mylder"
    await expect(brand).toHaveAttribute('data-variant', 'mark')
    await expect(heard(brand)).toBe('Mylder')
  },
}

/** `Default`'s figures with one unknown, the brand name and "Unknown" overridden. */
export const Labels: Story = {
  args: {
    time: '08:14',
    stats: UNKNOWN_DELAY,
    brandNameLabel: 'Perron',
    unknownLabel: 'No data yet',
  },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(heard(root.querySelector('.pn-KioskBar-brand')!)).toBe('Perron')
    await expect(heardFigures(canvasElement)[2]).toEqual(['Average delay', 'No data yet'])
    await expect(root).not.toHaveTextContent(/Mylder/i)
    await expect(root).not.toHaveTextContent(/Unknown/)
  },
}
