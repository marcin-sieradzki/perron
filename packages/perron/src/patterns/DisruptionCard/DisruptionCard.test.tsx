// DisruptionCard leaves out the description when `children` renders nothing (CR-5), so no empty
// part takes up a gap, and reads `affectedLinesLabel` just before the list of lines (CR-4, CR-7).
// Spec: docs/patterns/disruption-card.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
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
})
