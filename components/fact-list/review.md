# Review: FactList, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/fact-list.md:83` The sentence "A value that wraps then reads as running text, where an end-aligned one would ragged on its left" is not grammatical ("would ragged"); write "would be ragged on its left" or "would rag on its left", as content design's plain short sentences ask (content-audit, Docs).
- **P2-2.** `docs/components/fact-list.md:126` The last sentence of Owned strings, "`main`, with Stat, is merged into this branch.", is a build-time note about the branch, not about the component, and it ships in `packages/perron/data/docs.json` and on the Specs/FactList page; cut it, since the docs should hold only what a reader of the spec needs (content-audit, Docs).

## P3

- **P3-1.** `packages/perron/src/components/FactList/FactList.css:7` `grid-template-columns: minmax(0, max-content) minmax(0, 1fr)` puts no limit on the name column. At 320 px a name of a sentence's length ("Seneste positionsrapport modtaget fra køretøjet") takes 272 px and leaves the values 4 px wide, one character per line. Realistic names of a word or two measured fine (a two-word Danish or Swedish name leaves the value column 120 to 133 px). So the spec's "a long Danish name … still fits 320 px" holds only while callers follow its Do and don't. Should the name column be capped, for example with `fit-content(50%)`?
- **P3-2.** `packages/perron/src/components/FactList/FactList.stories.tsx:16` The `Default` story shows the time "08:14" in `typography.label` with tabular Schibsted Grotesk figures, so the colon renders spaced. `docs/foundations/typography.md:9` puts times in a `data` role. Should the spec's Do and don't tell callers to wrap time and count values in `<Text variant="data">`, or should FactList's value keep one role for every kind of fact, as the spec decides now?
- **P3-3.** `.storybook/main.ts:22` The first `npm run check` failed 4 tests in `storybook/contract/Contract.stories.tsx` with "Failed to fetch dynamically imported module … @storybook_addon-docs_n_@storybook_react-dom-shim.js" after "Vite unexpectedly reloaded a test". Two re-runs on the same tree passed, and `npm run check` exited 0. This looks like a dependency-optimisation flake rather than anything in FactList: should `optimizeDeps.include` also list the addon-docs and react-dom-shim entries?
