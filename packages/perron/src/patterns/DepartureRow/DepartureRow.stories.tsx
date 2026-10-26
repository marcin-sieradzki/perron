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
import { colour, expectNoFocus, heard, lines, mounted, struck } from '../../testing/stories.ts'
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

/**
 * The parts a screen reader meets in turn, an interval's among them in the countdown's place. The
 * platform is read as part of the status that holds it.
 */
const READ_PARTS = [...PARTS, 'interval'] as const

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
  ...row.querySelectorAll<HTMLElement>(
    READ_PARTS.map((name) => `.pn-DepartureRow-${name}`).join(', '),
  ),
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

/** The attributes the root carries, sorted, for the check that no own prop reaches it (CR-2). */
const rootAttributes = (element: ReactElement) => staticRow(element).getAttributeNames().sort()

/** Each locale's render of `element`, held to its dictionary and the caller's `words`. */
function ownedStringsInEveryLocale(element: ReactElement, words: string[]) {
  for (const locale of LOCALES)
    expectOwnedStrings(
      renderToStaticMarkup(<PerronProvider locale={locale}>{element}</PerronProvider>),
      locale,
      words,
    )
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

/**
 * What a screen reader reads of a row's schedule: its children in DOM order, each one's text apart,
 * those hidden from the ear left out.
 */
const scheduleRead = (row: Element) =>
  [...(part(row, 'schedule')?.children ?? [])]
    .filter((child) => !isInaccessible(child))
    .map(heard)
    .join(' ')

/**
 * A bus running two minutes late: its expected time in the timetabled time's place, the timetabled
 * one struck through before it.
 */
export const Expected: Story = {
  args: { variant: 'live', countdown: 360, expected: '08:16', delay: 2 },
  play: async ({ canvasElement, args, step }) => {
    const row = rowIn(canvasElement)
    const shows = (props: Partial<DepartureRowProps>) =>
      staticRow(<DepartureRow {...args} {...props} />)
    await step(
      'the timetabled time is struck through before the expected one (CR-16)',
      async () => {
        const time = part(row, 'time')!
        const expected = part(row, 'expected')!
        await expect(time.tagName).toBe('TIME')
        await expect(time).toHaveAttribute('datetime', '08:14')
        await expect(time).toHaveAttribute('data-superseded', '')
        await expect(struck(time)).toBe(true)
        await expect(expected.tagName).toBe('TIME')
        await expect(expected).toHaveAttribute('datetime', '08:16')
        await expect(expected.textContent).toBe('08:16')
        await expect(struck(expected)).toBe(false)
        await expect(time.compareDocumentPosition(expected)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        await expect(part(row, 'schedule')!.lastElementChild).toBe(part(row, 'delay'))
      },
    )
    await step('it is heard "Timetabled 08:14", then the expected time', async () => {
      await expect(isInaccessible(part(row, 'time')!)).toBe(true)
      await expect(scheduleRead(row)).toBe('Timetabled 08:14 08:16 2 min late')
      await expect(heard(part(row, 'expected')!)).toBe('08:16')
    })
    await step(
      'the expected time takes the time\'s type and colour, and no "~" when live',
      async () => {
        const time = getComputedStyle(part(row, 'time')!)
        const expected = getComputedStyle(part(row, 'expected')!)
        for (const property of [
          'font-size',
          'line-height',
          'font-weight',
          'letter-spacing',
          'color',
        ])
          await expect(expected.getPropertyValue(property)).toBe(time.getPropertyValue(property))
        await expect(expected.color).toBe(colour('--perron-color-text-secondary'))
        await expect(expected.fontVariantNumeric).toBe('tabular-nums')
        await expect(expected.whiteSpace).toBe('nowrap')
        await expect(row.textContent).not.toContain('~')
      },
    )
    await step('ageing shows it alike, and estimated puts a hidden "~" before it', async () => {
      const ageing = shows({ variant: 'ageing' })
      await expect(part(ageing, 'time')).toHaveAttribute('data-superseded', '')
      await expect(scheduleRead(ageing)).toBe('Timetabled 08:14 08:16 2 min late')
      const estimated = shows({ variant: 'estimated' })
      const expected = part(estimated, 'expected')!
      await expect(expected.textContent).toBe('~08:16')
      await expect(expected.firstElementChild).toHaveAttribute('aria-hidden', 'true')
      await expect(expected).toHaveAttribute('datetime', '08:16')
      await expect(scheduleRead(estimated)).toBe('Timetabled 08:14 08:16 2 min late')
      await expect(heard(part(estimated, 'status')!)).toBe('Estimated')
    })
    await step('timetable-only and no-signal show the timetabled time alone', async () => {
      for (const variant of ['timetable-only', 'no-signal'] as const) {
        const root = shows({ variant })
        await expect(part(root, 'expected')).toBeNull()
        await expect(part(root, 'time')).not.toHaveAttribute('data-superseded')
        await expect(part(root, 'time')).not.toHaveAttribute('aria-hidden')
        await expect(scheduleRead(root)).toBe('08:14 Delay unknown')
      }
    })
    await step('an expected time the same as the timetabled one shows once, unstruck', async () => {
      const same = shows({ expected: '08:14', delay: 0 })
      await expect(part(same, 'time')).toBeNull()
      await expect(part(same, 'expected')!.textContent).toBe('08:14')
      await expect(same.querySelector('[data-superseded]')).toBeNull()
      await expect(scheduleRead(same)).toBe('08:14 On time')
      await expect(
        part(shows({ variant: 'estimated', expected: '08:14' }), 'expected')!.textContent,
      ).toBe('~08:14')
    })
    await step('with time left out, the expected time stands alone', async () => {
      const { time: _, ...rest } = args
      const root = staticRow(<DepartureRow {...rest} />)
      await expect(part(root, 'time')).toBeNull()
      await expect(scheduleRead(root)).toBe('08:16 2 min late')
    })
    await step('an empty expected time is left out, and the timetabled time stays', async () => {
      const root = shows({ expected: '' })
      await expect(part(root, 'expected')).toBeNull()
      await expect(part(root, 'time')).not.toHaveAttribute('data-superseded')
      await expect(scheduleRead(root)).toBe('08:14 2 min late')
    })
    await step('a cancelled row strikes its timetabled time as before, and no expected time', () =>
      mounted(canvasElement, <DepartureRow {...args} cancelled />, async (host) => {
        const found = await waitFor(() => rowIn(host))
        const time = part(found, 'time')!
        await expect(part(found, 'expected')).toBeNull()
        await expect(time).not.toHaveAttribute('data-superseded')
        await expect(isInaccessible(time)).toBe(false)
        await expect(struck(time)).toBe(true)
        await expect(struck(part(found, 'countdown')!)).toBe(true)
        await expect(readOf(found)).toBe('5C Husum Torv Cancelled 6 min 08:14')
      }),
    )
    await step('with an interval, no time renders at all (CR-14)', async () => {
      const root = shows({ interval: [3, 4] })
      await expect(part(root, 'schedule')).toBeNull()
      await expect(root.querySelector('time')).toBeNull()
    })
    await step('timetabledTimeLabel replaces the words heard, filled alike', async () => {
      const root = shows({ timetabledTimeLabel: 'Planned {time}' })
      await expect(scheduleRead(root)).toBe('Planned 08:14 08:16 2 min late')
    })
    await step(
      "slotProps.expected's and slotProps.time's classes join after the parts' own",
      async () => {
        const root = shows({
          slotProps: {
            time: { className: 'caller-time' },
            expected: { className: 'caller-expected' },
          },
        })
        await expect([...part(root, 'expected')!.classList]).toEqual([
          'pn-DepartureRow-expected',
          'caller-expected',
        ])
        await expect([...part(root, 'time')!.classList]).toEqual([
          'pn-DepartureRow-time',
          'caller-time',
        ])
      },
    )
    await step('expected does not reach the root (CR-2)', async () => {
      await expect(rootAttributes(<DepartureRow {...args} />)).toEqual(['class', 'data-variant'])
    })
    await step('in a 320 px container, the times and the delay stay on one line', () =>
      mounted(
        canvasElement,
        <div style={{ inlineSize: 320 }}>
          <DepartureRow
            {...args}
            variant="estimated"
            destination="Københavns Lufthavn (Kastrup) Lufthavnsterminalen"
            delay={12}
            expected="08:26"
          />
        </div>,
        async (host) => {
          const found = await waitFor(() => rowIn(host))
          const schedule = part(found, 'schedule')!
          await expect(lines(part(found, 'time')!)).toBeLessThan(1.5)
          await expect(lines(part(found, 'expected')!)).toBeLessThan(1.5)
          await expect(part(found, 'delay')!.getBoundingClientRect().top).toBeLessThan(
            part(found, 'time')!.getBoundingClientRect().bottom,
          )
          await expect(part(found, 'status')!.getBoundingClientRect().right).toBeLessThanOrEqual(
            schedule.getBoundingClientRect().left,
          )
          await expect(found.scrollWidth).toBeLessThanOrEqual(found.clientWidth)
        },
      ),
    )
    await step("in every locale, every word is the dictionary's", () => {
      for (const variant of ['live', 'estimated'] as const)
        ownedStringsInEveryLocale(<DepartureRow {...args} variant={variant} />, [
          '5C',
          'Husum Torv',
          '08:14',
          '08:16',
        ])
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
  expected: '08:14',
  delay: 0,
  cancelled: false,
  nowLabel: 'Leaving',
  unknownLabel: 'Not known',
  timetabledTimeLabel: 'Planned {time}',
  cancelledLabel: 'Not running',
  everyLabel: 'Each {minutes} mins',
  everyRangeLabel: 'Each {from} or {to} mins',
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

/** A cancelled bus: the row stays, marked "Cancelled", its countdown and time struck through. */
export const Cancelled: Story = {
  args: { variant: 'live', cancelled: true, delay: 2 },
  play: async ({ canvasElement, args, step }) => {
    const row = rowIn(canvasElement)
    await step('the root carries data-cancelled (CR-13)', async () => {
      await expect(row).toHaveAttribute('data-cancelled', '')
      await expect(row).toHaveAttribute('data-variant', 'live')
    })
    await step('the status reads "Cancelled", in the danger colour, with no dot', async () => {
      const status = part(row, 'status')!
      await expect(heard(status)).toBe('Cancelled')
      await expect(status.textContent).toBe('Cancelled')
      await expect(part(row, 'dot')).toBeNull()
      await expect(row.textContent).not.toContain('Live')
      await expect(getComputedStyle(status).color).toBe(colour('--perron-color-text-danger'))
    })
    await step('the countdown and the time are struck through, their text kept', async () => {
      await expect(struck(part(row, 'countdown')!)).toBe(true)
      await expect(struck(part(row, 'time')!)).toBe(true)
      await expect(part(row, 'countdown')!.textContent).toBe('4 min')
      await expect(struck(part(row, 'destination')!)).toBe(false)
    })
    await step('no Delay renders, though delay is 2 (CR-5)', async () => {
      await expect(part(row, 'delay')).toBeNull()
      const timetabled = staticRow(<DepartureRow {...args} variant="timetable-only" />)
      await expect(part(timetabled, 'delay')).toBeNull()
    })
    await step('the row reads "Cancelled" before the countdown', async () => {
      await expect(readOf(row)).toBe('5C Husum Torv Cancelled 4 min 08:14')
    })
    await step('an estimated cancelled row keeps its "~"', async () => {
      const estimated = staticRow(<DepartureRow {...args} variant="estimated" />)
      await expect(part(estimated, 'countdown')!.textContent).toBe('~4 min')
      await expect(heard(part(estimated, 'status')!)).toBe('Cancelled')
    })
    await step('cancelledLabel replaces the word', async () => {
      const root = staticRow(<DepartureRow {...args} cancelledLabel="Not running" />)
      await expect(heard(part(root, 'status')!)).toBe('Not running')
    })
    await step('cancelled={false} sets no data-cancelled and draws the dot', async () => {
      const root = staticRow(<DepartureRow {...args} cancelled={false} />)
      await expect(root).not.toHaveAttribute('data-cancelled')
      await expect(part(root, 'dot')).not.toBeNull()
      await expect(heard(part(root, 'status')!)).toBe('Live')
      await expect(rootAttributes(<DepartureRow {...args} cancelled={false} />)).toEqual([
        'class',
        'data-variant',
      ])
    })
    await step('with an interval, the interval is struck through', () =>
      mounted(canvasElement, <DepartureRow {...args} interval={[3, 4]} />, async (host) => {
        const interval = await waitFor(() => part(rowIn(host), 'interval')!)
        await expect(struck(interval)).toBe(true)
      }),
    )
    await step('with a platform, it is read after "Cancelled" and not struck', () =>
      mounted(canvasElement, <DepartureRow {...args} platform="Track 4" />, async (host) => {
        const found = await waitFor(() => rowIn(host))
        await expect(heard(part(found, 'status')!)).toBe('Cancelled Track 4')
        await expect(struck(part(found, 'platform')!)).toBe(false)
        await expect(getComputedStyle(part(found, 'platform')!).color).toBe(
          colour('--perron-color-text-primary'),
        )
      }),
    )
    await step("in every locale, every word is the dictionary's", () => {
      ownedStringsInEveryLocale(<DepartureRow {...args} />, ['5C', 'Husum Torv', '08:14'])
      ownedStringsInEveryLocale(<DepartureRow {...args} interval={[3, 4]} />, ['5C', 'Husum Torv'])
    })
  },
}

/** The Metro, which runs to an interval: "Every 3 to 4 min" in place of a countdown and a time. */
export const Interval: Story = {
  args: {
    variant: 'live',
    line: 'm2',
    lineName: 'M2',
    destination: 'Lufthavnen',
    interval: [3, 4],
  },
  play: async ({ canvasElement, args, step }) => {
    const row = rowIn(canvasElement)
    const shows = (props: Partial<DepartureRowProps>) =>
      part(staticRow(<DepartureRow {...args} {...props} />), 'interval')!
    await step('the interval reads "Every 3 to 4 min" in the countdown\'s place', async () => {
      const interval = part(row, 'interval')!
      await expect(interval.textContent).toBe('Every 3 to 4 min')
      await expect(heard(interval)).toBe('Every 3 to 4 min')
      await expect(readOf(row)).toBe('M2 Lufthavnen Live Every 3 to 4 min')
      const style = getComputedStyle(interval)
      await expect(style.gridColumnStart).toBe('3')
      await expect(style.whiteSpace).toBe('nowrap')
      await expect(style.fontVariantNumeric).toBe('tabular-nums')
    })
    await step(
      'no countdown, schedule, time or Delay, though countdown and time are given',
      async () => {
        await expect(args.countdown).toBe(240)
        await expect(args.time).toBe('08:14')
        for (const name of ['countdown', 'schedule', 'time', 'delay'])
          await expect(part(row, name)).toBeNull()
        const timetabled = staticRow(<DepartureRow {...args} variant="timetable-only" delay={3} />)
        await expect(part(timetabled, 'delay')).toBeNull()
        await expect(part(timetabled, 'schedule')).toBeNull()
      },
    )
    await step('the dot and "Live" stay', () => dotHiddenWordRead(row, 'Live'))
    await step('one number, a range high to low and ends that round alike (CR-14)', async () => {
      await expect(shows({ interval: 3 }).textContent).toBe('Every 3 min')
      await expect(shows({ interval: [4, 3] }).textContent).toBe('Every 3 to 4 min')
      await expect(shows({ interval: [3.2, 2.8] }).textContent).toBe('Every 3 min')
      await expect(shows({ interval: 2.6 }).textContent).toBe('Every 3 min')
    })
    await step('an interval that is not finite shows "—", read "Unknown"', async () => {
      for (const interval of [Number.NaN, [3, Number.POSITIVE_INFINITY] as const]) {
        const found = shows({ interval })
        await expect(found.textContent).toBe('—Unknown')
        await expect(heard(found)).toBe('Unknown')
      }
    })
    await step('an estimated interval takes no "~"', async () => {
      await expect(shows({ variant: 'estimated' }).textContent).toBe('Every 3 to 4 min')
    })
    await step('everyLabel and everyRangeLabel replace its words, filled alike', async () => {
      const labels = {
        everyLabel: 'Each {minutes} mins',
        everyRangeLabel: 'Each {from} or {to} mins',
      }
      await expect(shows(labels).textContent).toBe('Each 3 or 4 mins')
      await expect(shows({ ...labels, interval: 3 }).textContent).toBe('Each 3 mins')
      // the template carries its own unit, so minutesUnitLabel leaves the interval alone
      await expect(shows({ minutesUnitLabel: 'mins' }).textContent).toBe('Every 3 to 4 min')
    })
    await step("slotProps.interval's class joins after the part's own", async () => {
      const found = shows({ slotProps: { interval: { className: 'caller-interval' } } })
      await expect([...found.classList]).toEqual(['pn-DepartureRow-interval', 'caller-interval'])
    })
    await step('interval does not reach the root (CR-2)', async () => {
      await expect(rootAttributes(<DepartureRow {...args} />)).toEqual(['class', 'data-variant'])
    })
    await step('in a 320 px container the interval stays on one line', () =>
      mounted(
        canvasElement,
        <div style={{ inlineSize: 320 }}>
          <DepartureRow {...args} destination="Københavns Lufthavn (Kastrup) Lufthavnsterminalen" />
        </div>,
        async (host) => {
          const found = await waitFor(() => rowIn(host))
          const interval = part(found, 'interval')!
          await expect(lines(interval)).toBeLessThan(1.5)
          await expect(
            part(found, 'destination')!.getBoundingClientRect().right,
          ).toBeLessThanOrEqual(interval.getBoundingClientRect().left)
          await expect(found.scrollWidth).toBeLessThanOrEqual(found.clientWidth)
        },
      ),
    )
    await step("in every locale, every word is the dictionary's", () => {
      for (const interval of [3, [3, 4] as const, Number.NaN])
        ownedStringsInEveryLocale(<DepartureRow {...args} interval={interval} />, [
          'M2',
          'Lufthavnen',
        ])
    })
  },
}

/** A regional train with its track: the platform after the state's word. */
export const Platform: Story = {
  args: {
    variant: 'timetable-only',
    line: 'regional',
    lineName: 'RE',
    destination: 'Helsingør',
    countdown: 1080,
    time: '08:26',
    platform: 'Track 4',
  },
  play: async ({ canvasElement, args, step }) => {
    const row = rowIn(canvasElement)
    await step("the platform sits last in the status, after the state's word", async () => {
      const status = part(row, 'status')!
      const platform = part(row, 'platform')!
      await expect(status.lastElementChild).toBe(platform)
      await expect(heard(status)).toBe('Timetable only Track 4')
      await expect(getComputedStyle(platform).color).toBe(colour('--perron-color-text-primary'))
      await expect(readOf(row)).toBe(
        'RE Helsingør Timetable only Track 4 18 min 08:26 Delay unknown',
      )
    })
    await step('an element renders as given', async () => {
      const root = staticRow(<DepartureRow {...args} platform={<b>Spor 4</b>} />)
      await expect(part(root, 'platform')!.querySelector('b')).toHaveTextContent('Spor 4')
    })
    await step("left out, or '', no platform renders", async () => {
      const { platform: _, ...rest } = args
      await expect(part(staticRow(<DepartureRow {...rest} />), 'platform')).toBeNull()
      await expect(part(staticRow(<DepartureRow {...rest} platform="" />), 'platform')).toBeNull()
    })
    await step("slotProps.platform's class joins after the part's own", async () => {
      const root = staticRow(
        <DepartureRow {...args} slotProps={{ platform: { className: 'caller-platform' } }} />,
      )
      await expect([...part(root, 'platform')!.classList]).toEqual([
        'pn-DepartureRow-platform',
        'caller-platform',
      ])
    })
    await step('platform does not reach the root (CR-2)', async () => {
      await expect(rootAttributes(<DepartureRow {...args} />)).toEqual(['class', 'data-variant'])
    })
    await step("beside a long state's word at 320 px, it stays inside the middle column", () =>
      mounted(
        canvasElement,
        <div style={{ inlineSize: 320 }}>
          <DepartureRow {...args} timetableOnlyLabel="Realtidspositionsopdateringstjenesten" />
        </div>,
        async (host) => {
          const found = await waitFor(() => rowIn(host))
          const platform = part(found, 'platform')!
          await expect(platform.getBoundingClientRect().right).toBeLessThanOrEqual(
            part(found, 'schedule')!.getBoundingClientRect().left,
          )
          await expect(found.scrollWidth).toBeLessThanOrEqual(found.clientWidth)
        },
      ),
    )
    await step("in every locale, every word is the dictionary's", () =>
      ownedStringsInEveryLocale(<DepartureRow {...args} />, [
        'RE',
        'Helsingør',
        '08:26',
        'Track 4',
      ]),
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
    expected: '08:14',
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
    expected: '08:19',
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
