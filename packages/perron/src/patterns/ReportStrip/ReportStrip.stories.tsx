// ReportStrip's stories: one per row of the spec's Stories table (docs/patterns/report-strip.md),
// with the design deferred, each with a play test that reads the accessibility tree and the drawing.
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, isInaccessible, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  colour,
  expectNoFocus,
  expectVehicleDotShape,
  heard,
  lines,
  mounted,
  rendered,
  resolve,
  typography,
} from '../../testing/stories.ts'
import { ReportStrip } from './ReportStrip.tsx'
import type { ReportStripCounts, ReportStripProps } from './ReportStrip.tsx'

/**
 * The five states, in the order Data states lists them: each one's `data-variant`, its word, the
 * prop that overrides the word, and a word of the caller's for the `Labels` story.
 */
const STATES = [
  { variant: 'live', word: 'Live', prop: 'liveLabel', own: 'Reporting now' },
  { variant: 'ageing', word: 'Ageing', prop: 'ageingLabel', own: 'Late reports' },
  { variant: 'estimated', word: 'Estimated', prop: 'estimatedLabel', own: 'Placed by delay' },
  {
    variant: 'timetable-only',
    word: 'Timetable only',
    prop: 'timetableOnlyLabel',
    own: 'Schedule alone',
  },
  { variant: 'no-signal', word: 'No signal', prop: 'noSignalLabel', own: 'Gone quiet' },
] as const satisfies readonly {
  variant: string
  word: string
  prop: keyof ReportStripProps
  own: string
}[]

const WORDS: string[] = STATES.map((s) => s.word)

/** A morning's counts: one past a thousand, and no signal at 0, a count. */
const COUNTS: ReportStripCounts = {
  live: 1046,
  ageing: 112,
  estimated: 30,
  timetableOnly: 12,
  noSignal: 0,
}

/** Live known; ageing `null`, estimated left out, timetable only `NaN`, no signal `Infinity`. */
const UNKNOWN_COUNTS: ReportStripCounts = {
  live: 1046,
  ageing: null,
  timetableOnly: Number.NaN,
  noSignal: Number.POSITIVE_INFINITY,
}

/** Every word override at once, from `STATES`, with "Unknown" as "No data yet". */
const OWN_LABELS = {
  liveLabel: STATES[0].own,
  ageingLabel: STATES[1].own,
  estimatedLabel: STATES[2].own,
  timetableOnlyLabel: STATES[3].own,
  noSignalLabel: STATES[4].own,
  unknownLabel: 'No data yet',
} satisfies Partial<ReportStripProps>

const INK = '--perron-color-text-primary'
const NO_SIGNAL = '--perron-color-data-state-no-signal'

