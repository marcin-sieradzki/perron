# Review: Checkbox, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/checkbox.md:84` The spec says it sets `overflow-wrap: anywhere` "as the contract's Long words rule asks". The contract (`docs/components/README.md:165`) gives `break-word` to a content-sized box that sits beside others in a flex or inline row, and Checkbox's root is a content-sized inline-flex row. Answer 9 binds the choice, and `min-inline-size: 0` on the label (`packages/perron/src/components/Checkbox/Checkbox.css:32`) breaks a Danish compound mid-word in a 320 px flex row with either value. No rule settles which Long words case a checkbox label is, so the maintainer or CheckboxGroup's spec should decide.
- **P3-2.** `docs/components/README.md:220` The new note says "`SelectedMark` draws the same tick", but `packages/perron/src/parts/SelectedMark/` does not exist yet. Also, the rows at lines 215 and 216 each say that only their own folder holds the tick icon. The note could say that SelectedMark will draw the tick and how the two folders share it, so that SelectedMark's build is not misled.
- **P3-3.** `packages/perron/src/parts/CheckboxIndicator/CheckboxIndicator.css:74` In dark, a disabled unticked box has a `transparent` fill and a `color.border.subtle` edge (rgba(235, 238, 235, 0.1)), so the box almost disappears and only grey words are left (`components-checkbox--disabled` dark, indicator). WCAG exempts disabled controls, and answer 6 chose FilterChip's treatment. But a chip keeps its pill shape when disabled, while a checkbox has no shape other than its box. The maintainer may want to reconsider this.
- **P3-4.** `packages/perron/src/components/Checkbox/Checkbox.tsx:14` The Inputs category now has two names for an on/off state: FilterChip's `selected`/`defaultSelected`, and Checkbox's `checked`/`defaultChecked` (Base UI's and MUI's names). Switch and the menu's checkbox item will copy one of them. The contract could say which name goes with which kind of control (api-consistency Direction). MUI uses `checked` for Checkbox and Switch, and `selected` for ToggleButton.
- **P3-5.** `docs/components/checkbox.md:183` The checklist says `children` renders a string, an element and a list alike, and renders nothing when it is empty. Every story passes a string or `undefined`, so no story stops element, list or empty children from regressing. Surface's `Shapes` story does this for Surface.
- **P3-6.** `docs/components/checkbox.md:5` The spec page ships as `Specs/Checkbox` but holds notes about this run: line 5 has "No ROADMAP wave line names Checkbox" and "The extracted prototype component is not in any branch this run can reach", and line 74 has "since its unit test pins the row and a component branch leaves shared tooling as it is". These notes belong in `pipeline.yaml`, not in the spec's prose (content audit, house voice).
- **P3-7.** `docs/components/checkbox.md:214` The Stories prose says each story "renders the checkbox 'Show planned works on the map'". The Stories table, which holds over the prose, gives `Indeterminate` "Show all lines" (line 224), `InForm` a second checkbox "Show bus routes" (line 230) and `LongLabel` a Danish label (line 231), and the stories render those labels. The sentence could say "Each renders the checkbox 'Show planned works on the map' unless its row names another label".
- **P3-8.** `docs/foundations/icons.md:13` The `icon.size.325` row says it is for marks "Inline with label and caption text: the disruption icons", and `icon.size.400` (line 14) says it is for marks "Inside controls". The new `tick` and `dash` render at `icon.size.325` inside a control's box. The spec gives its reason at `docs/components/checkbox.md:74`, but the token's description, which builds this row, does not mention a checkbox's mark. A future part could read the row and pick `icon.size.400`.
