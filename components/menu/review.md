# Review: Menu, round 4

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/menu.md:256` Still open from round 2: the `alignOffset` row and CR-9 (`:402`) say "minus `space.100` plus `border.width.025`", which read literally gives -3 px, while the code (`Menu.tsx:42`) computes `-(space.100 + border.width.025)`, -5 px, which is right: the submenu's first item measures level with its row (157.0 against 156.7, both themes). The comment at `Menu.tsx:33` repeats the wording, and all three should say "minus the sum of".
- **P3-2.** `docs/components/menu.md:402` Still open from round 2: with the submenu's `sideOffset` at 0, the submenu's glass overlaps the parent popup's padding and edge. Measured in the Submenu story, both themes, the submenu starts at x 133.0 and the parent ends at 137.5; CR-9 never says so, so the maintainer may want the overlap written down or the submenu moved out by that amount.
- **P3-3.** `packages/perron/src/components/Menu/Menu.css:218` Still open from round 2: under forced colours, the highlighted row's `forced-color-adjust: none` keeps `perron.css`'s ring in `color.border.focus`. Measured as rgb(18, 24, 27) on the Highlight fill (Default and CheckboxItems, opened from the keys), so the ring all but disappears and only the fill marks the row (accessibility-audit step 6).
- **P3-4.** `packages/perron/src/components/Menu/Menu.stories.tsx:33` Still open from rounds 1 to 3: the local `glyph` helper works around the shared `icon` helper in `packages/perron/src/testing/stories.ts`, which keeps the SVG file's white space and so breaks Base UI's typeahead. Trimming the white space in the shared helper would fix it for every story.
- **P3-5.** `packages/perron/src/components/Menu/Menu.tsx:26` Still open from rounds 1 to 3: `pixels` and the module-level `offsets` cache repeat the pixel reader and cache of `positionerOffsets` in `packages/perron/src/internal/tokens.ts:32`. One helper that also read `space.100` and the submenu's `alignOffset` would leave a single reader of positioner tokens.
- **P3-6.** `docs/components/menu.md:416` Still open from round 2: the Stories prose promises "`fn()` handlers for `onOpen`, `onClose` and every `onClick` and `onChange`", but the Submenu story's `MenuRadioGroup` (`Menu.stories.tsx:464`) and the LinkItems story's link items (`:518-519`) have none. Either the prose says "where the story checks one", or those stories add the handlers.
- **P3-7.** `docs/components/menu.md:370` Still open from round 3: the submenu row's ARIA row, and the Base UI parts row at `:68`, say the row has `aria-expanded` only while closed. Base UI's source (`node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.js:204`) drops it only while open after a keyboard open, and only on a platform it takes for VoiceOver; in every other case it sets `aria-expanded="true"` while open, and after a hover open it measured `true` in both themes. Both lines should say when Base UI drops it.