const meta = {
  title: 'Patterns/ReportStrip',
  component: ReportStrip,
  args: { counts: COUNTS },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 'var(--perron-space-300)',
          background: 'var(--perron-color-surface-default)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReportStrip>

export default meta
type Story = StoryObj<typeof meta>

/** The strip's root in `scope`, once it has rendered. */
const stripIn = (scope: HTMLElement) =>
  waitFor(() => {
    const found = scope.querySelector<HTMLElement>('.pn-ReportStrip')
    expect(found).not.toBeNull()
    return found!
  })

/** A strip's items, labels, dots and counts, each in order. */
const partsOf = (strip: Element) => ({
  items: [...strip.querySelectorAll<HTMLElement>(':scope > .pn-ReportStrip-item')],
  labels: [...strip.querySelectorAll<HTMLElement>('.pn-ReportStrip-label')],
  dots: [...strip.querySelectorAll<HTMLElement>('.pn-ReportStrip-label .pn-VehicleDot')],
  counts: [...strip.querySelectorAll<HTMLElement>('.pn-ReportStrip-count')],
})

/** What the ear hears of each item: its word, then its count or "Unknown". */
const heardItems = (strip: HTMLElement) => within(strip).getAllByRole('listitem').map(heard)

/** A morning's counts: five items in one row. The subject story: its args render the strip alone. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const list = within(canvasElement).getByRole('list')
    const { items, labels, dots, counts } = partsOf(list)
    await step('a list of five items, heard in the order of Data states (CR-1, CR-2)', async () => {
      await expect(list.tagName).toBe('UL')
      await expect(list.className).toBe('pn-ReportStrip')
      await expect(within(list).getAllByRole('listitem')).toEqual(items)
      await expect(list.children).toHaveLength(STATES.length)
      await expect(heardItems(list)).toEqual([
        'Live 1 046',
        'Ageing 112',
        'Estimated 30',
        'Timetable only 12',
        'No signal 0',
      ])
      for (const [index, item] of items.entries()) {
        await expect(item.tagName).toBe('LI')
        await expect(item).toHaveAttribute('data-variant', STATES[index].variant)
        // the label, then the count
        await expect(item.firstElementChild).toBe(labels[index])
        await expect(item.lastElementChild).toBe(counts[index])
      }
    })
    await step('counts grouped by a no-break space; 0 is a count (CR-4, CR-5)', async () => {
      await expect(counts.map((count) => count.textContent)).toEqual([
        '1 046',
        '112',
        '30',
        '12',
        '0',
      ])
      for (const [index, count] of counts.entries()) {
        await expect(count).not.toHaveAttribute('data-unknown')
        await expect(items[index]).not.toHaveAttribute('data-unknown')
      }
    })
    await step(
      'each label: a VehicleDotLabel with no line, its dot in the ink (CR-3)',
      async () => {
        const ink = colour(INK)
        await expect(ink).not.toBe(colour('--perron-color-transit-line-m1'))
        for (const [index, label] of labels.entries()) {
          const { variant, word } = STATES[index]
          await expect(label.className).toBe('pn-VehicleDotLabel pn-ReportStrip-label')
          await expect(label).toHaveAttribute('data-variant', variant)
          await expect(label).not.toHaveAttribute('data-line')
          await expect(heard(label)).toBe(word)
          const dot = dots[index]
          await expect(dot).not.toHaveAttribute('data-line')
          await expect(dot).toHaveAttribute('aria-hidden', 'true')
          await expect(isInaccessible(dot)).toBe(true)
          await expect(getComputedStyle(dot).color).toBe(ink)
          // every dot in the ink; no signal's circle keeps VehicleDot's own grey
          await expectVehicleDotShape(dot, variant, ink, colour(NO_SIGNAL))
        }
        await expect(within(list).queryAllByRole('img')).toHaveLength(0)
      },
    )
    await step('each count: typography.data in color.text.primary, tabular', async () => {
      // tabular-nums leaves the computed font shorthand empty, so the role is read in its longhands
      const probe = document.createElement('span')
      probe.style.font = 'var(--perron-typography-data)'
      document.body.append(probe)
      const role = getComputedStyle(probe)
      const font = [role.fontFamily, role.fontSize, role.fontWeight, role.lineHeight]
      probe.remove()
      const tracking = resolve('letterSpacing', 'var(--perron-typography-data-tracking)')
      await expect(font[0]).toContain('JetBrains Mono')
      for (const count of counts) {
        const style = getComputedStyle(count)
        await expect([
          style.fontFamily,
          style.fontSize,
          style.fontWeight,
          style.lineHeight,
        ]).toEqual(font)
        await expect(style.letterSpacing).toBe(tracking)
        await expect(style.fontVariantNumeric).toBe('tabular-nums')
        await expect(style.whiteSpace).toBe('nowrap')
        await expect(style.color).toBe(colour(INK))
      }
    })
    await step('the gaps, and no surface, bullets or place of its own (CR-7, CR-8)', async () => {
      const style = getComputedStyle(list)
      await expect(style.display).toBe('flex')
      await expect(style.flexWrap).toBe('wrap')
      await expect(style.columnGap).toBe(rendered('space-400', 'column-gap'))
      await expect(style.rowGap).toBe(rendered('space-100', 'row-gap'))
      await expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
      await expect(style.borderStyle).toBe('none')
      await expect(style.boxShadow).toBe('none')
      await expect(style.position).toBe('static')
      await expect(style.zIndex).toBe('auto')
      await expect(style.margin).toBe('0px')
      await expect(style.padding).toBe('0px')
      await expect(style.listStyleType).toBe('none')
      for (const item of items) {
        const own = getComputedStyle(item)
        await expect(own.alignItems).toBe('baseline')
        await expect(own.columnGap).toBe(rendered('space-200', 'column-gap'))
        await expect(own.margin).toBe('0px')
      }
    })
    await step('no tab stop: Tab passes the strip by (CR-10)', async () => {
      await expect(list.querySelector('[tabindex], a, button, input')).toBeNull()
      await mounted(
        canvasElement,
        <>
          <button type="button">Before</button>
          <ReportStrip counts={COUNTS} data-testid="between" />
          <button type="button">After</button>
        </>,
        async (host) => {
          const [before, after] = await waitFor(() => within(host).getAllByRole('button'))
          before.focus()
          await expectNoFocus(within(host).getByTestId('between'))
          await expect(before).toHaveFocus()
          await userEvent.tab()
          await expect(after).toHaveFocus()
          await userEvent.tab({ shift: true })
          await expect(before).toHaveFocus()
          before.blur()
        },
      )
    })
    await step('no name of its own and no live region; aria-label names it (CR-11)', async () => {
      await expect(list).not.toHaveAccessibleName()
      await expect(list.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull()
      await expect(list).not.toHaveAttribute('aria-live')
      await mounted(
        canvasElement,
        <>
          <ReportStrip counts={COUNTS} aria-label="Reporting now" />
          <p id="strip-title" style={typography('label')}>
            Reporting, by state
          </p>
          <ReportStrip counts={COUNTS} aria-labelledby="strip-title" />
        </>,
        async (host) => {
          await waitFor(() => within(host).getByRole('list', { name: 'Reporting now' }))
          await expect(
            within(host).getByRole('list', { name: 'Reporting, by state' }),
          ).toBeInTheDocument()
        },
      )
    })
    await step('className follows pn-ReportStrip on the root', async () => {
      await mounted(
        canvasElement,
        <ReportStrip counts={COUNTS} className="caller" />,
        async (host) => {
          const own = await stripIn(host)
          await expect(own.className).toBe('pn-ReportStrip caller')
        },
      )
    })
    await step('ref, as an object and as a callback, and style reach the root', async () => {
      const held = createRef<HTMLUListElement>()
      let called: HTMLUListElement | null = null
      await mounted(
        canvasElement,
        <>
          <ReportStrip counts={COUNTS} ref={held} style={{ opacity: 0.5 }} data-testid="object" />
          <ReportStrip
            counts={COUNTS}
            ref={(element) => {
              called = element
            }}
            data-testid="callback"
          />
        </>,
        async (host) => {
          const object = await waitFor(() => within(host).getByTestId('object'))
          await expect(held.current).toBe(object)
          await expect(held.current).toHaveClass('pn-ReportStrip')
          await expect(called).toBe(within(host).getByTestId('callback'))
          await expect(object.style.opacity).toBe('0.5')
          await expect(getComputedStyle(object).opacity).toBe('0.5')
        },
      )
    })
    await step('its own props never reach the DOM (CR-9)', async () => {
      await mounted(
        canvasElement,
        <ReportStrip
          counts={UNKNOWN_COUNTS}
          className="caller"
          {...OWN_LABELS}
          slotProps={{ item: {}, label: {}, count: {} }}
        />,
        async (host) => {
          const own = await stripIn(host)
          await expect(own.getAttributeNames()).toEqual(['class'])
          await expect(own.className).toBe('pn-ReportStrip caller')
          await expect(heardItems(own)[1]).toBe(`${STATES[1].own} No data yet`)
        },
      )
    })
    await step(
      'each slotProps className joins after its part’s own, on all five (CR-12)',
      async () => {
        await mounted(
          canvasElement,
          <ReportStrip
            counts={COUNTS}
            slotProps={{
              item: { className: 'caller-item' },
              label: { className: 'caller-label' },
              count: { className: 'caller-count' },
            }}
          />,
          async (host) => {
            const own = partsOf(await stripIn(host))
            for (const [index, { variant }] of STATES.entries()) {
              await expect(own.items[index].className).toBe('pn-ReportStrip-item caller-item')
              await expect(own.items[index]).toHaveAttribute('data-variant', variant)
              await expect(own.labels[index].className).toBe(
                'pn-VehicleDotLabel pn-ReportStrip-label caller-label',
              )
              await expect(own.labels[index]).toHaveAttribute('data-variant', variant)
              await expect(own.counts[index].className).toBe('pn-ReportStrip-count caller-count')
            }
          },
        )
      },
    )
  },
}

/** Live known, and the four others unknown, each a way `counts` can leave one out. */
export const UnknownCounts: Story = {
  args: { counts: UNKNOWN_COUNTS },
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list')
    const { items, counts } = partsOf(list)
    // five items still, in order, each heard as its word, then its count or "Unknown"
    await expect(items).toHaveLength(STATES.length)
    await expect(heardItems(list)).toEqual([
      'Live 1 046',
      'Ageing Unknown',
      'Estimated Unknown',
      'Timetable only Unknown',
      'No signal Unknown',
    ])
    // CR-5: the live item is a count
    await expect(items[0]).not.toHaveAttribute('data-unknown')
    await expect(counts[0]).not.toHaveAttribute('data-unknown')
    const quiet = colour('--perron-color-text-tertiary')
    for (const [index, item] of items.entries()) {
      await expect(item).toHaveAttribute('data-variant', STATES[index].variant)
      if (index === 0) continue
      const count = counts[index]
      await expect(item).toHaveAttribute('data-unknown', '')
      await expect(count).toHaveAttribute('data-unknown', '')
      const dash = count.querySelector('[aria-hidden="true"]')!
      await expect(dash).toHaveTextContent(/^—$/)
      await expect(isInaccessible(dash)).toBe(true)
      await expect(heard(count)).toBe('Unknown')
      await expect(getComputedStyle(dash).color).toBe(quiet)
    }
    // "Unknown" is a word the Default render doesn't show: in every locale, it is the dictionary's
    for (const locale of Object.keys(dictionaries) as Locale[])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <ReportStrip counts={UNKNOWN_COUNTS} />
          </PerronProvider>,
        ),
        locale,
      )
  },
}

