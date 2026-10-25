# Review: MapTooltip, round 2

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/MapTooltip/MapTooltip.tsx:99` `join` is the shared helper `classes` from `packages/perron/src/internal/nodes.ts` written again under another name: same signature, same body. This breaks the contract's Shared helpers rule: each helper is written once in its file, and a component imports it from there. The `shared-parts` gate matches by name, so it passes. Import `classes` and use it in `withClass`.
- **P2-2.** `docs/components/map-tooltip.md:56` The row for `className`, `style` and `ref` gives "React's" as the type and `none` as the Base UI prop. That contradicts line 60 and the code, which inherit `className` and `style` from `Tooltip.Popup.Props`, where `className` is `string | ((state: Tooltip.Popup.State) => string | undefined)`. The contract's Props rule holds: an inherited row reads `inherited` and gives Base UI's type, as Sheet's spec does at `docs/components/sheet.md:63`. Give `className` and `style` their own inherited rows, keep `ref` as a declared row, and have line 60 say the type omits `children` and `ref`, as `MapTooltip.tsx:42` does.
- **P2-3.** `packages/perron/src/components/MapTooltip/MapTooltip.tsx:73` `ref`'s JSDoc reads "The root element, the card." The spec's description is "Reach the root, the card" (line 56, under line 40's "Every prop here gets this description as its JSDoc"), and its Overlays sibling has "Reaches the root, the popup." (`Dialog.tsx:83`). Most components write "Reaches the root, …". So it breaks the api-consistency JSDoc rule: one prop is described the same way in every member. Write "Reaches the root, the card."

## P3

- **P3-1.** `packages/perron/src/components/MapTooltip/MapTooltip.tsx:94` `withClass` and its `ClassName` type are now copied word for word in a third component (`Dialog.tsx:109`, `Sheet.tsx:144`). The contract's Shared helpers section says a helper a second component needs joins its table first. Should the maintainer move `withClass` into `packages/perron/src/internal/nodes.ts` and the table, for all three?
- **P3-2.** `packages/perron/src/components/MapTooltip/MapTooltip.tsx:26` Carried from round 1: `defaultOffsets()` calls `getComputedStyle(document.documentElement)` during render, until a token stylesheet has loaded. It keeps the first reading in a module variable for the life of the page, so a later change to `--perron-space-200` or `--perron-size-panel-gap` is never picked up. Should `src/` get a way to import the numeric tokens instead?
- **P3-3.** `packages/perron/src/components/MapTooltip/MapTooltip.stories.tsx:140` Carried from round 1: the `Controlled` story's `ref={dot}` still logs React 19's "Accessing element.ref was removed" console error each time it renders. The log comes from Storybook's JSX source serialiser, not the component. `parameters.docs.source.type: 'code'` on the story would quiet it.
- **P3-4.** `docs/components/map-tooltip.md:5` "The extracted prototype component is not in any branch this run can reach" describes the build run, not the component. The spec ships in `packages/perron/data/docs.json` and on the `Specs/MapTooltip` page. The other deferred specs use this place to name what the component builds on (`docs/components/dialog.md:5`). Should the line go?
