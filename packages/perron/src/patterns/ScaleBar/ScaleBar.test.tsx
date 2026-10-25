// ScaleBar picks its distance and its bar's share from the map's resolution (CR-3), reads it in
// metres or kilometres (CR-6), says "Unknown" for a resolution that gives no distance (CR-7), and
// in a server render, before it has measured its longest length, holds only the hidden "Scale"
// (CR-4). Spec: docs/patterns/scale-bar.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { heardMarkup } from '../../testing/markup.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { figureOf, scaleFor } from './scale.ts'
import { ScaleBar } from './ScaleBar.tsx'

/** The bar's longest length in pixels, as ScaleBar's CSS draws it. */
const LONGEST = 96

describe('scaleFor', () => {
  it.each([
    // each round step, met exactly: the bar at its longest
    [1, 1, 1],
    [2, 2, 1],
    [3, 3, 1],
    [5, 5, 1],
    [10, 10, 1],
    [300, 300, 1],
    [1000, 1000, 1],
    [2000, 2000, 1],
    [5000, 5000, 1],
    [1e6, 1e6, 1],
    // just under each step: the step below it, the bar shorter
    [1.99, 1, 1 / 1.99],
    [2.99, 2, 2 / 2.99],
    [4.99, 3, 3 / 4.99],
    [9.99, 5, 5 / 9.99],
    [999, 500, 500 / 999],
    [1999, 1000, 1000 / 1999],
  ])(
    'over a longest distance of %f m shows %i m, the bar %f of its longest',
    (longest, meters, share) => {
      // one pixel long, so the longest distance is the resolution itself
      expect(scaleFor(longest, 1)).toEqual({ meters, share: expect.closeTo(share, 9) })
    },
  )

  it.each([
    [4.2, 300, 300 / 403.2],
    [40, 3000, 3000 / 3840],
    [20.82, 1000, 1000 / 1998.72],
  ])(
    "at the stories' %f m per pixel shows %i m, the bar %f of its longest",
    (mpp, meters, share) => {
      expect(scaleFor(mpp, LONGEST)).toEqual({ meters, share: expect.closeTo(share, 9) })
    },
  )

  it.each([4.2, 20.82, 40, 0.5, 123.4, 9876])(
    'draws the bar at %f m per pixel from half to the whole of its longest',
    (mpp) => {
      const { share } = scaleFor(mpp, LONGEST)!
      expect(share).toBeGreaterThanOrEqual(0.5)
      expect(share).toBeLessThanOrEqual(1)
    },
  )

  it.each([0.001, 0.005, 0.01])(
    'shows never less than 1 m, with the bar at its longest, at %f m per pixel',
    (mpp) => {
      expect(scaleFor(mpp, LONGEST)).toEqual({ meters: 1, share: 1 })
    },
  )

  it.each([
    ['0', 0],
    ['a negative number', -4.2],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
  ])('gives no distance for %s', (_, mpp) => {
    expect(scaleFor(mpp, LONGEST)).toBeUndefined()
  })

  it.each([0, NaN, -96])('gives no distance for a longest length of %f', (longest) => {
    expect(scaleFor(4.2, longest)).toBeUndefined()
  })
})

describe('figureOf', () => {
  it.each([
    [1, '1', 'meters'],
    [300, '300', 'meters'],
    [500, '500', 'meters'],
    [1000, '1', 'kilometers'],
    [3000, '3', 'kilometers'],
    [5_000_000, '5000', 'kilometers'],
  ])('reads %i m as %s in %s, with no grouping', (meters, figure, unit) => {
    expect(figureOf(meters)).toEqual({ figure, unit })
  })
})

describe('ScaleBar', () => {
  it.each(Object.keys(dictionaries) as Locale[])(
    'holds only the hidden "Scale" and no bar before it has measured, in %s',
    (locale) => {
      const markup = renderToStaticMarkup(
        <PerronProvider locale={locale}>
          <ScaleBar metersPerPixel={4.2} />
        </PerronProvider>,
      )
      expect(heardMarkup(markup)).toBe(dictionaries[locale].scale)
      expect(markup).not.toContain('pn-ScaleBar-bar')
      expectOwnedStrings(markup, locale)
    },
  )

  it.each([
    ['0', 0],
    ['a negative number', -1],
    ['NaN', NaN],
    ['Infinity', Infinity],
  ])('shows "—" and says "Unknown" for %s', (_, mpp) => {
    const markup = renderToStaticMarkup(<ScaleBar metersPerPixel={mpp} />)
    expect(markup).toContain('<span aria-hidden="true">—</span>')
    expect(heardMarkup(markup)).toBe('Scale Unknown')
    expect(markup).not.toContain('pn-ScaleBar-bar')
  })

  it('says unknownLabel and scaleLabel in place of the locale’s', () => {
    const markup = renderToStaticMarkup(
      <ScaleBar metersPerPixel={NaN} scaleLabel="Målestok" unknownLabel="Not known yet" />,
    )
    expect(heardMarkup(markup)).toBe('Målestok Not known yet')
  })

  it('keeps the class order and the caller’s slot props', () => {
    const markup = renderToStaticMarkup(
      <ScaleBar
        metersPerPixel={4.2}
        className="corner"
        slotProps={{ label: { className: 'figure', id: 'scale' } }}
      />,
    )
    expect(markup).toContain('class="pn-Surface pn-ScaleBar corner"')
    expect(markup).toMatch(/<span class="pn-ScaleBar-label figure" id="scale">/)
  })
})
