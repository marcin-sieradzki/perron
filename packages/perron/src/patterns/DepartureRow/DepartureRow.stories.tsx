// DepartureRow's stories: one per row of the spec's Stories table (docs/patterns/departure-row.md),
// with the design deferred, and their play tests, which read the accessibility tree and the DOM.
// Every line used has a badge pair that reaches 4.5:1, so axe's color-contrast rule stays on (CR-11).
import { createRef, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, isInaccessible, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { delayKnown, VEHICLE_STATES } from '../../internal/vehicle-states.ts'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { expectNoFocus, heard, lines, mounted } from '../../testing/stories.ts'
import { DepartureRow } from './DepartureRow.tsx'
import type { DepartureRowProps } from './DepartureRow.tsx'

const LOCALES = Object.keys(dictionaries) as Locale[]

const meta = {
  title: 'Patterns/DepartureRow',
  component: DepartureRow,
  args: {
    line: 'bus',
    lineName: '5C',
    destination: 'Husum Torv',
    countdown: 240,
    time: '08:14',
  },
  decorators: [
    // a stop's detail panel: its width and its raised surface
    (Story) => (
      <div
        style={{
          boxSizing: 'border-box',
          inlineSize: 'var(--perron-size-detail-width)',
          maxInlineSize: '100%',
          paddingInline: 'var(--perron-space-400)',
          background: 'var(--perron-color-surface-raised)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DepartureRow>

export default meta
type Story = StoryObj<typeof meta>

/** The parts of a row, in reading order. */
const PARTS = ['badge', 'destination', 'status', 'countdown', 'time', 'delay'] as const

/** One part of the row in `scope`, by its class, or null when it isn't rendered. */
const part = (scope: Element, name: string) =>
  scope.querySelector<HTMLElement>(`.pn-DepartureRow-${name}`)

/** The first row in `scope`. */
function rowIn(scope: Element) {
  const row = scope.querySelector<HTMLElement>('.pn-DepartureRow')
  if (!row) throw new Error('no .pn-DepartureRow rendered')
  return row
}

/** The row's parts that are rendered, in DOM order, the order a screen reader meets them. */
const partsInOrder = (row: Element) => [
  ...row.querySelectorAll<HTMLElement>(PARTS.map((name) => `.pn-DepartureRow-${name}`).join(', ')),
]

/** What a screen reader reads of a row: its parts in DOM order, each part's text apart. */
const readOf = (row: Element) => partsInOrder(row).map(heard).join(' ')

/** A row rendered to markup on the server and read back as an element, for shapes no story draws. */
function staticRow(element: ReactElement) {
  const host = document.createElement('div')
  host.innerHTML = renderToStaticMarkup(element)
  return rowIn(host)
}

/** The dot is in the row, hidden from assistive technology, and the state's word is read once. */
async function dotHiddenWordRead(row: HTMLElement, word: string) {
  const dot = part(row, 'dot')!
  await expect(dot).toHaveAttribute('aria-hidden', 'true')
  await expect(isInaccessible(dot)).toBe(true)
  const status = part(row, 'status')!
  await expect(heard(status)).toBe(word)
  await expect(isInaccessible(status)).toBe(false)
  await expect(within(row).getAllByText(word)).toHaveLength(1)
}

/** The countdown's "~", seen and never heard, straight before the figure. */
async function tildeBeforeFigure(row: HTMLElement) {
  const countdown = part(row, 'countdown')!
  const tilde = countdown.firstElementChild
  await expect(tilde?.textContent).toBe('~')
  await expect(tilde).toHaveAttribute('aria-hidden', 'true')
  await expect(countdown.textContent).toMatch(/^~\d+ min$/)
}

/** An ageing bus, a little late: the subject story. */
export const Ageing: Story = {
  args: { variant: 'ageing', delay: 2 },
  play: async ({ canvasElement, step }) => {
    const row = rowIn(canvasElement)
    await step('data-variant is ageing', async () => {
      await expect(row).toHaveAttribute('data-variant', 'ageing')
    })
    await step('the row reads its parts in DOM order, which is its reading order', async () => {
      const names = partsInOrder(row).map((found) =>
        PARTS.find((name) => found.classList.contains(`pn-DepartureRow-${name}`)),
      )
      await expect(names).toEqual([...PARTS])
      await expect(readOf(row)).toBe('5C Husum Torv Ageing 4 min 08:14 2 min late')
    })
    await step('the dot is hidden and "Ageing" is read beside it', () =>
      dotHiddenWordRead(row, 'Ageing'),
    )
    await step('no "~" renders', async () => {
      await expect(part(row, 'countdown')).toHaveTextContent(/^4 min$/)
      await expect(row.textContent).not.toContain('~')
    })
  },
}

/** An estimated bus, three minutes late: the countdown is an estimate. */
export const Estimated: Story = {
  args: { variant: 'estimated', countdown: 380, time: '08:16', delay: 3 },
  play: async ({ canvasElement, step }) => {
    const row = rowIn(canvasElement)
    await step('the countdown shows "~6 min", its "~" hidden', async () => {
      await tildeBeforeFigure(row)
      await expect(part(row, 'countdown')).toHaveTextContent('~6 min')
      await expect(heard(part(row, 'countdown')!)).toBe('6 min')
    })
    await step('"Estimated" is read beside the dot', () => dotHiddenWordRead(row, 'Estimated'))
    await step('the Delay is read "3 min late"', async () => {
      await expect(heard(part(row, 'delay')!)).toBe('3 min late')
    })
    await step("the Delay is set in the time's type, over its own (CR-12)", async () => {
      const delay = getComputedStyle(part(row, 'delay')!)
      const time = getComputedStyle(part(row, 'time')!)
      for (const property of ['font-size', 'line-height', 'font-weight', 'letter-spacing'])
        await expect(delay.getPropertyValue(property)).toBe(time.getPropertyValue(property))
      await expect(delay.fontVariantNumeric).toBe('tabular-nums')
      await expect(delay.whiteSpace).toBe('nowrap')
    })
  },
}

/** Every own prop at once, for the check that none reaches the root as an attribute (CR-2). */
const EVERY_PROP = {
  variant: 'live',
  line: 'bus',
  lineName: '5C',
  destination: 'Husum Torv',
  countdown: 240,
  time: '08:14',
  delay: 0,
  nowLabel: 'Leaving',
  unknownLabel: 'Not known',
  liveLabel: 'Real-time',
  ageingLabel: 'Older',
  estimatedLabel: 'Guessed',
  timetableOnlyLabel: 'Planned only',
  noSignalLabel: 'Silent',
  minutesUnitLabel: 'mins',
  minutesLateLabel: 'mins behind',
  minutesEarlyLabel: 'mins ahead',
  onTimeLabel: 'Punctual',
  delayUnknownLabel: 'No delay data',
  slotProps: {},
} satisfies DepartureRowProps

/** Each part's own class and a caller's, through `slotProps`. */
const SLOT_CLASSES = {
  badge: { className: 'caller-badge' },
  destination: { className: 'caller-destination' },
  status: { className: 'caller-status' },
  dot: { className: 'caller-dot', 'aria-hidden': false },
  countdown: { className: 'caller-countdown' },
  schedule: { className: 'caller-schedule' },
  time: { className: 'caller-time' },
  delay: { className: 'caller-delay' },
} satisfies DepartureRowProps['slotProps']

/**
 * A live bus on time. Its play test holds the root, the parts' `slotProps`, the countdown's
 * rounding and its unknown value, the label overrides and the owned strings.
 */
export const Live: Story = {
  args: { variant: 'live', delay: 0 },
  play: async ({ canvasElement, args, step }) => {
    const row = rowIn(canvasElement)
    await step('"Live" is read once, and the dot is hidden', () => dotHiddenWordRead(row, 'Live'))
    await step('no "~" renders', async () => {
      await expect(part(row, 'countdown')).toHaveTextContent(/^4 min$/)
      await expect(row.textContent).not.toContain('~')
    })

    await step('Tab passes the row by, from a button before it to one after it', async () => {
      const before = document.createElement('button')
      const after = document.createElement('button')
      before.textContent = 'Before the row'
      after.textContent = 'After the row'
      canvasElement.before(before)
      canvasElement.after(after)
      try {
        before.focus()
        await expectNoFocus(row)
        await expect(before).toHaveFocus()
        await userEvent.tab()
        await expect(after).toHaveFocus()
        await userEvent.tab({ shift: true })
        await expect(before).toHaveFocus()
      } finally {
        before.remove()
        after.remove()
      }
    })

    await step('with variant left out, data-variant is live', async () => {
      const { variant: _, ...rest } = args
      await expect(staticRow(<DepartureRow {...rest} />)).toHaveAttribute('data-variant', 'live')
    })

    await step('className, style and ref reach the root (CR-2)', () => {
      const ref = createRef<HTMLDivElement>()
      return mounted(
        canvasElement,
        <DepartureRow {...args} ref={ref} className="caller" style={{ marginInline: '3px' }} />,
        async (host) => {
          const root = await waitFor(() => rowIn(host))
          await waitFor(() => expect(ref.current).toBe(root))
          await expect(root.className).toBe('pn-DepartureRow caller')
          await expect(root.style.marginInline).toBe('3px')
        },
      )
    })

    await step('with every own prop passed, none reaches the root (CR-2)', async () => {
      const root = staticRow(<DepartureRow {...EVERY_PROP} data-testid="every" />)
      await expect(root.getAttributeNames().sort()).toEqual([
        'class',
        'data-testid',
        'data-variant',
      ])
    })

    await step("each part's slotProps class joins after the part's own (CR-7)", async () => {
      const root = staticRow(<DepartureRow {...args} slotProps={SLOT_CLASSES} />)
      for (const name of [...PARTS, 'dot', 'schedule']) {
        const found = part(root, name)!
        const names = [...found.classList]
        await expect(names.indexOf(`pn-DepartureRow-${name}`)).toBeGreaterThanOrEqual(0)
        await expect(names.indexOf(`caller-${name}`)).toBe(
          names.indexOf(`pn-DepartureRow-${name}`) + 1,
        )
      }
      // the row's own aria-hidden wins over the caller's
      await expect(part(root, 'dot')).toHaveAttribute('aria-hidden', 'true')
    })

    await step("each state's label replaces its word (CR-6)", async () => {
      const replaced = {
        live: ['liveLabel', 'Live'],
        ageing: ['ageingLabel', 'Ageing'],
        estimated: ['estimatedLabel', 'Estimated'],
        'timetable-only': ['timetableOnlyLabel', 'Timetable only'],
        'no-signal': ['noSignalLabel', 'No signal'],
      } as const
      for (const variant of VEHICLE_STATES) {
        const [label, word] = replaced[variant]
        const root = staticRow(<DepartureRow {...EVERY_PROP} variant={variant} />)
        await expect(heard(part(root, 'status')!)).toBe(EVERY_PROP[label])
        await expect(root.textContent).not.toContain(word)
      }
    })

    await step('minutesUnitLabel replaces the countdown\'s "min" and the Delay\'s', async () => {
      const root = staticRow(<DepartureRow {...args} delay={3} minutesUnitLabel="mins" />)
      await expect(part(root, 'countdown')!.textContent).toBe('4 mins')
      await expect(part(root, 'delay')!.querySelector('.pn-Delay-unit')).toHaveTextContent(/^mins$/)
    })

    await step("Delay's four labels reach the Delay", async () => {
      const delayRead = (delay: number | null) =>
        heard(part(staticRow(<DepartureRow {...EVERY_PROP} delay={delay} />), 'delay')!)
      await expect(delayRead(3)).toBe(`3 ${EVERY_PROP.minutesLateLabel}`)
      await expect(delayRead(-2)).toBe(`2 ${EVERY_PROP.minutesEarlyLabel}`)
      await expect(delayRead(0)).toBe(EVERY_PROP.onTimeLabel)
      await expect(delayRead(null)).toBe(EVERY_PROP.delayUnknownLabel)
    })

    await step('lineName and destination render a string, an element and a list', async () => {
      const shapes = [
        ['5C', 'Husum Torv'],
        [<b>5C</b>, <span lang="da">Husum Torv</span>],
        [
          ['5', 'C'],
          ['Husum', ' ', 'Torv'],
        ],
      ] as const
      for (const [lineName, destination] of shapes) {
        const root = staticRow(
          <DepartureRow {...args} lineName={lineName} destination={destination} />,
        )
        await expect(heard(part(root, 'badge')!)).toBe('5C')
        await expect(heard(part(root, 'destination')!)).toBe('Husum Torv')
      }
      const elements = staticRow(
        <DepartureRow
          {...args}
          lineName={<b>5C</b>}
          destination={<span lang="da">Husum Torv</span>}
        />,
      )
      await expect(part(elements, 'badge')!.querySelector('b')).toHaveTextContent('5C')
      await expect(part(elements, 'destination')!.querySelector('[lang="da"]')).toHaveTextContent(
        'Husum Torv',
      )
    })

    await step('the countdown rounds to whole minutes (CR-3)', async () => {
      const shows = (countdown: number) =>
        part(staticRow(<DepartureRow {...args} countdown={countdown} />), 'countdown')!
      await expect(shows(89.4).textContent).toBe('1 min')
      await expect(shows(90).textContent).toBe('2 min')
      await expect(shows(3600).textContent).toBe('60 min')
    })

    await step('a countdown that is not finite shows "—", read "Unknown" (CR-3)', async () => {
      for (const countdown of [Number.NaN, Number.POSITIVE_INFINITY]) {
        const countdownPart = part(
          staticRow(<DepartureRow {...args} variant="estimated" countdown={countdown} />),
          'countdown',
        )!
        await expect(countdownPart.textContent).toBe('—Unknown')
        await expect(heard(countdownPart)).toBe('Unknown')
        await expect(countdownPart.querySelector('[aria-hidden="true"]')).toHaveTextContent('—')
      }
      const overridden = staticRow(
        <DepartureRow {...args} countdown={Number.NaN} unknownLabel="Not known" />,
      )
      await expect(heard(part(overridden, 'countdown')!)).toBe('Not known')
    })

    await step('delay a number, null and left out, in every variant (CR-5)', async () => {
      const { delay: _, ...withoutDelay } = args
      for (const variant of VEHICLE_STATES)
        for (const delay of [3, null, undefined]) {
          const root = staticRow(
            <DepartureRow
              {...withoutDelay}
              variant={variant}
              {...(delay === undefined ? {} : { delay })}
            />,
          )
          const found = part(root, 'delay')
          if (delay === undefined && delayKnown(variant)) {
            await expect(found).toBeNull()
            continue
          }
          const unknown = delay === null || !delayKnown(variant)
          await expect(found).toHaveAttribute('data-delay', unknown ? 'unknown' : 'late')
          await expect(found!.querySelector('.pn-Delay-value')).toHaveTextContent(
            unknown ? '—' : '+3',
          )
          await expect(heard(found!)).toBe(unknown ? 'Delay unknown' : '3 min late')
        }
    })

    await step('with delay left out, the schedule holds the time alone (CR-10)', async () => {
      const { delay: _, ...rest } = args
      const schedule = part(staticRow(<DepartureRow {...rest} />), 'schedule')!
      await expect([...schedule.children].map((child) => child.tagName)).toEqual(['TIME'])
      await expect(schedule.textContent).toBe('08:14')
    })

    await step('with time left out, the schedule holds the Delay alone (CR-10)', async () => {
      const { time: _, ...rest } = args
      const schedule = part(staticRow(<DepartureRow {...rest} delay={3} />), 'schedule')!
      await expect(schedule.children).toHaveLength(1)
      await expect(schedule.firstElementChild).toHaveClass('pn-DepartureRow-delay')
      await expect(schedule.querySelector('time')).toBeNull()
    })

    await step('with time and delay left out, no schedule renders (CR-10)', async () => {
      const { time: _, delay: __, ...rest } = args
      const root = staticRow(<DepartureRow {...rest} />)
      await expect(part(root, 'schedule')).toBeNull()
      await expect(root.querySelector('time')).toBeNull()
      await expect(root.querySelector('.pn-Delay')).toBeNull()
    })

    for (const locale of LOCALES)
      await step(`in ${locale}, every word in every variant is the dictionary's`, () => {
        for (const variant of [
          'live',
          'ageing',
          'estimated',
          'timetable-only',
          'no-signal',
        ] as const)
          for (const countdown of [240, 30, Number.NaN])
            expectOwnedStrings(
              renderToStaticMarkup(
                <PerronProvider locale={locale}>
                  <DepartureRow {...args} variant={variant} countdown={countdown} delay={3} />
                </PerronProvider>,
              ),
              locale,
              ['5C', 'Husum Torv', '08:14'],
            )
      })
  },
}

/** A silent bus: the delay is unknown whatever `delay` holds. */
export const NoSignal: Story = {
  args: { variant: 'no-signal', delay: 4 },
  play: async ({ canvasElement, step }) => {
    const row = rowIn(canvasElement)
    await step(
      'the Delay shows "—" and is read "Delay unknown", though delay is 4 (CR-5)',
      async () => {
        const delay = part(row, 'delay')!
        await expect(delay).toHaveAttribute('data-delay', 'unknown')
        await expect(delay.querySelector('.pn-Delay-value')).toHaveTextContent('—')
        await expect(heard(delay)).toBe('Delay unknown')
      },
    )
    await step('"~" comes before the figure', () => tildeBeforeFigure(row))
    await step('"No signal" is read beside the dot', () => dotHiddenWordRead(row, 'No signal'))
  },
}

/** "Now": a live bus leaving in under 45 seconds. */
export const Now: Story = {
  args: { variant: 'live', countdown: 30, delay: 0 },
  play: async ({ canvasElement, args, step }) => {
    const countdown = part(rowIn(canvasElement), 'countdown')!
    await step('the countdown shows and reads "Now", with no figure, unit or "~"', async () => {
      await expect(countdown.textContent).toBe('Now')
      await expect(heard(countdown)).toBe('Now')
      await expect(isInaccessible(countdown)).toBe(false)
    })
    const shows = (props: Partial<DepartureRowProps>) =>
      part(staticRow(<DepartureRow {...args} {...props} />), 'countdown')!.textContent
    await step('0 and −20 seconds show "Now", 45 shows "1 min"', async () => {
      await expect(shows({ countdown: 0 })).toBe('Now')
      await expect(shows({ countdown: -20 })).toBe('Now')
      await expect(shows({ countdown: 44.9 })).toBe('Now')
      await expect(shows({ countdown: 45 })).toBe('1 min')
    })
    await step('an estimated "Now" takes no "~"', async () => {
      await expect(shows({ variant: 'estimated' })).toBe('Now')
    })
    await step('nowLabel replaces it', async () => {
      await expect(shows({ nowLabel: 'Leaving' })).toBe('Leaving')
    })
  },
}

/** A bus with no real-time data: a timetabled time, an unknown delay. */
export const TimetableOnly: Story = {
  args: { variant: 'timetable-only' },
  play: async ({ canvasElement, step }) => {
    const row = rowIn(canvasElement)
    await step('a Delay renders unknown though delay is left out (CR-5)', async () => {
      await expect(part(row, 'delay')).toHaveAttribute('data-delay', 'unknown')
      await expect(heard(part(row, 'delay')!)).toBe('Delay unknown')
    })
    await step('the time carries its HH:MM as dateTime (CR-10)', async () => {
      const time = row.querySelector('time')
      await expect(time).toHaveClass('pn-DepartureRow-time')
      await expect(time).toHaveTextContent('08:14')
      await expect(time).toHaveAttribute('datetime', '08:14')
    })
    await step('"~" comes before the figure', () => tildeBeforeFigure(row))
    await step('"Timetable only" is read beside the dot', () =>
      dotHiddenWordRead(row, 'Timetable only'),
    )
  },
}

/** A long destination in a 320 px container: it wraps; the countdown and the time never do. */
export const LongDestination: Story = {
  args: {
    variant: 'live',
    line: 'm2',
    lineName: 'M2',
    destination: 'Københavns Lufthavn (Kastrup) Lufthavnsterminalen',
    countdown: 720,
    delay: 0,
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 320 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement, args, step }) => {
    const row = rowIn(canvasElement)
    const destination = part(row, 'destination')!
    const countdown = part(row, 'countdown')!
    const time = part(row, 'time')!
    const delay = part(row, 'delay')!
    // CR-9: the destination wraps inside the middle column
    await expect(lines(destination)).toBeGreaterThan(1.5)
    await expect(destination.getBoundingClientRect().right).toBeLessThanOrEqual(
      countdown.getBoundingClientRect().left,
    )
    // the countdown and the schedule each stay on one line
    await expect(countdown.textContent).toBe('12 min')
    await expect(lines(countdown)).toBeLessThan(1.5)
    await expect(lines(time)).toBeLessThan(1.5)
    await expect(delay.getBoundingClientRect().top).toBeLessThan(
      time.getBoundingClientRect().bottom,
    )
    // the row is no wider than its container
    await expect(row.getBoundingClientRect().width).toBeLessThanOrEqual(
      row.parentElement!.getBoundingClientRect().width,
    )
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth)

    await step("a long state's word wraps inside the middle column (CR-9)", () =>
      mounted(
        row.parentElement!,
        <DepartureRow {...args} liveLabel="Realtidspositionsopdateringstjenesten" />,
        async (host) => {
          const long = await waitFor(() => rowIn(host))
          const status = part(long, 'status')!
          await expect(lines(status)).toBeGreaterThan(1.5)
          await expect(status.getBoundingClientRect().right).toBeLessThanOrEqual(
            part(long, 'schedule')!.getBoundingClientRect().left,
          )
          await expect(lines(part(long, 'time')!)).toBeLessThan(1.5)
          await expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth)
        },
      ),
    )
  },
}

/** Four departures as a stop's list, each row in its own list item. */
const DEPARTURES: (DepartureRowProps & { key: string })[] = [
  {
    key: '5c',
    variant: 'live',
    line: 'bus',
    lineName: '5C',
    destination: 'Husum Torv',
    countdown: 120,
    time: '08:12',
    delay: 0,
  },
  {
    key: 'm3',
    variant: 'estimated',
    line: 'm3',
    lineName: 'M3',
    destination: 'Cityringen',
    countdown: 260,
    time: '08:13',
    delay: 1,
  },
  {
    key: 'f',
    variant: 'ageing',
    line: 'f',
    lineName: 'F',
    destination: 'Hellerup',
    countdown: 540,
    time: '08:15',
    delay: 4,
  },
  {
    key: 're',
    variant: 'timetable-only',
    line: 'regional',
    lineName: 'RE',
    destination: 'Helsingør',
    countdown: 1080,
    time: '08:26',
  },
]

/** A stop's departures: a list of four rows. */
export const List: Story = {
  render: () => (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {DEPARTURES.map(({ key, ...departure }) => (
        <li key={key}>
          <DepartureRow {...departure} />
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole('listitem')
    await expect(items).toHaveLength(4)
    for (const [index, item] of items.entries()) {
      const rows = item.querySelectorAll('.pn-DepartureRow')
      await expect(rows).toHaveLength(1)
      await expect(rows[0]).toHaveAttribute('data-variant', DEPARTURES[index].variant)
    }
  },
}
