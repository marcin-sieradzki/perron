# Review: SearchField, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/search-field.md:203` The ARIA table's `item` row says a row's name comes from "the item's `label`, then its `description`, and the text of its `startIcon`", which suggests the mark's words come last, and the checklist at line 212 lists them in the same order. In the DOM the start icon span comes before the text span (CR-2), so the mark's words are heard first: the `WithMarks` story asserts "5C 5C Bus, Husum Torv to Lufthavnen", and the round 3 accessibility tree reads "250S 250S Bus, Buddinge St. to Ishøj St.". The code and CR-2 are right, so the row and line 212 could give the heard order: start icon, label, description.
- **P3-2.** `docs/components/search-field.md:47` (carried from round 2) The Base UI parts row says `Autocomplete.Root` renders "No element", and so does Anatomy line 35. In Base UI 1.9.0, `AriaCombobox.mjs:1283` renders a hidden `<input tabindex="-1" aria-hidden="true">` with no `name`, used for autofill, as the root `<div>`'s last child. Nothing breaks, but both lines describe the DOM wrongly.
- **P3-3.** `packages/perron/src/components/SearchField/SearchField.tsx:112` (carried from round 1) `onItemSelect(event, item)` is a new event name that later list components will copy, while MUI's Autocomplete reports a chosen option through `onChange`. The contract could settle what choosing a row is called in a list that keeps no selection.
- **P3-4.** `packages/perron/src/components/SearchField/SearchField.tsx:55` (carried from round 1) `hiddenLabel`, MUI's boolean, gets past the props gate's `<key>Label` rule only through `perron-allow(props)`. The contract's Props table (`docs/components/README.md:54`) could name it as an exception, so the next field doesn't need the same allowance.
- **P3-5.** `docs/components/README.md:219` (carried from round 1) The Shared parts row now lists `Autocomplete.Clear` under `CloseButton`, but the bullet below it still says the part's label is the owned "Close" overridden by `closeLabel`, while SearchField gives "Clear" through `clearLabel`. The `close` icon's `use` in `packages/perron/icons/icons.json` also still names only closing a panel, a dialog or a highlight.
- **P3-6.** `docs/components/search-field.md:78` (carried from round 1) The default filter uses Base UI's collator in the runtime's locale, which ignores accents. In an English runtime it treats ø as o: in round 3, typing "Nør" in the `Default` story gave 4 options, "Nordhavn St." among them, which a Danish reader wouldn't expect. Only a PerronProvider locale that reaches components, or a caller's `filter`, avoids it. Base UI's `Autocomplete.Root` takes a `locale` prop for this.
- **P3-7.** `docs/components/search-field.md:83` (carried from round 1) With `hiddenLabel`, the placeholder is the only text that names the field for the eye. It is drawn in `color.text.tertiary`, about 4.0:1 on `color.surface.raised` in light and about 3.8:1 in dark. `docs/foundations/accessibility.md:7` keeps that colour for hints next to stronger text, yet the spec recommends this setup for the top bar.
- **P3-8.** `packages/perron/src/components/SearchField/SearchField.stories.tsx:393` (carried from round 1) In `WithMarks`, a LineBadge `startIcon` repeats the item's label, so the option is heard as "5C 5C Bus, Husum Torv to Lufthavnen". The spec's Do and don't could tell callers how to avoid saying the same words twice.
- **P3-9.** `packages/perron/src/components/SearchField/SearchField.tsx:237` (carried from round 1) The clear button is left out only when SearchField's own `disabled` prop is set. If a Base UI `Fieldset` around the field disables it instead, Base UI (`ComboboxClear.mjs:55`, `fieldDisabled`) still renders the `CloseButton`, disabled but with no disabled look (Dialog CR-6).
- **P3-10.** `packages/perron/src/components/SearchField/SearchField.tsx:105` (carried from round 2) `onClose` takes Base UI's whole `Autocomplete.Root.ChangeEventReason`, which also allows reasons SearchField never sends (`'trigger-press'`, `'input-press'`, `'imperative-action'`, `'chip-remove-press'`). A narrower union of the seven reasons its JSDoc lists would let the compiler check a caller's `switch` for missing cases. Dialog also takes the whole Base UI type, so this choice affects the whole library.
