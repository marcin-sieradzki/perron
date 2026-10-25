// KioskBar renders its list only when `stats` holds an entry (CR-4), one Stat per entry in the
// caller's order, and each entry's `label` and `figure` in every shape a ReactNode takes.
// Spec: docs/patterns/kiosk-bar.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { KioskBar } from './KioskBar.tsx'
import type { KioskBarStat } from './KioskBar.tsx'

/** Four key figures about the network, as a kiosk shows them. */
const STATS: ReadonlyArray<KioskBarStat> = [
  { label: 'Vehicles on the map', figure: '1 204' },
  { label: 'Reporting live', figure: '1 046' },
  { label: 'Average delay', figure: '2 min' },
  { label: 'Disruptions', figure: '3' },
]

/** Which of the root's parts are present, in the anatomy's order (presence only: the Default story checks the order). */
const parts = (markup: string) =>
  ['brand', 'stats', 'time'].filter((part) => markup.includes(`pn-KioskBar-${part}"`))

/** Each figure's label, in the order they render. */
const labels = (markup: string) =>
  [...markup.matchAll(/<div class="pn-Stat-label">([^<]*)<\/div>/g)].map((match) => match[1])

describe('KioskBar', () => {
  it.each([
    ['left out', undefined],
    ['empty', []],
  ])('renders the brand and the clock alone when stats is %s', (_, stats) => {
    const markup = renderToStaticMarkup(<KioskBar time="23:59" stats={stats} />)
    expect(parts(markup)).toEqual(['brand', 'time'])
    expect(markup).not.toContain('<ul')
    expect(markup).not.toContain('<li')
  })

  it.each([1, 2, 3, 4])('renders %i entries as that many items, in their order', (count) => {
    const stats = STATS.slice(0, count)
    const markup = renderToStaticMarkup(<KioskBar time="08:14" stats={stats} />)
    expect(parts(markup)).toEqual(['brand', 'stats', 'time'])
    expect(markup.match(/<li class="pn-Stat pn-KioskBar-stat">/g)).toHaveLength(count)
    expect(labels(markup)).toEqual(stats.map((entry) => entry.label))
  })

  it.each([
    ['a string', '412', '412'],
    ['a number', 412, '412'],
    ['an element', <span key="figure">412</span>, '<span>412</span>'],
    ['a list', ['4', '12'], '4(<!-- -->)?12'],
  ])('renders a label and a figure given as %s inside their parts', (_, node, html) => {
    const markup = renderToStaticMarkup(
      <KioskBar time="08:14" stats={[{ label: node, figure: node }]} />,
    )
    expect(markup).toMatch(new RegExp(`<div class="pn-Stat-label">${html}</div>`))
    expect(markup).toMatch(new RegExp(`<div class="pn-Stat-value">${html}</div>`))
  })
})
