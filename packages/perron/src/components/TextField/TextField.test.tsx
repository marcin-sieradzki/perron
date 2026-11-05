// TextField's props type holds the rule of its spec's Do and don't checked by types: each line under
// a `@ts-expect-error DD-<n>` is one the compiler rejects, so `npm run typecheck` fails the day
// TextFieldProps accepts it. Spec: docs/components/text-field.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TextField } from './TextField.tsx'

describe("TextField's props type", () => {
  it('rejects the search and number types, which nothing stops at run time (DD-8)', () => {
    const misuses = [
      // @ts-expect-error DD-8: a search box is SearchField, with its own keys and words
      <TextField label="Stop" type="search" />,
      // @ts-expect-error DD-8: a number is NumberField, with its own keys and steps
      <TextField label="Departures shown" type="number" />,
    ]
    expect(misuses.map((m) => renderToStaticMarkup(m))).toEqual([
      expect.stringContaining('type="search"'),
      expect.stringContaining('type="number"'),
    ])
  })
})
