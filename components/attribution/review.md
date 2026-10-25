# Review: Attribution, round 1

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/attribution.md:107` The target-size checklist line relies on WCAG 2.5.8's inline exception: the links are 15 px tall, and in `components-attribution--wrapping` the 24 px circle around "Rejseplanen" overlaps the wrapped second line of "OpenStreetMap contributors". But `docs/foundations/accessibility.md:69` ("at least `size.target-min` square, or has that much room around it") and the contract's checklist line name no such exception, so the maintainer should decide whether the foundation adopts the inline exception for links in running text, which matters on a touch map, or whether credits need a taller line.
- **P3-2.** `docs/components/attribution.md:119` CR-4 keeps the shared `perron.css` focus ring (`focus.width` at `focus.offset`) on an inline 15 px link inside a 22 px strip. In both themes the ring butts against the "©" before the link and the "." after it, and it hangs about 1 px past the strip's top and bottom edges onto the map; a question for the maintainer: accept this for inline links, or add a focus-ring variant for links inside text.
- **P3-3.** `docs/components/attribution.md:86` The Keyboard table credits Tab and Enter to "Perron, through the native `<a href>`", but Attribution adds no keys and the caller's native link does this; sibling LinkButton (`docs/components/link-button.md:110`) writes "The browser" for the same keys on the same element, and the table leaves out Shift+Tab, which LinkButton lists.
- **P3-4.** `packages/perron/src/components/Attribution/Attribution.stories.tsx:48` The JSDoc comments on lines 48 (140 characters) and 64 (121 characters) run past the repo's `printWidth` of 100, which prettier does not wrap in comments; Count's second review wrapped its story JSDoc at 100.
