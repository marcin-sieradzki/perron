# Review: DetailPanel, round 4

## P1

- **P1-1.** `packages/perron/src/components/MapTooltip/MapTooltip.tsx:95` `npm run check` is red. The `shared-parts` gate fails with "declares withClass, a shared helper; import it from packages/perron/src/internal/nodes.ts", and so does the unit test `scripts/checks/shared-parts.test.ts > passes the real tree`. This branch moves `withClass` into `nodes.ts` and adds it to the contract's Shared helpers table (`docs/components/README.md:229`). But the merge of main (29ce40f) brought in MapTooltip with its own top-level `withClass` and `ClassName` (lines 85-98), and nothing moved them to the shared helper. That breaks the Shared helpers rule (`docs/components/README.md:222`): no other file declares a helper's name at the top level. MapTooltip should import `withClass` from `../../internal/nodes.ts` like Sheet, Dialog and DetailPanel do, and `.changeset/detail-panel.md` should then name MapTooltip among the importers.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/patterns/DetailPanel/DetailPanel.tsx:9` Still open from rounds 1 to 3. The `perron-allow(patterns)` reason says "the contract does not yet say whether a pattern may compose another". But the contract's Patterns section lists what a pattern may import and does not list other patterns, while `dependsOn` and CR-1 name DetailHeader. No rule settles which side holds. The maintainer either extends that line to the patterns an entry's `dependsOn` names, or rewords the reason to call this a departure.
- **P3-2.** `packages/perron/src/patterns/DetailPanel/DetailPanel.tsx:154` Still open. The Sheet's title part, rendered as a `div`, passes `typography.heading-md` down to the action row. In WithAction and LongTitle, in both themes, `.pn-DetailPanel-action` computes to 600 20px/23px. So a plain-string `action` shows as a second heading. Neither spec gives the action a typography role.
- **P3-3.** `packages/perron/src/patterns/DetailPanel/DetailPanel.tsx:56` Still open. The `children` JSDoc (lines 56-59) and the `anchor` JSDoc (lines 65-67) end with design reasoning copied from the spec's Props rows (`docs/patterns/detail-panel.md:57`, `:58`), and the docs page's props table shows it. The maintainer may prefer to keep that reasoning in the spec's prose.
- **P3-4.** `packages/perron/src/patterns/DetailHeader/DetailHeader.tsx:42` Still open. DetailHeader's `action` JSDoc and its spec rows (`docs/patterns/detail-header.md:19`, `:50`) still put the controls "at the end of the row". DetailPanel moves them into a fifth grid row (`DetailPanel.css:23-30`), which depends on DetailHeader's internal four-row template. The maintainer may want DetailHeader to have an action-below layout of its own.
- **P3-5.** `docs/patterns/detail-panel.md:24` Still open. The Anatomy note still ends with an instruction to the build ("The build then rewrites what still says otherwise...") and cites DetailHeader's spec by line numbers 19, 50, 63, 123 and 158. That work is done, and the note ships on the `Specs/DetailPanel` page, where the line numbers will go stale. It could be cut down to the decision alone.
