// DataStateKey's stories: one per row of the spec's Stories table (docs/patterns/data-state-key.md),
// with the design deferred, each with a play test that reads the accessibility tree and the drawing.
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, isInaccessible, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  STATE_LABELS,
  STATE_WORDS,
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
import { STATE_KEY, VEHICLE_STATES } from '../../internal/vehicle-states.ts'
import { DataStateKey } from './DataStateKey.tsx'
import type { DataStateKeyCounts, DataStateKeyProps } from './DataStateKey.tsx'

/** Mylder's thresholds: live under 150 s, 2.5 times its feed's minute, and no signal past 5 min. */
const MYLDER = { liveThreshold: 150_000, ageingThreshold: 300_000 }

/** The feed defaults the `vehicle-dot.live-threshold` and `vehicle-dot.ageing-threshold` tokens give. */
const DEFAULTS = { liveThreshold: 60_000, ageingThreshold: 300_000 }

/** A morning's counts, in the order of Data states: one past a thousand, and no signal at 0, a count. */
const COUNTS: DataStateKeyCounts = Object.fromEntries(
  VEHICLE_STATES.map((state, index) => [STATE_KEY[state], [1046, 38, 61, 9, 0][index]]),
)

/** Live known; ageing `null`, estimated left out, timetable only `NaN`, no signal `Infinity`. */
const UNKNOWN_COUNTS: DataStateKeyCounts = {
  live: 1046,
  ageing: null,
  timetableOnly: Number.NaN,
  noSignal: Number.POSITIVE_INFINITY,
}

/** The five sentences in English at Mylder's thresholds, in the order of Data states. */
const MYLDER_SENTENCES = [
  'Reported by the vehicle in the last 2.5 min',
  'Last reported 2.5 min to 5 min ago',
  'Placed from the timetable and the latest delay',
  'No real-time data, placed from the timetable alone',
  'No report for over 5 min, moved on by the timetable',
]

/** Each sentence's override prop, in the order of Data states, with a caller's own wording. */
const OWN_SENTENCES = [
  { prop: 'liveDescriptionLabel', own: 'Heard from within {liveThreshold}' },
  { prop: 'ageingDescriptionLabel', own: 'Quiet from {liveThreshold} up to {ageingThreshold}' },
  { prop: 'estimatedDescriptionLabel', own: 'Worked out from its delay' },
  { prop: 'timetableOnlyDescriptionLabel', own: 'Drawn from the schedule' },
  { prop: 'noSignalDescriptionLabel', own: 'Silent beyond {ageingThreshold}' },
] as const satisfies readonly { prop: keyof DataStateKeyProps; own: string }[]

/** A caller's word for each state, in the order of Data states, for the `Labels` story. */
const OWN_WORDS = ['Fresh', 'Fading', 'Guessed', 'Planned', 'Lost']

/** Every override at once: the words, the sentences, the durations and "Unknown". */
const OWN_LABELS = {
  ...Object.fromEntries(
    STATE_WORDS.map(({ variant }, index) => [STATE_LABELS[variant], OWN_WORDS[index]]),
  ),
  ...Object.fromEntries(OWN_SENTENCES.map(({ prop, own }) => [prop, own])),
  secondsDurationLabel: '{count} sec',
  minutesDurationLabel: '{count} minutes',
  unknownLabel: 'No data yet',
} as Partial<DataStateKeyProps>

/** The sentences `OWN_LABELS` gives at Mylder's thresholds. */
const OWN_FILLED = [
  'Heard from within 2.5 minutes',
  'Quiet from 2.5 minutes up to 5 minutes',
  'Worked out from its delay',
  'Drawn from the schedule',
  'Silent beyond 5 minutes',
]

/** One 61-letter Swedish compound, longer than a 320 px container's line, for the long-word check (CR-10). */
const LONG_WORD = 'tidtabellsuppgiftsregionaltågsförbindelseändringsmeddelandena'

const INK = '--perron-color-text-primary'
const NO_SIGNAL = '--perron-color-data-state-no-signal'

