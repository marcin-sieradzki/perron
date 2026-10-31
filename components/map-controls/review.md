# Review: MapControls, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/MapControls/MapControls.tsx:333` The compass's new description uses `aria-description`, an ARIA 1.3 attribute that no other Perron component uses and that some screen readers (VoiceOver on older Safari among them) don't read. The fix meets the contract's "everything the eye is told, the ear is told" for round 2's P2-2. The question for the maintainer, which the build also raised in a direction note, is whether a visually hidden element referenced by `aria-describedby` should replace it, since `aria-describedby` is announced more widely.
- **P3-2.** `packages/perron/src/locale/sv.ts:67` The new Swedish description, "Kartan är roterad bort från norr", uses _rotera_, while the same button's name, "Vrid mot norr" (`:66`), uses _vrida_. One button now gives two verbs for the same turn. This adds to round 2's P3-3: a native reviewer could pick one verb for both strings.
- **P3-3.** `packages/perron/src/components/MapControls/MapControls.tsx:323` Round 1's P3-1 (raised again in round 2) is still open: the 3D toggle, the compass and the pause button each get `disabled={disabled}`, which `Toolbar.Root` already passes to every button (CR-1 against CR-8). Nothing behaves differently.
- **P3-4.** `packages/perron/src/components/MapControls/MapControls.stories.tsx:654` Round 2's P3-2 is still open: the `Tilted` story checks only the forced-colours `Highlight` fill, now on `[data-selected]`. No test renders the on-and-disabled `GrayText`/`Canvas` rule (`MapControls.css:52`) or the on toggle's `CanvasText` focus ring (`:48`). The Stories table doesn't promise them, so this is a note.
- **P3-5.** `packages/perron/src/testing/owned-strings.ts:9` `SPOKEN` doesn't read `aria-description`, so `expectOwnedStrings` would miss a hard-coded description. `CustomLabels` makes up for it by asserting `turnedFromNorth` directly in English overrides and in Danish. Adding `aria-description` to `SPOKEN` would cover every component, as the build's direction note says. This is outside the component's diff, so it is a note.
