// FactList renders every shape its items' `label` and `value` accept, tells a value from an unknown
// one (CR-4), renders an empty list (CR-8), and keeps its own props off the DOM (CR-9).
// Spec: docs/components/fact-list.md.
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
import { FactList } from './FactList.tsx'

const render = (value: ReactNode, label: ReactNode = 'Speed') =>
  renderToStaticMarkup(<FactList items={[{ label, value }]} />)

const UNKNOWN_ITEM =
  '<div class="pn-FactList-item" data-unknown=""><dt class="pn-FactList-label">Speed</dt><dd class="pn-FactList-value" data-unknown=""><span aria-hidden="true">—</span><span class="pn-VisuallyHidden">Unknown</span></dd></div>'

describe('FactList', () => {
  it.each([
    ['a string', '32 km/h', '32 km/h'],
    ['a number', 32, '32'],
    ['0', 0, '0'],
    ["'0'", '0', '0'],
    [
      'an element',
      <a key="v" href="/vehicles/8412">
        8412
      </a>,
      '<a href="/vehicles/8412">8412</a>',
    ],
    ['a list', ['≈ ', 30], '≈ 30'],
  ])('renders %s as the value, as given', (_, value, shown) => {
    expect(render(value)).toBe(
      `<dl class="pn-FactList"><div class="pn-FactList-item"><dt class="pn-FactList-label">Speed</dt><dd class="pn-FactList-value">${shown}</dd></div></dl>`,
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
  ])('shows "—" and says "Unknown" when the value is %s', (_, value) => {
    expect(render(value)).toBe(`<dl class="pn-FactList">${UNKNOWN_ITEM}</dl>`)
  })

  it('renders a label of any shape', () => {
    expect(render('Movia', <strong>Operator</strong>)).toContain(
      '<dt class="pn-FactList-label"><strong>Operator</strong></dt>',
    )
    expect(render('08:14', ['Last ', 'report'])).toContain(
      '<dt class="pn-FactList-label">Last report</dt>',
    )
  })

  it('renders one item per fact, in order, each a label then a value (CR-2)', () => {
    const markup = renderToStaticMarkup(
      <FactList
        items={[
          { label: 'Operator', value: 'Movia', key: 'operator' },
          { label: 'Vehicle', value: '8412', key: 'vehicle' },
        ]}
      />,
    )
    expect(markup).toBe(
      '<dl class="pn-FactList"><div class="pn-FactList-item"><dt class="pn-FactList-label">Operator</dt><dd class="pn-FactList-value">Movia</dd></div><div class="pn-FactList-item"><dt class="pn-FactList-label">Vehicle</dt><dd class="pn-FactList-value">8412</dd></div></dl>',
    )
  })

  it('renders an empty items as an empty dl (CR-8)', () => {
    expect(renderToStaticMarkup(<FactList items={[]} className="mine" />)).toBe(
      '<dl class="pn-FactList mine"></dl>',
    )
  })

  it('says the locale\'s "Unknown", or unknownLabel', () => {
    expect(
      renderToStaticMarkup(
        <PerronProvider locale="da">
          <FactList items={[{ label: 'Hastighed' }]} />
        </PerronProvider>,
      ),
    ).toContain('<span class="pn-VisuallyHidden">Ukendt</span>')
    expect(
      renderToStaticMarkup(<FactList items={[{ label: 'Speed' }]} unknownLabel="No data" />),
    ).toContain('<span class="pn-VisuallyHidden">No data</span>')
  })

  it('merges slotProps into every part, its own class, data-unknown and children kept (CR-7)', () => {
    const markup = renderToStaticMarkup(
      <FactList
        items={[{ label: 'Speed' }]}
        slotProps={{
          item: { className: 'row', render: <section /> },
          label: { className: 'name', children: 'lost' },
          value: { className: 'mine', children: 'lost' },
        }}
      />,
    )
    expect(markup).toBe(
      '<dl class="pn-FactList"><section class="pn-FactList-item row" data-unknown=""><dt class="pn-FactList-label name">Speed</dt><dd class="pn-FactList-value mine" data-unknown=""><span aria-hidden="true">—</span><span class="pn-VisuallyHidden">Unknown</span></dd></section></dl>',
    )
  })

  it('keeps its own props off the root, and passes the rest through (CR-9)', () => {
    const markup = renderToStaticMarkup(
      <FactList
        items={[{ label: 'Operator', value: 'Movia' }]}
        unknownLabel="No data"
        className="mine"
        aria-label="Bus 8412"
        render={<dl data-panel="" />}
        slotProps={{}}
      />,
    )
    expect(markup).toMatch(
      /^<dl data-panel="" class="pn-FactList mine" aria-label="Bus 8412"><div class="pn-FactList-item">/,
    )
    expect(markup).not.toMatch(/items|unknownlabel|slotprops/i)
  })
})
