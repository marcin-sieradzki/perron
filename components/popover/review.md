# Review: Popover, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/popover.md:235` This Do and don't row says to pass a `ToolbarButton` as `trigger` and disable it with `slotProps.trigger.disabled`, and not to set `disabled` on the `ToolbarButton`. The Toolbar spec says the opposite: open a popover through `<ToolbarButton render={<Popover.Trigger />}>` and set `disabled` on the `ToolbarButton`, not the trigger (`docs/components/toolbar.md:253`, and the "Base UI already does" line at `toolbar.md:37`). Perron's Popover can't express the Toolbar spec's form. I tested the Popover row's claims live in a Toolbar and they hold: with `slotProps.trigger.disabled` the button has `aria-disabled="true"` and stays in the arrow-key order. With `disabled` on the `ToolbarButton` itself it has `data-disabled` but `aria-disabled="false"`, so it looks disabled and is announced as enabled. That trap breaks the spirit of the contract's first "What axe won't catch" line ("for every shape each prop accepts"), and Dialog's `trigger` composes the same way. The maintainer should settle the two specs and decide whether the Overlays family forwards a trigger element's `disabled` to `*.Trigger` (the build's direction note).
- **P3-2.** `packages/perron/src/components/Popover/Popover.tsx:161` The positioner still keeps Base UI's `align: 'center'`. With a narrow trigger near the screen's edge, the popup is shifted to `collisionPadding`, so its start edge sits 4 px off the trigger's. In `components-popover--default`, `--title-only`, `--long-content` and `--close-label` the popup is at x 12 and the trigger at x 16; in `--controls` too. This shows in light and dark, at 1024 and 320 px. The maintainer may prefer `align: 'start'` as the default (`popover.md:81`; the build's direction note; round 1's P3-1, still open).
- **P3-3.** `packages/perron/src/components/Popover/Popover.tsx:60` The Overlays family still types the first argument of `onOpen` and `onClose` two ways. Dialog and Popover use `Event`; Sheet and MapTooltip use `ChangeDetails['event']`. The family should settle on one form (the `api-consistency` rule "One name, one type and default"; round 1's P3-2, still open).
- **P3-4.** `docs/components/popover.md:89` The popup is padded `space.400`, as question 6 answered. The contract's Families row for Popups names popovers and still reads "padded `space.100`" for every member (`docs/components/README.md:200`). That row should gain an exception for popups that hold text rather than rows, so the next text popup doesn't contradict it too (the brief's direction note; round 1's P3-3, still open).

Checked: `npm run check` passed: 51 unit test files with 646 tests, and 46 story and fixture files with 351 tests, Popover's 5 stories among them. `npm run gates -- props Popover` passed. Both round-1 P2s are fixed:

- P2-1: the positioner now defaults `collisionAvoidance` to `{ fallbackAxisSide: 'none' }`, as the build's question recommended. The "Base UI already does" line (`popover.md:47`), the Base UI parts row, CR-7, CR-14 and the LongContent row agree with each other, with the code and with Base UI's `useAnchorPositioning.mjs`. `LongContent` stays below its trigger (`data-side="bottom"`) and scrolls inside `--available-height` (728 px at 1024 x 800, 568 px at 320 x 640).
- P2-2: the Do and don't row now describes what a caller can do with `trigger`.

Every story was reopened after its `play` test and measured in light and dark at 1024 and 320 px. The fill, edge, radius, padding, shadow, glass, title, description and content fonts and colours, the `space.200` gap from the trigger, `z-index.dialog`, the 320 px cap and the wrapping of the long Danish title all match the Tokens table. Default was also opened by keyboard in light, dark and forced colours: the focus ring is on the close button, the border is kept and there is no transition. The accessibility tree reads: button "About the data" [expanded], dialog "About the data" with an h2, button "Close" and the description. The worktree is as I found it, with only `components/popover/pipeline.yaml` modified.
