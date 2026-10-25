// StopTimeline's stories: one per row of the spec's Stories table (docs/patterns/stop-timeline.md),
// with the design deferred, and their play tests, which read the accessibility tree.
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, isInaccessible, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../../components/Button/Button.tsx'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { colour, heard, mounted, struck } from '../../testing/stories.ts'
import { StopTimeline } from './StopTimeline.tsx'
import type { StopTimelineProps, StopTimelineStop } from './StopTimeline.tsx'

/**
 * An S-tog A trip of seven stops, southbound through the centre: on time, early and slight before
 * the next stop, late at it, easing after it.
 */
const TRIP: StopTimelineStop[] = [
  { name: 'Svanemøllen', time: '08:07', delay: 0 },
  { name: 'Nordhavn', time: '08:09', delay: -1 },
  { name: 'Østerport', time: '08:11', delay: 2 },
  { name: 'Nørreport', time: '08:14', delay: 3 },
  { name: 'Vesterport', time: '08:16', delay: 3 },
  { name: 'København H', time: '08:18', delay: 2 },
  { name: 'Dybbølsbro', time: '08:20', delay: 1 },
]

const LOCALES = Object.keys(dictionaries) as Locale[]

const meta = {
  title: 'Patterns/StopTimeline',
  component: StopTimeline,
  args: { stops: TRIP, line: 'a' },
  decorators: [
    // a vehicle's detail panel: its width and its raised surface
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
} satisfies Meta<typeof StopTimeline>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A word for the ear only: in the accessibility tree, in a box too small to show it (a screen
 * reader's text, kept to one pixel so it is still read).
 */
async function expectHeardNotSeen(element: HTMLElement | null) {
  await expect(element).not.toBeNull()
  await expect(isInaccessible(element!)).toBe(false)
  const box = element!.getBoundingClientRect()
  await expect(box.width).toBeLessThanOrEqual(1)
  await expect(box.height).toBeLessThanOrEqual(1)
}

/** The stops of the timeline in `root`, as list items. */
const itemsOf = (root: HTMLElement) => within(root).getAllByRole('listitem')

/** A timeline rendered to markup and read back as elements, for the shapes no story draws. */
function renderOff(element: ReactElement) {
  const host = document.createElement('div')
  host.innerHTML = renderToStaticMarkup(element)
  const items = [...host.querySelectorAll('li')]
  return {
    host,
    items,
    /** Each stop's place, from its `data-stop`. */
    places: items.map((item) => item.dataset.stop),
    /** The index of the stop with `aria-current`, or -1. */
    current: items.findIndex((item) => item.hasAttribute('aria-current')),
  }
}

/**
 * What a screen reader reads of a stop: its parts in DOM order, each part's text apart, the hidden
 * rail and marker left out.
 */
const readOf = (item: Element) =>
  [...item.children]
    .filter((part) => part.getAttribute('aria-hidden') !== 'true')
    .map(heard)
    .filter(Boolean)
    .join(' ')

/** The first element `selector` finds in `scope`, waited for, since `mounted` renders a tick later. */
const found = (scope: Element, selector: string) =>
  waitFor(() => {
    const element = scope.querySelector<HTMLElement>(selector)
    if (!element) throw new Error(`no ${selector} rendered`)
    return element
  })

/** The number of columns the timeline's grid lays out. */
const columnsOf = (list: Element) => getComputedStyle(list).gridTemplateColumns.split(' ').length

/** Each locale's render of `element`, held to its dictionary and the caller's `words`. */
function ownedStringsInEveryLocale(element: ReactElement, words: string[]) {
  for (const locale of LOCALES)
    expectOwnedStrings(
      renderToStaticMarkup(<PerronProvider locale={locale}>{element}</PerronProvider>),
      locale,
      words,
    )
}

/** The places `nextStopIndex` gives a trip of seven stops, as CR-2 reads it. */
const placesAt = (next: number) =>
  TRIP.map((_, index) => (index < next ? 'passed' : index === next ? 'next' : 'upcoming'))

/**
 * Three passed, one next, three upcoming. Only the fourth stop is current and says "Next stop", the
 * first three say "Passed", the rail and markers are hidden, each time carries its `dateTime`, and
 * Tab passes the timeline by, from the panel's control before it to the one after it.
 */
export const Default: Story = {
  args: { nextStopIndex: 3 },
  render: (args) => (
    // the timeline takes the panel's width, as in every other story; only the buttons start-align
    <div style={{ display: 'grid', gap: 'var(--perron-space-300)' }}>
      <Button variant="outline" style={{ justifySelf: 'start' }}>
        Show on map
      </Button>
      <StopTimeline {...args} />
      <Button variant="outline" style={{ justifySelf: 'start' }}>
        All departures
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list')
    const items = itemsOf(list)
    await expect(items).toHaveLength(7)
    // the timeline fills its panel, so the times and delays sit in their columns at its edge (CR-7)
    await expect(list.getBoundingClientRect().width).toBe(
      list.parentElement!.getBoundingClientRect().width,
    )

    await step('only the fourth stop is current, and says "Next stop"', async () => {
      for (const [index, item] of items.entries()) {
        if (index === 3) {
          await expect(item).toHaveAttribute('aria-current', 'step')
          await expect(item).toHaveTextContent('Next stop')
        } else {
          await expect(item).not.toHaveAttribute('aria-current')
          await expect(item).not.toHaveTextContent('Next stop')
        }
      }
      await expect(canvas.getAllByText('Next stop')).toHaveLength(1)
    })

    await step('the first three say "Passed", straight after the name', async () => {
      for (const [index, item] of items.entries()) {
        const passed = within(item).queryByText('Passed')
        if (index < 3) {
          await expect(passed).not.toBeNull()
          await expectHeardNotSeen(passed)
          await expect(passed?.previousElementSibling).toHaveTextContent(TRIP[index].name)
        } else await expect(passed).toBeNull()
      }
    })

    await step('the rail and the markers are hidden from assistive technology', async () => {
      const rails = list.querySelectorAll('.pn-StopTimeline-rail')
      const markers = list.querySelectorAll('.pn-StopTimeline-marker')
      await expect(rails).toHaveLength(6)
      await expect(markers).toHaveLength(7)
      for (const part of [...rails, ...markers]) {
        await expect(part).toHaveAttribute('aria-hidden', 'true')
        await expect(isInaccessible(part)).toBe(true)
      }
      // the next stop's marker is filled, every other outlined
      for (const [index, marker] of [...markers].entries())
        await expect(marker).toHaveAttribute('data-variant', index === 3 ? 'filled' : 'outlined')
    })

    await step('each time carries its HH:MM as dateTime', async () => {
      const times = list.querySelectorAll('time')
      await expect(times).toHaveLength(7)
      for (const [index, time] of [...times].entries()) {
        await expect(time).toHaveTextContent(TRIP[index].time!)
        await expect(time).toHaveAttribute('datetime', TRIP[index].time)
      }
    })

    await step("the label props override every word, Delay's included", async () => {
      const overrides = {
        nextStopLabel: 'Arriving next',
        passedLabel: 'Gone by',
        minutesUnitLabel: 'mins',
        minutesLateLabel: 'mins behind',
        minutesEarlyLabel: 'mins ahead',
        onTimeLabel: 'Punctual',
        delayUnknownLabel: 'No delay data',
      }
      const markup = renderToStaticMarkup(
        <StopTimeline
          stops={[...TRIP, { name: 'Sydhavn', delay: null }]}
          nextStopIndex={3}
          {...overrides}
        />,
      )
      for (const word of Object.values(overrides)) await expect(markup).toContain(word)
      for (const word of [
        'Next stop',
        'Passed',
        'min late',
        'min early',
        'On time',
        'Delay unknown',
      ])
        await expect(markup).not.toContain(word)
    })

    await step('at the first stop, nothing is passed and the first stop is next', async () => {
      const { places, current } = renderOff(<StopTimeline stops={TRIP} nextStopIndex={0} />)
      await expect(places).toEqual(placesAt(0))
      await expect(current).toBe(0)
    })

    await step('at the last stop, every other stop is passed and the last is next', async () => {
      const {
        places,
        current,
        host,
        items: stops,
      } = renderOff(<StopTimeline stops={TRIP} nextStopIndex={6} />)
      await expect(places).toEqual(placesAt(6))
      await expect(current).toBe(6)
      // "Passed" is heard after every stop but the last, which says "Next stop"
      for (const [index, item] of stops.entries())
        await expect(within(item).queryByText('Passed') !== null).toBe(index < 6)
      await expect(host.querySelector('.pn-StopTimeline-next')?.closest('li')).toBe(stops[6])
    })

    await step('Tab passes the timeline by, to the next focusable element', async () => {
      const before = canvas.getByRole('button', { name: 'Show on map' })
      const after = canvas.getByRole('button', { name: 'All departures' })
      const start = document.activeElement
      await userEvent.tab()
      await expect(before).toHaveFocus()
      await userEvent.tab()
      await expect(after).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(before).toHaveFocus()
      // back to the resting state: focus where it started
      await userEvent.tab({ shift: true })
      await expect(document.activeElement).toBe(start)
    })
  },
}

/**
 * No `nextStopIndex`: the vehicle's place is unknown, so no stop is passed or next. A negative index,
 * or one that is not a whole number, is as unknown.
 */
export const NotStarted: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const items = itemsOf(canvas.getByRole('list'))
    await expect(items).toHaveLength(7)
    for (const item of items) {
      await expect(item).not.toHaveAttribute('aria-current')
      await expect(item).toHaveAttribute('data-stop', 'upcoming')
    }
    await expect(canvas.queryByText('Passed')).toBeNull()
    await expect(canvas.queryByText('Next stop')).toBeNull()
    for (const marker of canvasElement.querySelectorAll('.pn-StopTimeline-marker'))
      await expect(marker).toHaveAttribute('data-variant', 'outlined')

    for (const next of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])
      await step(`nextStopIndex ${next} places no stop: every stop upcoming`, async () => {
        const { places, current, host } = renderOff(
          <StopTimeline stops={TRIP} nextStopIndex={next} />,
        )
        await expect(places).toEqual(TRIP.map(() => 'upcoming'))
        await expect(current).toBe(-1)
        await expect(host).not.toHaveTextContent('Passed')
        await expect(host).not.toHaveTextContent('Next stop')
        for (const marker of host.querySelectorAll('.pn-StopTimeline-marker'))
          await expect(marker).toHaveAttribute('data-variant', 'outlined')
      })
  },
}

