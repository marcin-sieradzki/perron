# Review: ScaleBar, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/patterns/ScaleBar/scale.ts:36` The 1 m floor keeps the bar at its full 96 px labelled "1 m" when the longest distance is shorter than 1 m. At Copenhagen's latitude that happens above zoom 22, which MapLibre allows, so there the bar claims more ground than it spans. This follows the build's answered question 1 and CR-3, but it pulls against CR-7's "never claims more than the data knows". Question for the maintainer: keep the floor, cap the map's zoom, or let the scale show distances under 1 m?
- **P3-2.** `packages/perron/src/patterns/ScaleBar/ScaleBar.tsx:57` Carried from round 1. ScaleBar draws the "—" and hidden "Unknown" pair itself (lines 110-115), which copies `packages/perron/src/internal/UnknownValue.tsx`. The contract's Patterns section and the `patterns` gate let a pattern import only `internal/nodes`. Question: should `UnknownValue` join what a pattern may import?
- **P3-3.** `docs/patterns/scale-bar.md:146` Carried from round 1. CR-4 reads the root's `inline-size` once (`ScaleBar.tsx:90-92`). If the content box changes later, the bar is drawn at a share worked out for another length. If the CSS has not loaded at first layout, the read gives `NaN`, and a valid resolution then shows an empty glass box heard only as "Scale", for good. Question: keep the single read, or follow the box with a `ResizeObserver`?
- **P3-4.** `packages/perron/src/patterns/ScaleBar/ScaleBar.css:25` Carried from round 1 (build direction note). With no bar (`patterns-scalebar--unknown` and the server render), the glass is 25.6 px tall against 33.6 px with a bar, light and dark alike. A scale anchored at the bottom right therefore moves its top edge when the first resolution arrives. Options: the root keeps the bar's room, or the shorter box stays.
- **P3-5.** `packages/perron/src/patterns/ScaleBar/ScaleBar.css:28` Carried from round 1 (build direction note). The label never wraps inside the fixed 96 px content box, so a unit override longer than a symbol, such as "5000 kilometres", runs past the padding and out of the glass. Options: the root grows to fit its label, or the `metersUnitLabel` and `kilometersUnitLabel` JSDoc and Props rows say the overrides are for symbols only.
- **P3-6.** `docs/patterns/scale-bar.md:66` Carried from round 1 (brief direction note). Three boxes of different shape share the bottom-right corner: ScaleBar at `radius.md` and about 34 px tall, the MapControls toolbar at `radius.lg`, and Attribution as an edgeless strip at `radius.xs`. When the design is drawn, decide whether the cluster shares one radius and height.
