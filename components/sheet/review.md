# Review: Sheet, round 4

## P1

None.

## P2

- **P2-1.** `docs/components/sheet.md:146` Round 3's P2-1 asked for a `root` focus row in the Tokens table, but the row went into the Keyboard and ARIA section's Element table instead. That table's columns are Role, Accessible name from and States announced, so the row now reads as role `focus`, named by `outline`. The Tokens table (lines 83-121) still has `focus` rows for `content` (line 113) and `close` (line 121) but none for `root`, which breaks its own rule at line 81, "One row per part, state and property", and the template's Element table shape (`docs/components/TEMPLATE.md:66`). In every story, in light and dark, the open popup is `document.activeElement` with `:focus-visible` and draws `perron.css`'s ring (2px solid `color.border.focus`, 2px offset). The row should leave the Element table and join the Tokens table as `root | focus | outline | focus.width solid color.border.focus, focus.offset away, as perron.css draws it`. Lines 41 and 135 now say the popup takes focus, which settles the rest of round 3's P2-1.

## P3

- **P3-1.** `packages/perron/src/components/Sheet/Sheet.tsx:47` Still open from rounds 1 to 3. The spec says it decides the variant property, but it names it `anchor` and puts `data-anchor` on the root and the viewport. The contract's Props and Styling sections name the Penpot variant property `variant`, with `data-variant`. Should a placement axis keep MUI Drawer's `anchor`, which Dialog and later Panels will copy, or become `variant`?
- **P3-2.** `packages/perron/src/components/Sheet/Sheet.css:62` Still open from rounds 1 to 3. Every side sheet is `size.sheet-width` (376px), including `anchor` `right`, which the `anchor` JSDoc calls the detail panel. `docs/foundations/layout.md` and the token's description give the detail panel `size.detail-width` (364px). Should the right sheet read `size.detail-width`, or should the DetailPanel pattern set its own width through `className`?
- **P3-3.** `docs/components/sheet.md:11` Still open from rounds 1 to 3. The Anatomy has no grab handle, so a bottom sheet at its peek gives no sign that it can be pulled up. Its body scrolls and takes focus at the peek, so this is about discoverability only. Should the later design run add a handle part?
- **P3-4.** `packages/perron/src/components/Sheet/Sheet.css:74` Still open from round 3. On a bottom sheet, the popup's focus ring sits `focus.offset` outside a panel that is flush with the screen's sides and bottom. So in `components-sheet--bottom` and `components-sheet--bottom-expanded`, in light and dark, at 390px and 1280px wide, it shows only along the top edge. The content's ring is drawn inside the panel for this reason (line 161). Should a bottom sheet's root ring be inset the same way, or is the top edge enough?
- **P3-5.** `docs/components/sheet.md:67` The inherited `initialFocus` row copies Base UI's JSDoc word for word, so it gives the default as "first tabbable element or popup". Line 41 and the Drawer code (`DrawerPopup.js`, `initialFocus === undefined ? popupRef : initialFocus`) both move focus to the popup. The contract's Props rule keeps an inherited row as Base UI's own text, so the spec cannot fix this itself. Should the maintainer report the wording to Base UI, or should the spec add a note under the Props table?
