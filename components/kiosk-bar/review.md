# Review: KioskBar, round 1

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/patterns/KioskBar/KioskBar.tsx:61` `slotProps.stat` is spread onto every Stat (line 107), and its type `Omit<StatProps, 'label' | 'children' | 'unknownLabel' | 'render'>` still accepts `id` and `ref`, so a caller who passes an `id` gives every `li` the same one (axe's `duplicate-id`), and a ref object ends up on the last figure only. The question for the maintainer: should a per-item key that is given to every item leave out `id` and `ref`, or should its JSDoc warn the caller? This touches the contract's Customising `slotProps` rule and the api-consistency "one part, one key" form that later list patterns will copy.
- **P3-2.** `packages/perron/src/patterns/KioskBar/KioskBar.css:23` In story `patterns-kioskbar--narrow` (light and dark, `brand` part), the 27 × 24 px mark sits alone on the first line of a 286 px row. This happens because the `stats` list's `flex: 1 1 auto` basis is its full one-line width, so it always wraps below the brand. The design is deferred, so this is a question for the drawing: should the mark share a line with the first figures, for example with a `flex-basis` of `0` or of one figure's width, or is a line of its own the intended look for a tight bar? Spec Tokens, `stats` `flex` row.
- **P3-3.** `docs/patterns/kiosk-bar.md:137` The checklist line "Every shape the type accepts renders" claims a number, an element and a list as `figure`, an empty `stats` and one to four entries, but every story passes string figures and either three entries or `undefined`. I updated `Default`'s args by hand and confirmed that `[]`, a single `0` figure, a numeric label, an `''` figure (heard as "Unknown") and an array figure all render and are heard correctly. Should a story keep that coverage, as the contract's What axe won't catch line asks for "every story's accessibility tree"?
