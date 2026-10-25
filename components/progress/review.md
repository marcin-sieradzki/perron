# Review: Progress, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Progress/Progress.css:77` The sweep still runs on `easing.standard`, which slows the segment at both ends of each pass. A round 3 sample of the Indeterminate story every 200 ms, in right-to-left, put the segment at x = -125, -141 and -146 px on a 364 px track for three samples in a row, so for roughly a third of each 1600 ms loop the track is empty or shows only a sliver. This works against the spec's own reason for the loop at `docs/components/progress.md:103`: "a still bar reads as stuck or empty". The maintainer may prefer the `linear` keyword or an easing token built for loops (added through the `design-tokens` skill), or may keep the pause on purpose (Direction, carried over from round 2's P3-1).
- **P3-2.** `packages/perron/src/locale/da.ts:43` The build agent wrote the Danish "I gang" for `inProgress`, and "Pågår" for the Swedish and Norwegian (`packages/perron/src/locale/sv.ts:43`, `packages/perron/src/locale/nb.ts:43`). The word is not in content design's fixed table of data-state words, so a native reader should confirm it reads naturally when heard after a task's name, as in "Eksporterer rapporten, I gang" (content-audit step 2, carried over from round 2's P3-3).
