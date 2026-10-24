# Review: LineBadge, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/line-badge.md:117` The spec says "the first, `M1Medium`, gives the contract story its args", but `storybook/contract/subjects.ts` takes `Object.values(named)[0]` from an ES module namespace, whose exports are sorted alphabetically, so `ALarge` gives the args. The contract `Root` story therefore renders line A's 2.94:1 pair with axe on and no `color-contrast` override, and passes only because axe marks one-letter text as incomplete (`shortTextContent`, measured in Storybook). Either correct the sentence and name the story that really feeds the contract story, or add a `Default` story whose pair meets 4.5:1. This breaks the contract's Root rule ("the args of its `Default` story (or its first story)") and the intent of CR-6 that only the five named stories turn off `color-contrast`.
- **P2-2.** `packages/perron/src/components/LineBadge/LineBadge.tsx:19` The `size` JSDoc tells callers about maintainer history ("since `docs/renames.md` merged `badge-lg` into `badge` and a component sets text only with a role"), and the `line` JSDoc at lines 13-14 does the same with "A default would paint a colour the caller's data never gave, and `color` stays for intents". A caller reading these in their editor can't act on either sentence, and the file they name doesn't ship with the package. Trim both here and in the spec's Props table (`docs/components/line-badge.md:32-33`), keeping what the prop does. This is content-audit Polish on the JSDoc of `LineBadgeProps`.
- **P2-3.** `packages/perron/src/components/LineBadge/LineBadge.stories.tsx:25` Storybook turns the export names into sidebar names, so `M1Medium` to `M4Large` show as "M 1 Medium" and "M 4 Large". Riders know the line as "M1", so the sidebar and docs page misname it. A `name: 'M1 Medium'` (and the same on the other seven metro stories) fixes it and keeps the export names the visual check pairs by. This is content-audit Polish.

## P3

- **P3-1.** `docs/components/line-badge.md:88` The bus and regional fills tell the eye the mode, but the ear hears only "5C" or "RE", and an S-tog "A" says nothing about S-tog to either. The spec's checklist line at :92 says the colour "names the line", but for `bus` and `regional` it names a mode. The spec leaves the mode to the surrounding row. Question for the maintainer: keep that, or add an owned mode word in a `VisuallyHidden` part with its `*Label` override (What axe won't catch, "Everything the eye is told, the ear is told").
- **P3-2.** `packages/perron/src/components/LineBadge/LineBadge.tsx:16` The `line` union is written inline and mixes line ids (`m1` to `h`) with modes (`bus`, `regional`). Prik, StationIcon, DepartureRow and the other Transit entries will need the same set. Question for the maintainer: export it now as a named type, such as `TransitLine`, so the siblings share one source, or wait for the second user (api-consistency, "one idea, one name").
- **P3-3.** `docs/components/line-badge.md:33` At `large`, the label stays at `typography.badge`, 12 px in a 34 px box (measured), so in light and dark it reads light next to the 22 px medium badge. Question for the maintainer: is merging `badge-lg` into `badge` in `docs/renames.md` right for the panel-header badge, or should `large` get a larger role when the deferred design is drawn (design-qa, Direction)?
