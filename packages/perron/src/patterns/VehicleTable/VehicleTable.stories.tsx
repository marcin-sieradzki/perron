// VehicleTable's stories: one per row of the spec's Stories table (docs/patterns/vehicle-table.md),
// with the design deferred, and their play tests, which read the accessibility tree and the DOM.
import { createRef } from 'react'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, isInaccessible, userEvent, waitFor, within } from 'storybook/test'
import { Link } from '../../components/Link/Link.tsx'
import { delayKnown, VEHICLE_STATES } from '../../internal/vehicle-states.ts'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  colour,
  edge,
  expectFocusRing,
  expectNoFocus,
  fill,
  heard,
  lines,
  mounted,
  onHover,
  pressedAfterHover,
  rendered,
  stateFill,
  stateRules,
  typography,
} from '../../testing/stories.ts'
import { VehicleTable } from './VehicleTable.tsx'
import type {
  VehicleTableColumn,
  VehicleTableProps,
  VehicleTableSort,
  VehicleTableVehicle,
} from './VehicleTable.tsx'

/**
 * Five vehicles, one in each data state, on lines whose badges reach 4.5:1 (CR-9): the
 * timetable-only one gives no delay, and the no-signal one gives a delay its state hides (CR-4).
 */
const VEHICLES: VehicleTableVehicle[] = [
  {
    id: 'bus-5c-1042',
    line: 'bus',
    lineName: '5C',
    destination: 'Husum Torv',
    variant: 'live',
    delay: 0,
  },
  {
    id: 'metro-m2-07',
    line: 'm2',
    lineName: 'M2',
    destination: 'Lufthavnen',
    variant: 'estimated',
    delay: 3,
  },
  {
    id: 'stog-f-4511',
    line: 'f',
    lineName: 'F',
    destination: 'Hellerup',
    variant: 'ageing',
    delay: -1,
  },
  {
    id: 'regional-re-1031',
    line: 'regional',
    lineName: 'RE',
    destination: 'Helsingør',
    variant: 'timetable-only',
  },
  {
    id: 'bus-150s-2208',
    line: 'bus',
    lineName: '150S',
    destination: 'Kokkedal St.',
    variant: 'no-signal',
    delay: 4,
  },
]

/** The column headers, in order. */
const HEADERS = ['Line', 'Destination', 'Position', 'Delay']

/** The column headers with Last seen shown, in order (CR-3, CR-11). */
const HEADERS_LAST_SEEN = ['Line', 'Destination', 'Position', 'Last seen', 'Delay']

/** Every other prop VehicleTable declares but `vehicles`, each given, for the root's check. */
const OWN = {
  sort: { column: 'line', direction: 'asc' },
  onSortChange: () => {},
  delayColumnHidden: false,
  lastSeenColumnVisible: true,
} satisfies Partial<VehicleTableProps>

/** Every label prop VehicleTable declares, each with a word no locale has. */
const OVERRIDES = {
  lineColumnLabel: 'Route',
  destinationColumnLabel: 'Heading to',
  positionColumnLabel: 'Freshness',
  delayColumnLabel: 'Lateness',
  lastSeenColumnLabel: 'Last report',
  unknownLabel: 'No report',
  liveLabel: 'Tracked now',
  ageingLabel: 'Going stale',
  estimatedLabel: 'Guessed',
  timetableOnlyLabel: 'Scheduled',
  noSignalLabel: 'Silent',
  minutesUnitLabel: 'mins',
  minutesLateLabel: 'mins behind',
  minutesEarlyLabel: 'mins ahead',
  onTimeLabel: 'Punctual',
  delayUnknownLabel: 'No lateness data',
} satisfies Partial<VehicleTableProps>

