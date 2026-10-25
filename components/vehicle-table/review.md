# Review: VehicleTable, round 2

## P1

None.

## P2

- **P2-1.** `docs/patterns/vehicle-table.md:232` CR-8 contradicts itself. This round added a line saying "the destination cell is at least `calc(4 * var(--perron-space-600))`, 96 px, wide", which matches the Tokens row at line 154 and `VehicleTable.css:76`. But CR-8's opening still says "no cell sets its own width". It also still says that in a narrow table "each column gives up width in proportion to its content, so beside a long destination the state's word can wrap". The render disagrees with that opening. In `Default` (light and dark), the destination column's max-content width is the 96 px floor itself, because no destination there needs that much. The column stays at 96 px, with visible spare width after "Kokkedal St.", while the position column alone gives up width. So from a 288 px container (the width CR-8 promises) up to about 304 px, "Timetable only" wraps onto two lines with no long destination in the table. The stale comment at `packages/perron/src/patterns/VehicleTable/VehicleTable.css:67` ("no cell sets a width, so the automatic table layout gives each column its content's width") says the same wrong thing. The Tokens row and the new sentence hold, so rewrite CR-8's opening and that comment to match them. The rewrite should say that every cell but the destination sets no width, that the destination column keeps its 96 px while the others give up width first, and that the state's word can wrap below about 310 px even when no destination is long (rubric 6: a fix that one line now says and another still denies).

## P3

- **P3-1.** `docs/patterns/vehicle-table.md:154` The run's unblock note expected a size token from the `design-tokens` skill for the destination column's least width. Instead the build wrote `calc(4 * var(--perron-space-600))`, a spacing token used as a width, following ScaleBar's precedent for a measure only one CSS file reads. That is now the second unrelated 96 px measure written this way (ScaleBar's line 88 says a `size.scale-bar` joins "when a second place must agree on it"). The maintainer may want a named size token here, such as one for the destination column's least width, so a later change to `space.600` doesn't move a column width by accident.
