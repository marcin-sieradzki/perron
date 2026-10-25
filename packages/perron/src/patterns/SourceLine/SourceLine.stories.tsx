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
const REJSEPLANEN: SourceLineSource = { name: 'Rejseplanen', time: '08:14:05' }

/** A second source, fresh, a few seconds older than the first. */
const POSITIONS: SourceLineSource = { name: 'Vehicle positions', time: '08:13:58' }

/** The second source gone stale under a fresh first one: the case the line exists for. */
const STALE: SourceLineSource = { name: 'Vehicle positions', time: '08:09:40', outOfDate: true }

/** Each of the line's words overridden, with the prop that overrides it and the locale's word. */
const WORDS = [
  { prop: 'updatedLabel', word: 'updated', own: 'as of' },
  { prop: 'pausedLabel', word: 'Paused', own: 'On hold' },
  { prop: 'mayBeOutOfDateLabel', word: 'may be out of date', own: 'could be old' },
] as const satisfies readonly { prop: keyof SourceLineProps; word: string; own: string }[]

/** Every word override at once, from `WORDS`. */
const OWN_LABELS = {
  updatedLabel: WORDS[0].own,
  pausedLabel: WORDS[1].own,
  mayBeOutOfDateLabel: WORDS[2].own,
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
    updated: all('updated'),
    times: [...line.querySelectorAll<HTMLTimeElement>('time.pn-SourceLine-time')],
    outOfDate: all('outOfDate'),
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

/** One source, Rejseplanen at 08:14:05. The subject story: its args render the line alone. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const line = await lineIn(canvasElement)
    const parts = partsOf(line)
    await step('a paragraph: name, "·", "updated", then the time (CR-1, CR-2)', async () => {
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
        parts.updated[0],
        parts.times[0],
      ])
      await expect(parts.names[0]).toHaveTextContent(/^Rejseplanen$/)
      await expect(parts.separators[0]).toHaveTextContent(/^·$/)
      await expect(parts.updated[0]).toHaveTextContent(/^updated$/)
      // the "·" is read in place: nothing in the line is hidden from the ear
      await expect(line.querySelector('[aria-hidden]')).toBeNull()
    })
    await step('the time: the caller’s string, in a <time> with that dateTime (CR-3)', async () => {
      const [time] = parts.times
      await expect(time).toHaveAttribute('dateTime', '08:14:05')
      await expect(time).toHaveTextContent(/^08:14:05$/)
    })
    await step('caption in secondary ink; the time in the data role, tabular', async () => {
      const secondary = colour(SECONDARY)
      await expect(longhandsOf(line)).toEqual(roleLonghands('caption'))
      await expect(getComputedStyle(line).letterSpacing).toBe(
        resolve('letterSpacing', 'var(--perron-typography-caption-tracking)'),
      )
      await expect(getComputedStyle(line).color).toBe(secondary)
      await expect(getComputedStyle(line).margin).toBe('0px')
      await expect(getComputedStyle(line).overflowWrap).toBe('anywhere')
      for (const part of [...parts.names, ...parts.separators, ...parts.updated])
        await expect(getComputedStyle(part).color).toBe(secondary)
      const [time] = parts.times
      const style = getComputedStyle(time)
      await expect(roleLonghands('data')[0]).toContain('JetBrains Mono')
      await expect(longhandsOf(time)).toEqual(roleLonghands('data'))
      await expect(style.letterSpacing).toBe(
        resolve('letterSpacing', 'var(--perron-typography-data-tracking)'),
      )
      await expect(style.fontVariantNumeric).toBe('tabular-nums')
      await expect(style.whiteSpace).toBe('nowrap')
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
      await expect(parts.outOfDate).toHaveLength(0)
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
          slotProps={{
            paused: {},
            source: {},
            name: {},
            separator: {},
            updated: {},
            time: {},
            outOfDate: {},
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
            updated: { className: 'caller-updated' },
            time: { className: 'caller-time' },
            outOfDate: { className: 'caller-outOfDate' },
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
            updated: own.updated,
            time: own.times,
            outOfDate: own.outOfDate,
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
              updated: { children: 'Caller updated' },
              time: { dateTime: '23:59:59', children: 'Caller time' },
              outOfDate: { children: 'Caller out of date' },
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

/** Two sources, each with its own name, "updated" and time. */
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
    // CR-4: each source its own word and time, and no time for the line as a whole
    await expect(parts.updated).toHaveLength(2)
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
    await expect(parts.times.map((time) => time.textContent)).toEqual(['08:14:05', '08:13:58'])
  },
}

/** A fresh source and a stale one under it, the second marked by the app as out of date. */
export const OutOfDate: Story = {
  args: { sources: [REJSEPLANEN, STALE] },
  play: async ({ canvasElement }) => {
    const line = await lineIn(canvasElement)
    const parts = partsOf(line)
    // CR-6: only the stale source carries the state and the words, after its own time
    await expect(parts.sources[0]).not.toHaveAttribute('data-out-of-date')
    await expect(parts.sources[0].querySelector('.pn-SourceLine-outOfDate')).toBeNull()
    await expect(parts.sources[1]).toHaveAttribute('data-out-of-date', '')
    await expect(heard(parts.sources[1])).toBe(
      'Vehicle positions · updated 08:09:40, may be out of date',
    )
    await expect(parts.outOfDate).toHaveLength(1)
    await expect(parts.outOfDate[0].previousElementSibling).toBe(parts.times[1])
    await expect(parts.sources[1].lastElementChild).toBe(parts.outOfDate[0])
    await expect(getComputedStyle(parts.outOfDate[0]).color).toBe(
      colour('--perron-color-text-warning'),
    )
    await expect(line).not.toHaveAttribute('data-paused')
    // the paused and out-of-date words, beyond the subject story's: in every locale, the dictionary's
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
    // CR-13: the line wraps, each time on one line, and nothing past the container's edge
    await expect(lines(line)).toBeGreaterThan(1)
    for (const time of parts.times) await expect(lines(time)).toBeLessThan(1.5)
    await expect(container.scrollWidth).toBe(container.clientWidth)
    await expect(line.scrollWidth).toBe(line.clientWidth)
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

/** `Narrow`'s sources in English, paused, with each of the line's words overridden. */
export const Labels: Story = {
  args: { sources: [REJSEPLANEN, STALE], paused: true, ...OWN_LABELS },
  play: async ({ canvasElement, step }) => {
    const line = await lineIn(canvasElement)
    await step('each word is the caller’s, in every copy (CR-7)', async () => {
      await expect(heard(line)).toBe(
        'On hold · Rejseplanen · as of 08:14:05 · Vehicle positions · as of 08:09:40, could be old',
      )
      for (const { word } of WORDS) await expect(line.textContent).not.toContain(word)
    })
    for (const [index, { prop, word, own }] of WORDS.entries())
      await step(`${prop} replaces only “${word}”`, async () => {
        await mounted(
          canvasElement,
          <SourceLine sources={[REJSEPLANEN, STALE]} paused {...{ [prop]: own }} />,
          async (host) => {
            const text = heard(await lineIn(host))
            await expect(text).toContain(own)
            await expect(text).not.toContain(word)
            for (const other of WORDS.filter((_, at) => at !== index))
              await expect(text).toContain(other.word)
          },
        )
      })
  },
}
