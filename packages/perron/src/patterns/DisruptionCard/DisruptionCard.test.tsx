// DisruptionCard leaves out the description when `children` renders nothing (CR-5), so no empty
// part takes up a gap, reads `affectedLinesLabel` just before the list of lines (CR-4, CR-7), and
// writes its stops and time in each locale's own words around the caller's (CR-12, CR-13).
// Spec: docs/patterns/disruption-card.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
import type { Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { DisruptionCard } from './DisruptionCard.tsx'
import type { DisruptionCardProps } from './DisruptionCard.tsx'

const TITLE = 'Signal fault at Kongens Nytorv'
const SENTENCE =
  'M2 and M3 trains between Kongens Nytorv and Christianshavn run slower than planned.'

/** The Delay story's args. */
const delay = {
  severity: 'delay',
  lines: [
    { line: 'm2', name: 'M2' },
    { line: 'm3', name: 'M3' },
  ],
  title: TITLE,
  children: SENTENCE,
  slotProps: { title: { render: <h3 /> } },
} satisfies DisruptionCardProps

const hasDescription = (markup: string) => markup.includes('pn-DisruptionCard-description')

describe('DisruptionCard', () => {
  it.each([
    ['left out', undefined],
    ['null', null],
    ['false', false],
    ['true', true],
    ["''", ''],
    ['[]', []],
    ['an array of nothing', ['', [undefined, null], false]],
  ])('renders no description when children is %s', (_, children) => {
    const markup = renderToStaticMarkup(
      <DisruptionCard severity="data" title="Bus positions not updating">
        {children}
      </DisruptionCard>,
    )
    expect(hasDescription(markup)).toBe(false)
    expect(markup).toContain('class="pn-Text pn-DisruptionCard-title')
  })

  it('renders the description when its array holds something', () => {
    const markup = renderToStaticMarkup(
      <DisruptionCard severity="data" title="Bus positions not updating">
        {['', 'Buses across the network show timetable positions until the data feed returns.']}
      </DisruptionCard>,
    )
    expect(hasDescription(markup)).toBe(true)
  })

  it.each(['en', 'da'] as const)(
    'reads affectedLinesLabel="Lines" just before the list in %s',
    (locale) => {
      const markup = renderToStaticMarkup(
        <PerronProvider locale={locale}>
          <DisruptionCard {...delay} affectedLinesLabel="Lines" />
        </PerronProvider>,
      )
      expect(markup).toMatch(
        /<span class="pn-VisuallyHidden">Lines<\/span><ul class="pn-DisruptionCard-lines">/,
      )
      expect(markup).not.toContain('Affected lines')
      expectOwnedStrings(markup, locale, ['Lines', 'M2', 'M3', TITLE, SENTENCE])
    },
  )

  const STOPS = ['Nørreport', 'Kongens Nytorv', 'Christianshavn', 'Islands Brygge', 'DR Byen']

  /** The text of one part, `stops` or `time`, in a render, or null when it renders none. */
  const part = (markup: string, name: 'stops' | 'time') =>
    new RegExp(`class="pn-Text pn-DisruptionCard-${name}"[^>]*>(.*?)</p>`).exec(markup)?.[1] ?? null

  const card = (props: Partial<DisruptionCardProps>, locale: Locale = 'en') =>
    renderToStaticMarkup(
      <PerronProvider locale={locale}>
        <DisruptionCard severity="delay" title={TITLE} {...props} />
      </PerronProvider>,
    )

  it.each([
    [1, 'Affects Nørreport'],
    [2, 'Affects Nørreport and Kongens Nytorv'],
    [3, 'Affects Nørreport, Kongens Nytorv and Christianshavn'],
    [4, 'Affects Nørreport, Kongens Nytorv and 2 more'],
    [5, 'Affects Nørreport, Kongens Nytorv and 3 more'],
  ])('names %i stops as "%s"', (count, words) => {
    expect(part(card({ stops: STOPS.slice(0, count) }), 'stops')).toBe(words)
  })

  it.each([
    ['left out', undefined],
    ['an empty list', []],
  ])('renders no stops when stops is %s', (_, stops) => {
    expect(part(card({ stops }), 'stops')).toBeNull()
  })

  it.each([
    ['from alone', { from: '08:03' }, 'From 08:03'],
    ['to alone', { to: '22:00' }, 'Until 22:00'],
    ['both', { from: '24', to: '25 October' }, '24 to 25 October'],
  ])('writes the time from %s', (_, time, words) => {
    expect(part(card({ time }), 'time')).toBe(words)
  })

  it.each([
    ['left out', undefined],
    ['neither end', {}],
    ['ends that render nothing', { from: '', to: null }],
  ])('renders no time when time is %s', (_, time) => {
    expect(part(card({ time }), 'time')).toBeNull()
  })

  it('renders no action when action renders nothing', () => {
    expect(card({ action: false })).not.toContain('pn-DisruptionCard-action')
  })

  it.each([
    [
      'da',
      'Berører Nørreport, Kongens Nytorv og 3 andre',
      'Mellem Hellerup og Klampenborg',
      'Fra 08:03',
      '24. til 25. oktober',
    ],
    [
      'sv',
      'Berör Nørreport, Kongens Nytorv och 3 till',
      'Mellan Hellerup och Klampenborg',
      'Från 08:03',
      '24 till 25 oktober',
    ],
    [
      'nb',
      'Berører Nørreport, Kongens Nytorv og 3 andre',
      'Mellom Hellerup og Klampenborg',
      'Fra 08:03',
      '24. til 25. oktober',
    ],
  ] as const)('writes the stops and the time in %s', (locale, list, stretch, from, range) => {
    // the caller writes each end in its locale's date style; the card owns only the word between
    const [start, end] = locale === 'sv' ? ['24', '25 oktober'] : ['24.', '25. oktober']
    const listed = card({ stops: STOPS, time: { from: '08:03' } }, locale)
    expect(part(listed, 'stops')).toBe(list)
    expect(part(listed, 'time')).toBe(from)
    expectOwnedStrings(listed, locale, [...STOPS, TITLE])
    const between = card(
      { stops: { from: 'Hellerup', to: 'Klampenborg' }, time: { from: start, to: end } },
      locale,
    )
    expect(part(between, 'stops')).toBe(stretch)
    expect(part(between, 'time')).toBe(range)
    expectOwnedStrings(between, locale, ['Hellerup', 'Klampenborg', end, TITLE])
  })

  it('takes each *Label override, its placeholders filled the same way', () => {
    const labelled = {
      affectsStopsLabel: 'Stops: {stops}',
      stopListEndLabel: '{stops} & {stop}',
      moreStopsLabel: '{stops} +{count}',
      betweenStopsLabel: '{from}–{to}',
      fromTimeLabel: 'Starts {time}',
      untilTimeLabel: 'Ends {time}',
      timeRangeLabel: '{from}–{to}',
    }
    const two = card({ ...labelled, stops: STOPS.slice(0, 2), time: { to: '22:00' } })
    expect(part(two, 'stops')).toBe('Stops: Nørreport &amp; Kongens Nytorv')
    expect(part(two, 'time')).toBe('Ends 22:00')
    const five = card({ ...labelled, stops: STOPS, time: { from: '08:03' } })
    expect(part(five, 'stops')).toBe('Stops: Nørreport, Kongens Nytorv +3')
    expect(part(five, 'time')).toBe('Starts 08:03')
    const stretch = card({
      ...labelled,
      stops: { from: 'Hellerup', to: 'Klampenborg' },
      time: { from: '06:00', to: '22:00' },
    })
    expect(part(stretch, 'stops')).toBe('Hellerup–Klampenborg')
    expect(part(stretch, 'time')).toBe('06:00–22:00')
  })
})
