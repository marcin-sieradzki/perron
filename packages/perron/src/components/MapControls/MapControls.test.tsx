// MapControls' props type holds the rule of its spec's Do and don't checked by types: each line
// under a `@ts-expect-error DD-<n>` is one the compiler rejects, so `npm run typecheck` fails the
// day MapControlsProps accepts it. Spec: docs/components/map-controls.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MapControls } from './MapControls.tsx'

describe("MapControls' props type", () => {
  it('takes no children, which the bar drops at run time (DD-8)', () => {
    const markup = renderToStaticMarkup(
      // @ts-expect-error DD-8: the bar's buttons are its own; another action goes in a Toolbar beside it
      <MapControls>
        <button type="button">Layers</button>
      </MapControls>,
    )
    expect(markup).toContain('role="toolbar"')
    expect(markup).not.toContain('Layers')
  })
})