const meta = {
  title: 'Patterns/DataStateKey',
  component: DataStateKey,
  args: { counts: COUNTS, ...MYLDER },
  decorators: [
    (Story) => (
      <div
        style={{
          maxInlineSize: 400,
          padding: 'var(--perron-space-300)',
          background: 'var(--perron-color-surface-default)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataStateKey>

export default meta
type Story = StoryObj<typeof meta>

/** The key's root in `scope`, once it has rendered. */
const keyIn = (scope: HTMLElement) =>
  waitFor(() => {
    const found = scope.querySelector<HTMLElement>('.pn-DataStateKey')
    expect(found).not.toBeNull()
    return found!
  })

/** A key's items, labels, dots, counts and sentences, each in order. */
const partsOf = (key: Element) => ({
  items: [...key.querySelectorAll<HTMLElement>(':scope > .pn-DataStateKey-item')],
  labels: [...key.querySelectorAll<HTMLElement>('.pn-DataStateKey-label')],
  dots: [...key.querySelectorAll<HTMLElement>('.pn-DataStateKey-label .pn-VehicleDot')],
  counts: [...key.querySelectorAll<HTMLElement>('.pn-DataStateKey-count')],
  descriptions: [...key.querySelectorAll<HTMLElement>('.pn-DataStateKey-description')],
})

/** What the ear hears of each item: its word, its count or "Unknown", then its sentence. */
const heardItems = (key: HTMLElement) => partsOf(key).items.map(heard)

/** What the ear hears of each sentence. */
const heardSentences = (key: Element) => partsOf(key).descriptions.map(heard)

/** Mylder's thresholds and a morning's counts. The subject story: its args render the key alone. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const list = within(canvasElement).getByRole('list')
    const { items, labels, dots, counts, descriptions } = partsOf(list)
    await step('a list of five items, heard in the order of Data states (CR-1, CR-2)', async () => {
      await expect(list.tagName).toBe('UL')
      await expect(list.className).toBe('pn-DataStateKey')
      await expect(within(list).getAllByRole('listitem')).toEqual(items)
      await expect(list.children).toHaveLength(STATE_WORDS.length)
      await expect(heardItems(list)).toEqual([
        'Live 1 046 Reported by the vehicle in the last 2.5 min',
        'Ageing 38 Last reported 2.5 min to 5 min ago',
        'Estimated 61 Placed from the timetable and the latest delay',
        'Timetable only 9 No real-time data, placed from the timetable alone',
        'No signal 0 No report for over 5 min, moved on by the timetable',
      ])
      for (const [index, item] of items.entries()) {
        await expect(item.tagName).toBe('LI')
        await expect(item).toHaveAttribute('data-variant', STATE_WORDS[index].variant)
        // the label, the count, then the sentence
        await expect([...item.children]).toEqual([
          labels[index],
          counts[index],
          descriptions[index],
        ])
      }
    })
    await step('counts grouped by a no-break space; 0 is a count (CR-4, CR-5)', async () => {
      await expect(counts.map((count) => count.textContent)).toEqual([
        '1 046',
        '38',
        '61',
        '9',
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
          const { variant, word } = STATE_WORDS[index]
          await expect(label.className).toBe('pn-VehicleDotLabel pn-DataStateKey-label')
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
    await step('each count: typography.data in the ink, tabular, at the inline end', async () => {
      // tabular-nums leaves the computed font shorthand empty, so the role is read in its longhands
      const probe = document.createElement('span')
      probe.style.font = 'var(--perron-typography-data)'
      document.body.append(probe)
      const role = getComputedStyle(probe)
      const font = [role.fontFamily, role.fontSize, role.fontWeight, role.lineHeight]
      probe.remove()
      const tracking = resolve('letterSpacing', 'var(--perron-typography-data-tracking)')
      await expect(font[0]).toContain('JetBrains Mono')
      for (const [index, count] of counts.entries()) {
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
        // the five counts end at their items' inline end, so they line up in a column
        const end = items[index].getBoundingClientRect().right
        await expect(Math.abs(count.getBoundingClientRect().right - end)).toBeLessThan(0.5)
      }
    })
    await step(
      'each sentence: a Text caption in color.text.secondary, under the word',
      async () => {
        // the caption role, read in its longhands from a probe
        const probe = document.createElement('span')
        probe.style.font = 'var(--perron-typography-caption)'
        document.body.append(probe)
        const role = getComputedStyle(probe)
        const caption = [role.fontFamily, role.fontSize, role.fontWeight, role.lineHeight]
        probe.remove()
        for (const [index, description] of descriptions.entries()) {
          await expect(description.tagName).toBe('SPAN')
          await expect(description).toHaveClass('pn-Text', 'pn-DataStateKey-description')
          await expect(description).toHaveAttribute('data-variant', 'caption')
          await expect(description).toHaveAttribute('data-emphasis', 'secondary')
          const style = getComputedStyle(description)
          await expect(style.color).toBe(colour('--perron-color-text-secondary'))
          await expect([
            style.fontFamily,
            style.fontSize,
            style.fontWeight,
            style.lineHeight,
          ]).toEqual(caption)
          await expect(heard(description)).toBe(MYLDER_SENTENCES[index])
          // a line below its label, starting where the label's word starts
          const label = labels[index]
          const word = label.querySelector('.pn-VehicleDotLabel-label')!.getBoundingClientRect()
          const box = description.getBoundingClientRect()
          const text = document.createRange()
          text.selectNodeContents(description)
          await expect(box.top).toBeGreaterThanOrEqual(label.getBoundingClientRect().bottom - 0.5)
          await expect(Math.abs(text.getBoundingClientRect().left - word.left)).toBeLessThan(0.5)
        }
      },
    )
    await step('the gaps, and no surface, bullets or place of its own (CR-9)', async () => {
      const style = getComputedStyle(list)
      await expect(style.display).toBe('flex')
      await expect(style.flexDirection).toBe('column')
      await expect(style.rowGap).toBe(rendered('space-300', 'row-gap'))
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
        await expect(own.display).toBe('grid')
        await expect(own.alignItems).toBe('baseline')
        await expect(own.columnGap).toBe(rendered('space-200', 'column-gap'))
        await expect(own.rowGap).toBe(rendered('space-050', 'row-gap'))
        await expect(own.margin).toBe('0px')
      }
    })
    await step('no tab stop: Tab passes the key by (CR-12)', async () => {
      await expect(list.querySelector('[tabindex], a, button, input')).toBeNull()
      await mounted(
        canvasElement,
        <>
          <button type="button">Before</button>
          <DataStateKey counts={COUNTS} {...MYLDER} data-testid="between" />
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
    await step('no name of its own and no live region; aria-label names it (CR-13)', async () => {
      await expect(list).not.toHaveAccessibleName()
      await expect(list.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull()
      await expect(list).not.toHaveAttribute('aria-live')
      await mounted(
        canvasElement,
        <>
          <DataStateKey counts={COUNTS} {...MYLDER} aria-label="Vehicles by state" />
          <p id="key-title" style={typography('label')}>
            How sure are we?
          </p>
          <DataStateKey counts={COUNTS} {...MYLDER} aria-labelledby="key-title" />
        </>,
        async (host) => {
          await waitFor(() => within(host).getByRole('list', { name: 'Vehicles by state' }))
          await expect(
            within(host).getByRole('list', { name: 'How sure are we?' }),
          ).toBeInTheDocument()
        },
      )
    })
    await step('className follows pn-DataStateKey on the root', async () => {
      await mounted(
        canvasElement,
        <DataStateKey counts={COUNTS} {...MYLDER} className="caller" />,
        async (host) => {
          const own = await keyIn(host)
          await expect(own.className).toBe('pn-DataStateKey caller')
        },
      )
    })
    await step('ref, as an object and as a callback, and style reach the root', async () => {
      const held = createRef<HTMLUListElement>()
      let called: HTMLUListElement | null = null
      await mounted(
        canvasElement,
        <>
          <DataStateKey
            counts={COUNTS}
            {...MYLDER}
            ref={held}
            style={{ opacity: 0.5 }}
            data-testid="object"
          />
          <DataStateKey
            counts={COUNTS}
            {...MYLDER}
            ref={(element) => {
              called = element
            }}
            data-testid="callback"
          />
        </>,
        async (host) => {
          const object = await waitFor(() => within(host).getByTestId('object'))
          await expect(held.current).toBe(object)
          await expect(held.current).toHaveClass('pn-DataStateKey')
          await expect(called).toBe(within(host).getByTestId('callback'))
          await expect(object.style.opacity).toBe('0.5')
          await expect(getComputedStyle(object).opacity).toBe('0.5')
        },
      )
    })
    await step('its own props never reach the DOM (CR-11)', async () => {
      await mounted(
        canvasElement,
        <DataStateKey
          counts={UNKNOWN_COUNTS}
          {...MYLDER}
          className="caller"
          {...OWN_LABELS}
          slotProps={{ item: {}, label: {}, count: {}, description: {} }}
        />,
        async (host) => {
          const own = await keyIn(host)
          await expect(own.getAttributeNames()).toEqual(['class'])
          await expect(own.className).toBe('pn-DataStateKey caller')
          await expect(heardItems(own)[1]).toBe(`${OWN_WORDS[1]} No data yet ${OWN_FILLED[1]}`)
        },
      )
    })
    await step(
      'each slotProps className joins after its part’s own, on all five (CR-14)',
      async () => {
        await mounted(
          canvasElement,
          <DataStateKey
            counts={COUNTS}
            {...MYLDER}
            slotProps={{
              item: { className: 'caller-item' },
              label: { className: 'caller-label' },
              count: { className: 'caller-count' },
              description: { className: 'caller-description' },
            }}
          />,
          async (host) => {
            const own = partsOf(await keyIn(host))
            for (const [index, { variant }] of STATE_WORDS.entries()) {
              await expect(own.items[index].className).toBe('pn-DataStateKey-item caller-item')
              await expect(own.items[index]).toHaveAttribute('data-variant', variant)
              await expect(own.labels[index].className).toBe(
                'pn-VehicleDotLabel pn-DataStateKey-label caller-label',
              )
              await expect(own.labels[index]).toHaveAttribute('data-variant', variant)
              await expect(own.counts[index].className).toBe('pn-DataStateKey-count caller-count')
              await expect(own.descriptions[index].className).toBe(
                'pn-Text pn-DataStateKey-description caller-description',
              )
            }
          },
        )
      },
    )
    await step(
      'the pattern’s own props win over each slotProps value, on all five (CR-14)',
      async () => {
        // the props the pattern sets are left out of the slots' types; a caller's untyped ones still lose
        await mounted(
          canvasElement,
          <DataStateKey
            counts={UNKNOWN_COUNTS}
            {...MYLDER}
            slotProps={
              {
                item: {
                  'data-variant': 'caller',
                  'data-unknown': 'caller',
                  children: 'Caller item',
                },
                label: { variant: 'live', line: 'm1' },
                count: { 'data-unknown': 'caller', children: 'Caller count' },
                description: {
                  variant: 'heading-lg',
                  color: 'danger',
                  emphasis: 'tertiary',
                  children: 'Caller sentence',
                },
              } as DataStateKeyProps['slotProps']
            }
          />,
          async (host) => {
            const key = await keyIn(host)
            const own = partsOf(key)
            await expect(key.textContent).not.toContain('Caller')
            await expect(heardItems(key)).toEqual(
              STATE_WORDS.map(
                ({ word }, index) =>
                  `${word} ${index === 0 ? '1 046' : 'Unknown'} ${MYLDER_SENTENCES[index]}`,
              ),
            )
            for (const [index, { variant }] of STATE_WORDS.entries()) {
              const unknown = index === 0 ? null : ''
              await expect(own.items[index].getAttribute('data-variant')).toBe(variant)
              await expect(own.items[index].getAttribute('data-unknown')).toBe(unknown)
              await expect(own.counts[index].getAttribute('data-unknown')).toBe(unknown)
              await expect(own.labels[index]).toHaveAttribute('data-variant', variant)
              await expect(own.labels[index]).not.toHaveAttribute('data-line')
              await expect(own.dots[index]).not.toHaveAttribute('data-line')
              await expect(own.descriptions[index]).toHaveAttribute('data-variant', 'caption')
              await expect(own.descriptions[index]).toHaveAttribute('data-color', 'neutral')
              await expect(own.descriptions[index]).toHaveAttribute('data-emphasis', 'secondary')
            }
          },
        )
      },
    )
  },
}

/** The sentences of a key with these thresholds, in a locale, mounted apart from the story. */
const sentencesAt = async (
  canvasElement: HTMLElement,
  thresholds: { liveThreshold: number; ageingThreshold: number },
  locale: Locale = 'en',
) => {
  let found: string[] = []
  await mounted(
    canvasElement,
    <PerronProvider locale={locale}>
      <DataStateKey counts={COUNTS} {...thresholds} />
    </PerronProvider>,
    async (host) => {
      found = heardSentences(await keyIn(host))
    },
  )
  return found
}

/** The feed defaults the tokens give, and, in its play, other figures in English and Danish. */
export const Thresholds: Story = {
  args: DEFAULTS,
  play: async ({ canvasElement, step }) => {
    const key = await keyIn(canvasElement)
    await step('the feed defaults: 60 s and 5 min (CR-6, CR-7)', async () => {
      await expect(heardSentences(key)).toEqual([
        'Reported by the vehicle in the last 60 s',
        'Last reported 60 s to 5 min ago',
        MYLDER_SENTENCES[2],
        MYLDER_SENTENCES[3],
        'No report for over 5 min, moved on by the timetable',
      ])
    })
    await step('whole seconds under 2 min, minutes to one place from it (CR-7)', async () => {
      const figures: [number, string][] = [
        [90_000, '90 s'],
        [119_400, '119 s'],
        [120_000, '2 min'],
        [150_000, '2.5 min'],
        [240_000, '4 min'],
      ]
      for (const [ms, written] of figures) {
        const [live] = await sentencesAt(canvasElement, { liveThreshold: ms, ageingThreshold: ms })
        await expect(live).toBe(`Reported by the vehicle in the last ${written}`)
      }
    })
    await step('the locale’s decimal mark: 2,5 min in Danish (CR-7)', async () => {
      const danish = await sentencesAt(canvasElement, MYLDER, 'da')
      await expect(danish[0]).toBe('Meldt af køretøjet inden for de seneste 2,5 min')
      await expect(danish[1]).toBe('Sidst meldt for 2,5 min til 5 min siden')
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale="da">
            <DataStateKey counts={COUNTS} {...MYLDER} />
          </PerronProvider>,
        ),
        'da',
      )
    })
    await step('a threshold not finite or below 0 is unknown, in its sentence (CR-7)', async () => {
      await mounted(
        canvasElement,
        <DataStateKey counts={COUNTS} liveThreshold={Number.NaN} ageingThreshold={-1} />,
        async (host) => {
          const own = partsOf(await keyIn(host))
          await expect(heardSentences(await keyIn(host))).toEqual([
            'Reported by the vehicle in the last Unknown',
            'Last reported Unknown to Unknown ago',
            MYLDER_SENTENCES[2],
            MYLDER_SENTENCES[3],
            'No report for over Unknown, moved on by the timetable',
          ])
          for (const index of [0, 1, 4]) {
            const dashes = own.descriptions[index].querySelectorAll('[aria-hidden="true"]')
            await expect(dashes.length).toBeGreaterThan(0)
            for (const dash of dashes) {
              await expect(dash).toHaveTextContent(/^—$/)
              await expect(isInaccessible(dash)).toBe(true)
            }
          }
          await expect(own.descriptions[0].textContent).toBe(
            'Reported by the vehicle in the last —Unknown',
          )
        },
      )
      for (const locale of Object.keys(dictionaries) as Locale[])
        expectOwnedStrings(
          renderToStaticMarkup(
            <PerronProvider locale={locale}>
              <DataStateKey counts={COUNTS} liveThreshold={Number.NaN} ageingThreshold={-1} />
            </PerronProvider>,
          ),
          locale,
        )
    })
  },
}

/** Mylder's thresholds, live known, and the four others unknown, each a way `counts` leaves one out. */
export const UnknownCounts: Story = {
  args: { counts: UNKNOWN_COUNTS },
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list')
    const { items, counts } = partsOf(list)
    // five items still, in order, each heard as its word, its count or "Unknown", then its sentence
    await expect(items).toHaveLength(STATE_WORDS.length)
    await expect(heardItems(list)).toEqual([
      `Live 1 046 ${MYLDER_SENTENCES[0]}`,
      `Ageing Unknown ${MYLDER_SENTENCES[1]}`,
      `Estimated Unknown ${MYLDER_SENTENCES[2]}`,
      `Timetable only Unknown ${MYLDER_SENTENCES[3]}`,
      `No signal Unknown ${MYLDER_SENTENCES[4]}`,
    ])
    // CR-5: the live item is a count
    await expect(items[0]).not.toHaveAttribute('data-unknown')
    await expect(counts[0]).not.toHaveAttribute('data-unknown')
    const quiet = colour('--perron-color-text-tertiary')
    for (const [index, item] of items.entries()) {
      await expect(item).toHaveAttribute('data-variant', STATE_WORDS[index].variant)
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
            <DataStateKey counts={UNKNOWN_COUNTS} {...MYLDER} />
          </PerronProvider>,
        ),
        locale,
      )
  },
}

/** `Default`'s args in Swedish, in a 320 px container. */
export const Narrow: Story = {
  render: (args) => (
    <PerronProvider locale="sv">
      <div data-testid="narrow" style={{ inlineSize: 320 }}>
        <DataStateKey {...args} />
      </div>
    </PerronProvider>
  ),
  play: async ({ canvasElement }) => {
    const container = within(canvasElement).getByTestId('narrow')
    await expect(container.getBoundingClientRect().width).toBe(320)
    const key = await keyIn(container)
    const { items, counts, descriptions } = partsOf(key)
    await expect(heard(descriptions[0])).toBe('Rapporterad av fordonet under de senaste 2,5 min')
    // every sentence longer than its line wraps onto more lines; at least one does here
    const wrapped = descriptions.filter((description) => lines(description) > 1.5)
    await expect(wrapped.length).toBeGreaterThan(0)
    // each count stays on one line
    for (const count of counts) await expect(lines(count)).toBeLessThan(1.5)
    // nothing reaches past the container's edge (CR-10)
    const edge = container.getBoundingClientRect()
    for (const part of [...items, ...descriptions]) {
      const box = part.getBoundingClientRect()
      await expect(box.left).toBeGreaterThanOrEqual(edge.left - 0.5)
      await expect(box.right).toBeLessThanOrEqual(edge.right + 0.5)
    }
    await expect(container.scrollWidth).toBe(container.clientWidth)
    await expect(key.scrollWidth).toBe(key.clientWidth)
    // a word longer than the container wraps inside its label, and every count stays inside (CR-10)
    await mounted(
      canvasElement,
      <PerronProvider locale="sv">
        <div data-testid="long" style={{ inlineSize: 320 }}>
          <DataStateKey counts={COUNTS} {...MYLDER} timetableOnlyLabel={LONG_WORD} />
        </div>
      </PerronProvider>,
      async (host) => {
        const box = await waitFor(() => within(host).getByTestId('long'))
        const long = await keyIn(box)
        const own = partsOf(long)
        const label = own.labels[3]
        await expect(heard(label)).toBe(LONG_WORD)
        await expect(lines(label)).toBeGreaterThan(1)
        await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth)
        const bounds = box.getBoundingClientRect()
        for (const count of own.counts) {
          await expect(lines(count)).toBeLessThan(1.5)
          await expect(count.getBoundingClientRect().right).toBeLessThanOrEqual(bounds.right + 0.5)
        }
        for (const item of own.items)
          await expect(item.getBoundingClientRect().right).toBeLessThanOrEqual(bounds.right + 0.5)
        await expect(box.scrollWidth).toBe(box.clientWidth)
        await expect(long.scrollWidth).toBe(long.clientWidth)
      },
    )
  },
}

