# Review: Toolbar, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/Toolbar/Toolbar.css:122` In forced colours, a disabled brand button draws its edge in CanvasText (measured `rgb(0, 0, 0)` in `components-toolbar--button-brand-disabled` and `--disabled`), so its edge looks enabled; every other disabled button draws GrayText. The cause is selector weight: `.pn-ToolbarButton[data-color='brand'][data-disabled]` sets `border-color: transparent` and outranks the `(forced-colors: active)` rule at lines 127–131. That rule's GrayText edge (CR-5, forced colours drawing an edge round each button) never reaches the brand colour.
- **P2-2.** `packages/perron/src/components/Toolbar/Toolbar.tsx:117` `labelled` counts `false` and `''` as a label. So `<ToolbarButton startIcon={…}>{cond && 'Zoom in'}</ToolbarButton>` renders an empty `pn-ToolbarButton-label` span, loses `data-icon-only`, and draws a 58 px-wide button with its icon pushed off-centre by the `space.150` gap. This breaks the spec's icon-only rule (square, `size.control` both ways) and the checklist line "Every shape the type accepts renders, in every variant".
- **P2-3.** `packages/perron/src/components/Toolbar/Toolbar.css:8` At 320 px, `flex-wrap: wrap` breaks `components-toolbar--horizontal` (light and dark) after the separator. The separator is left hanging at the end of the first row, with no group after it, and the group moves to a second row (separator box 97,25,1,26; group 21,59). It doesn't overflow, but the divider now divides nothing (design-qa Text and Alignment, Polish).

## P3

- **P3-1.** `packages/perron/src/components/Toolbar/Toolbar.css:23` A vertical toolbar uses `align-items: stretch`, so any icon-only button beside a wider labelled one stretches to the widest width and stops being square. The spec defines the vertical layout only for icon-only buttons. Should icon-only buttons keep `align-self: center` (or a fixed `inline-size`) in a column?
- **P3-2.** `packages/perron/src/components/Toolbar/Toolbar.tsx:70` The folder holds four components, an exception to the contract's "One component per folder" (Files) that only the spec records. `props`, `api-compatibility` and `api.json` read only `ToolbarProps`, so `ToolbarButtonProps`, `ToolbarGroupProps` and `ToolbarSeparatorProps` get no gate and will have no shrink protection once stable. Does the contract need a line for compound parts, or should the gates read every exported `*Props`?
- **P3-3.** `docs/components/toolbar.md:37` The spec says Base UI swaps Left and Right in right-to-left text. With `dir="rtl"` on `<html>`, ArrowLeft from "Show departures" moved to the previous item, because Base UI reads its `DirectionProvider`, not `dir`. The claim (repeated at lines 172–173) holds only under a provider that Perron doesn't set up. All four locales are left-to-right today.
- **P3-4.** `scripts/lib/site.test.ts:25` A component branch changes a shared site test, making the `## Specs` group in llms.txt conditional on a spec page being in `PAGES`. The change is correct, since this is the first entry past designing, but the maintainer may want it to land on its own, ahead of the component.
- **P3-5.** `.changeset/toolbar.md:5` "Adds `Toolbar`." doesn't mention that the package also starts exporting `ToolbarButton`, `ToolbarGroup` and `ToolbarSeparator` with their props types, so the changelog line undersells what ships.
