// VehicleTable's stories: one per row of the spec's Stories table (docs/patterns/vehicle-table.md),
// with the design deferred, and their play tests, which read the accessibility tree and the DOM.
import { createRef } from 'react'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, isInaccessible, userEvent, waitFor, within } from 'storybook/test'
import { Link } from '../../components/Link/Link.tsx'
import { delayKnown, VEHICLE_STATES } from '../../internal/vehicle-states.ts'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  edge,
  expectNoFocus,
  heard,
  lines,
  mounted,
  rendered,
  stateRules,
  typography,
} from '../../testing/stories.ts'
import { VehicleTable } from './VehicleTable.tsx'
import type { VehicleTableProps, VehicleTableVehicle } from './VehicleTable.tsx'

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

/** Every prop VehicleTable declares but `vehicles`, each with a word no locale has. */
const OVERRIDES = {
  lineColumnLabel: 'Route',
  destinationColumnLabel: 'Heading to',
  positionColumnLabel: 'Freshness',
  delayColumnLabel: 'Lateness',
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
        />,
        async (host) => {
          const root = await tableIn(host)
          await expect(ref.current).toBe(root)
          await expect(root).toHaveAttribute('class', 'pn-VehicleTable caller')
          await expect(root).toHaveAttribute('data-testid', 'root')
          await expect(root.style.marginBlockStart).toBe('var(--perron-space-200)')
          const own = ['vehicles', ...Object.keys(OVERRIDES)].map((name) => name.toLowerCase())
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
        <VehicleTable vehicles={vehicles} aria-label="Overridden" {...OVERRIDES} />,
        async (host) => {
          const root = await tableIn(host)
          await expect(textsOf(root, 'headerCell')).toEqual([
            OVERRIDES.lineColumnLabel,
            OVERRIDES.destinationColumnLabel,
            OVERRIDES.positionColumnLabel,
            OVERRIDES.delayColumnLabel,
          ])
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
            ...HEADERS,
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
