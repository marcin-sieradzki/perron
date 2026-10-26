// SourceLine's stories: one per row of the spec's Stories table (docs/patterns/source-line.md),
// with the design deferred, each with a play test that reads the accessibility tree and the drawing.
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  colour,
  expectNoFocus,
  frames,
  heard,
  lines,
  mounted,
  resolve,
} from '../../testing/stories.ts'
import { SourceLine } from './SourceLine.tsx'
import type { SourceLineProps, SourceLineSource } from './SourceLine.tsx'

/** The departures' source, fresh. */
const REJSEPLANEN = { name: 'Rejseplanen', time: '08:14:05' } satisfies SourceLineSource

/** A second source, fresh, a few seconds older than the first. */
const POSITIONS: SourceLineSource = { name: 'Vehicle positions', time: '08:13:58' }

/** The second source gone stale under a fresh first one: the case the line exists for. */
const STALE = {
  name: 'Vehicle positions',
  time: '08:09:40',
  outOfDate: true,
} satisfies SourceLineSource

/**
 * The sources of Mylder's own lines, each in the app's words of what its time is of (CR-15): one
 * provider's name before its facts, a fact with no name of its own, a fact with no time, and a date
 * where a time usually goes.
 */
const POSITION: SourceLineSource = {
  name: 'Rejseplanen',
  time: '08:14:05',
  label: 'position {time}',
}
const TIMES: SourceLineSource = { time: '08:14:20', label: 'times {time}' }
const TIMES_FROM_TIMETABLE: SourceLineSource = { label: 'times from the timetable' }
const DEPARTURES: SourceLineSource = {
  name: 'Rejseplanen',
  time: '08:14:20',
  label: 'departures {time}',
}
const TIMETABLE_AND_POSITIONS: SourceLineSource = {
  time: '08:14:05',
  label: 'Timetable and positions {time}',
}
const FLEET_POSITIONS: SourceLineSource = {
  name: 'Rejseplanen',
  time: '08:14:05',
  label: 'positions {time}',
}
const TIMETABLE_OF: SourceLineSource = {
  time: '12 October',
  dateTime: '2026-10-12',
  label: 'timetable of {time}',
}

/** A source gone out of date, as the app judges it. */
const stale = (source: SourceLineSource): SourceLineSource => ({ ...source, outOfDate: true })

/** One of Mylder's source lines: the screen it is on, its sources, and how it is heard. */
interface MylderLine {
  screen: string
  sources: SourceLineProps['sources']
  heard: string
}

/** Each of Mylder's source lines, as its screens word them. */
const MYLDER_LINES: readonly MylderLine[] = [
  {
    screen: 'vehicle-detail',
    sources: [POSITION, TIMES],
    heard: 'Rejseplanen · position 08:14:05 · times 08:14:20',
  },
  {
    screen: 'vehicle-detail-timetable',
    sources: [POSITION, TIMES_FROM_TIMETABLE],
    heard: 'Rejseplanen · position 08:14:05 · times from the timetable',
  },
  {
    screen: 'stop-departures',
    sources: [DEPARTURES],
    heard: 'Rejseplanen · departures 08:14:20',
  },
  {
    screen: 'stop-departures-timetable',
    sources: [TIMETABLE_AND_POSITIONS],
    heard: 'Timetable and positions 08:14:05',
  },
  {
    screen: 'city-pulse',
    sources: [FLEET_POSITIONS, TIMETABLE_OF],
    heard: 'Rejseplanen · positions 08:14:05 · timetable of 12 October',
  },
  {
    screen: 'vehicles-list',
    sources: [FLEET_POSITIONS],
    heard: 'Rejseplanen · positions 08:14:05',
  },
]

/** `MYLDER_LINES`, with the answer of one source on each older than its refresh. */
const MYLDER_LINES_OUT_OF_DATE: readonly MylderLine[] = [
  {
    screen: 'vehicle-detail',
    sources: [POSITION, stale(TIMES)],
    heard: 'Rejseplanen · position 08:14:05 · times 08:14:20, may be out of date',
  },
  {
    screen: 'vehicle-detail-timetable',
    sources: [stale(POSITION), TIMES_FROM_TIMETABLE],
    heard: 'Rejseplanen · position 08:14:05, may be out of date · times from the timetable',
  },
  {
    screen: 'stop-departures',
    sources: [stale(DEPARTURES)],
    heard: 'Rejseplanen · departures 08:14:20, may be out of date',
  },
  {
    screen: 'stop-departures-timetable',
    sources: [stale(TIMETABLE_AND_POSITIONS)],
    heard: 'Timetable and positions 08:14:05, may be out of date',
  },
  {
    screen: 'city-pulse',
    sources: [stale(FLEET_POSITIONS), TIMETABLE_OF],
    heard: 'Rejseplanen · positions 08:14:05, may be out of date · timetable of 12 October',
  },
  {
    screen: 'vehicles-list',
    sources: [stale(FLEET_POSITIONS)],
    heard: 'Rejseplanen · positions 08:14:05, may be out of date',
  },
]

