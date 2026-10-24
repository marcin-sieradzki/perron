# Review: Sheet, round 3

## P1

None.

## P2

- **P2-1.** `docs/components/sheet.md:135` The Keyboard row says Enter or Space on the trigger moves focus to "the first tabbable element, the close button, or the popup", but focus always goes to the popup. Base UI's Drawer defaults `initialFocus` to the popup (`node_modules/@base-ui/react/drawer/popup/DrawerPopup.js:281`, `initialFocus === undefined ? popupRef : initialFocus`), unlike Dialog. In every story, both on load and after Enter on "Show stop", `document.activeElement` is `.pn-Sheet` with `:focus-visible`, and it shows the ring `perron.css` draws now that the old `outline: none` is gone. Line 41 ("the first tabbable element, or the popup") repeats the claim. The Tokens table (lines 83-121) has no `root` focus row for the ring that now shows, though it gives `content` and `close` one each. So the spec breaks the accessibility audit's rule that each key in the Keyboard table does what the table says, and its own "One row per part, state and property". Lines 41 and 135 should say the popup gets focus, and a `root` focus row should name `perron.css`'s ring.

## P3

- **P3-1.** `packages/perron/src/components/Sheet/Sheet.tsx:47` Still open from rounds 1 and 2. The spec says it decides the variant property, but it names it `anchor` and puts `data-anchor` on the root and the viewport. The contract's Props and Styling sections name the Penpot variant property `variant`, with `data-variant`. Should a placement axis keep MUI Drawer's `anchor`, which Dialog and later Panels will copy, or become `variant`?
- **P3-2.** `packages/perron/src/components/Sheet/Sheet.css:62` Still open from rounds 1 and 2. Every side sheet is `size.sheet-width` (376px), including `anchor` `right`, which the `anchor` JSDoc calls the detail panel. `docs/foundations/layout.md` and the token's description give the detail panel `size.detail-width` (364px). Should the right sheet read `size.detail-width`, or should the DetailPanel pattern set its own width through `className`?
- **P3-3.** `docs/components/sheet.md:11` Still open from rounds 1 and 2. The Anatomy has no grab handle, so a bottom sheet at its peek gives no sign that it can be pulled up. Its body scrolls and takes focus at the peek, so this is about discoverability only. Should the later design run add a handle part?
- **P3-4.** `packages/perron/src/components/Sheet/Sheet.css:74` The popup now shows `perron.css`'s ring on focus, which settles round 2's P3-4. On a bottom sheet, though, the ring sits `focus.offset` outside a panel that is flush with the screen's sides and bottom. In `components-sheet--bottom` and `components-sheet--bottom-expanded`, in light and dark, it shows only along the top edge. The content's ring is drawn inside the panel for this reason (line 161). Should a bottom sheet's root ring be inset the same way, or is the top edge enough?
