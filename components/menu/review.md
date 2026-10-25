# Review: Menu, round 3

## P1

None.

## P2

- **P2-1.** `docs/components/menu.md:286` The Tokens table and the CSS still disagree on three row properties. `Menu.css:64` gives all five rows `cursor: default`, but the table has no row for it, while Checkbox (`checkbox.md:103`) and RadioGroup (`radio-group.md:133`) each give their cursor a row. `Menu.css:63` gives the row itself `overflow-wrap: anywhere`, but the table (`:294`) and CR-11 (`:402`) give it only to the label and the group label. `Menu.css:62` sets `text-decoration: none` on every row, but row `:286` gives it to `linkItem` alone. This breaks the Tokens rule of one row per part, state and property (`:227`; review area 6, design-qa Token use).

## P3

- **P3-1.** `docs/components/menu.md:256` Still open from round 2: the `alignOffset` row and CR-9 (`:400`) say "minus `space.100` plus `border.width.025`", which read literally gives -3 px. The code (`Menu.tsx:42`) computes `-(space.100 + border.width.025)`, which is -5 px and correct, since the submenu's first item measures level with its row (157.0 against 156.7). The comment at `Menu.tsx:33` repeats the wording; all three should say "minus the sum of".
- **P3-2.** `docs/components/menu.md:400` Still open from round 2: with the submenu's `sideOffset` at 0, the submenu's glass overlaps the parent popup's padding and edge. Measured in the Submenu story, both themes: the submenu starts at x 133 and the parent ends at 137.5. The spec never states this; the maintainer may want the overlap written down, or the submenu moved out by the same amount.
- **P3-3.** `packages/perron/src/components/Menu/Menu.css:218` Still open from round 2: under forced colours, a highlighted row's `forced-color-adjust: none` keeps `perron.css`'s ring in `color.border.focus`. Measured as rgb(18, 24, 27) on a black Canvas with a dark system palette and the light theme, so the ring disappears and only the Highlight fill marks the row. The other half of that finding is fixed: the selected row's hover layer is now `none` there.
- **P3-4.** `packages/perron/src/components/Menu/Menu.stories.tsx:33` Still open from rounds 1 and 2: the local `glyph` helper works around the shared `icon` helper in `packages/perron/src/testing/stories.ts`, which keeps the SVG file's white space and so breaks Base UI's typeahead. Trimming it in the shared helper would fix every story.
- **P3-5.** `packages/perron/src/components/Menu/Menu.tsx:26` Still open from rounds 1 and 2: `pixels` and the module-level `offsets` cache repeat `positionerOffsets`'s pixel reader and cache in `packages/perron/src/internal/tokens.ts:32`. One helper that also read `space.100` and the submenu's `alignOffset` would keep a single reader of positioner tokens.
- **P3-6.** `docs/components/menu.md:414` Still open from round 2: the Stories prose promises "`fn()` handlers for `onOpen`, `onClose` and every `onClick` and `onChange`". The Submenu story's `MenuRadioGroup` (`Menu.stories.tsx:464`) and the LinkItems story's link items (`:518-519`) have none. Either the prose says "where the story checks one", or the stories add the handlers.
- **P3-7.** `docs/components/menu.md:368` The submenu row's ARIA row, and the Base UI parts row at `:68`, say it carries `aria-expanded` only while closed. Base UI's source (`MenuSubmenuTrigger.js:204`) drops it only while open after a keyboard open, and only on a platform it takes for VoiceOver. In every other case it sets `aria-expanded="true"` while open: measured after a hover open, it was `true`. Both lines should say when Base UI drops it.