/** `UnknownCounts`' args with every string overridden, and "Unknown" as "No data yet". */
export const Labels: Story = {
  args: { counts: UNKNOWN_COUNTS, ...OWN_LABELS },
  play: async ({ canvasElement, step }) => {
    const list = within(canvasElement).getByRole('list')
    await step('each word, sentence and unknown count is the caller’s (CR-8)', async () => {
      await expect(heardItems(list)).toEqual([
        `${OWN_WORDS[0]} 1 046 ${OWN_FILLED[0]}`,
        ...OWN_WORDS.slice(1).map((own, index) => `${own} No data yet ${OWN_FILLED[index + 1]}`),
      ])
      // each dot's name is its own item's word too
      for (const [index, dot] of partsOf(list).dots.entries())
        await expect(dot).toHaveAttribute('aria-label', OWN_WORDS[index])
      const text = list.textContent!
      for (const { word } of STATE_WORDS) await expect(text).not.toContain(word)
      for (const sentence of MYLDER_SENTENCES) await expect(text).not.toContain(sentence)
      await expect(text).not.toContain('Unknown')
      await expect(text).not.toMatch(/\d min\b|\d s\b/)
    })
    for (const [index, { variant, word }] of STATE_WORDS.entries())
      await step(`${STATE_LABELS[variant]} replaces only “${word}”`, async () => {
        await mounted(
          canvasElement,
          <DataStateKey counts={COUNTS} {...MYLDER} {...{ [STATE_LABELS[variant]]: 'Own' }} />,
          async (host) => {
            const key = await keyIn(host)
            await expect(partsOf(key).labels.map((label) => heard(label))).toEqual(
              STATE_WORDS.map((state) => state.word).with(index, 'Own'),
            )
            await expect(heardSentences(key)).toEqual(MYLDER_SENTENCES)
          },
        )
      })
    for (const [index, { prop, own }] of OWN_SENTENCES.entries())
      await step(`${prop} replaces only its own sentence`, async () => {
        await mounted(
          canvasElement,
          <DataStateKey counts={COUNTS} {...MYLDER} {...{ [prop]: own }} />,
          async (host) => {
            const key = await keyIn(host)
            const filled = own
              .replace('{liveThreshold}', '2.5 min')
              .replace('{ageingThreshold}', '5 min')
            await expect(heardSentences(key)).toEqual(MYLDER_SENTENCES.with(index, filled))
          },
        )
      })
    await step('each duration override writes only its own unit (CR-7, CR-8)', async () => {
      await expect(
        (await sentencesAt(canvasElement, DEFAULTS)).slice(0, 2), // en, as a baseline
      ).toEqual(['Reported by the vehicle in the last 60 s', 'Last reported 60 s to 5 min ago'])
      await mounted(
        canvasElement,
        <DataStateKey counts={COUNTS} {...DEFAULTS} secondsDurationLabel="{count} sec" />,
        async (host) => {
          const [, ageing] = heardSentences(await keyIn(host))
          await expect(ageing).toBe('Last reported 60 sec to 5 min ago')
        },
      )
      await mounted(
        canvasElement,
        <DataStateKey counts={COUNTS} {...DEFAULTS} minutesDurationLabel="{count} minutes" />,
        async (host) => {
          const [, ageing] = heardSentences(await keyIn(host))
          await expect(ageing).toBe('Last reported 60 s to 5 minutes ago')
        },
      )
    })
  },
}
