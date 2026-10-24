// Brand's inline mark keeps the logo file's geometry exactly, so the two never drift apart, and
// leaves its colours to Brand.css (CR-3). Spec: docs/components/brand.md.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Brand } from './Brand.tsx'

const logo = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../logos/mylder-mark.svg'),
  'utf8',
)

/** An attribute's value inside one tag, or undefined. */
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]

/** The svg's box: its viewBox, width and height. */
const box = (markup: string) => {
  const svg = markup.match(/<svg\b[^>]*>/)![0]
  return { viewBox: attr(svg, 'viewBox'), width: attr(svg, 'width'), height: attr(svg, 'height') }
}

/** Each circle's geometry, in order. */
const circles = (markup: string) =>
  (markup.match(/<circle\b[^>]*>/g) ?? []).map((tag) => ({
    cx: attr(tag, 'cx'),
    cy: attr(tag, 'cy'),
    r: attr(tag, 'r'),
    strokeWidth: attr(tag, 'stroke-width'),
  }))

describe('Brand', () => {
  const markup = renderToStaticMarkup(<Brand />)

  it("draws the mark in the logo file's box (CR-3)", () => {
    expect(box(markup)).toEqual(box(logo))
  })

  it("draws the logo file's three circles, at its places and sizes (CR-3)", () => {
    expect(circles(markup)).toEqual(circles(logo))
    expect(circles(markup)).toHaveLength(3)
  })

  it('keeps every colour out of the markup, for Brand.css to set from the tokens (CR-3)', () => {
    for (const tag of markup.match(/<circle\b[^>]*>/g) ?? []) {
      expect(attr(tag, 'fill')).toBeUndefined()
      expect(attr(tag, 'stroke')).toBeUndefined()
    }
  })

  it('hides the mark, with no title, so the brand name is heard once (CR-4)', () => {
    expect(markup).toMatch(/<svg\b[^>]*\saria-hidden="true"/)
    expect(markup).toMatch(/<svg\b[^>]*\sfocusable="false"/)
    expect(markup).not.toContain('<title')
  })

  it('lays brandNameLabel over the brand name in both variants (CR-2)', () => {
    expect(renderToStaticMarkup(<Brand brandNameLabel="Perron" />)).toContain(
      '<span class="pn-Brand-wordmark">Perron</span>',
    )
    const mark = renderToStaticMarkup(<Brand variant="mark" brandNameLabel="Perron" />)
    expect(mark).not.toContain('pn-Brand-wordmark')
    expect(mark).toMatch(/<\/svg><span [^>]*>Perron<\/span><\/span>$/)
  })
})
