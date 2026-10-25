# Review: Popover, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/popover.md:47` The "Base UI already does" line says the popup flips to the opposite side when its side has no room, then shifts along the edge. That is not what the installed Base UI does. Its popover positioner defaults to `collisionAvoidance` with `fallbackAxisSide: 'end'` (`node_modules/@base-ui/react/internals/constants.mjs:26`), so it falls back to the perpendicular axis. In `components-popover--long-content`, in light and dark at 800 px, the popup opens to the right of the trigger (`data-side="right"`, 576 px tall), not below it. That breaks CR-14's "the trigger placed with room below it for the popup" (line 205) and the LongContent row of the Stories table (line 220), which assume the popup stays below. Base UI's source holds, so the line must name the perpendicular fallback, unless the maintainer chooses the build's open direction note instead: Popover defaults `fallbackAxisSide` to `'none'`. No rule settles that choice, so the build returns it to the maintainer.
- **P2-2.** `docs/components/popover.md:235` The Do row says to open a popover from a toolbar "through the toolbar's button's `render`, as the Toolbar spec says", which means `<ToolbarButton render={<Popover.Trigger />}>`. Popover's API cannot express that. Popover renders its own `Popover.Trigger` around the `trigger` element (CR-2, the `trigger` Props row at line 62), and Perron exports no `Popover.Trigger` for a caller to pass. The only composition open to a caller is `trigger={<ToolbarButton …/>}`, which nests the other way round. This breaks the Props row and CR-2, and those hold over the Do and don't prose. The row, and its Don't about disabling the trigger, must describe what a caller can do with `trigger`, or the row comes out.

## P3

- **P3-1.** `packages/perron/src/components/Popover/Popover.tsx:157` The positioner keeps Base UI's `align: 'center'`. When the trigger is narrow and near the screen's edge, the popup is shifted to `collisionPadding`, so its start edge sits 4 px off the trigger's: popup x 12 against trigger x 16 in `components-popover--default` (light and dark) and `--controls`. The maintainer may prefer `align: 'start'` as the default (popover.md:81; the build's direction note).
- **P3-2.** `packages/perron/src/components/Popover/Popover.tsx:54` The Overlays family types the first argument of `onOpen` and `onClose` two ways. Dialog and Popover use `Event`; Sheet (`Sheet.tsx:71`) and MapTooltip use `ChangeDetails['event']`. The family should settle on one form (the `api-consistency` rule "one name, one type"; the build's direction note).
- **P3-3.** `docs/components/popover.md:89` The popup is padded `space.400`, as question 6 answered. The contract's Families row for Popups, which names popovers, still reads "padded `space.100`" for every member (`docs/components/README.md:200`). That row should gain an exception for popups that hold text rather than rows, so the next text popup doesn't contradict it too (the brief's direction note).

Checked: `npm run check` passed, with all 5 Popover story tests passing. Every story was rendered in light and dark, and Default, Controls and LongContent also at 320 px and in forced colours. The worktree is as I found it, with only `components/popover/pipeline.yaml` modified.
