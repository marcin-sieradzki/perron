# Review: DataStateKey, round 1

## P1

None.

## P2

- **P2-1.** `docs/patterns/data-state-key.md:91` The Props prose tells an app that keeps the defaults to pass `tokens['vehicle-dot.live-threshold']` from `@mylder/perron/tokens.ts`, but that module has no `tokens` export. The number is `numeric['vehicle-dot.live-threshold']` (`60000`, `packages/perron/tokens/generated/tokens.ts:449`), and `base['vehicle-dot.live-threshold']` is the string `"60000ms"`, which the required `number` prop refuses. A caller who copies the spec's advice gets `undefined` or a type error, so the spec disagrees with the code it points to (rubric 6, the spec against the code). Name `numeric[…]` for both thresholds.
- **P2-2.** `docs/patterns/data-state-key.md:235` Test coverage, one line unticked. CR-7 says "the figure and its unit are joined by the strings' no-break space, so they never part at a line's end", but only the minutes form is proven: `'2.5\u00A0min'` in English (`DataStateKey.stories.tsx:253`). No `play` step checks the U+00A0 in `secondsDuration` ("60 s", "90 s"), and the Thresholds checks at `DataStateKey.stories.tsx:504-524` compare through `heard`, which turns every `\s`, U+00A0 included, into a plain space. A plain space in `secondsDuration` in any locale would pass every story. Assert the U+00A0 in a seconds threshold's `textContent`, as line 253 does for minutes.

## P3

- **P3-1.** `packages/perron/src/patterns/DataStateKey/DataStateKey.tsx:168-173` Three edge cases in how `threshold` writes a figure, for the maintainer to decide:
  - It picks the unit from the raw milliseconds and rounds afterwards, so 119 500 to 119 999 ms reads "120 s". CR-7 (`docs/patterns/data-state-key.md:218`) allows that to the letter, but line 93 says "under 2 min in whole seconds … 2 min or more in minutes". Picking the unit from the rounded value would write "2 min".
  - `-0` passes `ms < 0` and renders "-0 s".
  - `Intl.NumberFormat`'s default grouping writes 1000 min or more as "1,000 min", unlike `grouped`'s no-break space.

  None of these is a realistic threshold.

- **P3-2.** `packages/perron/src/patterns/DataStateKey/DataStateKey.tsx:216` A new `Intl.NumberFormat` is built on every render. The key re-renders each time the counts change (every few seconds), while Slider builds its formatter inside `useMemo` keyed on the locale (`Slider.tsx:185-191`). Memoising on `useLocale()` would match it.
- **P3-3.** `docs/patterns/data-state-key.md:178` The prose calls "{liveThreshold} to {ageingThreshold}" content design's range, "as in 'Every 3 to 4 min'". But content design writes the unit once, and the key writes it twice ("2.5 min to 5 min"). Writing it twice is right, since the two figures can take different units ("60 s to 5 min"), and the line should give that reason rather than cite the range form.
- **P3-4.** `packages/perron/src/locale/en.ts:49-55` The JSDoc of `secondsDuration` and `minutesDuration` doesn't say where each string is seen (inside DataStateKey's sentences). The `unknown` key's JSDoc at `en.ts:108-112` lists its users without DataStateKey, which now says it inside a sentence too (ReportStrip is missing from that list already). The content audit reads each key's JSDoc as where the string is seen or heard.
- **P3-5.** `packages/perron/src/locale/en.ts:55` Direction:
  - `minutesDuration` ("{count} min") is a second owned string carrying the unit that `minutesUnit` ("min", `en.ts:99`) already holds.
  - `{count}` names a figure that is a duration, not a count of things, as it is in `moreStops`. `{minutes}` and `{seconds}` would say what fills them.

  The next duration string will copy whichever form this one sets.

- **P3-6.** `packages/perron/src/patterns/DataStateKey/DataStateKey.tsx:20-31` Direction: `DataStateKeyCounts` copies `ReportStripCounts` field for field, JSDoc included, which the spec explains at line 89 (a pattern can't import a pattern its `dependsOn` doesn't name). One shared type in `packages/perron/src/internal/vehicle-states.ts`, re-exported under both names, would keep the two from drifting while a caller passes one object to both.
- **P3-7.** The first `npm run check` failed one unit test, by timeout: `scripts/checks/api-compatibility.test.ts:16` ran past its 5 s limit while the machine was loaded by parallel worktrees. The test passes alone, and a rerun of `npm run test`, the website build and `npm run test:stories` (69 files, 596 tests) was green. The test is not DataStateKey's, and every other check passed on the first run. Noted so the PR's CI run is watched for the same flake.