/** `nextStopIndex` past the last stop: the trip is over and every stop passed. */
export const Finished: Story = {
  args: { nextStopIndex: 7 },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const items = itemsOf(canvas.getByRole('list'))
    for (const item of items) {
      await expectHeardNotSeen(within(item).getByText('Passed'))
      await expect(item).not.toHaveAttribute('aria-current')
    }
    await expect(canvas.queryByText('Next stop')).toBeNull()

    await step('an index well past the last stop is the same finished trip', async () => {
      const { places, current, host } = renderOff(<StopTimeline stops={TRIP} nextStopIndex={20} />)
      await expect(places).toEqual(TRIP.map(() => 'passed'))
      await expect(current).toBe(-1)
      await expect(host).not.toHaveTextContent('Next stop')
    })
  },
}

/** Every `delay` `null`, as for a timetable-only or no-signal vehicle. */
export const TimetableOnly: Story = {
  args: {
    nextStopIndex: 3,
    stops: TRIP.map((stop) => ({ ...stop, delay: null })),
  },
  play: async ({ canvasElement, args, step }) => {
    const delays = canvasElement.querySelectorAll('.pn-StopTimeline-delay')
    await expect(delays).toHaveLength(7)
    await step('each delay is "—" to the eye and "Delay unknown" to the ear', async () => {
      for (const delay of delays) {
        const value = delay.querySelector('.pn-Delay-value')
        await expect(value).toHaveTextContent('—')
        await expect(value).toHaveAttribute('aria-hidden', 'true')
        await expectHeardNotSeen(within(delay as HTMLElement).getByText('Delay unknown'))
      }
    })
    // "Delay unknown" is a word the Default story never shows, so its locales are checked here
    for (const locale of LOCALES)
      await step(`in ${locale}, every word is the caller's or the dictionary's`, () => {
        const markup = renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <StopTimeline {...(args as StopTimelineProps)} />
          </PerronProvider>,
        )
        expectOwnedStrings(
          markup,
          locale,
          args.stops.map((stop) => stop.name),
        )
      })
  },
}

