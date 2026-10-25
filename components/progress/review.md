# Review: Progress, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/meter.md:190` Meter's Don't still says a task's progress "is a `progressbar`, which Perron does not have yet". This branch ships Progress, so the published Meter spec becomes false, and it contradicts `docs/components/progress.md:9` ("Meter's own Do and don't sends a task's progress here"). Progress's line holds. Meter's row should send a task's progress to [Progress](progress.md) in the same change (content-audit, Docs; the reviewer's rule that a spec must not contradict another doc).

## P3

- **P3-1.** `packages/perron/src/components/Progress/Progress.css:73` The sweep runs on `easing.standard`, which slows the segment down as it slides out past the inline end. Measured in the Indeterminate story, under 5% of the track is lit for about 31% of every 1.6 s cycle, and under 10% for about 43%. That works against the spec's own reason for the loop at `docs/components/progress.md:103`: "a still bar reads as stuck or empty". The maintainer may prefer the `linear` keyword or a token easing built for loops, or may keep the pause as intended (Direction).
- **P3-2.** `packages/perron/src/components/Progress/Progress.css:71` Outside reduced motion, `.pn-Progress-indicator[data-indeterminate]` gives the segment no resting `inset-inline-start`. Wherever the animation does not run, such as a Playwright screenshot with `animations: 'disabled'`, which cancels infinite animations, the segment falls back to the inline start and reads as "40% done". That is the reading the spec's 30% rest under reduced motion is there to avoid (CR-6). Separately, `scripts/visual.ts:222` screenshots with animations running, so once the deferred design lands, the Indeterminate pixel diff will depend on where the sweep happens to be. Setting `inset-inline-start: 30%` on the base rule (the running animation overrides it), and emulating reduced motion in the visual stage, would fix both.
- **P3-3.** `packages/perron/src/locale/da.ts:43` The build agent wrote the Danish "I gang" and the Swedish and Norwegian "Pågår" (`packages/perron/src/locale/sv.ts`, `packages/perron/src/locale/nb.ts`) for `inProgress`. The word is not in content design's fixed data-state table, so a native reader should confirm it reads naturally after a task's name, as in "Eksporterer rapporten, I gang" (content-audit step 2).