/** What a caller gives for its sources: each name, and each label with its time filled in. */
const callerWords = (sources: readonly SourceLineSource[]) =>
  sources.flatMap((source) => [
    ...(source.name ? [source.name] : []),
    ...(source.label ? [source.label.replace('{time}', source.time ?? '')] : []),
  ])

/**
 * Each of the line's owned strings overridden: the prop, the caller's own string, and how the
 * paused line of `REJSEPLANEN` and `STALE` is heard with that one override alone.
 */
const OVERRIDES = [
  {
    prop: 'sourceUpdatedLabel',
    own: 'as of {time}',
    alone:
      'Paused · Rejseplanen · as of 08:14:05 · Vehicle positions · updated 08:09:40, may be out of date',
  },
  {
    prop: 'sourcePausedLabel',
    own: 'On hold',
    alone:
      'On hold · Rejseplanen · updated 08:14:05 · Vehicle positions · updated 08:09:40, may be out of date',
  },
  {
    prop: 'sourceOutOfDateLabel',
    own: 'as of {time}, could be old',
    alone:
      'Paused · Rejseplanen · updated 08:14:05 · Vehicle positions · as of 08:09:40, could be old',
  },
] as const satisfies readonly { prop: keyof SourceLineProps; own: string; alone: string }[]

/** Every override at once, from `OVERRIDES`. */
const OWN_LABELS = {
  sourceUpdatedLabel: OVERRIDES[0].own,
  sourcePausedLabel: OVERRIDES[1].own,
  sourceOutOfDateLabel: OVERRIDES[2].own,
} satisfies Partial<SourceLineProps>

/** One 100-letter name, longer than a 320 px container's line, for the long-word check (CR-13). */
const LONG_NAME = 'trafikinformationsdatakildeopdateringsforbindelser'.repeat(2)

const SECONDARY = '--perron-color-text-secondary'

const meta = {
  title: 'Patterns/SourceLine',
  component: SourceLine,
  args: { sources: [REJSEPLANEN] },
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
} satisfies Meta<typeof SourceLine>

export default meta
type Story = StoryObj<typeof meta>

/** The line's root in `scope`, once it has rendered. */
const lineIn = (scope: HTMLElement) =>
  waitFor(() => {
    const found = scope.querySelector<HTMLElement>('.pn-SourceLine')
    expect(found).not.toBeNull()
    return found!
  })

/** A line's parts, each in order; `between` are the separators outside any source. */
const partsOf = (line: Element) => {
  const all = (part: string) => [...line.querySelectorAll<HTMLElement>(`.pn-SourceLine-${part}`)]
  return {
    paused: all('paused'),
    sources: all('source'),
    names: all('name'),
    separators: all('separator'),
    between: all('separator').filter((s) => !s.closest('.pn-SourceLine-source')),
    times: [...line.querySelectorAll<HTMLTimeElement>('time.pn-SourceLine-time')],
  }
}

/** A typography role's family, size, weight and line height, as the `font` shorthand sets them. */
function roleLonghands(role: string) {
  const probe = document.createElement('span')
  probe.style.font = `var(--perron-typography-${role})`
  document.body.append(probe)
  const style = getComputedStyle(probe)
  const found = [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight]
  probe.remove()
  return found
}

/** An element's family, size, weight and line height, to compare with `roleLonghands`. */
const longhandsOf = (element: Element) => {
  const style = getComputedStyle(element)
  return [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight]
}

/** How many line boxes the caller's time takes inside its `time` part: 1 when its digits hold. */
function timeBoxes(time: HTMLTimeElement) {
  const text = time.firstChild!
  const at = text.textContent!.indexOf(time.dateTime)
  const range = document.createRange()
  range.setStart(text, at)
  range.setEnd(text, at + time.dateTime.length)
  return new Set([...range.getClientRects()].map((box) => Math.round(box.top))).size
}

/**
 * The widths, from 240 to 480 px, at which a line in `box` starts a line with a "·": a "·" at a
 * line's start sits at the paragraph's start edge (CR-1). Leaves `box` at its own width.
 */
