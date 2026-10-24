// Stat renders every shape its `label` and `children` accept, tells a figure from an unknown one
// (CR-3), and keeps its own props off the DOM (CR-8). Spec: docs/components/stat.md.
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
import { Stat } from './Stat.tsx'

const render = (figure: ReactNode, label: ReactNode = 'Reporting live') =>
  renderToStaticMarkup(<Stat label={label}>{figure}</Stat>)

const UNKNOWN_VALUE =
  '<div class="pn-Stat-value" data-unknown=""><span aria-hidden="true">—</span><span class="pn-VisuallyHidden">Unknown</span></div>'

describe('Stat', () => {
  it.each([
    ['a string', '412', '412'],
    ['a number', 412, '412'],
    ['0', 0, '0'],
    ["'0'", '0', '0'],
    ['an element', <span key="f">4 min</span>, '<span>4 min</span>'],
    ['a list', ['≈ ', 30], '≈ 30'],
  ])('renders %s as the figure, as given', (_, figure, shown) => {
    const markup = render(figure)
    expect(markup).toBe(
      `<div class="pn-Stat"><div class="pn-Stat-label">Reporting live</div><div class="pn-Stat-value">${shown}</div></div>`,
    )
  })

  it.each([
    ['left out', undefined],
    ['null', null],
    ['false', false],
    ['true', true],
    ["''", ''],
    ['[]', []],
    ['an array of nothing', [null, false, ['', undefined]]],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
  ])('shows "—" and says "Unknown" when the figure is %s', (_, figure) => {
    const markup = render(figure)
    expect(markup).toBe(
      `<div class="pn-Stat" data-unknown=""><div class="pn-Stat-label">Reporting live</div>${UNKNOWN_VALUE}</div>`,
    )
  })

  it('renders a label of any shape', () => {
    expect(render('412', <strong>Reporting live</strong>)).toContain(
      '<div class="pn-Stat-label"><strong>Reporting live</strong></div>',
    )
    expect(render('412', ['Reporting ', 'live'])).toContain(
      '<div class="pn-Stat-label">Reporting live</div>',
    )
  })

  it('says the locale\'s "Unknown", or unknownLabel', () => {
    expect(
      renderToStaticMarkup(
        <PerronProvider locale="da">
          <Stat label="Rapporterer live" />
        </PerronProvider>,
      ),
    ).toContain('<span class="pn-VisuallyHidden">Ukendt</span>')
    expect(renderToStaticMarkup(<Stat label="Average delay" unknownLabel="No data" />)).toContain(
      '<span class="pn-VisuallyHidden">No data</span>',
    )
  })

  it('merges slotProps into each part, its own class and children kept (CR-7)', () => {
    const markup = renderToStaticMarkup(
      <Stat
        label="Reporting live"
        slotProps={{
          label: { className: 'mine', render: <span />, children: 'lost' },
          value: { id: 'figure', render: <strong /> },
        }}
      >
        412
      </Stat>,
    )
    expect(markup).toBe(
      '<div class="pn-Stat"><span class="pn-Stat-label mine">Reporting live</span><strong id="figure" class="pn-Stat-value">412</strong></div>',
    )
  })

  it('keeps its own props off the root, and passes the rest through (CR-8)', () => {
    const markup = renderToStaticMarkup(
      <Stat
        label="Reporting live"
        unknownLabel="No data"
        className="mine"
        id="live"
        render={<li />}
        slotProps={{}}
      >
        412
      </Stat>,
    )
    expect(markup).toMatch(/^<li class="pn-Stat mine" id="live"><div class="pn-Stat-label">/)
  })
})
