// Fieldset's props type holds the rule of its spec's Do and don't checked by types: each line under
// a `@ts-expect-error DD-<n>` is one the compiler rejects, so `npm run typecheck` fails the day
// FieldsetProps accepts it. Spec: docs/components/fieldset.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Fieldset } from './Fieldset.tsx'

describe("Fieldset's props type", () => {
  it('requires the legend, which nothing asks for at run time (DD-5)', () => {
    const misuses = [
      // @ts-expect-error DD-5: the legend is the group's one name, seen and heard alike
      <Fieldset>
        <input type="checkbox" />
      </Fieldset>,
      // @ts-expect-error DD-5: an aria-label on the root names the group for the ear alone
      <Fieldset aria-label="Show on the map">
        <input type="checkbox" />
      </Fieldset>,
    ]
    expect(misuses.map((m) => renderToStaticMarkup(m))).toEqual([
      expect.stringContaining('class="pn-Fieldset-legend"></div>'),
      expect.stringContaining('class="pn-Fieldset-legend"></div>'),
    ])
  })
})