/** The trip with its call at Vesterport, the stop after the next, cancelled. */
const CANCELLED: StopTimelineStop[] = TRIP.map((stop, index) =>
  index === 4 ? { ...stop, cancelled: true } : stop,
)

/**
 * A cancelled call stays in the list: "Cancelled" under its name in the danger colour, its time
 * struck through and kept, and no Delay; the ear hears "Cancelled" before the time.
 */
export const Cancelled: Story = {
  args: { stops: CANCELLED, nextStopIndex: 3 },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list')
    const items = itemsOf(list)
    const item = items[4]

    await step('the call stays in the list, and only its item carries data-cancelled', async () => {
      await expect(items).toHaveLength(7)
      for (const [index, each] of items.entries())
        if (index === 4) await expect(each).toHaveAttribute('data-cancelled', '')
        else await expect(each).not.toHaveAttribute('data-cancelled')
      await expect(item.querySelector('.pn-StopTimeline-marker')).not.toBeNull()
      await expect(item.querySelector('.pn-StopTimeline-rail')).not.toBeNull()
    })

    await step('"Cancelled" is seen under the name, in the danger colour', async () => {
      const word = within(item).getByText('Cancelled')
      await expect(word).toHaveClass('pn-StopTimeline-cancelled')
      await expect(isInaccessible(word)).toBe(false)
      await expect(getComputedStyle(word).color).toBe(colour('--perron-color-text-danger'))
      const name = within(item).getByText(CANCELLED[4].name)
      await expect(word.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        name.getBoundingClientRect().bottom - 1,
      )
      await expect(canvas.getAllByText('Cancelled')).toHaveLength(1)
    })

    await step('its time is struck through, its text kept, and its name is not', async () => {
      const time = item.querySelector('time')!
      await expect(struck(time)).toBe(true)
      await expect(time).toHaveTextContent('08:16')
      await expect(time).toHaveAttribute('datetime', '08:16')
      await expect(struck(within(item).getByText(CANCELLED[4].name))).toBe(false)
      await expect(struck(items[5].querySelector('time')!)).toBe(false)
    })

    await step('no Delay renders, though its delay is 3', async () => {
      await expect(item.querySelector('.pn-Delay')).toBeNull()
      await expect(items[5].querySelector('.pn-Delay')).not.toBeNull()
    })

    await step('the stop reads "Cancelled" after its name, before its time', async () => {
      await expect(readOf(item)).toBe('Vesterport Cancelled 08:16')
    })

    await step('a cancelled next stop says "Next stop", then "Cancelled" under it', () =>
      mounted(canvasElement, <StopTimeline stops={CANCELLED} nextStopIndex={4} />, async (host) => {
        const next = await found(host, 'li:nth-child(5)')
        await expect(next).toHaveAttribute('aria-current', 'step')
        await expect(readOf(next)).toBe('Vesterport Next stop Cancelled 08:16')
        const below = within(next).getByText('Cancelled').getBoundingClientRect()
        await expect(below.top).toBeGreaterThanOrEqual(
          within(next).getByText('Next stop').getBoundingClientRect().bottom - 1,
        )
      }),
    )

    await step('a cancelled passed stop says "Passed", then "Cancelled"', async () => {
      const { items: stops } = renderOff(<StopTimeline stops={CANCELLED} nextStopIndex={5} />)
      await expect(readOf(stops[4])).toBe('Vesterport Passed Cancelled 08:16')
    })

    await step('with an expected time, both times are struck through, the "~" kept', () =>
      mounted(
        canvasElement,
        <StopTimeline stops={[{ ...CANCELLED[4], expected: '08:19' }]} />,
        async (host) => {
          const expected = await found(host, '.pn-StopTimeline-expected')
          await expect(struck(host.querySelector('.pn-StopTimeline-time')!)).toBe(true)
          await expect(struck(expected)).toBe(true)
          await expect(expected.textContent).toContain('~08:19')
          await expect(readOf(itemsOf(host)[0])).toBe('Vesterport Cancelled 08:16 Expected 08:19')
        },
      ),
    )

    await step('cancelledLabel replaces the word', async () => {
      const { items: stops } = renderOff(
        <StopTimeline stops={CANCELLED} cancelledLabel="Not calling" />,
      )
      await expect(readOf(stops[4])).toBe('Vesterport Not calling 08:16')
    })

    await step('cancelled: false sets no data-cancelled and keeps the Delay', async () => {
      const { items: stops } = renderOff(
        <StopTimeline stops={[{ ...CANCELLED[4], cancelled: false }]} />,
      )
      await expect(stops[0]).not.toHaveAttribute('data-cancelled')
      await expect(stops[0].querySelector('.pn-StopTimeline-cancelled')).toBeNull()
      await expect(stops[0].querySelector('.pn-Delay')).not.toBeNull()
    })

    await step("in every locale, every word is the caller's or the dictionary's", () => {
      ownedStringsInEveryLocale(
        <StopTimeline {...(args as StopTimelineProps)} />,
        args.stops.map((stop) => stop.name),
      )
    })
  },
}

