# Review: EmptyState, round 1

## P1

- **P1-1.** `packages/perron/src/components/EmptyState/EmptyState.css:18` The icon part forces `--perron-icon-size: var(--perron-icon-size-450)` (18 px) on any icon, so a 16-grid or 14-grid icon from the set gets scaled. The Default story's `search` icon (16 grid) renders at 18 × 18 in light and dark, and `close`, `plus` and `minus` would draw a 2.0 px stroke while `warning` and `signal-off` would draw about 2.06 px. This breaks the icon foundation's Sizes rule ("Each icon is drawn on the grid closest to its step … A larger icon is a new drawing, not a scaled one"; strokes 1.5 to 1.8 px), together with `icon.size.450`'s stated use. The spec's Tokens row (`docs/components/empty-state.md:69`) and its icon decision (`:84`) need to change too, for example by letting the caller's icon keep its own step, or by allowing only 18-grid icons.
- **P1-2.** `packages/perron/src/components/EmptyState/EmptyState.tsx:11` `render` is left out of `useRender.ComponentProps<'div'>` and declared again at `:24-25`, with Perron's own JSDoc in place of Base UI's. This only serves to show it in the docs, which breaks the contract's Props rule that "a component never redeclares a Base UI prop to show it": the docgen already lists inherited Base UI members such as `render` with Base UI's JSDoc. The spec's `render` row (`docs/components/empty-state.md:47`) asks for this and should go as well.

## P2

- **P2-1.** `packages/perron/src/components/EmptyState/EmptyState.tsx:40` `given()` counts `''` and `[]` as given. So `action={query && <Button />}` with an empty query, or an empty array, renders an empty `pn-EmptyState-action` (or `-description`) wrapper, which adds the 4 px gap and the 12 px top margin. A runtime probe rendered `<div class="pn-EmptyState-description"></div>` and `<div class="pn-EmptyState-action"></div>`. That goes against CR-1's aim that "no empty wrapper takes up a gap". The rule's list (`docs/components/empty-state.md:126`) names only `null`, `undefined` and `false`, so the code and CR-1 should both cover nodes that render nothing.

## P3

- **P3-1.** `packages/perron/src/components/EmptyState/EmptyState.tsx:21` EmptyState is the first built entry, and its bare `icon` prop sits beside the contract's `startIcon` and `endIcon`. That is a new prop name the next siblings (DataStatePanel, NormalService and others in Feedback and Data) will copy. Should "the icon above the content" be `icon`, as in MUI's `Alert`, across the library, or get a name of its own?
- **P3-2.** `docs/components/empty-state.md:57` The spec names "a data panel with nothing to show" as one of EmptyState's uses, while `packages/perron/components.json` also lists `DataStatePanel` (Data). Does an empty data panel use EmptyState, or DataStatePanel with its data-state words? It would help to draw the line in both specs before DataStatePanel is briefed.