function separatorFirstAt(box: HTMLElement, line: HTMLElement) {
  const own = box.style.inlineSize
  const found: number[] = []
  for (let width = 240; width <= 480; width++) {
    box.style.inlineSize = `${width}px`
    const start = line.getBoundingClientRect().left
    if (partsOf(line).separators.some((s) => s.getBoundingClientRect().left <= start + 1))
      found.push(width)
  }
  box.style.inlineSize = own
  return found
}

/**
 * A line in a 320 px `box` wraps onto more than one line, keeps each time's digits together,
 * reaches nowhere past the box's edge, and at no width from 240 to 480 px starts a line with a "·"
 * (CR-1, CR-13).
 */
async function expectWrapsInside(box: HTMLElement, line: HTMLElement) {
  await expect(lines(line)).toBeGreaterThan(1)
  for (const time of partsOf(line).times) await expect(timeBoxes(time)).toBe(1)
  await expect(box.scrollWidth).toBe(box.clientWidth)
  await expect(line.scrollWidth).toBe(line.clientWidth)
  await expect(separatorFirstAt(box, line)).toEqual([])
}

/** One source, Rejseplanen at 08:14:05. The subject story: its args render the line alone. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const line = await lineIn(canvasElement)
    const parts = partsOf(line)
    await step('a paragraph: name, "·", then the time in its phrase (CR-1, CR-2)', async () => {
      await expect(line.tagName).toBe('P')
      await expect(line.className).toBe('pn-Text pn-SourceLine')
      await expect(within(canvasElement).getByRole('paragraph')).toBe(line)
      await expect(heard(line)).toBe('Rejseplanen · updated 08:14:05')
      await expect(parts.sources).toHaveLength(1)
      await expect([...line.children]).toEqual([
        ...line.querySelectorAll(':scope > .pn-SourceLine-source'),
      ])
      const [source] = parts.sources
      await expect([...source.children]).toEqual([
        parts.names[0],
        parts.separators[0],
        parts.times[0],
      ])
      await expect(parts.names[0]).toHaveTextContent(/^Rejseplanen$/)
      await expect(parts.separators[0]).toHaveTextContent(/^·$/)
      // a no-break space before the "·" and a space after it (CR-1)
      await expect(parts.separators[0].previousSibling?.textContent).toBe('\u00A0')
      await expect(parts.separators[0].nextSibling?.textContent).toBe(' ')
      // the "·" is read in place: nothing in the line is hidden from the ear
      await expect(line.querySelector('[aria-hidden]')).toBeNull()
    })
    await step(
      'the time: one phrase, in a <time> with the caller’s dateTime (CR-2, CR-3)',
      async () => {
        const [time] = parts.times
        await expect(time).toHaveAttribute('dateTime', '08:14:05')
        // the owned phrase filled by interpolate: one text run, no element between word and time
        await expect(time.childNodes).toHaveLength(1)
        await expect(time.firstChild?.nodeType).toBe(Node.TEXT_NODE)
        await expect(time).toHaveTextContent(/^updated 08:14:05$/)
      },
    )
    await step('caption in secondary ink, the time in its face and figures', async () => {
      const secondary = colour(SECONDARY)
      await expect(longhandsOf(line)).toEqual(roleLonghands('caption'))
      await expect(getComputedStyle(line).letterSpacing).toBe(
        resolve('letterSpacing', 'var(--perron-typography-caption-tracking)'),
      )
      await expect(getComputedStyle(line).color).toBe(secondary)
      await expect(getComputedStyle(line).margin).toBe('0px')
      await expect(getComputedStyle(line).overflowWrap).toBe('anywhere')
      for (const part of [...parts.names, ...parts.separators])
        await expect(getComputedStyle(part).color).toBe(secondary)
      const [time] = parts.times
      const style = getComputedStyle(time)
      await expect(roleLonghands('caption')[0]).toContain('Schibsted Grotesk')
      await expect(longhandsOf(time)).toEqual(roleLonghands('caption'))
      await expect(style.fontVariantNumeric).toBe('normal')
      await expect(style.color).toBe(secondary)
    })
    await step('no surface and no place of its own (CR-9)', async () => {
      const style = getComputedStyle(line)
      await expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
      await expect(style.borderStyle).toBe('none')
      await expect(style.boxShadow).toBe('none')
      await expect(style.position).toBe('static')
      await expect(style.zIndex).toBe('auto')
    })
    await step('not paused, nothing out of date (CR-5, CR-6)', async () => {
      await expect(line).not.toHaveAttribute('data-paused')
      await expect(parts.paused).toHaveLength(0)
      await expect(parts.sources[0]).not.toHaveAttribute('data-out-of-date')
    })
    await step('no live region (CR-12)', async () => {
      await expect(line).not.toHaveAttribute('aria-live')
      await expect(line).not.toHaveAttribute('role')
      await expect(line.querySelector('[aria-live], [role]')).toBeNull()
    })
    await step('it never counts up: the text holds still between updates (CR-3)', async () => {
      const before = line.textContent
      await frames(30)
      await expect(line.textContent).toBe(before)
    })
    await step('no tab stop: Tab passes the line by (CR-8)', async () => {
      await expect(line.querySelector('[tabindex], a, button, input')).toBeNull()
      await mounted(
        canvasElement,
        <>
          <button type="button">Before</button>
          <SourceLine sources={[REJSEPLANEN, STALE]} paused data-testid="between" />
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
    await step('className follows pn-Text pn-SourceLine on the root', async () => {
      await mounted(
        canvasElement,
        <SourceLine sources={[REJSEPLANEN]} className="caller" />,
        async (host) => {
          const own = await lineIn(host)
          await expect(own.className).toBe('pn-Text pn-SourceLine caller')
        },
      )
    })
    await step('ref, as an object and as a callback, and style reach the root', async () => {
      const held = createRef<HTMLParagraphElement>()
      let called: HTMLParagraphElement | null = null
      await mounted(
        canvasElement,
        <>
          <SourceLine
            sources={[REJSEPLANEN]}
            ref={held}
            style={{ opacity: 0.5 }}
            data-testid="object"
          />
          <SourceLine
            sources={[REJSEPLANEN]}
            ref={(element) => {
              called = element
            }}
            data-testid="callback"
          />
        </>,
        async (host) => {
          const object = await waitFor(() => within(host).getByTestId('object'))
          await expect(held.current).toBe(object)
          await expect(held.current).toHaveClass('pn-SourceLine')
          await expect(called).toBe(within(host).getByTestId('callback'))
          await expect(object.style.opacity).toBe('0.5')
          await expect(getComputedStyle(object).opacity).toBe('0.5')
        },
      )
    })
    await step('its own props never reach the DOM (CR-10)', async () => {
      await mounted(
        canvasElement,
        <SourceLine
          sources={[REJSEPLANEN, STALE]}
          paused
          className="caller"
          {...OWN_LABELS}
          sourceLabelOutOfDateLabel="{label}, could be old"
          slotProps={{
            paused: {},
            source: {},
            name: {},
            separator: {},
            time: {},
          }}
        />,
        async (host) => {
          const own = await lineIn(host)
          // Text's own data attributes and the paused state, and nothing else
          await expect(own.getAttributeNames().sort()).toEqual(
            ['class', 'data-color', 'data-emphasis', 'data-paused', 'data-variant'].sort(),
          )
          await expect(own.className).toBe('pn-Text pn-SourceLine caller')
          await expect(heard(own)).toBe(
            'On hold · Rejseplanen · as of 08:14:05 · Vehicle positions · as of 08:09:40, could be old',
          )
        },
      )
    })
    await step('each slotProps className joins after its part’s own (CR-11)', async () => {
      await mounted(
        canvasElement,
        <SourceLine
          sources={[REJSEPLANEN, STALE]}
          paused
          slotProps={{
            paused: { className: 'caller-paused' },
            source: { className: 'caller-source' },
            name: { className: 'caller-name' },
            separator: { className: 'caller-separator' },
            time: { className: 'caller-time' },
          }}
        />,
        async (host) => {
          const own = partsOf(await lineIn(host))
          await expect(own.separators).toHaveLength(4)
          const byPart = {
            paused: own.paused,
            source: own.sources,
            name: own.names,
            separator: own.separators,
            time: own.times,
          }
          for (const [part, copies] of Object.entries(byPart)) {
            await expect(copies.length).toBeGreaterThan(0)
            for (const copy of copies)
              await expect(copy.className).toBe(`pn-SourceLine-${part} caller-${part}`)
          }
        },
      )
    })
    await step('the pattern’s own props win over each slotProps value (CR-11)', async () => {
      await mounted(
        canvasElement,
        <SourceLine
          sources={[REJSEPLANEN, STALE]}
          paused
          slotProps={
            {
              paused: { children: 'Caller paused' },
              source: { 'data-out-of-date': 'caller', children: 'Caller source' },
              name: { children: 'Caller name' },
              separator: { children: 'Caller separator' },
              time: { dateTime: '23:59:59', children: 'Caller time' },
            } as SourceLineProps['slotProps']
          }
        />,
        async (host) => {
          const merged = await lineIn(host)
          const own = partsOf(merged)
          await expect(merged.textContent).not.toContain('Caller')
          await expect(heard(merged)).toBe(
            'Paused · Rejseplanen · updated 08:14:05 · Vehicle positions · updated 08:09:40, may be out of date',
          )
          await expect(own.sources[0].getAttribute('data-out-of-date')).toBeNull()
          await expect(own.sources[1].getAttribute('data-out-of-date')).toBe('')
          await expect(own.times.map((time) => time.getAttribute('dateTime'))).toEqual([
            '08:14:05',
            '08:09:40',
          ])
        },
      )
    })
  },
}

/** Two sources, each with its own name and its own phrase and time. */
export const TwoSources: Story = {
  args: { sources: [REJSEPLANEN, POSITIONS] },
  play: async ({ canvasElement }) => {
    const line = await lineIn(canvasElement)
    const parts = partsOf(line)
    await expect(heard(line)).toBe(
      'Rejseplanen · updated 08:14:05 · Vehicle positions · updated 08:13:58',
    )
    // CR-1: the caller's order, joined by one separator outside the sources
    await expect(parts.sources).toHaveLength(2)
    await expect(parts.sources.map((source) => heard(source))).toEqual([
      'Rejseplanen · updated 08:14:05',
      'Vehicle positions · updated 08:13:58',
    ])
    await expect(parts.between).toHaveLength(1)
    await expect(parts.between[0].previousElementSibling).toBe(parts.sources[0])
    await expect(parts.between[0].nextElementSibling).toBe(parts.sources[1])
    // CR-4: each source its own phrase and time, and no time for the line as a whole
    await expect(parts.times).toHaveLength(2)
    await expect(line.querySelectorAll('time')).toHaveLength(2)
    for (const [index, source] of parts.sources.entries()) {
      await expect(source.querySelector('.pn-SourceLine-name')).toBe(parts.names[index])
      await expect(source.querySelector('time')).toBe(parts.times[index])
    }
  },
}

