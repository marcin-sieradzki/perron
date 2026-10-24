# Review: Text, round 1

## P1

- **P1-1.** `packages/perron/src/components/Text/Text.css:4` `.pn-Text` sets no `overflow-wrap`, and the spec doesn't say whether Text wraps or truncates, so one long Danish word runs past a 320 px screen: "Trafikinformation" in `display` renders 389 px wide and is cut off, and "Driftsforstyrrelsesmeddelelser" in `heading-lg` makes the page 338 px wide. This breaks design-qa's Text line (a 320 px width wraps or truncates as the spec says, never overflows) and the reflow check in `docs/foundations/accessibility.md` (1.4.10). The fix is a keyword such as `overflow-wrap: anywhere` on the root, plus a line in the spec saying so.

## P2

- **P2-1.** `docs/components/text.md:32` The `color` row in the spec's Props table no longer matches the JSDoc at `packages/perron/src/components/Text/Text.tsx:42`, which adds `such as "Late" or "+4 min": colour is never the only sign`. The spec's Props section says every prop gets its row's description as its JSDoc. The JSDoc is the wording CR-8 asks for, so the spec row should take it.
- **P2-2.** `packages/perron/src/components/Text/Text.stories.tsx:152` `BodyBrandPrimary` says "Every bus, train and ferry in Copenhagen". Mylder shows buses, S-tog, metro and regional trains (`docs/foundations/README.md:3`), not ferries. So the story claims more than the data has, against content design's first rule, and it disagrees with the `DisplayNeutralPrimary` headline beside it.
- **P2-3.** `packages/perron/src/components/Text/Text.stories.tsx:10` The meta's `children` never renders, because every story sets its own. It also cuts content design's example short ("run slower." where the example says "run slower than planned."). Drop it or use the full sentence.

## P3

- **P3-1.** `docs/components/text.md:132` CR-10 keeps `display`, `data-xl` and `stat` at full size on phones, which departs from the step-down in `docs/foundations/typography.md`. The spec calls this a token gap for the `design-tokens` skill, but nothing in the repo tracks it. Should it get an issue before Text goes `stable`? The missing step-down is also what makes P1-1 easy to hit in `display`.
- **P3-2.** `docs/components/text.md:108` On the checklist line "Every shape the type accepts renders, in every variant", no story shows a single element as `children`, and only `body-sm` shows a list. The spec counts the line as met because `children` passes through `useRender` unchanged. Accept that, or add a story whose `children` is a single `<strong>`?
- **P3-3.** `packages/perron/src/components/Text/Text.tsx:56` `emphasis` is a new prop name, and the next Display entries (Stat, Count, FactList) will copy it. MUI's Typography does the same job through `color` (`'textPrimary' | 'textSecondary' | 'textDisabled'`). Should `emphasis` be the name the whole family uses?
- **P3-4.** `packages/perron/src/components/Text/Text.tsx:10` `body` and `body-sm` default to `<p>`. That element is invalid inside a `<button>` or a `<label>`, and inside another body Text, which nests a `<p>` in a `<p>`. The callers' only escape is `render`. The brief's answer that chose this default was filled in by an agent, so the maintainer may want to confirm it.