/**
 * The trip with an expected time where real-time data gives one: at the passed Østerport, the next
 * stop and two after it, and none at the last stop.
 */
const EXPECTED: StopTimelineStop[] = [
  TRIP[0],
  TRIP[1],
  { ...TRIP[2], expected: '08:13' },
  { ...TRIP[3], expected: '08:17' },
  { ...TRIP[4], expected: '08:19' },
  { ...TRIP[5], expected: '08:20' },
  TRIP[6],
]

/**
 * An expected time after the timetabled one, "~08:17" beside 08:14, in a column of its own: "~" to
 * the eye, "Expected" to the ear.
 */
export const Expected: Story = {
  args: { stops: EXPECTED, nextStopIndex: 3 },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list')
    const items = itemsOf(list)
    const parts = [...list.querySelectorAll<HTMLElement>('.pn-StopTimeline-expected')]

    await step('each expected time shows "~" and its HH:MM, in a <time> of its own', async () => {
      await expect(parts).toHaveLength(4)
      for (const [index, part] of parts.entries()) {
        const { expected } = EXPECTED[index + 2]
        await expect(part.closest('li')).toBe(items[index + 2])
        const tilde = part.querySelector('[aria-hidden="true"]')
        await expect(tilde?.textContent).toBe('~')
        await expect(tilde?.nextElementSibling?.tagName).toBe('TIME')
        const time = part.querySelector('time')!
        await expect(time.textContent).toBe(expected)
        await expect(time).toHaveAttribute('datetime', expected)
        await expect(part.textContent).toContain(`~${expected}`)
      }
      await expect(items[0].querySelector('.pn-StopTimeline-expected')).toBeNull()
      await expect(items[6].querySelector('.pn-StopTimeline-expected')).toBeNull()
    })

    await step('"Expected" is heard, not seen, in place of the "~"', async () => {
      for (const [index, part] of parts.entries()) {
        await expectHeardNotSeen(within(part).getByText('Expected'))
        await expect(heard(part)).toBe(`Expected ${EXPECTED[index + 2].expected}`)
      }
    })

    await step('the next stop reads its time, then its expected time, then its delay', async () => {
      await expect(readOf(items[3])).toBe('Nørreport Next stop 08:14 Expected 08:17 3 min late')
      await expect(readOf(items[2])).toBe('Østerport Passed 08:11 Expected 08:13 2 min late')
      await expect(readOf(items[6])).toBe('Dybbølsbro 08:20 1 min late')
    })

    await step('the expected times share a column after the time, before the delay', async () => {
      await expect(columnsOf(list)).toBe(5)
      const starts = parts.map((part) => part.getBoundingClientRect().left)
      for (const start of starts) await expect(start).toBeCloseTo(starts[0], 0)
      const delays = [...list.querySelectorAll('.pn-StopTimeline-delay')].map(
        (delay) => delay.getBoundingClientRect().left,
      )
      // every delay lines up, the last stop's too, which has no expected time
      for (const start of delays) await expect(start).toBeCloseTo(delays[0], 0)
      const time = items[3].querySelector('.pn-StopTimeline-time')!.getBoundingClientRect()
      await expect(starts[1]).toBeGreaterThan(time.right)
      await expect(delays[3]).toBeGreaterThan(parts[1].getBoundingClientRect().right)
    })

    await step('a passed stop sets its expected time back, as its time', async () => {
      await expect(parts[0]).toHaveAttribute('data-stop', 'passed')
      await expect(getComputedStyle(parts[0]).color).toBe(colour('--perron-color-text-secondary'))
      await expect(getComputedStyle(parts[1]).color).toBe(colour('--perron-color-text-primary'))
      await expect(struck(parts[1])).toBe(false)
    })

    await step('with no expected time in the trip, no column is kept for one', () =>
      mounted(canvasElement, <StopTimeline stops={TRIP} />, async (host) => {
        const ol = await found(host, 'ol')
        await expect(columnsOf(ol)).toBe(4)
      }),
    )

    await step('a stop with only an expected time renders it alone', async () => {
      const { items: stops } = renderOff(
        <StopTimeline stops={[{ name: 'Sydhavn', expected: '08:23' }]} />,
      )
      await expect(stops[0].querySelector('.pn-StopTimeline-time')).toBeNull()
      await expect(stops[0].querySelector('.pn-Delay')).toBeNull()
      await expect(readOf(stops[0])).toBe('Sydhavn Expected 08:23')
    })

    await step('expectedLabel replaces the word', async () => {
      const { items: stops } = renderOff(<StopTimeline stops={EXPECTED} expectedLabel="Now due" />)
      await expect(readOf(stops[3])).toBe('Nørreport 08:14 Now due 08:17 3 min late')
    })

    await step("in every locale, every word is the caller's or the dictionary's", () => {
      ownedStringsInEveryLocale(
        <StopTimeline {...(args as StopTimelineProps)} />,
        args.stops.map((stop) => stop.name),
      )
    })
  },
}

