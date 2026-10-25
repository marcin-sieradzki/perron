# Review: DepartureRow, round 1

## P1

None.

## P2

- **P2-1.** `docs/patterns/departure-row.md:230` CR-12, and the Tokens rows at `docs/patterns/departure-row.md:148-151` that cite it, call for a compound selector `.pn-Delay.pn-DepartureRow-delay`, and `packages/perron/src/patterns/DepartureRow/DepartureRow.css:79` writes it: two classes on one element. That breaks the contract's Styling rule "Selectors: one class, then attributes", and it is the only such selector in the library. The contract holds over CR-12, so CR-12 and the CSS should reach the needed specificity through a selector the contract allows, for example the descendant form the library already uses (`.pn-Alert[data-color] .pn-Alert-icon`), such as `.pn-DepartureRow-schedule .pn-DepartureRow-delay`.
- **P2-2.** `docs/patterns/departure-row.md:236` The Stories table's `play` tests leave these lines of the coverage checklist unticked (rubric 7; contract Stories, "a `play` test for every behaviour the component promises"):
  1. `delay={null}` on a `live`, `ageing` or `estimated` row: CR-5 says the Delay renders "—", heard as "Delay unknown". No story or step passes `null`, though the spec's checklist line 182 promises "`delay` a number, `null` and left out, in every `variant`".
  2. `delay` left out with `time` given on a live row: no Delay renders and the schedule holds only the time (CR-5, CR-10). `time` left out with `delay` given: the schedule holds the Delay alone. Only the case with both left out is tested.
  3. `ageingLabel`, `estimatedLabel`, `timetableOnlyLabel` and `noSignalLabel` replacing the state's word (CR-6). Only `liveLabel` is checked.
  4. `minutesUnitLabel` replacing both the countdown's "min" and the Delay's (Props row at line 75).
  5. `minutesLateLabel`, `minutesEarlyLabel`, `onTimeLabel` and `delayUnknownLabel` reaching the Delay (line 181, "every default label can be overridden"). `EVERY_PROP` checks only the root's attributes.
  6. `lineName` and `destination` rendering "a string, an element and a list alike" (checklist line 182).
  7. The state's word wrapping inside the middle column at 320 px (CR-9). `LongDestination` checks only the destination.
  8. DOM order being reading order (line 185). The `Ageing` step's `readOf` joins the parts in the fixed `PARTS` order, so it would still pass if the DOM order changed. Reading `ariaSnapshot` or the row's text nodes in DOM order would prove it.

## P3

- **P3-1.** `docs/patterns/departure-row.md:109` Each row is its own grid with an `auto` badge column, so down the `List` story the destinations start at 66.0 to 74.7 px, depending on the badge ("F" against "M3"). The right-aligned schedule also puts each `time` at a different x (280.8 to 320.4 px), so neither column lines up for a rider scanning the list. This goes against design-qa's Alignment line and Typography's "columns line up". The design run should choose between a list-level subgrid, a badge-column measure token, or the schedule laid out as columns.
- **P3-2.** `packages/perron/src/patterns/DepartureRow/DepartureRow.css:19` In `LongDestination`, the badge is centred on the whole row, so it sits beside the destination's second line, not beside the first line it names. Should the badge align to the first line (`align-self: start` with a `1lh` offset) or stay centred? This is a question for the design run.
- **P3-3.** `docs/patterns/departure-row.md:11` The Anatomy line says "Family: none", but the contract's Families table lists "list rows" in Rows. The row already meets Rows' fill, border and text, and its 54 px height clears `size.target-min` without a rule that sets it. Should the spec name it a Rows member that has no hover, since it is not pressed?
- **P3-4.** `docs/patterns/departure-row.md:94` The prose says each `slotProps` value is the part's props "less what the row sets itself", but the Props rows at lines 84-89 keep `children` on the plain parts, `dateTime` on `time` and `aria-hidden` on `dot`. The row overrides all of these. The Props rows hold (they match KioskBar's and DetailHeader's slot types), so the sentence should say this applies to the composed components' keys only.
- **P3-5.** `patterns-departurerow--list` light, row F, `dot`: VehicleDot's ageing dot in a yellow line colour shows faintly on `color.surface.raised`. The word "Ageing" carries the state, so contrast is not required, but the design run should check that the dot still reads in a list (VehicleDot's tokens, not this row's).
