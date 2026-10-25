# Review: Select, round 3

## P1

None.

## P2

- **P2-1.** `docs/components/select.md:308` The Stories table, and so the plays in `packages/perron/src/components/Select/Select.stories.tsx`, still test three behaviours that the spec promises and Base UI delivers. I confirmed all three by hand in Storybook. (1) Space, which the Keyboard table's `Enter`, `Space` row (`:236`) promises both on the closed trigger (open, `'trigger-press'`) and on a highlighted row (choose it, close the list, return focus). No play presses Space, though Button, IconButton and MapControls each test it, and Space also counts as a typed character in Base UI's typeahead. (2) The `'cancel-open'` dismissal, a press on the closed trigger dragged off and released outside, which line 71 and the `onClose` row (`:103`) name. (3) The pointer highlighting the row under it, from line 71 and the `item` hover row (`:218`). This breaks the contract's Stories rule, "a `play` test for every behaviour the component promises (dismissal, focus, keyboard)", which round 2's P2-3 applied to the four gaps it named; the Space test can sit in `Open` and `Controlled`, beside their Enter steps.

## P3

- **P3-1.** `docs/components/select.md:267` The checklist's focus line says "opening moves focus to the chosen row", and the `Select.Popup` row (`:62`) says Base UI "moves focus into the list on open". Line 71 holds, and matches Base UI and Storybook: opened from the keys with nothing chosen, focus goes to the first row, or the last on ArrowUp; opened by a press or by `defaultOpen` with nothing chosen, it goes to the popup and no row is highlighted. The two lines could say the same as line 71 (round 2's P3-3, still open).
- **P3-2.** `docs/components/select.md:315` The `Invalid` story's error, "Choose a transport mode" (`packages/perron/src/components/Select/Select.stories.tsx:258`), repeats the placeholder in the box above it word for word. Its accessibility tree reads the combobox's value and its description as the same words. Content design asks an error to say what is wrong and how to put it right (round 2's P3-4, still open).
- **P3-3.** `docs/components/select.md:112` The JSDoc Select inherits through `FieldProps` for `name` and `disabled` (`:113`) is Base UI's. It says each "takes precedence over" the prop on "the `<Field.Control>` component", which Select never renders. `error`'s example (`:111`), "Enter a stop name", is a text field's. The Field dependents may want wording that fits every control (round 2's P3-6, still open).
- **P3-4.** `packages/perron/src/components/Select/Select.stories.tsx:60` The `color-contrast` exception for `.pn-Select-value[data-placeholder]` lives in Select's meta, as CR-16 now decides, not in `.storybook/preview.ts` as the build's question 1 recommended. Combobox, the next Field dependent that draws a text placeholder, would repeat it, so the maintainer may want to settle where it lives.
