# Review: NumberField, round 3

## P1

None.

## P2

- **P2-1.** `docs/components/number-field.md:276` Several behaviours that the Keyboard table, the Props rows and the "Base UI already does" line promise are not proved by any `play` step. A regression in any of them would pass `npm run test:stories`, which breaks the test-coverage checklist (one line per Keyboard row, per promised behaviour and per Base UI behaviour the spec says the component keeps). The `Stories` table should give each a `play` step:
  - (1) ArrowUp and ArrowDown calling `onChangeCommitted` with the reason `'keyboard'` (line 196). The `Keyboard` story reads only `onChange`.
  - (2) A held button stepping again every 60 ms after 400 ms, calling `onChange` on each step and `onChangeCommitted` once on release (line 202, and the `onChangeCommitted` row at line 85, whose whole advice rests on it). `Steppers` only clicks.
  - (3) Leaving the input marking the field touched, `data-touched` (line 200). No play reads it.
  - (4) `Home` and `End` moving the caret when `min` or `max` is unset (line 199).
  - (5) A typed minus sign refused while `min` is 0 or above (line 57). `Typing` types only a letter.
  - (6) The wheel stepping the number only with `allowWheelScrub` (line 57).
  - (7) A paste spliced in at the caret, calling `onChange` with `'input-paste'` (lines 84 and 204).
  - (8) The browser's own `min`, `max` and `step` checks on the hidden input marking the field invalid, for example a typed 25 with `allowOutOfRange` showing the `rangeOverflow` message (line 57).

## P3

- **P3-1.** `packages/perron/src/components/NumberField/NumberField.css:60` `font-variant-numeric: tabular-nums` (the Tokens row at `docs/components/number-field.md:159`, answer 6) gives the group separator and the decimal point a full figure's width. In both themes the `Danish` story's box reads "1 . 500" beside the description's proportional "5.000", and `LongWords` reads "100 , 000 , …". Should the maintainer keep tabular figures, which hold the digits still while a button is held, or use proportional figures?
- **P3-2.** `packages/perron/src/components/NumberField/NumberField.css:38` A mouse press on a stepper makes Base UI's `focusInput` focus the input, and a text input always matches `:focus-visible`, so the box shows its focus ring after every pointer press. Measured in `components-numberfield--steppers`, light and dark: while the button is held, the active element is `pn-NumberField-input`, `:focus-visible` is true and the group's outline is solid 2px. TextField and SearchField behave the same way. Should the ring show after a pointer press?
- **P3-3.** `packages/perron/src/components/NumberField/NumberField.tsx:76` `onChangeCommitted(event, value, details)` (answer 4) is the library's first commit event, and the contract's [State and events](docs/components/README.md#state-and-events) does not name it. Slider will copy whatever NumberField sets here, so the event may belong in that list.
- **P3-4.** `packages/perron/src/components/NumberField/NumberField.tsx:16` `name`, `required` and `readOnly` keep Base UI's JSDoc, as the contract's [Props](docs/components/README.md#props) rule asks. They therefore read differently from TextField's own JSDoc for the same props: "Identifies the field when a form is submitted." against "The name the words are submitted under in a form's `FormData`." That breaks api-consistency's "one prop, one description" rule. No rule says which of the two rules wins, so the maintainer has to decide.
- **P3-5.** `docs/components/number-field.md:125` The prose says `space.050` at the box's end puts a `size.control` button "1 px inside the edge". As rendered, with a 38 px box, a 1 px edge, a 2 px `padding-inline-end` and a 34 px button, the increment button sits 2 px inside the edge at the inline end and 1 px inside at the top and bottom. SearchField's clear button has the same geometry, so the sentence should say this.
- **P3-6.** `docs/components/number-field.md:105` The `numberFieldLabel` Props row ends with "(Owned strings)", but its JSDoc at `packages/perron/src/components/NumberField/NumberField.tsx:103` does not. The Props section (line 61) says each declared prop takes its row's description as its JSDoc, so the trailing section reference should come out of the row.
- **P3-7.** `docs/components/number-field.md:57` The "Base UI already does" line says Base UI allows a minus sign "only while `min` is below zero or `allowOutOfRange` is set". Base UI also allows it when `min` is left out: `NumberFieldRoot.js:82` sets `minWithDefault = min ?? Number.MIN_SAFE_INTEGER`, and line 156 tests `minWithDefault < 0`. The line should add "or unset" so it matches the installed source it cites.
- **P3-8.** `docs/components/number-field.md:201` Measured in `components-numberfield--in-form`: with the Save button removed, Enter in the input does not submit the form. Base UI's hidden `<input type="number">` is a second field that blocks implicit submission, so a form holding only a NumberField and no submit button never submits on Enter, unlike a lone TextField. CR-1 keeps NumberField from adding a key handler. The maintainer may want the contract's "Forms" section to say so, or to tell callers to always give such a form a submit button.
