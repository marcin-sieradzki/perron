# Review: MapTooltip, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/map-tooltip.md:42` The spec names the placing prop `anchor` (code at `packages/perron/src/components/MapTooltip/MapTooltip.tsx:53`) and dismisses `anchorEl` because it "would misname" a virtual element. Both reasons fail. Its Overlays sibling Sheet already ships `anchor` as an edge union defaulting to `'left'` (`packages/perron/src/components/Sheet/Sheet.tsx:47`, MUI Drawer's meaning, Sheet CR-3), and MUI's Popper `anchorEl` itself takes a virtual element (`HTML element | object | func`). That breaks the api-consistency rule "one name, one type and default". Rename the prop to MUI's `anchorEl`, and rewrite the spec line, the Props row, CR-5 and the stories to match.
- **P2-2.** `packages/perron/src/components/MapTooltip/MapTooltip.tsx:65` `onClose`'s JSDoc reads "Called when Base UI asks to close the card" and leaves out `details.cancel()`. Its siblings both say "Called when the dialog/sheet asks to close" and that `details.cancel()` keeps it open (`Dialog.tsx`, `Sheet.tsx`), so it breaks the api-consistency JSDoc rule ("one prop is described the same way in every member that has it"). The spec's Props row for `onClose` (`docs/components/map-tooltip.md:54`) changes with it.
- **P2-3.** `docs/components/map-tooltip.md:154` The Stories table has no `play` test for two things the component promises. One is CR-6: the card is hidden by `visibility: hidden` while the positioner has `[data-anchor-hidden]`. The other is the `anchor` JSDoc's "pass a new one when the point moves, so the card follows". Both work when driven by hand, at a 0,0 or off-screen point and at a moved point, but nothing in the stories checks them. That breaks the contract's Stories rule "a `play` test for every behaviour the component promises". Add them to the table and to `MapTooltip.stories.tsx`.

## P3

- **P3-1.** `packages/perron/src/components/MapTooltip/MapTooltip.tsx:17` `defaultOffsets()` calls `getComputedStyle(document.documentElement)` during render and caches the result in a module-level variable for the life of the page. Until the token stylesheet loads, every render forces a style read, and a later change to `--perron-space-200` or `--perron-size-panel-gap` is never picked up. The spec (line 46) explains why: `tokens.ts` sits outside `rootDir`. Should the maintainer give `src/` a way to import the numeric tokens instead?
- **P3-2.** `packages/perron/src/components/MapTooltip/MapTooltip.stories.tsx:112` The `Controlled` story's `ref={dot}` makes Storybook's JSX source serialiser log React 19's "Accessing element.ref was removed" console error on every render of that story. It is not the component's fault. Setting `parameters.docs.source.type: 'code'` on the story would quiet it.