const meta = {
  title: 'Patterns/VehicleTable',
  component: VehicleTable,
  args: { vehicles: VEHICLES, 'aria-label': 'Vehicles' },
  // the decorator's padding is the sheet's, so Storybook adds none of its own: at a 320 px screen
  // the table gets the 288 px CR-8 measures it at
  parameters: { layout: 'fullscreen' },
  decorators: [
    // a detail panel or sheet: its width and its raised surface
    (Story) => (
      <div
        style={{
          boxSizing: 'border-box',
          inlineSize: 'var(--perron-size-detail-width)',
          maxInlineSize: '100%',
          padding: 'var(--perron-space-400)',
          background: 'var(--perron-color-surface-raised)',
          color: 'var(--perron-color-text-primary)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VehicleTable>

export default meta
type Story = StoryObj<typeof meta>

/** The body rows of `table`, in order. */
const bodyRows = (table: HTMLTableElement) => [...table.tBodies[0].rows]

/** What a screen reader reads of each cell of `row`, in order, joined by a space. */
const heardRow = (row: HTMLTableRowElement) => [...row.cells].map(heard).join(' ')

/** The table `host` holds, once React has rendered it. */
const tableIn = (host: HTMLElement) =>
  waitFor(() => {
    const table = host.querySelector('table')
    expect(table).not.toBeNull()
    return table!
  })

/**
 * Each word of `element`'s one text run sits on one line, but those in `except`: it wraps at its
 * spaces only.
 */
async function expectWholeWords(element: Element, except: string[] = []) {
  const text = element.firstChild!
  let start = 0
  for (const word of text.textContent!.split(' ')) {
    const range = document.createRange()
    range.setStart(text, start)
    range.setEnd(text, start + word.length)
    start += word.length + 1
    if (except.includes(word)) continue
    await expect(new Set([...range.getClientRects()].map((box) => Math.round(box.top))).size).toBe(
      1,
    )
  }
}

/** The text of the parts with class `part` in `root`, in order. */
const textsOf = (root: Element, part: string) =>
  [...root.querySelectorAll(`.pn-VehicleTable-${part}`)].map((node) => node.textContent)

/**
 * Five vehicles, one per data state. The subject story: its args render the table alone, named
 * "Vehicles" by the caller.
 */
export const Default: Story = {
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement)
    const table = canvas.getByRole('table', { name: 'Vehicles' }) as HTMLTableElement

    await step('four column headers, text only, in order (CR-3)', async () => {
      const headers = within(table).getAllByRole('columnheader')
      await expect(headers.map((header) => header.textContent)).toEqual(HEADERS)
      for (const header of headers) {
        await expect(header).toHaveAttribute('scope', 'col')
        await expect(header).not.toHaveAttribute('aria-sort')
        await expect(within(header).queryByRole('button')).toBeNull()
      }
    })

    await step('one row per vehicle, in the order given, each with two row headers', async () => {
      const rows = bodyRows(table)
      await expect(rows).toHaveLength(VEHICLES.length)
      for (const [index, row] of rows.entries()) {
        const vehicle = VEHICLES[index]
        await expect(row).toHaveAttribute('data-variant', vehicle.variant)
        const headers = within(row).getAllByRole('rowheader')
        await expect(headers.map((header) => header.textContent)).toEqual([
          vehicle.lineName,
          vehicle.destination,
        ])
        for (const header of headers) await expect(header).toHaveAttribute('scope', 'row')
        await expect(within(row).getAllByRole('cell')).toHaveLength(2)
      }
      await expect(heardRow(rows[0])).toBe('5C Husum Torv Live On time')
    })

    await step('the dots are hidden, since the word beside each says the same', async () => {
      const dots = table.querySelectorAll('.pn-VehicleDot')
      await expect(dots).toHaveLength(VEHICLES.length)
      for (const dot of dots) {
        await expect(dot).toHaveAttribute('aria-hidden', 'true')
        await expect(isInaccessible(dot as HTMLElement)).toBe(true)
      }
    })

    await step(
      'read, never operated: table roles, and no hover or pressed look (CR-1, CR-7)',
      async () => {
        const displays = [table, table.tHead!, table.tBodies[0], ...table.rows].map(
          (part) => getComputedStyle(part).display,
        )
        await expect(displays).toEqual([
          'table',
          'table-header-group',
          'table-row-group',
          ...[...table.rows].map(() => 'table-row'),
        ])
        for (const cell of table.querySelectorAll('th, td'))
          await expect(getComputedStyle(cell).display).toBe('table-cell')
        for (const part of [...table.rows, ...table.querySelectorAll('th, td')]) {
          await expect(stateRules(part, ':hover')).toHaveLength(0)
          await expect(stateRules(part, ':active')).toHaveLength(0)
          await expect(part).not.toHaveAttribute('tabindex')
        }
      },
    )

    await step('a timetable-only or no-signal vehicle has an unknown delay (CR-4)', async () => {
      const rows = bodyRows(table)
      await expect(rows[4].querySelector('.pn-VehicleTable-delay')).toHaveAttribute(
        'data-delay',
        'unknown',
      )
      for (const row of rows.slice(3)) {
        const delay = row.querySelector('.pn-VehicleTable-delay')!
        await expect(delay).toHaveAttribute('data-delay', 'unknown')
        await expect(heard(delay)).toBe('Delay unknown')
      }
      // the others show their figure, "On time" or the early figure
      await expect(
        rows.slice(0, 3).map((row) => row.querySelector('.pn-Delay')!.getAttribute('data-delay')),
      ).toEqual(['on-time', 'late', 'early'])
    })

    await step(
      'in every variant, a delay given, null or left out: a figure only where the state allows it (CR-4)',
      async () => {
        const given: Pick<VehicleTableVehicle, 'delay'>[] = [{ delay: 3 }, { delay: null }, {}]
        const vehicles = VEHICLE_STATES.flatMap((variant) =>
          given.map((delay, index): VehicleTableVehicle => ({
            id: `${variant}-${index}`,
            line: 'bus',
            lineName: '5C',
            destination: 'Husum Torv',
            variant,
            ...delay,
          })),
        )
        await mounted(
          canvasElement,
          <VehicleTable vehicles={vehicles} aria-label="Delays" />,
          async (host) => {
            const root = await tableIn(host)
            for (const [index, row] of bodyRows(root).entries()) {
              const { variant, delay: minutes } = vehicles[index]
              const delay = row.querySelector('.pn-VehicleTable-delay')!
              const shown = typeof minutes === 'number' && delayKnown(variant)
              if (shown) {
                await expect(delay).toHaveAttribute('data-delay', 'late')
                await expect(heard(delay)).toBe('3 min late')
              } else {
                await expect(delay).toHaveAttribute('data-delay', 'unknown')
                await expect(delay.querySelector('.pn-Delay-value')).toHaveTextContent('—')
                await expect(heard(delay)).toBe('Delay unknown')
              }
            }
          },
        )
      },
    )

    await step('the table owns no name and is no live region (CR-5, CR-7)', async () => {
      for (const part of [table, ...table.querySelectorAll('*')]) {
        await expect(part).not.toHaveAttribute('aria-live')
        await expect(['status', 'log', 'alert', 'marquee', 'timer']).not.toContain(
          part.getAttribute('role'),
        )
      }
      await mounted(canvasElement, <VehicleTable vehicles={VEHICLES} />, async (host) => {
        const root = await tableIn(host)
        await expect(root).toHaveAccessibleName('')
        await expect(root).not.toHaveAttribute('aria-label')
        await expect(root).not.toHaveAttribute('aria-labelledby')
        await expect(root.querySelector('caption')).toBeNull()
      })
      // the caller names it from the heading above it
      await mounted(
        canvasElement,
        <>
          <h2 id="vehicle-table-heading" style={typography('heading-sm')}>
            Vehicles on line 5C
          </h2>
          <VehicleTable vehicles={VEHICLES} aria-labelledby="vehicle-table-heading" />
        </>,
        async (host) => {
          await tableIn(host)
          await expect(
            within(host).getByRole('table', { name: 'Vehicles on line 5C' }),
          ).toBeInTheDocument()
        },
      )
    })

    await step('Tab passes the table by', async () => {
      await expectNoFocus(table)
      await mounted(
        canvasElement,
        <>
          <button type="button">Before the table</button>
          <VehicleTable vehicles={VEHICLES} aria-label="Passed by" />
          <button type="button">After the table</button>
        </>,
        async (host) => {
          await tableIn(host)
          const [before, after] = within(host).getAllByRole('button')
          before.focus()
          await userEvent.tab()
          await expect(after).toHaveFocus()
          await userEvent.tab({ shift: true })
          await expect(before).toHaveFocus()
          before.blur()
        },
      )
    })

    await step("a caller's links in the destinations are reached in row order", async () => {
      const linked = VEHICLES.map((vehicle) => ({
        ...vehicle,
        destination: <Link href={`#${vehicle.id}`}>{vehicle.destination as string}</Link>,
      }))
      await mounted(
        canvasElement,
        <>
          <button type="button">Before the table</button>
          <VehicleTable vehicles={linked} aria-label="Linked" />
        </>,
        async (host) => {
          await tableIn(host)
          const before = within(host).getByRole('button')
          const links = within(host).getAllByRole('link')
          await expect(links.map((link) => link.textContent)).toEqual(
            VEHICLES.map((vehicle) => vehicle.destination),
          )
          before.focus()
          for (const link of links) {
            await userEvent.tab()
            await expect(link).toHaveFocus()
          }
          for (const link of links.slice(0, -1).reverse()) {
            await userEvent.tab({ shift: true })
            await expect(link).toHaveFocus()
          }
          await userEvent.tab({ shift: true })
          await expect(before).toHaveFocus()
          before.blur()
        },
      )
    })

    await step('the root: its class, ref and style, and none of its own props (CR-2)', async () => {
      const ref = createRef<HTMLTableElement>()
      await mounted(
        canvasElement,
        <VehicleTable
          vehicles={VEHICLES}
          aria-label="Root"
          className="caller"
          style={{ marginBlockStart: 'var(--perron-space-200)' }}
          data-testid="root"
          ref={ref}
          {...OVERRIDES}
          {...OWN}
        />,
        async (host) => {
          const root = await tableIn(host)
          await expect(ref.current).toBe(root)
          await expect(root).toHaveAttribute('class', 'pn-VehicleTable caller')
          await expect(root).toHaveAttribute('data-testid', 'root')
          await expect(root.style.marginBlockStart).toBe('var(--perron-space-200)')
          const own = ['vehicles', ...Object.keys(OVERRIDES), ...Object.keys(OWN)].map((name) =>
            name.toLowerCase(),
          )
          for (const attribute of root.getAttributeNames())
            await expect(own).not.toContain(attribute)
        },
      )
    })

    await step("every label prop replaces its word, the components' included", async () => {
      // one vehicle late, early, on time and unknown, so each of Delay's words shows
      const vehicles: VehicleTableVehicle[] = [
        ...VEHICLES,
        { id: 'stog-e-12', line: 'e', lineName: 'E', destination: 'Køge', variant: 'live' },
      ]
      await mounted(
        canvasElement,
        <VehicleTable
          vehicles={vehicles}
          aria-label="Overridden"
          lastSeenColumnVisible
          {...OVERRIDES}
        />,
        async (host) => {
          const root = await tableIn(host)
          await expect(textsOf(root, 'headerCell')).toEqual([
            OVERRIDES.lineColumnLabel,
            OVERRIDES.destinationColumnLabel,
            OVERRIDES.positionColumnLabel,
            OVERRIDES.lastSeenColumnLabel,
            OVERRIDES.delayColumnLabel,
          ])
          // no vehicle here gives a last-seen time, so each says the override for unknown
          for (const cell of root.querySelectorAll('.pn-VehicleTable-lastSeenCell'))
            await expect(heard(cell)).toBe(OVERRIDES.unknownLabel)
          await expect(textsOf(root, 'status')).toEqual([
            OVERRIDES.liveLabel,
            OVERRIDES.estimatedLabel,
            OVERRIDES.ageingLabel,
            OVERRIDES.timetableOnlyLabel,
            OVERRIDES.noSignalLabel,
            OVERRIDES.liveLabel,
          ])
          const delays = [...root.querySelectorAll('.pn-VehicleTable-delay')].map(heard)
          await expect(delays).toEqual([
            OVERRIDES.onTimeLabel,
            `3 ${OVERRIDES.minutesLateLabel}`,
            `1 ${OVERRIDES.minutesEarlyLabel}`,
            OVERRIDES.delayUnknownLabel,
            OVERRIDES.delayUnknownLabel,
            OVERRIDES.delayUnknownLabel,
          ])
          for (const unit of root.querySelectorAll('.pn-Delay-unit'))
            await expect(unit).toHaveTextContent(OVERRIDES.minutesUnitLabel)
          const text = root.textContent!
          for (const word of [
            ...HEADERS_LAST_SEEN,
            'Unknown',
            'Live',
            'Ageing',
            'Estimated',
            'Timetable only',
            'No signal',
            'min late',
            'min early',
            'On time',
            'Delay unknown',
          ])
            await expect(text).not.toContain(word)
        },
      )
    })

    await step(
      'the line name and the destination take a string, an element and a list',
      async () => {
        const shapes: [ReactNode, ReactNode, string, string][] = [
          ['5C', 'Husum Torv', '5C', 'Husum Torv'],
          [<strong>5C</strong>, <em>Husum Torv</em>, '5C', 'Husum Torv'],
          [['150', 'S'], ['Kokkedal', ' St.'], '150S', 'Kokkedal St.'],
        ]
        for (const [lineName, destination, line, place] of shapes)
          await mounted(
            canvasElement,
            <VehicleTable
              vehicles={[{ id: 'shape', line: 'bus', lineName, destination, variant: 'live' }]}
              aria-label="Shapes"
            />,
            async (host) => {
              const root = await tableIn(host)
              const headers = within(root).getAllByRole('rowheader')
              await expect(headers.map((header) => header.textContent)).toEqual([line, place])
            },
          )
      },
    )

    await step("at the panel's width, each state's word keeps to one line (CR-8)", async () => {
      const labels = table.querySelectorAll('.pn-VehicleDotLabel-label')
      await expect(labels).toHaveLength(VEHICLES.length)
      for (const label of labels) await expect(lines(label)).toBeLessThan(1.5)
    })

    await step('rows are at least size.vehicle-row tall, divided by a hairline', async () => {
      const rows = bodyRows(table)
      const least = Number.parseFloat(rendered('size-vehicle-row', 'block-size'))
      const width = rendered('border-width-025', 'border-bottom-width')
      const subtle = edge('color-border-subtle')
      for (const [index, row] of rows.entries()) {
        await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(least - 0.5)
        const style = getComputedStyle(row)
        if (index < rows.length - 1) {
          await expect(style.borderBottomStyle).toBe('solid')
          await expect(style.borderBottomWidth).toBe(width)
          await expect(style.borderBottomColor).toBe(subtle)
        } else await expect(style.borderBottomStyle).toBe('none')
      }
      const header = getComputedStyle(table.tHead!.rows[0])
      await expect(header.borderBottomWidth).toBe(width)
      await expect(header.borderBottomColor).toBe(subtle)
    })

    await step("in Danish, every word is the caller's or the dictionary's", () => {
      const markup = renderToStaticMarkup(
        <PerronProvider locale="da">
          <VehicleTable {...(args as VehicleTableProps)} />
        </PerronProvider>,
      )
      expectOwnedStrings(markup, 'da', [
        'Vehicles',
        ...VEHICLES.flatMap((vehicle) => [vehicle.lineName, vehicle.destination] as string[]),
      ])
    })
  },
}

/** No vehicles: the header row alone, above an empty body (CR-6). */
export const Empty: Story = {
  args: { vehicles: [] },
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole('table', {
      name: 'Vehicles',
    }) as HTMLTableElement
    await expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(HEADERS)
    await expect(table.tBodies).toHaveLength(1)
    await expect(bodyRows(table)).toHaveLength(0)
    await expect(table.querySelectorAll('th, td')).toHaveLength(HEADERS.length)
  },
}

/** The long destination, longer than its column in a 320 px container. */
const LONG = 'Københavns Lufthavn (Kastrup) Lufthavnsterminalen'

/** The `Default` vehicles with one going to the long destination. */
const WITH_LONG: VehicleTableVehicle[] = [
  ...VEHICLES,
  {
    id: 'metro-m3-14',
    line: 'm3',
    lineName: 'M3',
    destination: LONG,
    variant: 'estimated',
    delay: 12,
  },
]

/**
 * A destination too long for its column, in a 320 px container: it wraps inside its column and its
 * row grows, while the badges, the state words and the delays stay inside their cells (CR-8).
 */
export const LongDestination: Story = {
  args: { vehicles: WITH_LONG },
  render: (args) => (
    <div style={{ inlineSize: 320, maxInlineSize: '100%' }} data-testid="container">
      <VehicleTable {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const container = canvas.getByTestId('container')
    const table = canvas.getByRole('table', { name: 'Vehicles' }) as HTMLTableElement
    const rows = bodyRows(table)
    const long = rows.at(-1)!
    const least = Number.parseFloat(rendered('size-vehicle-row', 'block-size'))

    await step('the table is no wider than its container', async () => {
      await expect(table.getBoundingClientRect().width).toBeLessThanOrEqual(
        container.getBoundingClientRect().width + 0.5,
      )
      await expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth)
    })

    await step('the long destination wraps in its column, and only its row grows', async () => {
      const cell = long.querySelector('.pn-VehicleTable-destinationCell')!
      const text = document.createRange()
      text.selectNodeContents(cell)
      const lineHeight = Number.parseFloat(getComputedStyle(cell).lineHeight)
      await expect(text.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5)
      const box = cell.getBoundingClientRect()
      await expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5)
      await expect(long.getBoundingClientRect().height).toBeGreaterThan(least)
      for (const row of rows.slice(0, -1))
        await expect(Math.abs(row.getBoundingClientRect().height - least)).toBeLessThan(0.5)
    })

    await step(
      'the badges, the state words and the delays stay inside their cells, whole',
      async () => {
        for (const part of ['badge', 'status', 'delay'])
          for (const node of table.querySelectorAll(`.pn-VehicleTable-${part}`)) {
            const box = node.getBoundingClientRect()
            const cell = node.closest('th, td')!.getBoundingClientRect()
            await expect(box.left).toBeGreaterThanOrEqual(cell.left - 0.5)
            await expect(box.right).toBeLessThanOrEqual(cell.right + 0.5)
          }
        // a state's word wraps only at its spaces
        for (const label of table.querySelectorAll('.pn-VehicleDotLabel-label'))
          await expectWholeWords(label)
        // the badges and the delays keep to one line: every box of theirs starts on the same top
        for (const node of table.querySelectorAll('.pn-VehicleTable-badge, .pn-VehicleTable-delay'))
          await expect(
            new Set([...node.getClientRects()].map((box) => Math.round(box.top))).size,
          ).toBe(1)
      },
    )

    await step(
      'the destination column keeps its least width, and only a longer word breaks (CR-8)',
      async () => {
        const least = 4 * Number.parseFloat(rendered('space-600', 'padding-top'))
        // a 320 px screen less a space.400 padding on each side
        const padding = 2 * Number.parseFloat(rendered('space-400', 'padding-top'))
        // the Default vehicles, whose columns would otherwise squeeze the destination's, and the
        // long destination beside them
        for (const vehicles of [VEHICLES, WITH_LONG])
          await mounted(
            canvasElement,
            <div style={{ inlineSize: 320 - padding }}>
              <VehicleTable vehicles={vehicles} aria-label="Least width" />
            </div>,
            async (host) => {
              const root = await tableIn(host)
              await expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(
                root.parentElement!.getBoundingClientRect().width + 0.5,
              )
              for (const cell of root.querySelectorAll('.pn-VehicleTable-destinationCell')) {
                await expect(cell.getBoundingClientRect().width).toBeGreaterThanOrEqual(least - 0.5)
                // "Lufthavnen", "Københavns" and "Kokkedal" stay whole; only a word wider than
                // the column's content box, its least width less the start padding, breaks inside it
                await expectWholeWords(cell, ['Lufthavnsterminalen'])
              }
              if (vehicles === VEHICLES) {
                // no destination here needs its least width, yet the column keeps it, and the
                // position column gives up width instead: "Timetable only" wraps at its space
                for (const cell of root.querySelectorAll('.pn-VehicleTable-destinationCell'))
                  await expect(cell.getBoundingClientRect().width).toBeLessThan(least + 0.5)
                const timetableOnly = root.querySelector(
                  '[data-variant="timetable-only"] .pn-VehicleDotLabel-label',
                )!
                await expect(lines(timetableOnly)).toBeGreaterThan(1.5)
                await expectWholeWords(timetableOnly)
              }
            },
          )
      },
    )

    await step('a long header wraps at its spaces and keeps whole words (CR-8)', async () => {
      await mounted(
        canvasElement,
        <div style={{ inlineSize: 320, maxInlineSize: '100%' }}>
          <VehicleTable
            vehicles={VEHICLES}
            aria-label="Long header"
            delayColumnLabel="Minutes behind the timetable"
          />
        </div>,
        async (host) => {
          const root = await tableIn(host)
          const header = root.querySelector('[data-column="delay"]')!
          await expect(lines(header)).toBeGreaterThan(1.5)
          await expectWholeWords(header)
          await expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(
            root.parentElement!.getBoundingClientRect().width + 0.5,
          )
        },
      )
    })
  },
}

/** The `Default` vehicles as a caller sorts them by delay, most late first, the unknown ones last. */
const BY_DELAY: VehicleTableVehicle[] = [
  VEHICLES[1],
  VEHICLES[0],
  VEHICLES[2],
  ...VEHICLES.slice(3),
]

/** Every column and both directions, each a sort the table is given. */
const SORTS: VehicleTableSort[] = (
  ['line', 'destination', 'position', 'last-seen', 'delay'] as const
).flatMap((column) => (['asc', 'desc'] as const).map((direction) => ({ column, direction })))

/** The sort a header's press asks for last, from the spy `onSortChange`. */
const lastAsked = (onSortChange: unknown) =>
  (onSortChange as ReturnType<typeof fn>).mock.lastCall?.[1] as VehicleTableSort | undefined

/**
 * Sortable headers, sorted by delay, descending: every header is a button that says its sort state
 * through `aria-sort`, and a press asks the caller for a sort, never reordering a row (CR-10).
 */
export const Sorted: Story = {
  args: {
    vehicles: BY_DELAY,
    sort: { column: 'delay', direction: 'desc' },
    onSortChange: fn(),
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement)
    const table = canvas.getByRole('table', { name: 'Vehicles' }) as HTMLTableElement
    const headers = within(table).getAllByRole('columnheader')

    await step('every header is a button named by its words, inside its <th>', async () => {
      await expect(headers.map((header) => header.textContent)).toEqual(HEADERS)
      for (const [index, header] of headers.entries()) {
        const button = within(header).getByRole('button', { name: HEADERS[index] })
        await expect(button).toHaveAttribute('type', 'button')
        await expect(button.parentElement).toBe(header)
        await expect(header).toHaveAttribute('scope', 'col')
      }
    })

    await step('aria-sort says the given sort on its header alone', async () => {
      await expect(headers.map((header) => header.getAttribute('aria-sort'))).toEqual([
        null,
        null,
        null,
        'descending',
      ])
      // the arrow only on the sorted column, hidden from the ear, which aria-sort tells
      const icons = table.querySelectorAll('.pn-VehicleTable-sortIcon')
      await expect(icons).toHaveLength(1)
      await expect(headers[3]).toContainElement(icons[0] as HTMLElement)
      await expect(icons[0]).toHaveAttribute('aria-hidden', 'true')
      await expect(heard(headers[3])).toBe('Delay')
      // pointing down when descending; the sorted header inked as the data is
      await expect(getComputedStyle(icons[0]).scale).toBe('none')
      await expect(getComputedStyle(headers[3]).color).toBe(colour('--perron-color-text-primary'))
      await expect(getComputedStyle(headers[0]).color).toBe(colour('--perron-color-text-secondary'))
    })

    await step('a press calls onSortChange with its column, and reorders nothing', async () => {
      const order = bodyRows(table).map((row) => row.cells[1].textContent)
      const asked: [VehicleTableColumn, VehicleTableSort['direction']][] = [
        ['line', 'asc'],
        ['destination', 'asc'],
        ['position', 'asc'],
        // the sorted column, the other way
        ['delay', 'asc'],
      ]
      for (const [index, header] of headers.entries()) {
        await userEvent.click(within(header).getByRole('button'))
        await expect(args.onSortChange).toHaveBeenCalledTimes(index + 1)
        const [event, sort] = (args.onSortChange as ReturnType<typeof fn>).mock.lastCall!
        await expect((event as { type: string }).type).toBe('click')
        const [column, direction] = asked[index]
        await expect(sort).toEqual({ column, direction })
      }
      // the sort is the caller's: the rows and the headers stay as given
      await expect(bodyRows(table).map((row) => row.cells[1].textContent)).toEqual(order)
      await expect(headers[3]).toHaveAttribute('aria-sort', 'descending')
      ;(args.onSortChange as ReturnType<typeof fn>).mockClear()
    })

    await step(
      'aria-sort follows each sort it is given, an ascending arrow turned up',
      async () => {
        for (const sort of SORTS) {
          const onSortChange = fn()
          await mounted(
            canvasElement,
            <VehicleTable
              vehicles={VEHICLES}
              aria-label="Sorts"
              lastSeenColumnVisible
              sort={sort}
              onSortChange={onSortChange}
            />,
            async (host) => {
              const root = await tableIn(host)
              const cells = within(root).getAllByRole('columnheader')
              for (const cell of cells) {
                const sorted = cell.getAttribute('data-column') === sort.column
                await expect(cell.getAttribute('aria-sort')).toBe(
                  sorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : null,
                )
              }
              const icon = root.querySelector('.pn-VehicleTable-sortIcon')!
              await expect(icon.closest('th')).toHaveAttribute('data-column', sort.column)
              await expect(getComputedStyle(icon).scale).toBe(
                sort.direction === 'asc' ? '1 -1' : 'none',
              )
              // a press on the sorted column asks for the other way, on another for ascending
              const own = root.querySelector(`[data-column="${sort.column}"] button`)!
              await userEvent.click(own)
              await expect(lastAsked(onSortChange)).toEqual({
                column: sort.column,
                direction: sort.direction === 'asc' ? 'desc' : 'asc',
              })
            },
          )
        }
      },
    )

    await step('with no sort given, no header carries aria-sort or an arrow', async () => {
      for (const sort of [undefined, null]) {
        const onSortChange = fn()
        await mounted(
          canvasElement,
          <VehicleTable
            vehicles={VEHICLES}
            aria-label="Unsorted"
            sort={sort}
            onSortChange={onSortChange}
          />,
          async (host) => {
            const root = await tableIn(host)
            for (const cell of within(root).getAllByRole('columnheader'))
              await expect(cell).not.toHaveAttribute('aria-sort')
            await expect(root.querySelector('.pn-VehicleTable-sortIcon')).toBeNull()
            await userEvent.click(within(root).getByRole('button', { name: 'Delay' }))
            await expect(lastAsked(onSortChange)).toEqual({ column: 'delay', direction: 'asc' })
          },
        )
      }
    })

    await step(
      'a sort given with no handler marks its column, and no header is a button',
      async () => {
        await mounted(
          canvasElement,
          <VehicleTable
            vehicles={VEHICLES}
            aria-label="Read only"
            sort={{ column: 'line', direction: 'asc' }}
          />,
          async (host) => {
            const root = await tableIn(host)
            const cells = within(root).getAllByRole('columnheader')
            await expect(cells.map((cell) => cell.getAttribute('aria-sort'))).toEqual([
              'ascending',
              null,
              null,
              null,
            ])
            await expect(within(root).queryByRole('button')).toBeNull()
            await expect(cells[0].querySelector('.pn-VehicleTable-sortIcon')).not.toBeNull()
            await expect(heard(cells[0])).toBe('Line')
          },
        )
      },
    )

    await step('Tab reaches each header in order; Enter and Space press it', async () => {
      const buttons = headers.map((header) => within(header).getByRole('button'))
      await expectFocusRing(canvasElement, buttons[0])
      buttons[0].focus()
      for (const button of buttons.slice(1)) {
        await userEvent.tab()
        await expect(button).toHaveFocus()
      }
      // past the last header, the rows take no focus
      await userEvent.tab()
      await expect(table.contains(document.activeElement)).toBe(false)
      buttons[1].focus()
      await userEvent.keyboard('{Enter}')
      await expect(args.onSortChange).toHaveBeenCalledTimes(1)
      await expect(lastAsked(args.onSortChange)).toEqual({
        column: 'destination',
        direction: 'asc',
      })
      await userEvent.keyboard(' ')
      await expect(args.onSortChange).toHaveBeenCalledTimes(2)
      buttons[1].blur()
      ;(args.onSortChange as ReturnType<typeof fn>).mockClear()
    })

    await step('the button fills its header, a target at least size.target-min', async () => {
      const least = Number.parseFloat(rendered('size-target-min', 'block-size'))
      for (const header of headers) {
        const button = within(header).getByRole('button').getBoundingClientRect()
        const cell = header.getBoundingClientRect()
        await expect(button.height).toBeGreaterThanOrEqual(least - 0.5)
        await expect(button.width).toBeGreaterThanOrEqual(least - 0.5)
        await expect(Math.abs(button.width - cell.width)).toBeLessThan(1)
      }
      // the header row keeps the height it has without buttons
      await mounted(
        canvasElement,
        <VehicleTable vehicles={VEHICLES} aria-label="Plain" />,
        async (host) => {
          const root = await tableIn(host)
          await expect(
            Math.abs(
              root.tHead!.rows[0].getBoundingClientRect().height -
                table.tHead!.rows[0].getBoundingClientRect().height,
            ),
          ).toBeLessThan(1)
        },
      )
    })

    await step('hover inks the words, a press lays the hover layer behind them too', async () => {
      const button = within(headers[0]).getByRole('button')
      await expect(getComputedStyle(button).cursor).toBe('pointer')
      await expect(onHover(button, 'color')).toBe('var(--perron-color-text-primary)')
      await expect(stateFill(button, ':hover')).toBe('')
      await expect(stateFill(button, ':active')).toBe('var(--perron-color-surface-hover)')
      await expect(fill('color-surface-hover')).not.toBe(getComputedStyle(button).backgroundColor)
      await expect(pressedAfterHover(button)).toBe(true)
      // the rows stay text: no row or cell answers the pointer (CR-7)
      for (const part of [...bodyRows(table), ...table.tBodies[0].querySelectorAll('th, td')]) {
        await expect(stateRules(part, ':hover')).toHaveLength(0)
        await expect(stateRules(part, ':active')).toHaveLength(0)
      }
    })
  },
}

