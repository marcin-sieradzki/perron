// PerronProvider picks the locale a component's owned strings come from, and a *Label prop
// overrides one of them on one instance.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider, useOwnedStrings } from './PerronProvider.tsx'
import type { Locale } from './locale/index.ts'

function CloseButton({ closeLabel }: { closeLabel?: string }) {
  const strings = useOwnedStrings({ close: closeLabel })
  return <button aria-label={strings.close}>×</button>
}

const render = (locale?: Locale, closeLabel?: string) =>
  renderToStaticMarkup(
    locale ? (
      <PerronProvider locale={locale}>
        <CloseButton closeLabel={closeLabel} />
      </PerronProvider>
    ) : (
      <CloseButton closeLabel={closeLabel} />
    ),
  )

describe('PerronProvider', () => {
  it.each([
    ['en', 'Close'],
    ['da', 'Luk'],
    ['sv', 'Stäng'],
    ['nb', 'Lukk'],
  ] as const)('gives the %s close label', (locale, label) => {
    expect(render(locale)).toBe(`<button aria-label="${label}">×</button>`)
  })

  it('reads English without a provider', () => {
    expect(render()).toBe('<button aria-label="Close">×</button>')
  })

  it('lets a *Label prop override one string on one instance', () => {
    expect(render('da', 'Luk kortet')).toBe('<button aria-label="Luk kortet">×</button>')
  })
})
