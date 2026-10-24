# Review: MapControls, round 1

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/MapControls/MapControls.tsx:156` The code passes the bar's `disabled` to each `ToolbarButton` (`disabled || zoomInDisabled`, and again at lines 164 and 173), but `Toolbar.Root` already passes disabled down to every button. CR-1 leaves that to Base UI, while CR-8 tells the build to set it, so the spec contradicts itself. Nothing behaves differently either way. The question for the maintainer is whether CR-8 should keep only the zoom-limit props, so the buttons get the bar's `disabled` from Base UI.
- **P3-2.** `packages/perron/src/components/MapControls/MapControls.tsx:148` `MapControlsProps` still accepts the `aria-label` it inherits from `Toolbar`, and the component's own name always replaces it without a word. Only the Do and don't line in `docs/components/map-controls.md:195` warns the caller. The question is whether to leave `aria-label` out of the type with `Omit`, so TypeScript stops it, or to let a caller's `aria-label` win over the owned string.
- **P3-3.** `packages/perron/src/locale/en.ts:55` The words "Centre the map" don't say where the map centres, while the button moves and zooms to show the whole network. Its `locate` crosshair is the icon most map apps use for "my location". Content design asks words to say what happens ("Show whole line"), and the spec's own Do and don't has to warn callers away from wiring it to the reader's location. The question is whether to keep "Centre the map" or name the result, such as "Show the whole network", in all four locales.