/** The Delay column left out, for vehicles whose data carries no delay (CR-12). */
export const DelayHidden: Story = {
  args: { delayColumnHidden: true },
  play: async ({ canvasElement, step }) => {
    const table = within(canvasElement).getByRole('table', {
      name: 'Vehicles',
    }) as HTMLTableElement

    await step('three column headers, and no delay in any row', async () => {
      await expect(
        within(table)
          .getAllByRole('columnheader')
          .map((header) => header.textContent),
      ).toEqual(HEADERS.slice(0, 3))
      await expect(table.querySelector('[data-column="delay"]')).toBeNull()
      await expect(table.querySelector('.pn-VehicleTable-delayCell, .pn-Delay')).toBeNull()
      for (const row of bodyRows(table)) await expect(row.cells).toHaveLength(3)
      await expect(heardRow(bodyRows(table)[0])).toBe('5C Husum Torv Live')
    })

    await step('beside Last seen, and sortable, Delay stays out', async () => {
      await mounted(
        canvasElement,
        <VehicleTable
          vehicles={VEHICLES}
          aria-label="No delay"
          delayColumnHidden
          lastSeenColumnVisible
          onSortChange={fn()}
        />,
        async (host) => {
          const root = await tableIn(host)
          await expect(
            within(root)
              .getAllByRole('button')
              .map((button) => button.textContent),
          ).toEqual(HEADERS_LAST_SEEN.slice(0, 4))
          for (const row of bodyRows(root)) await expect(row.cells).toHaveLength(4)
        },
      )
    })
  },
}

