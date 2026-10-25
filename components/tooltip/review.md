# Review: Tooltip, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/tooltip.md:48` When the trigger has keyboard focus, the shared `sideOffset` of `space.200` leaves only about 4 px between the popup and the focus ring: 8 px of offset, less `focus.offset` 2 px and `focus.width` 2 px (components-tooltip--keyboard, light and dark; it shows plainly in forced colours too). No rule settles it, and the build's direction note asks the same thing, so it goes to the maintainer: should the Tooltips family's offset clear the focus ring, or keep MapTooltip's value?
- **P3-2.** `docs/components/toolbar.md:254` Toolbar's Do row still tells callers to write Base UI's `<Tooltip.Trigger render={<ToolbarButton … />} />`. Perron now ships `Tooltip`, and its Do row at `docs/components/tooltip.md:179` sends callers to `trigger={<ToolbarButton … />}` "the way round Toolbar gives". Toolbar's line could name Perron's `Tooltip`, so that both specs point callers to the same component.
- **P3-3.** `docs/components/map-tooltip.md:142` MapTooltip's CR-5 (and its prose at line 46) still says MapTooltip reads `--perron-space-200` and `--perron-size-panel-gap` itself. Its code now imports the shared `positionerOffsets` helper (`packages/perron/src/components/MapTooltip/MapTooltip.tsx:8`), which Tooltip's CR-6 and the contract's Shared helpers table name. The behaviour has not changed, but MapTooltip's rule could name the helper, so the sibling spec matches its code and Tooltip's CR-6.
