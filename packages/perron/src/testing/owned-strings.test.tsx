// expectOwnedStrings fails a render that shows or announces a word neither the locale's
// dictionary nor the caller gave it. The fixtures are small components, one of them hardcoding.
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { Meter } from '@base-ui/react/meter'
import { PerronProvider, useOwnedStrings } from '../PerronProvider.tsx'
import type { Locale } from '../locale/index.ts'
import { expectOwnedStrings } from './owned-strings.ts'

const LOCALES: Locale[] = ['en', 'da', 'sv', 'nb']

/** Takes every word it owns from the dictionary, and its page count from the caller. */
function Pager({ children }: { children: ReactNode }) {
  const strings = useOwnedStrings()
  return (
    <nav>
      <button aria-label={strings.previousPage}>‹</button>
      <span>{children}</span>
      <span>4 / 12</span>
      <button aria-label={strings.nextPage}>›</button>
    </nav>
  )
}

/** Hardcodes its close label in English. */
function HardcodedClose() {
  return <button aria-label="Dismiss">×</button>
}

const render = (locale: Locale, node: ReactNode) =>
  renderToStaticMarkup(<PerronProvider locale={locale}>{node}</PerronProvider>)

describe('expectOwnedStrings', () => {
  it.each(LOCALES)('passes a component that takes its words from the %s dictionary', (locale) => {
    const markup = render(locale, <Pager>Departures</Pager>)
    expect(() => expectOwnedStrings(markup, locale, ['Departures'])).not.toThrow()
  })

  it('fails a hardcoded aria-label, naming it', () => {
    expect(() => expectOwnedStrings(render('en', <HardcodedClose />), 'en')).toThrow(/"Dismiss"/)
  })

  it.each([
    ['text', <p>Loading…</p>, 'Loading…'],
    ['title', <abbr title="Kilometres per hour">km/h</abbr>, 'Kilometres per hour'],
    ['alt', <img alt="Bus" src="bus.svg" />, 'Bus'],
    ['aria-valuetext', <div role="meter" aria-valuenow={0} aria-valuetext="No data" />, 'No data'],
    ['aria-roledescription', <input aria-roledescription="Counter" />, 'Counter'],
  ])('fails a hardcoded %s', (_, node, word) => {
    expect(() => expectOwnedStrings(render('en', node), 'en')).toThrow(`"${word}"`)
  })

  it('fails a word the caller passed but did not list', () => {
    expect(() => expectOwnedStrings(render('sv', <Pager>Avgångar</Pager>), 'sv')).toThrow(
      /"Avgångar"/,
    )
  })

  it("fails Base UI's English role description in another locale, and passes the dictionary's", () => {
    const english = render('da', <input aria-roledescription="Number field" />)
    expect(() => expectOwnedStrings(english, 'da')).toThrow(/"Number field"/)
    const danish = render('da', <input aria-roledescription="Talfelt" />)
    expect(() => expectOwnedStrings(danish, 'da')).not.toThrow()
  })

  it("fails another locale's word", () => {
    const english = renderToStaticMarkup(<Pager>Afgange</Pager>)
    expect(() => expectOwnedStrings(english, 'da', ['Afgange'])).toThrow(/"Previous page"/)
  })

  it("passes a template filled with the caller's strings and figures, in its own locale only", () => {
    const filled = (locale: Locale, text: string) => render(locale, <p>{text}</p>)
    const stops = ['Nørreport', 'Kongens Nytorv']
    expect(() =>
      expectOwnedStrings(filled('en', 'Affects Nørreport, Kongens Nytorv and 3 more'), 'en', stops),
    ).not.toThrow()
    expect(() =>
      expectOwnedStrings(filled('da', 'Berører Nørreport, Kongens Nytorv og 3 andre'), 'da', stops),
    ).not.toThrow()
    expect(() => expectOwnedStrings(filled('en', 'From 08:03'), 'en')).not.toThrow()
    // English joining words in a Danish render, a word the caller never gave, and a template
    // word inside another word are each strays
    expect(() =>
      expectOwnedStrings(filled('da', 'Berører Nørreport and 3 more'), 'da', stops),
    ).toThrow(/"Berører Nørreport and 3 more"/)
    expect(() => expectOwnedStrings(filled('en', 'Affects Valby'), 'en', stops)).toThrow(
      /"Affects Valby"/,
    )
    expect(() => expectOwnedStrings(filled('en', 'Fromage 08:03'), 'en')).toThrow(/"Fromage/)
    // caller's strings alone, with no template word, are a run the caller must give whole
    expect(() =>
      expectOwnedStrings(filled('en', 'Nørreport, Kongens Nytorv'), 'en', stops),
    ).toThrow(/"Nørreport, Kongens Nytorv"/)
  })

  it("matches a run against one template's own words, in their order", () => {
    const filled = (text: string) => render('en', <p>{text}</p>)
    const stops = ['Nørreport', 'Kongens Nytorv', 'Hellerup', 'Klampenborg']
    // each template whole, its placeholders holding figures, the caller's strings or another
    // template filled
    for (const run of [
      'Every 3 min',
      'Every 3 to 4 min',
      'Between Hellerup and Klampenborg',
      '06:00 to 22:00',
      'Affects Nørreport and Kongens Nytorv',
      'Affects Nørreport, Kongens Nytorv and 3 more',
    ])
      expect(() => expectOwnedStrings(filled(run), 'en', stops)).not.toThrow()
    // a placeholder left empty, the words out of order, two templates' words mixed, words before
    // or after a template, and a template's words repeated are each strays
    for (const run of [
      'to 3',
      'Every min',
      'more Nørreport Affects',
      'Nørreport Affects',
      'Affects and 3 more',
      'Every 3 and 4 more',
      'Between Hellerup to Klampenborg',
      'Hellerup Every 3 min',
      'Every 3 min min',
      'Every Every 3 min',
    ])
      expect(() => expectOwnedStrings(filled(run), 'en', stops)).toThrow(`"${run}"`)
  })

  it('skips the "x" Base UI appends to a meter, and nothing that only looks like it', () => {
    const meter = render(
      'da',
      <Meter.Root value={82}>
        <Meter.Label>Rapporterer live</Meter.Label>
      </Meter.Root>,
    )
    expect(meter).toContain('>x</span>')
    expect(() => expectOwnedStrings(meter, 'da', ['Rapporterer live'])).not.toThrow()
    // role="presentation" alone, or the clip alone, is a word like any other
    const presentation = render('en', <span role="presentation">x</span>)
    expect(() => expectOwnedStrings(presentation, 'en')).toThrow(/"x"/)
    const clipped = render('en', <span style={{ clipPath: 'inset(50%)' }}>x</span>)
    expect(() => expectOwnedStrings(clipped, 'en')).toThrow(/"x"/)
  })
})
