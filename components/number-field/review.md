# Review: NumberField, round 4

## P1

None.

## P2

- **P2-1.** `docs/components/number-field.md:276` The round-3 gaps are now covered, but no `play` step yet proves the following behaviours that the spec promises, so a regression in any of them would still pass `npm run test:stories`. This breaks the test-coverage checklist: one line per Keyboard row and part, per behaviour a `play` cell promises, and per Base UI behaviour the spec says the component keeps. Each needs a `play` step in the Stories table and the stories:
  - (1) **The `'input-blur'` reason (line 84).** Leaving the box after a clamped entry calls `onChange` with `'input-blur'`. Base UI's `NumberFieldInput.js:187` does this, so `Typing`'s Tab out calls `onChange(20, 'input-blur')`, but the play reads only `onChangeCommitted`'s value.
  - (2) **Rounding on leaving (line 200).** When `format` rounds the number, leaving writes the rounded number and commits it. No story types a number that `format` rounds.
  - (3) **Leaving a read-only field (line 200).** It only marks the field touched. `ReadOnly` checks its handlers before its Shift+Tab, and reads neither `data-touched` nor the absence of `onChangeCommitted` after leaving.
  - (4) **Arrow keys at a bound (line 196).** `ArrowUp` and `ArrowDown` are clamped to `max` and `min`. `Keyboard` reaches 20 and 1 only by `End` and `Home`, and never presses `ArrowUp` at 20 or `ArrowDown` at 1 to show the number stays and no `onChange` is called.
  - (5) **`Shift` + `ArrowDown` (line 197).** It is never pressed; only `Shift` + `ArrowUp` is.
  - (6) **`details.cancel()` (line 84 and CR-4).** No play cancels a change and checks that the number stays as it was.
  - (7) **`data-filled` and `data-focused` (line 57).** Base UI marks the field filled and focused for Field, but no play reads either attribute.
  - (8) **The group's `data-touched` at first (line 278).** `Default`'s row promises that "the root and the group carry no `data-touched` at first", but the play checks only the root before focus leaves.
  - (9) **`Enter` with no submit button (line 201).** A form without a submit button isn't submitted on `Enter`. `InForm` proves only the form that has one.
  - (10) **Danish parsing (line 57 and CR-6).** The person's typed text is parsed in the locale. `Danish` only steps with `ArrowUp` and types nothing, for example "2.000" read as 2000.
  - (11) **The hidden label (line 203).** A press on a hidden label focuses the input through Base UI's own handler. `HiddenLabel` never presses its `VisuallyHidden` label.
  - (12) **No pressed look on a button that can't step (CR-15).** The pressed rule must leave out a button at its bound or in a read-only field. `Bounds` and `ReadOnly` check only the hover rule (`onHover`), never `stateFill(button, ':active')`.

## P3

- **P3-1.** `packages/perron/src/components/NumberField/NumberField.css:60` `font-variant-numeric: tabular-nums` comes from the Tokens row at `docs/components/number-field.md:159` and answer 6. It makes the group separator a full figure wide: in both themes the `Danish` box reads "1 . 500" beside the description's proportional "5.000", and `LongWords` reads "100 , 000 , …". Should the input keep tabular figures, which hold the digits still while a button is held, or use proportional ones?
- **P3-2.** `packages/perron/src/components/NumberField/NumberField.css:38` A mouse press on a stepper makes Base UI focus the input, and a text input always matches `:focus-visible`, so the box draws its focus ring after every pointer press. Measured in `components-numberfield--steppers` in light and dark: while Increase is held, the active element is `pn-NumberField-input`, `:focus-visible` is true, and the group's outline is solid 2px. TextField and SearchField behave the same way. Should the ring show after a pointer press?
- **P3-3.** `packages/perron/src/components/NumberField/NumberField.tsx:76` `onChangeCommitted(event, value, details)` (answer 4) is the library's first commit event, and the contract's State and events section does not name it. Slider will copy whatever NumberField sets here, so the event may belong in the contract's list.
- **P3-4.** `packages/perron/src/components/NumberField/NumberField.tsx:16` `name`, `required` and `readOnly` keep Base UI's JSDoc, as the contract's Props rule asks. They therefore read differently from TextField's own JSDoc for the same props: "Identifies the field when a form is submitted." against "The name the words are submitted under in a form's `FormData`." That breaks api-consistency's "one prop, one description" rule. No rule says which of the two wins.
- **P3-5.** `docs/components/number-field.md:125` The prose says `space.050` at the box's end puts a `size.control` button "1 px inside the edge". As rendered, the box is 38 px with a 1 px edge and 2 px of `padding-inline-end`, and the button is 34 px. So the increment button sits 2 px inside the edge at the inline end and 1 px inside at the top and bottom, as SearchField's clear button does. The sentence should say so.
- **P3-6.** `docs/components/number-field.md:105` The `numberFieldLabel` Props row ends with "(Owned strings)", but its JSDoc at `packages/perron/src/components/NumberField/NumberField.tsx:103` does not. Line 61 says each declared prop takes its row's description as its JSDoc, so the trailing section reference should come out of the row.
- **P3-7.** `docs/components/number-field.md:201` The Keyboard row now says that a form without a submit button isn't submitted on `Enter`, because Base UI's hidden `<input type="number">` is a second field. A lone TextField's form is submitted on `Enter`. The contract's Forms section does not say this, so the maintainer may want it to, or to tell callers always to give such a form a submit button.