/** `Default`'s counts in Swedish, in a 320 px container, wrapped onto more than one row. */
export const Narrow: Story = {
  render: (args) => (
    <PerronProvider locale="sv">
      <div data-testid="narrow" style={{ inlineSize: 320 }}>
        <ReportStrip {...args} />
      </div>
    </PerronProvider>
  ),
  play: async ({ canvasElement }) => {
    const container = within(canvasElement).getByTestId('narrow')
    await expect(container.getBoundingClientRect().width).toBe(320)
    const strip = await stripIn(container)
    const { items, labels, counts } = partsOf(strip)
    await expect(labels.map((label) => heard(label))).toContain('Endast tidtabell')
    // the items sit on more than one row
    const rows = new Set(items.map((item) => Math.round(item.getBoundingClientRect().top)))
    await expect(rows.size).toBeGreaterThan(1)
    // each count stays on one line
    for (const count of counts) await expect(lines(count)).toBeLessThan(1.5)
    // no item reaches past the container's edge (CR-7)
    const edge = container.getBoundingClientRect()
    for (const item of items) {
      const box = item.getBoundingClientRect()
      await expect(box.left).toBeGreaterThanOrEqual(edge.left - 0.5)
      await expect(box.right).toBeLessThanOrEqual(edge.right + 0.5)
    }
    await expect(container.scrollWidth).toBe(container.clientWidth)
    await expect(strip.scrollWidth).toBe(strip.clientWidth)
  },
}

