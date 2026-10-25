// Kbd renders every shape its `children` accept, as given, inside the one <kbd> with pn-Kbd first
// (CR-1). Spec: docs/components/kbd.md.
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Kbd } from './Kbd.tsx'

const render = (key: ReactNode) => renderToStaticMarkup(<Kbd>{key}</Kbd>)

describe('Kbd', () => {
  it.each([
    ['a string', 'Esc', 'Esc'],
    ['an element', <span key="k">Esc</span>, '<span>Esc</span>'],
    ['a list', ['F', 1], 'F1'],
  ])('renders %s as the key, inside the one <kbd>', (_, key, shown) => {
    expect(render(key)).toBe(`<kbd class="pn-Kbd">${shown}</kbd>`)
  })

  it("puts pn-Kbd first, before the caller's class (CR-1)", () => {
    expect(renderToStaticMarkup(<Kbd className="mine">Esc</Kbd>)).toBe(
      '<kbd class="pn-Kbd mine">Esc</kbd>',
    )
  })
})
