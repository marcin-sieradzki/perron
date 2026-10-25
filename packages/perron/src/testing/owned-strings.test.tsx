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
