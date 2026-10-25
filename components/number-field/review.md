# Review: NumberField, round 9

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/NumberField/NumberField.css:67` `font-variant-numeric: tabular-nums` (Tokens row `docs/components/number-field.md:160`, answer 6) sets the group separator and the decimal point a full figure wide. So `LongWords` and `Danish` read spaced out next to the description's proportional figures. Should the input keep tabular figures, or use proportional ones?
- **P3-2.** `packages/perron/src/components/NumberField/NumberField.css:38` A mouse press on a stepper makes Base UI focus the input, and a text input always matches `:focus-visible`. So the box draws its ring after every pointer press, as TextField and SearchField do. Should the ring show after a pointer press?
- **P3-3.** `packages/perron/src/components/NumberField/NumberField.tsx:77` The contract's State and events section still does not name `onChangeCommitted(event, value, details)` (answer 4), the library's first commit event, and Slider will copy whatever NumberField sets.
- **P3-4.** `packages/perron/src/components/NumberField/NumberField.tsx:16` `name`, `required` and `readOnly` keep Base UI's JSDoc, as the contract's Props rule asks. So they read differently from TextField's own JSDoc for the same props, which goes against api-consistency's "one prop, one description", and no rule says which wins.
- **P3-5.** `docs/components/number-field.md:105` The `numberFieldLabel` row still ends with "(Owned strings)", which its JSDoc at `packages/perron/src/components/NumberField/NumberField.tsx:104` does not. Line 61 makes each declared prop's row its JSDoc, so the section reference should come out of the row.
- **P3-6.** `docs/components/number-field.md:203` Enter doesn't submit a form that holds a NumberField and no submit button, because Base UI's hidden `<input type="number">` is a second field, while a lone TextField's form is submitted. The contract's Forms line in `docs/components/README.md` does not say so.
- **P3-7.** `docs/components/number-field.md:257` CR-3 says each inner part's `slotProps` value is merged with `mergeProps`. The code spreads `slotProps.group` (`NumberField.tsx:241`) and the frame's `label`, `description` and `error` (`NumberField.tsx:215-226`), setting only their class. The contract's Customising rule allows that, so the code holds and CR-3 should say so.
- **P3-8.** `docs/components/number-field.md:206` "A paste is spliced in at the caret when the result parses" hides that Base UI parses with `parseFloat`: pasting "two" after the 1 in "18" leaves "1two8" in the box and the value 1. Should the spec say so, or should NumberField refuse such a paste, which CR-1 would then have to allow?
- **P3-9.** `docs/components/number-field.md:312` The Do row tells callers to save on `onChangeCommitted`. The `InForm` row (line 299) proves that a browser autofill calls `onChange` with `'none'` and never `onChangeCommitted`, so a caller who follows the row loses an autofilled number the person never touches.
- **P3-10.** `packages/perron/src/components/NumberField/NumberField.css:29` A read-only box still takes the Fields hover layer, since the rule excludes only `[data-disabled]`, as the Tokens row at `docs/components/number-field.md:147` and CR-7 ask. The contract's Pointer feedback says neither hover nor pressed applies to a read-only part. TextField and SearchField hover the same way when read-only. Does the family drop the hover on `[data-readonly]`?
- **P3-11.** `docs/components/number-field.md:125` The new prose leaves the default cursor on the group's own strips round the buttons, which a press doesn't focus. I measured them on `components-numberfield--hover` in light and dark, LTR and RTL: 2 px between the buttons, 2 px plus the edge after them, and 1 px above and below each. SearchField sets `cursor: text` on its whole input group (`packages/perron/src/components/SearchField/SearchField.css:37`), so its equivalent strips show a text cursor. The family has no one rule for a box's dead strips. Which should both follow?
- **P3-12.** `docs/components/number-field.md:155` The rows at lines 153 and 155 and the prose at line 125 now promise that a press in the space before the buttons lands on the input and focuses it. This round's probe confirms it: a press 1 px before the decrement button focuses the input in both directions. But no `play` test proves it, so a later change to the input's end padding or the group's layout could quietly bring back the dead strip that round 8's P2-2 named. Should `Hover` or `Steppers` press that strip and check focus?
