# Review: MapControls, round 2

## P1

None.

## P2

- **P2-1.** `docs/components/map-controls.md:252` CR-9 makes an exception to the contract's Design states table so the 3D toggle's on look can be read from `[aria-pressed='true']` (`MapControls.css:10`, `:19`, `:24`, `:29`, `:39–54`). CR-14 (`:260`) backs this by saying the toggle "sets no `data-pressed` or `data-selected`". The contract reads design states only from pseudo-classes and Base UI's attributes, and Selected is `[data-selected]`/`[data-checked]` (README.md, Design states). The contract names no exception, so the contract holds. Button, the sibling toggle, already sets `data-selected` while `selected` is `true`, from the same value as its `aria-pressed`. The toggle can do the same: pass `data-selected={tilted \|\| undefined}` from `tilted`, select the on rules by `.pn-MapControls-tilt[data-selected]`, and rewrite CR-9, CR-14 and the Tokens prose at `:110` to match.
- **P2-2.** `docs/components/map-controls.md:201` The spec declares the compass needle's angle "an exception to the contract's 'everything the eye is told, the ear is told'", and the checklist at `:205` repeats it. The angle is an `aria-hidden` mark with no text equivalent for any `heading` other than 0. The contract's What axe won't catch rule names no such exception, and the brief's question 6 can't settle a choice the contract doesn't leave open, so the contract holds. The ear needs at least what the eye gets: whether the map is turned away from north, kept stable across frames (for example a description that changes only between north and turned, not every degree). If the build finds no fitting form, it returns the line to the maintainer as a contract question.
- **P2-3.** `docs/components/map-controls.md:269` Test coverage: these lines of the new Keyboard and CR rows have no `play` step. First, the Enter/Space row (`:177`) on the compass: Space pressing the compass and calling `onResetNorth` (only Enter and a click are pressed, in `Compass`). Second, the same row's and CR-15's promise that focus stays on the compass as its needle turns: no story holds `heading` and changes it while the compass has focus, and the `screen()` step at `MapControls.stories.tsx:719` re-renders without focus on the button.

## P3

- **P3-1.** `packages/perron/src/components/MapControls/MapControls.tsx:308` Round 1's P3-1 is still open, and the two new buttons repeat it: the 3D toggle and the compass get `disabled={disabled}`, which `Toolbar.Root` already passes to every button (CR-1 against CR-8). Nothing behaves differently; the question is the same as in round 1.
- **P3-2.** `packages/perron/src/components/MapControls/MapControls.stories.tsx:671` The `Tilted` story checks the forced-colours `Highlight` fill only. The on-and-disabled `GrayText`/`Canvas` rule (`MapControls.css:54`) and the on toggle's `CanvasText` focus ring (`:50`), both Tokens rows at `docs/components/map-controls.md:161–162`, are never rendered by a test. The Stories table doesn't promise them, so this is a note, not a gap.
- **P3-3.** `packages/perron/src/locale/sv.ts:66` The Swedish "Vrid mot norr" uses _vrida_, which reads as twisting by hand. The question is whether a native reviewer would prefer "Rotera mot norr" or "Återställ till norr", which is closer to the English "Reset to north", for the compass's name.
