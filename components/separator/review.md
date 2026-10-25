# Review: Separator, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/separator.md:97` CR-8 says "Menu's, when it is built", but Menu is merged and `stable`. `MenuSeparator` (`packages/perron/src/components/Menu/Menu.tsx:582`, `Menu.css:223`) is a fourth divider, drawn with the same `border.width.025` in `color.border.subtle`. Several spec lines still describe a library without it, so the spec disagrees with the codebase its rules govern. CR-7 (line 96) binds "all three" dividers to change together and leaves `MenuSeparator` out of that lockstep. Line 7 ("the two separators already merged"), line 43 ("every divider Perron draws today, ToolbarSeparator's and Select's") and line 60 ("the two merged separators") each leave it out too. The Do row at line 118 names only `ToolbarSeparator` and Select, not `MenuSeparator` inside a `Menu`. CR-7, CR-8 and that prose need to name `MenuSeparator` as built. The binding `questions` answer (keep each own Base UI part) still holds.
- **P2-2.** `packages/perron/src/components/Separator/Separator.css:5` `.pn-Separator` sets one border side and never clears the others. So `render={<hr />}` keeps the user-agent `1px inset rgb(128, 128, 128)` border on the other three sides, measured with this CSS in Chromium: a 2px grey box rather than the hairline. That is the `render` the spec's Props row offers and the native element its line 79 names. It breaks CR-3 ("one border on a box of no size"), the Stories table's "it has no other border" and the design-qa Token use line (a browser-default colour). Setting `border: 0` (or `border-style: none`) on `.pn-Separator` before the orientation rules fixes it, and a `play` check could cover it.

## P3

- **P3-1.** `docs/components/separator.md:79` The Native semantics line contradicts itself. It calls `separator` "the ARIA a line with no native element of its own needs", then names `<hr>`, which gives that role natively. The contract's checklist allows "ARIA only for what no element says". The line could say why Base UI's `<div role="separator">` holds anyway: Base UI renders it, and `render={<hr />}` stays open to a caller.
- **P3-2.** `packages/perron/src/components/Separator/Separator.tsx:13` The `className` JSDoc, "Joined after `pn-Separator` on the root", matches Count, Text, Tag, Meter and FactList. It differs from the sibling separators' "Reaches the root. Merged after `pn-ToolbarSeparator`." and `MenuSeparator`'s, and from its Layout sibling Surface's "Reaches the root, merged after `pn-Surface`". Two forms are established library-wide (25 and 10 uses), so this is a question for the maintainer, not a fix: pick one form for the template and the contract's Props section, as the build's own note asks.
