# Review: Select, round 4

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/select.md:267` Two lines disagree with line 71. The checklist's focus line says "opening moves focus to the chosen row", and the `Select.Popup` row (`:62`) says Base UI "moves focus into the list on open". Line 71 is right, and Base UI and Storybook agree with it. Opened from the keys with nothing chosen, focus goes to the first row, or to the last on ArrowUp. Opened by a press or by `defaultOpen` with nothing chosen, focus goes to the popup and no row is highlighted. The `DisabledItem` and `Controlled` plays now test that case. The two lines could say the same as line 71. This is round 2's P3-3, still open.
- **P3-2.** `docs/components/select.md:315` The `Invalid` story's error, "Choose a transport mode" (`packages/perron/src/components/Select/Select.stories.tsx:340`), repeats the placeholder in the box above it word for word. Its accessibility tree gives the combobox's value and its description as the same words. Content design asks an error to say what is wrong and how to put it right. This is round 2's P3-4, still open.
- **P3-3.** `docs/components/select.md:112` Select inherits Base UI's JSDoc for `name` and `disabled` (`:113`) through `FieldProps`. That text says each prop "takes precedence over" the same prop on "the `<Field.Control>` component", which Select never renders. The example in `error`'s JSDoc (`:111`), "Enter a stop name", belongs to a text field. The Field dependents may want wording that fits every control. This is round 2's P3-6, still open.
- **P3-4.** `packages/perron/src/components/Select/Select.stories.tsx:60` The `color-contrast` exception for `.pn-Select-value[data-placeholder]` sits in Select's meta, as CR-16 decides. The build's question 1 recommended putting it in `.storybook/preview.ts` instead. Combobox, the next Field dependent that draws a text placeholder, would have to repeat it, so the maintainer may want to settle where it lives.
