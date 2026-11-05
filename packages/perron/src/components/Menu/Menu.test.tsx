// Menu's props type holds the rule of its spec's Do and don't checked by types: each line under a
// `@ts-expect-error DD-<n>` is one the compiler rejects, so `npm run typecheck` fails the day
// MenuProps accepts it. Spec: docs/components/menu.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Menu, MenuItem } from './Menu.tsx'

describe("Menu's props type", () => {
  it('requires the trigger, without which the menu fails at run time (DD-1)', () => {
    const render = () =>
      renderToStaticMarkup(
        // @ts-expect-error DD-1: a menu opened by `open` alone has no button to name it or return focus to
        <Menu open>
          <MenuItem>Kiosk mode</MenuItem>
        </Menu>,
      )
    expect(render).toThrow(TypeError)
  })
})