/** `TwoSources`' sources, paused. */
export const Paused: Story = {
  args: { sources: [REJSEPLANEN, POSITIONS], paused: true },
  play: async ({ canvasElement }) => {
    const line = await lineIn(canvasElement)
    const parts = partsOf(line)
    // CR-5: the state on the root, and "Paused" first, then a separator
    await expect(line).toHaveAttribute('data-paused', '')
    await expect(heard(line)).toBe(
      'Paused · Rejseplanen · updated 08:14:05 · Vehicle positions · updated 08:13:58',
    )
    await expect(parts.paused).toHaveLength(1)
    await expect(line.firstElementChild).toBe(parts.paused[0])
    await expect(parts.paused[0].nextElementSibling).toBe(parts.between[0])
    await expect(parts.between).toHaveLength(2)
    await expect(getComputedStyle(parts.paused[0]).color).toBe(
      colour('--perron-color-text-primary'),
    )
    // each source keeps its own time while paused
    await expect(parts.times.map((time) => time.dateTime)).toEqual(['08:14:05', '08:13:58'])
    await expect(parts.times.map((time) => time.textContent)).toEqual([
      'updated 08:14:05',
      'updated 08:13:58',
    ])
  },
}

/** A fresh source and a stale one under it, the second marked by the app as out of date. */
export const OutOfDate: Story = {
  args: { sources: [REJSEPLANEN, STALE] },
  play: async ({ canvasElement }) => {
    const line = await lineIn(canvasElement)
    const parts = partsOf(line)
    // CR-6: only the stale source carries the state, and its phrase says it, in warning ink
    await expect(parts.sources[0]).not.toHaveAttribute('data-out-of-date')
    await expect(parts.times[0]).toHaveTextContent(/^updated 08:14:05$/)
    await expect(getComputedStyle(parts.times[0]).color).toBe(colour(SECONDARY))
    await expect(parts.sources[1]).toHaveAttribute('data-out-of-date', '')
    await expect(heard(parts.sources[1])).toBe(
      'Vehicle positions · updated 08:09:40, may be out of date',
    )
    await expect(parts.times[1].childNodes).toHaveLength(1)
    await expect(parts.times[1]).toHaveTextContent(/^updated 08:09:40, may be out of date$/)
    await expect(parts.times[1]).toHaveAttribute('dateTime', '08:09:40')
    await expect(getComputedStyle(parts.times[1]).color).toBe(colour('--perron-color-text-warning'))
    await expect(line).not.toHaveAttribute('data-paused')
    // CR-3, CR-6: outOfDate false shows none of it, and an HH:MM time is shown as it is given
    await mounted(
      canvasElement,
      <SourceLine sources={[{ name: 'Rejseplanen', time: '08:14', outOfDate: false }]} />,
      async (host) => {
        const own = partsOf(await lineIn(host))
        await expect(own.sources[0]).not.toHaveAttribute('data-out-of-date')
        await expect(own.times[0]).toHaveAttribute('dateTime', '08:14')
        await expect(own.times[0]).toHaveTextContent(/^updated 08:14$/)
        await expect(heard(own.sources[0])).toBe('Rejseplanen · updated 08:14')
      },
    )
    // the paused word and out-of-date phrase, beyond the subject story's: in every locale, only the
    // dictionary's, each phrase filled with its time
    for (const locale of Object.keys(dictionaries) as Locale[])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <SourceLine sources={[REJSEPLANEN, STALE]} paused />
          </PerronProvider>,
        ),
        locale,
        [REJSEPLANEN.name, STALE.name],
      )
  },
}

