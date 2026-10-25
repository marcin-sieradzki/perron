# Review: NumberField, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/NumberField/NumberField.css:60` `font-variant-numeric: tabular-nums` (the spec's Tokens row at `docs/components/number-field.md:159`, answer 6) gives the group separator and the decimal point a full figure's width. The `Danish` story's box reads "1 . 500" beside the description's proportional "5.000", and `LongWords` reads "100 , 000 , …" in both themes. Should the maintainer keep tabular figures, which hold the digits still while a button is held, or use proportional figures?
- **P3-2.** `packages/perron/src/components/NumberField/NumberField.css:38` A mouse press on a stepper makes Base UI's `focusInput` focus the input, and a text input always matches `:focus-visible`. So the box keeps its focus ring after every pointer press: measured in `components-numberfield--steppers`, light and dark, the active element is `pn-NumberField-input` with `:focus-visible` true while the button is pressed. TextField and SearchField behave the same way. Should the ring show after a pointer press?
- **P3-3.** `packages/perron/src/components/NumberField/NumberField.tsx:76` `onChangeCommitted(event, value, details)` (answer 4) is the library's first commit event, and the contract's [State and events](docs/components/README.md#state-and-events) does not name it. Slider will copy whatever NumberField sets here, so the event may belong in that list.
- **P3-4.** `packages/perron/src/components/NumberField/NumberField.tsx:16` `name`, `required` and `readOnly` keep Base UI's JSDoc, as the contract's [Props](docs/components/README.md#props) rule asks, so they read differently from TextField's own JSDoc for the same props (for example "Identifies the field when a form is submitted." against "The name the words are submitted under in a form's `FormData`."). That breaks api-consistency's "one prop, one description" rule. No rule decides which of the two wins, so the maintainer has to settle it.
- **P3-5.** `docs/components/number-field.md:125` The prose says `space.050` at the box's end puts a `size.control` button "1 px inside the edge". As rendered, with a 38 px box, a 1 px edge, a 2 px `padding-inline-end` and a 34 px button, the increment button sits 2 px inside the edge at the inline end and 1 px inside at the top and bottom. This is the same geometry as SearchField's clear button, so the sentence should say so.
- **P3-6.** `docs/components/number-field.md:105` The `numberFieldLabel` Props row ends with "(Owned strings)", but its JSDoc at `packages/perron/src/components/NumberField/NumberField.tsx:103` does not. The spec's Props section (line 61) says each declared prop takes its row's description as its JSDoc, so the trailing section reference should come out of the row.
- **P3-7.** `docs/components/number-field.md:57` The "Base UI already does" line says Base UI allows a minus sign "only while `min` is below zero or `allowOutOfRange` is set". Base UI also allows it when `min` is left out: `NumberFieldRoot.mjs` tests `minWithDefault < 0`, and with no `min` that value is `Number.MIN_SAFE_INTEGER`. The line should add "or unset", to match the installed source it cites.
