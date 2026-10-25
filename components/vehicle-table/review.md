# Review: VehicleTable, round 4

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/patterns/vehicle-table.md:155` This round fixed CR-8 (line 232) and the CSS comment at `packages/perron/src/patterns/VehicleTable/VehicleTable.css:81` to say that `overflow-wrap: anywhere` breaks only a word longer than the 84 px left inside the cell's `space.300` start padding. The Tokens row for `destinationCell` `overflow-wrap` still says "a word longer than the column's least width breaks inside it", and that least width is 96 px. One spec line now says something another still denies; CR-8 holds (rubric 6). Missed in round 3, whose P3-1 named only CR-8 and the stories comment.
- **P3-2.** `docs/patterns/vehicle-table.md:232` The rewritten CR-8 matches the render. Measured on the `LongDestination` story's vehicles, 288 to 480 px tables, the destination column grows from 99 to 272 px while the position column stays at 86 to 105 px, and "Timetable only" takes two lines at every width. Measured among the `Default` vehicles, the destination stays at 96 px up to a 310 px table, "Timetable only" wraps, and it takes one line from 312 px. Two small points: the new sentence "wraps at its space even at the panel's width, as in `LongDestination`" cites a story that renders at 320 px, not at the panel's 332 px table; and no `play` step proves that wrap. The missing step is fine for a limitation the spec does not promise to keep, so the maintainer may prefer to reword the claim as a consequence ("it may wrap") rather than add a test that pins it (rubric 6 and 7).
- **P3-3.** `docs/patterns/vehicle-table.md:154` Still standing from rounds 2 and 3. The destination column's least width is `calc(4 * var(--perron-space-600))`, a spacing token used as a width, where the build's unblock note expected a size token from the `design-tokens` skill. It is the second unrelated 96 px measure written this way, after ScaleBar's. The maintainer may want a named size token, so that a later change to `space.600` doesn't move this column's width by accident.
