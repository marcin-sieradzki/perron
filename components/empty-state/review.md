# Review: EmptyState, round 2

## P1

None.

## P2

- **P2-1.** `docs/components/empty-state.md:82` The icon decision says "each icon renders at its own size in `icons.json` (16 px by default, through `.perron-icon`)". That only holds for the 16-grid icons. EmptyState sets no `--perron-icon-size`, so `.perron-icon` falls back to `icon.size.400`. An 18-grid icon such as `info` then draws at 16 px with a stroke of about 1.42 px. A 14-grid icon such as `warning` or `signal-off` draws with a stroke of about 1.83 px. Both break the icon foundation's Sizes rule: strokes stay between 1.5 and 1.8 px, and the element that holds an icon sets `--perron-icon-size` (contract, CSS: Icons). Neither the spec's Do and don't table nor the `icon` JSDoc (`packages/perron/src/components/EmptyState/EmptyState.tsx:20`) tells the caller to set the icon's step. The fix is either to say so in both places or to limit `icon` to 16-grid icons.
- **P2-2.** `docs/components/empty-state.md:54` The decision's example call uses the bare title "No departures". The spec's own Do and don't row (`:148`) tells callers not to write that when there may be departures later, since content design says never to claim more certainty than the data has. The example should use "No departures in the next hour", as the `TitleOnly` story does.

## P3

- **P3-1.** `packages/perron/src/components/EmptyState/EmptyState.tsx:9` EmptyState gets `render` by extending `useRender.ComponentProps<'div'>`, so the type is `ReactElement | ComponentRenderFn<HTMLProps, {}>` and the JSDoc is Base UI's. `StationIcon` on `main` (stable, in `api.json`) instead extends `ComponentPropsWithRef<'span'>` and declares `render?: useRender.RenderProp` with its own JSDoc. Once this branch merges, the library will have two forms of the same contract prop. Which form should every `useRender`-based component follow?
- **P3-2.** `docs/components/empty-state.md:82` Following the P1-1 fix from round 1, the Default story's icon is a 16 px glyph above a 14 px title. In both themes it reads small as the lead of an empty state. Should EmptyState get larger drawings on their own grid (a new `icon.size.*` step and new icons), or is a 16 px icon the intended weight while the design is deferred?
- **P3-3.** `.storybook/preview.ts:41` The branch's merge base is `a4daeff`, behind `main`, which has since merged StationIcon. `git merge-tree` reports conflicts in `.storybook/preview.ts` and `packages/perron/data/docs.json`, both files that `npm run registry` and the docs build write. The branch needs a rebase and the generators run again before the PR merges.
