// Section leaves out an optional part whose value renders nothing (CR-1), names its region by its
// own title (CR-2) and keeps its own props off the root (CR-3). Spec: docs/components/section.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Section } from './Section.tsx'

const parts = (markup: string) =>
  ['header', 'title', 'action', 'content'].filter((part) =>
    markup.includes(`class="pn-Section-${part}"`),
  )

describe('Section', () => {
  it.each([
    ['left out', {}],
    ['null', { action: null, children: null }],
    ['false', { action: false, children: false }],
    ["''", { action: '', children: '' }],
    ['[]', { action: [], children: [] }],
    ['an array of nothing', { action: [null, false], children: ['', [undefined]] }],
  ])('renders only the header and title when the optional parts are %s', (_, props) => {
    const markup = renderToStaticMarkup(<Section title="Lines here" {...props} />)
    expect(parts(markup)).toEqual(['header', 'title'])
  })

  it('renders a part whose array holds something', () => {
    const markup = renderToStaticMarkup(
      <Section title="Departures" action={['', 0]}>
        {['', 'Nothing leaves this stop in the next hour.']}
      </Section>,
    )
    expect(parts(markup)).toEqual(['header', 'title', 'action', 'content'])
  })

  it.each([
    ['a string', 'Departures'],
    ['an element', <span key="title">Departures</span>],
    ['an array', ['Depar', 'tures']],
  ])('renders a title given as %s inside the heading', (_, title) => {
    const markup = renderToStaticMarkup(<Section title={title} />)
    expect(markup).toMatch(/<h3 class="pn-Section-title" id="[^"]+">(<span>)?Depar(<!-- -->)?tures/)
  })

  it('names the region by its title, with the caller’s id when given (CR-2)', () => {
    const own = renderToStaticMarkup(<Section title="Departures" aria-labelledby="other" />)
    const id = /<h3 class="pn-Section-title" id="([^"]+)"/.exec(own)?.[1]
    expect(id).toBeTruthy()
    expect(own).toContain(`aria-labelledby="${id}"`)

    const given = renderToStaticMarkup(
      <Section title="Departures" slotProps={{ title: { id: 'departures' } }} />,
    )
    expect(given).toContain('aria-labelledby="departures"')
    expect(given).toContain('id="departures"')
  })

  it('keeps the HTML title attribute and render off the root (CR-3)', () => {
    const markup = renderToStaticMarkup(<Section title="Departures" />)
    expect(markup).toMatch(/^<section class="pn-Section" aria-labelledby="[^"]+"><div/)
  })
})