/** The `Default` vehicles with the time each last reported, but the timetable-only one. */
const SEEN: VehicleTableVehicle[] = VEHICLES.map((vehicle, index) => ({
  ...vehicle,
  lastSeen: [`08:14`, `08:13`, `08:11`, undefined, `08:02`][index],
}))

/**
 * The Last seen column, before Delay: the time each vehicle last reported, and "—", heard as
 * "Unknown", for the timetable-only one, which never has (CR-11).
 */
export const LastSeen: Story = {
  args: { vehicles: SEEN, lastSeenColumnVisible: true },
  play: async ({ canvasElement, args, step }) => {
    const table = within(canvasElement).getByRole('table', {
      name: 'Vehicles',
    }) as HTMLTableElement
    const rows = bodyRows(table)

    await step('five column headers, Last seen before Delay, at the column end', async () => {
      const headers = within(table).getAllByRole('columnheader')
      await expect(headers.map((header) => header.textContent)).toEqual(HEADERS_LAST_SEEN)
      await expect(headers[3]).toHaveAttribute('data-column', 'last-seen')
      await expect(getComputedStyle(headers[3]).textAlign).toBe('end')
      for (const row of rows) await expect(row.cells).toHaveLength(5)
    })

    await step('each time as given, in a <time>, and "—" heard as "Unknown" for none', async () => {
      for (const [index, row] of rows.entries()) {
        const cell = row.querySelector('.pn-VehicleTable-lastSeenCell')!
        await expect(row.cells[3]).toBe(cell)
        const seen = SEEN[index].lastSeen
        if (seen) {
          const time = cell.querySelector('time.pn-VehicleTable-lastSeen')!
          await expect(time).toHaveAttribute('dateTime', seen)
          await expect(heard(cell)).toBe(seen)
        } else {
          await expect(cell.querySelector('time')).toBeNull()
          await expect(cell.querySelector('[aria-hidden="true"]')).toHaveTextContent('—')
          await expect(heard(cell)).toBe('Unknown')
        }
      }
      await expect(heardRow(rows[0])).toBe('5C Husum Torv Live 08:14 On time')
    })

    await step('a time is data: tabular figures at the column end, on one line', async () => {
      const cell = rows[0].querySelector('.pn-VehicleTable-lastSeenCell')!
      const style = getComputedStyle(cell)
      const data = typography('data')
      const probe = document.createElement('span')
      Object.assign(probe.style, data)
      canvasElement.append(probe)
      try {
        await expect(style.fontFamily).toBe(getComputedStyle(probe).fontFamily)
        await expect(style.fontSize).toBe(getComputedStyle(probe).fontSize)
      } finally {
        probe.remove()
      }
      await expect(style.fontVariantNumeric).toBe('tabular-nums')
      await expect(style.textAlign).toBe('end')
      await expect(style.color).toBe(colour('--perron-color-text-primary'))
      // every box of each time starts on the same top
      for (const time of table.querySelectorAll('.pn-VehicleTable-lastSeen'))
        await expect(
          new Set([...time.getClientRects()].map((box) => Math.round(box.top))).size,
        ).toBe(1)
    })

    await step('left out by default, and its header sorts as the others do', async () => {
      await mounted(
        canvasElement,
        <VehicleTable vehicles={SEEN} aria-label="Off" />,
        async (host) => {
          const root = await tableIn(host)
          await expect(root.querySelector('.pn-VehicleTable-lastSeenCell, time')).toBeNull()
          await expect(within(root).getAllByRole('columnheader')).toHaveLength(HEADERS.length)
        },
      )
      const onSortChange = fn()
      await mounted(
        canvasElement,
        <VehicleTable
          vehicles={SEEN}
          aria-label="Sorted by last seen"
          lastSeenColumnVisible
          sort={{ column: 'last-seen', direction: 'desc' }}
          onSortChange={onSortChange}
        />,
        async (host) => {
          const root = await tableIn(host)
          const header = within(root).getByRole('columnheader', { name: 'Last seen' })
          await expect(header).toHaveAttribute('aria-sort', 'descending')
          await userEvent.click(within(header).getByRole('button'))
          await expect(lastAsked(onSortChange)).toEqual({ column: 'last-seen', direction: 'asc' })
        },
      )
    })

    await step("in Danish, every word is the caller's or the dictionary's", () => {
      const markup = renderToStaticMarkup(
        <PerronProvider locale="da">
          <VehicleTable {...(args as VehicleTableProps)} />
        </PerronProvider>,
      )
      expectOwnedStrings(markup, 'da', [
        'Vehicles',
        ...SEEN.flatMap((vehicle) => [vehicle.lineName, vehicle.destination] as string[]),
        ...SEEN.flatMap((vehicle) => (vehicle.lastSeen ? [vehicle.lastSeen] : [])),
      ])
      for (const word of ['Sidst set', 'Ukendt']) expect(markup).toContain(word)
    })
  },
}
