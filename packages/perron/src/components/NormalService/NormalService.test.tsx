// NormalService says the caller's runningNormallyLabel in place of the locale's words (CR-4), keeps
// its own props off the DOM (CR-6), and inlines the check-circle file's drawing unchanged (CR-2).
// Spec: docs/components/normal-service.md.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
import { heardMarkup } from '../../testing/markup.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { NormalService } from './NormalService.tsx'

const icon = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../icons/check-circle.svg'),
  'utf8',
)

/** A tag's attributes, less width and height, which CR-2 leaves out of the inlined icon. */
const attrs = (tag: string) =>
  [...tag.matchAll(/\s([\w-]+)="([^"]*)"/g)]
    .filter(([, name]) => name !== 'width' && name !== 'height')
    .map(([, name, value]) => `${name}=${value}`)

/** The svg's own drawing attributes and each child element, as markup. */
const drawing = (svg: string) => ({
  root: attrs(svg.match(/<svg\b[^>]*>/)![0]).filter(
    (a) => !/^(class|aria-hidden|focusable)=/.test(a),
  ),
  children: (svg.match(/<(?!\/?svg\b)[a-z]+\b[^>]*>/g) ?? []).map((tag) => [
    tag.match(/^<([a-z]+)/)![1],
    ...attrs(tag).sort(),
  ]),
})

describe('NormalService', () => {
  it('shows and reads runningNormallyLabel in place of "Running normally"', () => {
    const markup = renderToStaticMarkup(<NormalService runningNormallyLabel="Normal service" />)
    expect(markup).toContain('<span class="pn-NormalService-label">Normal service</span>')
    expect(markup).not.toContain('Running normally')
    expect(heardMarkup(markup)).toBe('Normal service')
    expect(markup).not.toMatch(/runningnormallylabel/i)
    expectOwnedStrings(
      renderToStaticMarkup(
        <PerronProvider locale="da">
          <NormalService runningNormallyLabel="Normal service" />
        </PerronProvider>,
      ),
      'da',
      ['Normal service'],
    )
  })

  it("keeps the locale's words when runningNormallyLabel is undefined", () => {
    const markup = renderToStaticMarkup(
      <PerronProvider locale="sv">
        <NormalService runningNormallyLabel={undefined} />
      </PerronProvider>,
    )
    expect(heardMarkup(markup)).toBe('Går som vanligt')
  })

  it("joins the caller's className after pn-NormalService, and passes the rest to the root", () => {
    const markup = renderToStaticMarkup(
      <NormalService className="row-status" id="m2-status" data-line="M2" />,
    )
    expect(markup).toMatch(/^<span [^>]*class="pn-NormalService row-status"/)
    expect(markup).toMatch(/^<span [^>]*id="m2-status"/)
    expect(markup).toMatch(/^<span [^>]*data-line="M2"/)
  })

  it('swaps the root for the element render gives, keeping its class and children', () => {
    const markup = renderToStaticMarkup(<NormalService render={<p />} />)
    expect(markup).toMatch(/^<p class="pn-NormalService"><svg /)
    expect(heardMarkup(markup)).toBe('Running normally')
  })

  it('inlines the check-circle file unchanged but for width and height, hidden from the ear', () => {
    const markup = renderToStaticMarkup(<NormalService />)
    const svg = markup.match(/<svg\b[\s\S]*<\/svg>/)![0]
    expect(drawing(svg)).toEqual(drawing(icon))
    expect(svg).toMatch(/^<svg [^>]*class="perron-icon pn-NormalService-icon"/)
    expect(svg).toMatch(/^<svg [^>]*aria-hidden="true"/)
    expect(svg).toMatch(/^<svg [^>]*focusable="false"/)
    expect(svg).not.toMatch(/^<svg [^>]*\s(width|height)=/)
    // CR-2: the icon comes before the label in reading order
    expect(markup.indexOf('<svg')).toBeLessThan(markup.indexOf('pn-NormalService-label'))
  })
})