/** Names only, one long enough to wrap, and a timeline of a single stop beside it. */
const NAMES_ONLY: StopTimelineStop[] = [
  { name: 'Hillerød' },
  { name: 'Allerød' },
  { name: 'Birkerød' },
  { name: 'Kongens Lyngby Station, bus terminal on Lyngby Hovedgade' },
]

/** One stop with a time and no delay, one with a delay and no time. */
const PART_TIMED: StopTimelineStop[] = [
  { name: 'Holte', time: '08:21' },
  { name: 'Virum', delay: 2 },
]

const label = {
  font: 'var(--perron-typography-label-sm)',
  letterSpacing: 'var(--perron-typography-label-sm-tracking)',
  color: 'var(--perron-color-text-secondary)',
  margin: '0 0 var(--perron-space-100)',
}

/**
 * Stops with only names: no time and no delay renders, a long name wraps under itself, and a
 * timeline of one stop has no rail. Below them, a stop with only a time and one with only a delay
 * each render only their own part.
 */
export const WithoutTimes: Story = {
  args: { stops: NAMES_ONLY, nextStopIndex: 1 },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--perron-space-400)' }}>
      <div>
        <p id="without-times-trip" style={label}>
          Hillerød to Kongens Lyngby
        </p>
        <StopTimeline {...args} aria-labelledby="without-times-trip" data-testid="trip" />
      </div>
      <div>
        <p id="without-times-one" style={label}>
          One stop
        </p>
        <StopTimeline
          {...args}
          stops={[{ name: 'Hillerød' }]}
          nextStopIndex={0}
          aria-labelledby="without-times-one"
          data-testid="one"
        />
      </div>
      <div>
        <p id="without-times-part" style={label}>
          A time or a delay
        </p>
        <StopTimeline
          {...args}
          stops={PART_TIMED}
          nextStopIndex={0}
          aria-labelledby="without-times-part"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('list', { name: 'Hillerød to Kongens Lyngby' })).toBe(
      canvas.getByTestId('trip'),
    )
    const one = canvas.getByRole('list', { name: 'One stop' })
    for (const names of [canvas.getByTestId('trip'), one]) {
      await expect(names.querySelector('time')).toBeNull()
      await expect(names.querySelector('.pn-Delay')).toBeNull()
    }
    await expect(itemsOf(one)).toHaveLength(1)
    await expect(one.querySelector('.pn-StopTimeline-rail')).toBeNull()
    // the long name wraps within its column: its box is more than one line tall
    const long = within(canvas.getByTestId('trip')).getByText(NAMES_ONLY[3].name)
    const lineHeight = parseFloat(getComputedStyle(long).lineHeight)
    await expect(long.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5)

    await step('a stop with only a time, or only a delay, renders only that part', async () => {
      const [timeOnly, delayOnly] = itemsOf(canvas.getByRole('list', { name: 'A time or a delay' }))
      const time = timeOnly.querySelector('time')
      await expect(time).toHaveTextContent(PART_TIMED[0].time!)
      await expect(time).toHaveAttribute('datetime', PART_TIMED[0].time)
      await expect(timeOnly.querySelector('.pn-Delay')).toBeNull()
      await expect(delayOnly.querySelector('time')).toBeNull()
      const delay = delayOnly.querySelector('.pn-StopTimeline-delay')
      await expect(delay).not.toBeNull()
      await expect(delay).toHaveClass('pn-Delay')
      await expect(delay).toHaveTextContent('min')
    })

    await step('an empty trip renders an empty list', async () => {
      const { host, items } = renderOff(<StopTimeline stops={[]} nextStopIndex={0} />)
      await expect(host.querySelector('ol.pn-StopTimeline')).not.toBeNull()
      await expect(items).toHaveLength(0)
      await expect(host).toHaveTextContent('')
    })
  },
}

