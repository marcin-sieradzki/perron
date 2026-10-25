// Count renders every shape its `children` accept, tells a count from an unknown one (CR-4, CR-5),
// and keeps its own props off the DOM (CR-1). Spec: docs/components/count.md.
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
import { Count } from './Count.tsx'

const render = (count: ReactNode) => renderToStaticMarkup(<Count>{count}</Count>)

describe('Count', () => {
  it.each([
    ['a string', '1 204', '1 204'],
    ['a number', 3, '3'],
    ['0', 0, '0'],
    ["'0'", '0', '0'],
    ['a capped count', '99+', '99+'],
    ['an element', <strong key="c">12</strong>, '<strong>12</strong>'],
    ['a list', ['≈ ', 30], '≈ 30'],
  ])('renders %s as the count, as given (CR-2)', (_, count, shown) => {
    expect(render(count)).toBe(`<span class="pn-Count" data-color="neutral">${shown}</span>`)
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
  ])('shows "—" and says "Unknown" when the count is %s (CR-4, CR-5)', (_, count) => {
    expect(render(count)).toBe(
      '<span class="pn-Count" data-color="neutral" data-unknown=""><span aria-hidden="true">—</span><span class="pn-VisuallyHidden">Unknown</span></span>',
    )
  })

  it.each(['neutral', 'success', 'warning', 'danger', 'info'] as const)(
    'carries data-color="%s" (CR-3)',
    (color) => {
      expect(renderToStaticMarkup(<Count color={color}>3</Count>)).toBe(
        `<span class="pn-Count" data-color="${color}">3</span>`,
      )
    },
  )

  it('says the locale\'s "Unknown", or unknownLabel', () => {
    expect(
      renderToStaticMarkup(
        <PerronProvider locale="da">
          <Count />
        </PerronProvider>,
      ),
    ).toContain('<span class="pn-VisuallyHidden">Ukendt</span>')
    expect(renderToStaticMarkup(<Count unknownLabel="No data" />)).toContain(
      '<span class="pn-VisuallyHidden">No data</span>',
    )
  })

  it('keeps its own props off the root, and passes the rest through (CR-1, CR-8)', () => {
    const clicked = () => {}
    const markup = renderToStaticMarkup(
      <Count
        color="danger"
        unknownLabel="No data"
        className="mine"
        id="delays"
        data-color="info"
        render={<strong />}
        onClick={clicked}
      >
        3
      </Count>,
    )
    expect(markup).toBe('<strong class="pn-Count mine" id="delays" data-color="danger">3</strong>')
  })
})
