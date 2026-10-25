# Review: DataStateKey, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `.changeset/departure-row-cancelled-interval-platform.md:5` This round renamed the `every` placeholder, and this changeset line still announces `every` as "Every {count} min". The DepartureRow changeset is still unreleased, so the next CHANGELOG will print `{count}` in DepartureRow's entry and the rename in DataStateKey's (`.changeset/data-state-key.md:5`, "DepartureRow's `every` string now names its figure `{minutes}`"). That second line describes a change between versions that no released version ever had. A caller who builds their own dictionary from the first line gets "Every min", because `interpolate` renders a placeholder with no value as nothing. The fix is to write `{minutes}` in this line and drop the extra sentence from DataStateKey's changeset, so the release notes match what ships (CLAUDE.md, changesets).
- **P3-2.** `docs/patterns/data-state-key.md:70` The `unknownLabel` Props row says "Unknown" is heard "in place of "—" for a count or a threshold no data gives", and its JSDoc (`packages/perron/src/patterns/DataStateKey/DataStateKey.tsx:121`) and the Anatomy's "says an unknown count or threshold in words" (`docs/patterns/data-state-key.md:11`) say the same. Under CR-7 (`:218`), and in the Owned strings row that round 2's fix rewrote (`:194`), it stands in for the whole sentence that holds an unknown threshold, not for the threshold. The three lines could say what `:194` says. Missed in round 2.
- **P3-3.** `docs/patterns/data-state-key.md:218` Still open from round 2's P3-1, a question on the answered build question that CR-7 follows. When a threshold is unknown, the ear hears "Live 1 046 Unknown", and an item with an unknown count too hears "Ageing Unknown Unknown". Nothing tells the ear that the second "Unknown" stands for the sentence. A sentence-level word such as "Threshold unknown" would say so, at the cost of one owned string and one override.
- **P3-4.** `packages/perron/src/patterns/DataStateKey/DataStateKey.tsx:20-32` Still open from round 1's P3-6: `DataStateKeyCounts` copies `ReportStripCounts` field for field. A shared type in `internal/vehicle-states.ts` would stop the two from drifting apart.