/** A stack of lines, one for each of `mylder`, each with `args` laid under its own sources. */
const linesOf = (mylder: readonly MylderLine[], args: Partial<SourceLineProps>) => (
  <div style={{ display: 'grid', gap: 'var(--perron-space-200)' }}>
    {mylder.map(({ screen, sources }) => (
      <SourceLine key={screen} {...args} sources={sources} data-testid={screen} />
    ))}
  </div>
)

/** Each line of `mylder` in `scope`, by its screen, once it has rendered. */
const linesIn = (scope: HTMLElement, mylder: readonly MylderLine[]) =>
  Promise.all(mylder.map(({ screen }) => waitFor(() => within(scope).getByTestId(screen))))

/**
 * Mylder's source lines, each source in the app's own words of what its time is of: the vehicle
 * detail's two, the stop departures' two, the city pulse's and the vehicles list's.
 */
export const SourceLabels: Story = {
  args: { sources: MYLDER_LINES[0].sources },
  render: ({ sources: _first, ...args }) => linesOf(MYLDER_LINES, args),
  play: async ({ canvasElement, step }) => {
    const found = await linesIn(canvasElement, MYLDER_LINES)
    const [detail, detailTimetable, departures, timetable, pulse] = found.map(partsOf)
    await step('each line reads as its screen words it (CR-15)', async () => {
      await expect(found.map(heard)).toEqual(MYLDER_LINES.map((line) => line.heard))
    })
    await step('a source with no name shows its phrase alone, after a "·" (CR-2)', async () => {
      await expect(detail.names.map((name) => name.textContent)).toEqual(['Rejseplanen'])
      await expect([...detail.sources[1].children]).toEqual([detail.times[1]])
      await expect(detail.between).toHaveLength(1)
      await expect(detail.separators).toHaveLength(2)
      // the line's own phrase, filled by interpolate: one text run
      for (const time of detail.times) await expect(time.childNodes).toHaveLength(1)
      await expect(detail.times.map((time) => time.dateTime)).toEqual(['08:14:05', '08:14:20'])
      // a line of one source with no name has no "·" at all
      await expect(timetable.names).toHaveLength(0)
      await expect(timetable.separators).toHaveLength(0)
      await expect(heard(timetable.sources[0])).toBe('Timetable and positions 08:14:05')
      await expect(timetable.times[0]).toHaveAttribute('dateTime', '08:14:05')
      await expect(heard(departures.sources[0])).toBe('Rejseplanen · departures 08:14:20')
    })
    await step('a fact with no time is a <time> with no dateTime (CR-3)', async () => {
      const [, plain] = detailTimetable.times
      await expect(plain).toHaveTextContent(/^times from the timetable$/)
      await expect(plain).not.toHaveAttribute('dateTime')
    })
    await step('a date takes its dateTime from the caller (CR-3)', async () => {
      const [, date] = pulse.times
      await expect(date).toHaveTextContent(/^timetable of 12 October$/)
      await expect(date).toHaveAttribute('dateTime', '2026-10-12')
    })
    await step('nothing is out of date, and the ink is the line\u2019s (CR-6)', async () => {
      for (const line of found) {
        await expect(line.querySelector('[data-out-of-date]')).toBeNull()
        for (const time of partsOf(line).times)
          await expect(getComputedStyle(time).color).toBe(colour(SECONDARY))
      }
    })
    await step('a phrase with {time} and no time fills it with "—"', async () => {
      await mounted(
        canvasElement,
        <SourceLine sources={[{ name: 'Rejseplanen', label: 'departures {time}' }]} />,
        async (host) => {
          const own = await lineIn(host)
          await expect(heard(own)).toBe('Rejseplanen · departures —')
          await expect(partsOf(own).times[0]).not.toHaveAttribute('dateTime')
        },
      )
    })
    await step('a source with neither name nor label keeps the owned phrase', async () => {
      await mounted(
        canvasElement,
        <SourceLine sources={[{ time: '08:14:05' }]} />,
        async (host) => {
          const own = await lineIn(host)
          await expect(heard(own)).toBe('updated 08:14:05')
          await expect(partsOf(own).separators).toHaveLength(0)
        },
      )
    })
    await step(
      'only the caller\u2019s words and the dictionary\u2019s, paused, in every locale',
      async () => {
        for (const locale of Object.keys(dictionaries) as Locale[])
          expectOwnedStrings(
            renderToStaticMarkup(
              <PerronProvider locale={locale}>
                {linesOf(MYLDER_LINES, { paused: true })}
              </PerronProvider>,
            ),
            locale,
            MYLDER_LINES.flatMap((line) => callerWords(line.sources)),
          )
      },
    )
  },
}

