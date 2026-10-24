// Base UI is what Perron's components are built on: @mylder/perron depends on it, pinned, and on
// the app's React 19, and a Base UI part imported from its own entry point typechecks and renders.
import { Button } from '@base-ui/react/button'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

const pkg = JSON.parse(readFileSync(join(import.meta.dirname, 'package.json'), 'utf8'))

describe('Base UI in @mylder/perron', () => {
  it('is a dependency pinned to exactly 1.9.0', () => {
    expect(pkg.dependencies['@base-ui/react']).toBe('1.9.0')
  })

  it.each(['react', 'react-dom'])('takes %s 19 from the app as a peer', (name) => {
    expect(pkg.peerDependencies?.[name]).toBe('^19.0.0')
    expect(pkg.dependencies[name]).toBeUndefined()
  })

  it('renders a Button from @base-ui/react/button', () => {
    const html = renderToStaticMarkup(createElement(Button, { disabled: true }, 'Save'))
    expect(html).toMatch(/^<button[^>]* type="button"[^>]*>Save<\/button>$/)
    expect(html).toContain('data-disabled')
  })
})
