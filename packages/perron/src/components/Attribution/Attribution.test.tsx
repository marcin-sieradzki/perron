// Attribution renders every shape its `children` accept, as given, inside the one <small> with
// pn-Attribution first (CR-1). Spec: docs/components/attribution.md.
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Attribution } from './Attribution.tsx'

const render = (credits: ReactNode) => renderToStaticMarkup(<Attribution>{credits}</Attribution>)

describe('Attribution', () => {
  it.each([
    ['a string', 'Departures from Rejseplanen', 'Departures from Rejseplanen'],
    [
      'an element',
      <a key="osm" href="https://www.openstreetmap.org/copyright">
        OpenStreetMap contributors
      </a>,
      '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    ],
    ['a list', ['Map data © ', 'OpenStreetMap'], 'Map data © OpenStreetMap'],
  ])('renders %s as the credits, inside the one <small>', (_, credits, shown) => {
    expect(render(credits)).toBe(`<small class="pn-Attribution">${shown}</small>`)
  })

  it("puts pn-Attribution first, before the caller's class (CR-1)", () => {
    expect(renderToStaticMarkup(<Attribution className="mine">Credits</Attribution>)).toBe(
      '<small class="pn-Attribution mine">Credits</small>',
    )
  })
})