/** Every `line` value, and none, each a three-stop timeline with the line named above it. */
const LINES: { line: StopTimelineProps['line']; name: string }[] = [
  { line: 'm1', name: 'M1' },
  { line: 'm2', name: 'M2' },
  { line: 'm3', name: 'M3' },
  { line: 'm4', name: 'M4' },
  { line: 'a', name: 'A' },
  { line: 'b', name: 'B' },
  { line: 'c', name: 'C' },
  { line: 'e', name: 'E' },
  { line: 'f', name: 'F' },
  { line: 'h', name: 'H' },
  { line: 'bus', name: 'Bus 5C' },
  { line: 'regional', name: 'Regional train' },
  { line: undefined, name: 'No line' },
]

const THREE: StopTimelineStop[] = TRIP.slice(2, 5)

/** A three-stop timeline, the second stop next, for every `line` value and none. */
export const Lines: Story = {
  args: { stops: THREE, nextStopIndex: 1 },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--perron-space-300)' }}>
      {LINES.map(({ line, name }) => (
        <div key={name}>
          <p id={`lines-${line ?? 'none'}`} style={label}>
            {name}
          </p>
          <StopTimeline {...args} line={line} aria-labelledby={`lines-${line ?? 'none'}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('list')).toHaveLength(LINES.length)
    for (const { line, name } of LINES) {
      const list = canvas.getByRole('list', { name })
      if (line) await expect(list).toHaveAttribute('data-line', line)
      else await expect(list).not.toHaveAttribute('data-line')
      for (const marker of list.querySelectorAll('.pn-StopTimeline-marker'))
        if (line) await expect(marker).toHaveAttribute('data-line', line)
        else await expect(marker).not.toHaveAttribute('data-line')
    }
  },
}
