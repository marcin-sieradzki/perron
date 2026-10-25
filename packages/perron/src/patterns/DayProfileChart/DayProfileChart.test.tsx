// DayProfileChart draws and lists only the points whose time reads as HH:MM (CR-2), tops its scale
// at the rounded largest known count (CR-3), breaks its line at each unknown count (CR-4), and
// renders every shape its props accept. Spec: docs/patterns/day-profile-chart.md.
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
import { DayProfileChart } from './DayProfileChart.tsx'
import type { DayProfileChartPoint } from './DayProfileChart.tsx'

const render = (points: ReadonlyArray<DayProfileChartPoint>, label: ReactNode = 'Count') =>
  renderToStaticMarkup(<DayProfileChart points={points} label={label} />)

/** The scale's text. */
const scale = (markup: string) =>
  /<span class="pn-DayProfileChart-scale" aria-hidden="true">([^<]*)<\/span>/.exec(markup)![1]

/** The line's path data, or undefined when it draws nothing. */
const line = (markup: string) =>
  /<path class="pn-DayProfileChart-line"(?: d="([^"]*)")?/.exec(markup)![1]

/** Each list item's words, as their hidden text holds them. */
const words = (markup: string) =>
  [...markup.matchAll(/<li [^>]*><span class="pn-VisuallyHidden">(.*?)<\/span><\/li>/g)].map((m) =>
    m[1].replace(/<[^>]*>/g, ''),
  )

const hours = (counts: ReadonlyArray<number | null>) =>
  counts.map((count, h) => ({ time: `${String(h).padStart(2, '0')}:00`, count }))

describe('DayProfileChart', () => {
  it.each([
    [412, '450'],
    [1260, '1\u00A0500'],
    [980, '1\u00A0000'],
    [8, '8'],
    [0, '1'],
    [1, '1'],
    [45001, '50\u00A0000'],
  ])('tops the scale for a largest count of %i at %s', (count, top) => {
    expect(scale(render([{ time: '08:00', count }]))).toBe(top)
  })

  it('writes counts grouped in threes by a no-break space', () => {
    expect(words(render([{ time: '08:00', count: 1234567 }]))).toEqual([
      '08:00 1\u00A0234\u00A0567',
    ])
  })

  it('leaves out a point whose time does not read as HH:MM, from the list and the line', () => {
    const markup = render([
      { time: '06:00', count: 100 },
      { time: '24:00', count: 200 },
      { time: '7:00', count: 300 },
      { time: '08:60', count: 400 },
      { time: '08:00 ', count: 500 },
      { time: '09:00', count: 600 },
    ])
    expect(words(markup)).toEqual(['06:00 100', '09:00 600'])
    expect(line(markup)).toBe('M360 83.33L540 0')
  })

  it('keeps the caller’s order and never sorts', () => {
    const markup = render([
      { time: '12:00', count: 1 },
      { time: '06:00', count: 2 },
    ])
    expect(words(markup)).toEqual(['12:00 1', '06:00 2'])
  })

  it('breaks the line at each unknown count, and draws a lone count as a dot', () => {
    const markup = render(hours([10, null, 10, Number.NaN, 5, Infinity, 10, 10]))
    expect(line(markup)).toBe('M0 0L0 0M120 0L120 0M240 50L240 50M360 0L420 0')
    expect(words(markup)[1]).toBe('01:00 Unknown')
    expect(words(markup)[3]).toBe('03:00 Unknown')
  })

  it('treats a count left out as unknown, and 0 as a count', () => {
    const markup = render([{ time: '05:00' }, { time: '06:00', count: 0 }])
    expect(words(markup)).toEqual(['05:00 Unknown', '06:00 0'])
    expect(scale(markup)).toBe('1')
  })

  it('draws nothing and shows no scale with every count unknown, but lists every point', () => {
    const markup = render(hours([null, null, null]))
    expect(scale(markup)).toBe('')
    expect(line(markup)).toBeUndefined()
    expect(markup).not.toContain('pn-DayProfileChart-gridline')
    expect(words(markup)).toEqual(['00:00 Unknown', '01:00 Unknown', '02:00 Unknown'])
    expect(markup).toContain('tabindex="0"')
  })

  it('takes no focus with no point to draw', () => {
    for (const points of [[], [{ time: 'noon', count: 3 }]]) {
      const markup = render(points)
      expect(markup).not.toContain('tabindex')
      expect(words(markup)).toEqual([])
    }
  })

  it.each([1, 24, 96])('lists %i points a whole day apart in order', (count) => {
    const points = Array.from({ length: count }, (_, i) => {
      const minutes = Math.round((i * 1440) / count)
      const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
      return { time, count: i }
    })
    expect(words(render(points))).toHaveLength(count)
  })

  it.each([
    ['a string', 'Vehicles in service', 'Vehicles in service'],
    ['an element', <strong key="s">Vehicles</strong>, '<strong>Vehicles</strong>'],
    ['a list', ['Vehicles', ' in ', <em key="e">service</em>], 'Vehicles in <em>service</em>'],
  ])('shows a label given as %s in the caption, which names the plot', (_, label, html) => {
    const markup = render([{ time: '08:00', count: 1 }], label)
    const caption =
      /<figcaption class="pn-DayProfileChart-caption" id="([^"]+)">(.*?)<\/figcaption>/.exec(
        markup,
      )!
    expect(caption[2].replaceAll('<!-- -->', '')).toBe(html)
    expect(markup).toContain(`aria-labelledby="${caption[1]}"`)
  })

  it('says unknownLabel, or the locale’s word, for an unknown count', () => {
    const points = [{ time: '05:00', count: null }]
    expect(
      words(
        renderToStaticMarkup(<DayProfileChart points={points} label="x" unknownLabel="No data" />),
      ),
    ).toEqual(['05:00 No data'])
    expect(
      words(
        renderToStaticMarkup(
          <PerronProvider locale="da">
            <DayProfileChart points={points} label="x" />
          </PerronProvider>,
        ),
      ),
    ).toEqual(['05:00 Ukendt'])
  })

  it('joins the caller’s classes after each part’s own, and keeps its own attributes', () => {
    const markup = renderToStaticMarkup(
      <DayProfileChart
        points={[{ time: '08:00', count: 1 }]}
        label="x"
        className="mine"
        slotProps={{
          caption: { className: 'c', id: 'theirs' },
          plot: { className: 'p', role: 'img', tabIndex: -1 },
          graph: { className: 'g' },
          scale: { className: 's' },
          points: { className: 'l' },
          point: { className: 'i', style: { color: 'red' } },
          axis: { className: 'a' },
        }}
      />,
    )
    expect(markup).toMatch(/^<figure class="pn-DayProfileChart mine">/)
    expect(markup).toContain('class="pn-DayProfileChart-caption c"')
    expect(markup).not.toContain('id="theirs"')
    expect(markup).toContain('class="pn-DayProfileChart-plot p" role="group"')
    expect(markup).toContain('tabindex="0"')
    expect(markup).toContain('class="pn-DayProfileChart-graph g"')
    expect(markup).toContain('class="pn-DayProfileChart-scale s"')
    expect(markup).toContain('class="pn-DayProfileChart-points l"')
    expect(markup).toContain('class="pn-DayProfileChart-point i"')
    expect(markup).toContain('style="color:red;left:33.33%"')
    expect(markup).toContain('class="pn-DayProfileChart-axis a"')
  })
})
