// NumberField's props type holds the rule of its spec's Do and don't checked by types: each line
// under a `@ts-expect-error DD-<n>` is one the compiler rejects, so `npm run typecheck` fails the
// day NumberFieldProps accepts it. Spec: docs/components/number-field.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NumberField } from './NumberField.tsx'

describe("NumberField's props type", () => {
  it('rejects a number the caller formats, which the box shows wrong at run time (DD-6)', () => {
    const misuses = [
      // @ts-expect-error DD-6: value is a number; the locale writes it
      <NumberField label="Departures to show" value="1,500" />,
      // @ts-expect-error DD-6: defaultValue is a number too; a Danish "1.500" is not 1500
      <NumberField label="Departures to show" defaultValue="1.500" />,
    ]
    expect(misuses.map((m) => renderToStaticMarkup(m))).toEqual([
      expect.stringContaining('class="pn-NumberField-input" value="NaN"'),
      expect.stringContaining('class="pn-NumberField-input" value="1.5"'),
    ])
  })
})
