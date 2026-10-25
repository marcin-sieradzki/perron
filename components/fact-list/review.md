# Review: FactList, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/FactList/FactList.css:7` `grid-template-columns: minmax(0, max-content) minmax(0, 1fr)` sets no upper limit on the name column. Names of a word or two still fit 320 px, as the spec says (both stories rendered at 320 px without overflow). But a name as long as a sentence takes almost the whole row, and the values wrap one character per line. So the spec's "a long Danish name … still fits 320 px" (Tokens prose, `docs/components/fact-list.md:83`) holds only while callers follow its Do and don't. Should the name column have a cap, such as `fit-content(50%)`, or is the Do and don't line enough?
- **P3-2.** `packages/perron/src/components/FactList/FactList.stories.tsx:16` In `Default`, the time "08:14" is set in `typography.label` with tabular Schibsted Grotesk figures, so its colon renders with visible space around it (seen in both themes). `docs/foundations/typography.md` puts times in the `data` role. Should the spec's Do and don't tell callers to wrap time and count values in `<Text variant="data">`, or should FactList's value keep one role for every kind of fact, as the spec now decides?
