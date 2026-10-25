# Review: Sheet, round 5

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Sheet/Sheet.tsx:47` Still open from rounds 1 to 4. The spec says it decides the variant property, but it calls it `anchor` and sets `data-anchor` on the root and the viewport. The contract's Props and Styling sections call the Penpot variant property `variant`, with `data-variant`. Should a placement axis keep MUI Drawer's name `anchor`, which Dialog and later Panels will copy, or become `variant`?
- **P3-2.** `packages/perron/src/components/Sheet/Sheet.css:62` Still open from rounds 1 to 4. Every side sheet is `size.sheet-width` (376px) wide. That includes `anchor` `right`, which the `anchor` JSDoc calls the detail panel, and `docs/foundations/layout.md` and the token's description give the detail panel `size.detail-width` (364px). Should the right sheet use `size.detail-width`, or should the DetailPanel pattern set its own width through `className`?
- **P3-3.** `docs/components/sheet.md:11` Still open from rounds 1 to 4. The Anatomy has no grab handle, so a bottom sheet at its peek gives no sign that it can be pulled up. Its body scrolls and takes focus at the peek, so this affects discoverability only. Should the later design run add a handle part?
- **P3-4.** `packages/perron/src/components/Sheet/Sheet.css:74` Still open from rounds 3 and 4. A bottom sheet is flush with the screen's sides and bottom, so the popup's focus ring, drawn `focus.offset` outside the panel, shows only along the top edge. This holds in `components-sheet--bottom` and `components-sheet--bottom-expanded`, in light and dark, at 320px, 390px and 1280px wide. The content's ring is drawn inside the panel for this reason (line 161). Should a bottom sheet's root ring be inset the same way, or is the top edge enough?
- **P3-5.** `docs/components/sheet.md:67` Still open from round 4. The inherited `initialFocus` row copies Base UI's JSDoc word for word, so it says the default is "first tabbable element or popup". But line 41, the Drawer code and every story in this round all put focus on the popup when the sheet opens. The contract's Props rule keeps an inherited row as Base UI's own text, so the spec cannot correct it itself. Should the maintainer report the wording to Base UI, or should the spec add a note under the Props table?
