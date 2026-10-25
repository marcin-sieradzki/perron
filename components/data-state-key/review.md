# Review: DataStateKey, round 2

## P1

None.

## P2

- **P2-1.** `packages/perron/src/locale/en.ts:112-114` The `unknown` key's JSDoc, rewritten in this round, says "Unknown" is heard "inside a data state key's sentence". Under the new CR-7 (`docs/patterns/data-state-key.md:218`) it is heard in place of the whole sentence: the story's own check reads the description as `'—Unknown'` (`DataStateKey.stories.tsx:576`), and a key with `liveThreshold={-1}` is heard as "Live 1 046 Unknown". So the JSDoc, which the content audit reads as where the string is seen or heard, now contradicts the code it documents. CR-7 holds. The spec's Owned strings row for `unknown` (`docs/patterns/data-state-key.md:194`, "a threshold in a sentence, that is unknown") was written for the old behaviour and should say the same as CR-7: in place of a sentence whose threshold is unknown.

## P3

- **P3-1.** `docs/patterns/data-state-key.md:218` A question on the answered build question that CR-7 now follows. With "Unknown" heard in place of the whole sentence, the ear gets "Live 1 046 Unknown", which gives no hint that the sentence is the unknown part. An item whose count and threshold are both unknown reads "Ageing Unknown Unknown". The eye can at least see where the "—" sits. A sentence-level label such as "Threshold unknown" would tell the ear what is missing, but it would add an owned string and an override.
- **P3-2.** `packages/perron/src/patterns/DataStateKey/DataStateKey.tsx:239` Still open from round 1's P3-1 (third bullet): `Intl.NumberFormat`'s default grouping writes a threshold of 1000 min or more as "1,000 min", where `grouped` would write "1 000". This is not a realistic threshold. `useGrouping: false`, or a CR-7 line that accepts this, would settle it.
- **P3-3.** `packages/perron/src/locale/en.ts:58` Direction on API consistency. `minutesDuration` now calls its whole-or-tenth minutes `{minutes}`. The merged sibling `every` (`en.ts:133`, "Every {count} min") calls its whole minutes `{count}`, and `everyRange` calls them `{from}` and `{to}`. The library now has two names for a figure in minutes, and the next duration string will copy one of them. Round 1's P3-5 asked for `{minutes}`. The maintainer may want one name for both.
- **P3-4.** `packages/perron/src/testing/owned-strings.test.tsx:122` `'Every 3 min ago'` replaces `'Every 3 min min'`, the only case of a template's words repeated after a filled template. The comment at lines 111-112 still promises that case, and only `'Every Every 3 min'` (repeated before) is left to prove it. The swap is needed: with `'{minutes} min'` owned, a doubled unit such as "5 min min" reads as one template nested in another, and `expectOwnedStrings` now accepts it. That gap in the shared matcher is the maintainer's to close. The comment should say which case the new stray stands for.
- **P3-5.** `packages/perron/src/patterns/DataStateKey/DataStateKey.tsx:20-32` Still open from round 1's P3-6: `DataStateKeyCounts` copies `ReportStripCounts` field for field. A shared type in `internal/vehicle-states.ts` would keep the two from drifting.