/**
 * `SourceLabels`' lines, each with one source whose answer is older than its refresh, as the app
 * judges it: its own words, then "may be out of date".
 */
export const SourceLabelsOutOfDate: Story = {
  args: { sources: MYLDER_LINES_OUT_OF_DATE[0].sources },
  render: ({ sources: _first, ...args }) => linesOf(MYLDER_LINES_OUT_OF_DATE, args),
  play: async ({ canvasElement, step }) => {
    const found = await linesIn(canvasElement, MYLDER_LINES_OUT_OF_DATE)
    await step(
      'each line adds "may be out of date" after the stale source\u2019s words',
      async () => {
        await expect(found.map(heard)).toEqual(MYLDER_LINES_OUT_OF_DATE.map((line) => line.heard))
      },
    )
    await step(
      'only the stale source carries the state, in warning ink (CR-6, CR-15)',
      async () => {
        for (const [index, line] of found.entries()) {
          const { sources, times } = partsOf(line)
          for (const [at, source] of MYLDER_LINES_OUT_OF_DATE[index].sources.entries()) {
            const old = source.outOfDate === true
            await expect(sources[at].hasAttribute('data-out-of-date')).toBe(old)
            await expect(getComputedStyle(times[at]).color).toBe(
              colour(old ? '--perron-color-text-warning' : SECONDARY),
            )
            // the caller's words and the owned words after them, filled by interpolate: one text run
            await expect(times[at].childNodes).toHaveLength(1)
          }
        }
      },
    )
    await step('in every locale, the dictionary\u2019s words after the caller\u2019s', async () => {
      for (const locale of Object.keys(dictionaries) as Locale[]) {
        const markup = renderToStaticMarkup(
          <PerronProvider locale={locale}>{linesOf(MYLDER_LINES_OUT_OF_DATE, {})}</PerronProvider>,
        )
        expectOwnedStrings(
          markup,
          locale,
          MYLDER_LINES_OUT_OF_DATE.flatMap((line) => callerWords(line.sources)),
        )
        await expect(markup).toContain(
          dictionaries[locale].sourceLabelOutOfDate.replace('{label}', 'departures 08:14:20'),
        )
      }
    })
  },
}

