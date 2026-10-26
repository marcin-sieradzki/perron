// TopBar renders its filters group and its tools group only when the caller gives them something
// to render (CR-7), each slot in every shape a ReactNode takes, the groups in their DOM order for
// each size (CR-3, CR-16), and its time as it is given or "—" (CR-4). Spec: docs/patterns/top-bar.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { attribute, openingTag } from '../../testing/markup.ts'
import { TopBar } from './TopBar.tsx'

/** The groups of the root, in the DOM's order. */
const groups = (markup: string) =>
  [...markup.matchAll(/class="pn-TopBar-(identity|filters|tools)"/g)].map((match) => match[1])

describe('TopBar', () => {
  it.each([
    ['left out', undefined],
    ['null', null],
    ['false', false],
    ['an empty string', ''],
    ['an empty list', []],
  ])('renders no filters or tools group when both are %s', (_, node) => {
    const markup = renderToStaticMarkup(<TopBar time="08:14:05" filters={node} tools={node} />)
    expect(groups(markup)).toEqual(['identity'])
    expect(markup).not.toContain('<fieldset')
  })

  it.each([
    ['a string', 'Bus', 'Bus'],
    ['a number', 412, '412'],
    ['an element', <button key="bus">Bus</button>, '<button>Bus</button>'],
    ['a fragment', <>Bus</>, 'Bus'],
    ['a list', ['Bus', <button key="metro">Metro</button>], 'Bus<button>Metro</button>'],
  ])('renders filters and tools given as %s inside their groups', (_, node, html) => {
    const markup = renderToStaticMarkup(<TopBar time="08:14:05" filters={node} tools={node} />)
    expect(markup).toContain(
      `<fieldset class="pn-TopBar-filters" aria-label="Filters">${html}</fieldset>`,
    )
    expect(markup).toContain(`<div class="pn-TopBar-tools">${html}</div>`)
  })

  it.each([
    ['medium', ['identity', 'filters', 'tools']],
    ['small', ['identity', 'tools', 'filters']],
    // one render for both widths, in the wide order; its CSS places the groups on a phone (CR-16)
    ['responsive', ['identity', 'filters', 'tools']],
  ] as const)('puts the groups of a %s bar in their DOM order', (size, order) => {
    const markup = renderToStaticMarkup(
      <TopBar size={size} time="08:14:05" filters="Bus" tools="About" />,
    )
    expect(groups(markup)).toEqual(order)
    expect(attribute(openingTag(markup, 'pn-Surface'), 'data-size')).toBe(size)
  })

  it.each([
    ['HH:MM:SS', '08:14:05'],
    ['HH:MM', '08:14'],
  ])('gives a time as %s as it is, with its dateTime', (_, time) => {
    const markup = renderToStaticMarkup(<TopBar time={time} />)
    expect(attribute(openingTag(markup, 'pn-TopBar-time'), 'dateTime')).toBe(time)
    expect(markup).toContain(`>Updated ${time}</time>`)
  })

  it.each([
    ['left out', undefined],
    ['an empty string', ''],
  ])('reads "Updated —" with no dateTime while the time is %s', (_, time) => {
    const markup = renderToStaticMarkup(<TopBar time={time} />)
    expect(markup).toContain('<time class="pn-TopBar-time">Updated —</time>')
  })
})
