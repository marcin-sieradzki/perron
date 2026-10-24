// EmptyState leaves out an optional part whose value renders nothing (CR-1), so no empty wrapper
// takes up a gap. Spec: docs/components/empty-state.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState.tsx'

const parts = (markup: string) =>
  ['icon', 'title', 'description', 'action'].filter((part) =>
    markup.includes(`class="pn-EmptyState-${part}"`),
  )

describe('EmptyState', () => {
  it.each([
    ['left out', {}],
    ['null', { icon: null, children: null, action: null }],
    ['false', { icon: false, children: false, action: false }],
    ["''", { icon: '', children: '', action: '' }],
    ['[]', { icon: [], children: [], action: [] }],
    ['an array of nothing', { icon: [null, false], children: ['', [undefined]], action: [true] }],
  ])('renders only the title when the optional parts are %s', (_, props) => {
    const markup = renderToStaticMarkup(<EmptyState title="No departures" {...props} />)
    expect(parts(markup)).toEqual(['title'])
  })

  it('renders a part whose array holds something', () => {
    const markup = renderToStaticMarkup(
      <EmptyState title="No departures" icon={[null, <svg key="icon" />]} action={['', 0]}>
        {['', 'Try a line number such as 5C.']}
      </EmptyState>,
    )
    expect(parts(markup)).toEqual(['icon', 'title', 'description', 'action'])
  })

  it('keeps the HTML title attribute and render off the root (CR-3)', () => {
    const markup = renderToStaticMarkup(<EmptyState title="No departures" />)
    expect(markup).toMatch(/^<div class="pn-EmptyState">/)
  })
})
