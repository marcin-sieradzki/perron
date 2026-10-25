# Review: DepartureRow, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/patterns/departure-row.md:109` Carried over from round 1 and still open. Each row is its own grid with an `auto` badge column, so down the `List` story the destinations start at a different x for each badge ("F" against "M3"). The right-aligned schedule also puts each `time` at a different x, so neither column lines up down a stop's list. This goes against design-qa's Alignment line and Typography's "columns line up". The design run should choose between a list-level subgrid, a badge-column measure token, or the schedule laid out as columns.
- **P3-2.** `packages/perron/src/patterns/DepartureRow/DepartureRow.css:19` Carried over from round 1 and still open. In `LongDestination`, `align-self: center` centres the badge on the whole three-line row, so it sits beside the destination's second line, not beside the first line it names. Should the badge align to the first line or stay centred? This is a question for the design run.
- **P3-3.** `docs/patterns/departure-row.md:11` Carried over from round 1 and still open. The Anatomy line says "Family: none", but the contract's Families table lists "list rows" in Rows. The row already meets Rows' fill, border and text. Should the spec name it a Rows member that has no hover, since it is not pressed?
- **P3-4.** `docs/patterns/departure-row.md:94` Carried over from round 1 and still open. The prose says each `slotProps` value is the part's props "less what the row sets itself". The Props rows at lines 84-89 keep `children` on the plain parts, `dateTime` on `time` and `aria-hidden` on `dot`, which the row overrides (CR-7). The Props rows hold, as they match KioskBar's and DetailHeader's slot types, so the sentence should say this applies to the composed components' keys only.
- **P3-5.** Story `patterns-departurerow--list`, light theme, row F, part `dot`. Carried over from round 1 and still open. VehicleDot's ageing dot in a yellow line colour shows faintly on `color.surface.raised`. The word "Ageing" carries the state, so contrast is not required, but the design run should check that the dot still reads in a list (VehicleDot's tokens, not this row's).