/** `UnknownCounts`' counts with every word overridden, and "Unknown" as "No data yet". */
export const Labels: Story = {
  args: { counts: UNKNOWN_COUNTS, ...OWN_LABELS },
  play: async ({ canvasElement, step }) => {
    const list = within(canvasElement).getByRole('list')
    await step('each word and the unknown counts are the caller’s (CR-6)', async () => {
      await expect(heardItems(list)).toEqual([
        `${STATES[0].own} 1 046`,
        ...STATES.slice(1).map(({ own }) => `${own} No data yet`),
      ])
      // each dot's name is its own item's word too
      for (const [index, dot] of partsOf(list).dots.entries())
        await expect(dot).toHaveAttribute('aria-label', STATES[index].own)
      for (const word of [...WORDS, 'Unknown']) await expect(list.textContent).not.toContain(word)
    })
    for (const [index, { prop, word, own }] of STATES.entries())
      await step(`${prop} replaces only “${word}”`, async () => {
        await mounted(
          canvasElement,
          <ReportStrip counts={COUNTS} {...{ [prop]: own }} />,
          async (host) => {
            const strip = await stripIn(host)
            await expect(partsOf(strip).labels.map((label) => heard(label))).toEqual(
              WORDS.with(index, own),
            )
          },
        )
      })
  },
}
