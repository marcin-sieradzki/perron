// StopTimeline's stories: one per row of the spec's Stories table (docs/patterns/stop-timeline.md),
// with the design deferred, and their play tests, which read the accessibility tree.
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, isInaccessible, userEvent, within } from 'storybook/test'
import { Button } from '../../components/Button/Button.tsx'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
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