/** `OutOfDate`'s sources, paused, in Swedish, in a 320 px container. */
export const Narrow: Story = {
  args: { sources: [REJSEPLANEN, STALE], paused: true },
  render: (args) => (
    <PerronProvider locale="sv">
      <div data-testid="narrow" style={{ inlineSize: 320 }}>
        <SourceLine {...args} />
      </div>
    </PerronProvider>
  ),
  play: async ({ canvasElement }) => {
    const container = within(canvasElement).getByTestId('narrow')
    await expect(container.getBoundingClientRect().width).toBe(320)
    const line = await lineIn(container)
    const parts = partsOf(line)
    await expect(heard(line)).toBe(
      'Pausad · Rejseplanen · uppdaterad 08:14:05 · Vehicle positions · uppdaterad 08:09:40, kan vara inaktuell',
    )
    await expect(parts.separators).toHaveLength(4)
    // CR-13: the line wraps, no time's digits break, nothing past the edge, and at no width does a
    // line start with "·" (CR-1)
    await expectWrapsInside(container, line)
    // the same in the other three locales, each in its own 320 px container
    for (const locale of ['en', 'da', 'nb'] as const)
      await mounted(
        canvasElement,
        <PerronProvider locale={locale}>
          <div data-testid={`narrow-${locale}`} style={{ inlineSize: 320 }}>
            <SourceLine sources={[REJSEPLANEN, STALE]} paused />
          </div>
        </PerronProvider>,
        async (host) => {
          const box = await waitFor(() => within(host).getByTestId(`narrow-${locale}`))
          const own = await lineIn(box)
          await expect(heard(own)).toContain(
            dictionaries[locale].sourceOutOfDate.replace('{time}', STALE.time),
          )
          await expectWrapsInside(box, own)
        },
      )
    // a line in the app's own words, a stale source among them, wraps as the owned one does
    await mounted(
      canvasElement,
      <PerronProvider locale="sv">
        <div data-testid="narrow-labels" style={{ inlineSize: 320 }}>
          <SourceLine sources={[POSITION, stale(TIMES)]} paused />
        </div>
      </PerronProvider>,
      async (host) => {
        const box = await waitFor(() => within(host).getByTestId('narrow-labels'))
        const own = await lineIn(box)
        await expect(heard(own)).toBe(
          'Pausad · Rejseplanen · position 08:14:05 · times 08:14:20, kan vara inaktuell',
        )
        await expectWrapsInside(box, own)
      },
    )
    // a name longer than the container's line breaks inside itself
    await mounted(
      canvasElement,
      <div data-testid="long" style={{ inlineSize: 320 }}>
        <SourceLine sources={[{ name: LONG_NAME, time: '08:14:05' }]} />
      </div>,
      async (host) => {
        const box = await waitFor(() => within(host).getByTestId('long'))
        const long = await lineIn(box)
        const [name] = partsOf(long).names
        await expect(heard(name)).toBe(LONG_NAME)
        // an inline name broken over lines has a box per line
        await expect(name.getClientRects().length).toBeGreaterThan(1)
        const edge = box.getBoundingClientRect()
        await expect(name.getBoundingClientRect().right).toBeLessThanOrEqual(edge.right + 0.5)
        await expect(box.scrollWidth).toBe(box.clientWidth)
        await expect(long.scrollWidth).toBe(long.clientWidth)
      },
    )
  },
}

