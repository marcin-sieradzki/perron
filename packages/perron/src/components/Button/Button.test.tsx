// Button's props type holds the rule of its spec's Do and don't checked by types: each line under
// a `@ts-expect-error DD-<n>` is one the compiler rejects, so `npm run typecheck` fails the day
// ButtonProps accepts it. Spec: docs/components/button.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Button } from './Button.tsx'

describe("Button's props type", () => {
  it("rejects MUI's variant, color and size values, which nothing stops at run time (DD-5)", () => {
    const misuses = [
      // @ts-expect-error DD-5: MUI's contained is no variant of Button
      <Button variant="contained">Save</Button>,
      // @ts-expect-error DD-5: MUI's primary is no color of Button; brand is the main action's
      <Button color="primary">Save</Button>,
      // @ts-expect-error DD-5: Button has no large size
      <Button size="large">Save</Button>,
    ]
    expect(misuses.map((m) => renderToStaticMarkup(m))).toEqual([
      expect.stringContaining('data-variant="contained"'),
      expect.stringContaining('data-color="primary"'),
      expect.stringContaining('data-size="large"'),
    ])
  })
})
