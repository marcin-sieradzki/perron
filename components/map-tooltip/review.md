# Review: MapTooltip, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/MapTooltip/MapTooltip.tsx:95` Carried from round 2: `withClass` and its `ClassName` type appear word for word in three components (`Dialog.tsx:109` and `Sheet.tsx:144` are the other two). The contract's Shared helpers section says a helper that a second component needs joins its table first. Should the maintainer move `withClass` into `packages/perron/src/internal/nodes.ts` and that table, for all three components?
- **P3-2.** `packages/perron/src/components/MapTooltip/MapTooltip.tsx:27` Carried from round 1: `defaultOffsets()` calls `getComputedStyle(document.documentElement)` during render until a token stylesheet has loaded. It then keeps the first reading in a module variable for the life of the page, so a later change to `--perron-space-200` or `--perron-size-panel-gap` is never picked up (CR-5). Should `src/` get a way to import the numeric tokens instead?
- **P3-3.** `packages/perron/src/components/MapTooltip/MapTooltip.stories.tsx:140` Carried from round 1: the `Controlled` story's `ref={dot}` still logs React 19's "Accessing element.ref was removed" console error each time it renders. The error comes from Storybook's JSX source serialiser, not from the component. Setting `parameters.docs.source.type: 'code'` on the story would stop it.
- **P3-4.** `docs/components/map-tooltip.md:5` Carried from round 2: "The extracted prototype component is not in any branch this run can reach" describes the build run, not the component, yet it ships in `packages/perron/data/docs.json` and on the `Specs/MapTooltip` page. The other deferred specs use this place to say what the component builds on (`docs/components/dialog.md:5`). Should the line go?
