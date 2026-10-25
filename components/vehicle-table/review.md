# Review: VehicleTable, round 3

## P1

None.

## P2

- **P2-1.** `docs/patterns/vehicle-table.md:232` This round rewrote CR-8. It now says that "in a table too narrow for that, the destination column keeps its 96 px and the other columns give up width first". The CSS comment at `packages/perron/src/patterns/VehicleTable/VehicleTable.css:69` says the same: "the other columns give up width before this one". That holds only when no destination is longer than the column's least width. Measured on the `LongDestination` vehicles, the destination column takes most of the width: it grows from 99 to 164 px as the table goes from 288 to 360 px, and 139 px at the panel's 332 px table. Over that range the position column stays near its least width, 86 to 93 px, and "Timetable only" wraps at every width. Chromium's automatic table layout shares the width above the columns' least widths in proportion to how much more each column's content wants. It does not take width from the other columns first. The rewrite also dropped round 2's true clause "beside a long destination the state's word can wrap". So the spec now gets wrong a case its own `LongDestination` story renders (rubric 6, the spec against the code and the render; a fix that one line now says and the render denies). The Tokens row at line 154 and the measured `Default` behaviour hold. Rewrite this sentence and the CSS comment to say three things: the destination column never goes below 96 px; among short destinations only the position column gives way, so "Timetable only" wraps below a table about 310 px wide; and beside a long destination, the destination column takes most of the spare width, so the state's word wraps even at the panel's width.

## P3

- **P3-1.** `docs/patterns/vehicle-table.md:232` CR-8 says `overflow-wrap: anywhere` "breaks only a word longer than 96 px". But the cell is `box-sizing: border-box` (computed: `min-width: 96px`, `padding-left: 12px`), so the 96 px includes the `space.300` start padding. A destination's word therefore breaks once it is longer than 84 px, not 96 px. The `LongDestination` comment "a word wider than the column" reads the same way (rubric 6). Missed in round 2.
- **P3-2.** `docs/patterns/vehicle-table.md:154` This is round 2's P3-1, still standing. The destination column's least width is `calc(4 * var(--perron-space-600))`, a spacing token used as a width, where the unblock note expected a size token from the `design-tokens` skill. It is the second unrelated 96 px measure written this way, after ScaleBar's. The maintainer may want a named size token, so that a later change to `space.600` doesn't move this column's width by accident.
