# Review: Tooltip, round 1

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/tooltip.md:48` On a keyboard-focused trigger, the shared `sideOffset` of `space.200` leaves only 4 px between the popup and the focus ring (8 px offset, minus `focus.offset` 2 px and `focus.width` 2 px; components-tooltip--keyboard, light and dark). The question for the maintainer: should the Tooltips family's offset clear the focus ring, or stay at MapTooltip's value? The build's direction note raises the same question, and no rule settles it.
- **P3-2.** `docs/components/toolbar.md:254` Toolbar's Do row still tells callers to write Base UI's `<Tooltip.Trigger render={<ToolbarButton … />} />`. Perron now ships `Tooltip`, and its Do row at `docs/components/tooltip.md:179` sends callers to `trigger={<ToolbarButton … />}` "the way round Toolbar gives". Toolbar's line could name Perron's `Tooltip`, so that callers who read either spec are pointed at the Perron component and not at Base UI's part.
