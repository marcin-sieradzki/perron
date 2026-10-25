# Review: ReportStrip, round 1

## P1

- **P1-1.** `packages/perron/src/patterns/ReportStrip/ReportStrip.css:19` A label holding a long word (I rendered `Narrow` at 320 px with `timetableOnlyLabel` set to a 50-letter word) makes the count "12" spill 22 px past the container's right edge: the container's `scrollWidth` is 342 against a `clientWidth` of 320. VehicleDotLabel's `overflow-wrap: break-word` keeps the whole word in the label's min-content width, and its `max-inline-size: 100%` lets the label take the item's full 320 px, so `.pn-ReportStrip-item` has no room left for the `space.200` gap and the `nowrap` count. This breaks CR-7 ("never overflows its container … a long word in a label breaks inside it") and design-qa's Text line (long words at 320 px wrap and never overflow); a Defect, so P1.

## P2

- **P2-1.** `docs/patterns/report-strip.md:188` Two lines of the test-coverage checklist have no `play` step. (1) CR-12: the pattern's own props win over a `slotProps` value, so a caller's `data-variant`, `data-unknown` or `children` in `slotProps.item` or `slotProps.count` is replaced on all five parts. Only the `className` join is tested. (2) CR-7: a long word in a label wraps inside it at 320 px while every count stays inside the container. `Narrow` only uses the Swedish words, which fit (this is the case P1-1 finds broken).

## P3

- **P3-1.** `packages/perron/src/internal/numbers.ts:10` In `typography.data` (JetBrains Mono), the U+00A0 that CR-4 (`docs/patterns/report-strip.md:173`) and answered question 3 choose is a full 7.2 px character. That is almost the 8 px `space.200` gap between the word and the count, so "Live 1 046" can read as "Live 1" and "046". This questions a choice the contract leaves open: keep U+00A0, or group with a narrow no-break space (U+202F) in `grouped` for every pattern.
- **P3-2.** `packages/perron/src/internal/numbers.ts:10` The group separator is now a literal, invisible U+00A0 inside `' '`, where DayProfileChart's copy wrote the escape `'\u00A0'`. A reader cannot see it, and an editor or a paste can silently turn it into an ordinary space. Writing it as `'\u00A0'` keeps the separator CR-4 names visible in the source.
- **P3-3.** `docs/patterns/day-profile-chart.md:13` This line still says the contract lets a pattern import only the helpers of `internal/nodes.ts`. `DayProfileChart.tsx` now imports `grouped` from `internal/numbers.ts`, and the contract's Patterns section allows every internal helper that reads no Base UI (all but `usePart`). The contract holds; the line is stale, as the brief's direction note already says.
