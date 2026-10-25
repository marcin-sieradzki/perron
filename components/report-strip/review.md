# Review: ReportStrip, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/internal/numbers.ts:10` This is round 1's P3-1, still open. In `typography.data` (JetBrains Mono), the U+00A0 that CR-4 (`docs/patterns/report-strip.md:174`) and answered question 3 choose is a full character wide, almost as wide as the 8 px `space.200` gap between the word and the count. So "Live 1 046" can read as "Live 1" and "046". This questions a choice the contract leaves open: keep U+00A0, or group with a narrow no-break space (U+202F) in `grouped` for every pattern.
- **P3-2.** `packages/perron/src/internal/numbers.ts:10` This is round 1's P3-2, still open. The group separator is still a literal, invisible U+00A0 (bytes `302 240`) inside `' '`, where DayProfileChart's old copy wrote the escape `'\u00A0'`. An editor or a paste can silently turn it into an ordinary space. Writing it as `'\u00A0'` keeps the separator CR-4 names visible in the source.
- **P3-3.** `docs/patterns/day-profile-chart.md:13` This is round 1's P3-3, still open. The line still says the contract "lets a pattern import only the helpers of `packages/perron/src/internal/nodes.ts`". `DayProfileChart.tsx` now imports `grouped` from `internal/numbers.ts`, and the contract's Patterns section allows every internal helper that reads no Base UI (all but `usePart`). The contract holds, so this line should be rewritten to agree with it.
- **P3-4.** `packages/perron/src/internal/numbers.ts:8` Missed in round 1. `grouped` writes `String(count)`, so a count of 1e21 or more comes out as "1e+21", and a negative count is shown as it is. CR-5 treats only a missing, `null` or non-finite count as unknown, so neither case is caught. Neither is a real vehicle count, but the spec doesn't say whether a negative count, or one past what `String` writes in digits, should show "—" as unknown.