/** `Narrow`'s sources in English, paused, with each of the line's owned strings overridden. */
export const Labels: Story = {
  args: { sources: [REJSEPLANEN, STALE], paused: true, ...OWN_LABELS },
  play: async ({ canvasElement, step }) => {
    const line = await lineIn(canvasElement)
    await step('each phrase and word is the caller’s, its time filled in (CR-7)', async () => {
      await expect(heard(line)).toBe(
        'On hold · Rejseplanen · as of 08:14:05 · Vehicle positions · as of 08:09:40, could be old',
      )
      for (const word of ['updated', 'Paused', 'may be out of date'])
        await expect(line.textContent).not.toContain(word)
    })
    for (const { prop, own, alone } of OVERRIDES)
      await step(`${prop} replaces only its own string`, async () => {
        await mounted(
          canvasElement,
          <SourceLine sources={[REJSEPLANEN, STALE]} paused {...{ [prop]: own }} />,
          async (host) => {
            await expect(heard(await lineIn(host))).toBe(alone)
          },
        )
      })
    await step('sourceLabelOutOfDateLabel replaces only its own string (CR-15)', async () => {
      await mounted(
        canvasElement,
        <SourceLine
          sources={[REJSEPLANEN, stale(TIMES)]}
          sourceLabelOutOfDateLabel="{label}, could be old"
        />,
        async (host) => {
          await expect(heard(await lineIn(host))).toBe(
            'Rejseplanen · updated 08:14:05 · times 08:14:20, could be old',
          )
        },
      )
    })
    await step('a source\u2019s own label wins over sourceUpdatedLabel (CR-15)', async () => {
      await mounted(
        canvasElement,
        <SourceLine sources={[POSITION, STALE]} {...OWN_LABELS} />,
        async (host) => {
          await expect(heard(await lineIn(host))).toBe(
            'Rejseplanen · position 08:14:05 · Vehicle positions · as of 08:09:40, could be old',
          )
        },
      )
    })
  },
}
