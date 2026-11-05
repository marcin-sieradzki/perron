// Fieldset's props type requires `legend`, so `npm run typecheck` fails the day FieldsetProps takes a
// fieldset with none. It catches half of its spec's DD-5, which stays checked by review:
// `legend=""` compiles. Spec: docs/components/fieldset.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Fieldset } from './Fieldset.tsx'

describe("Fieldset's props type", () => {
  it('requires the legend, which nothing asks for at run time', () => {
    const misuses = [
      // @ts-expect-error: the legend is the group's one name, seen and heard alike
      <Fieldset>
        <input type="checkbox" />
      </Fieldset>,
      // @ts-expect-error: an aria-label on the root names the group for the ear alone
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
