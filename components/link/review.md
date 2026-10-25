# Review: Link, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/link.md:117` In `components-link--in-text`, `components-link--rich-content` and `components-link--wrapping`, in light and dark, the `perron.css` focus ring sits `focus.offset` (2 px) outside an inline link. It crosses the comma after "Rejseplanen" and the full stops of "day." and "today.". This meets the Focus rule in `docs/foundations/accessibility.md` as written, but the ring covers the text next to the link. Should inline text links get a smaller or zero offset? That is a decision for the contract or the foundations, not for CR-6.
- **P3-2.** `docs/components/link.md:115` CR-4 allows no padding, so the hover and pressed layers cover only the 18 px content box of a 21 px `typography.body` line. In `components-link--in-text` and `components-link--wrapping`, hover and pressed, light and dark, the descenders and the underline sit on the layer's bottom edge. A vertical padding that the line's leading can hold would change CR-4 and the checklist's target-size line (line 99), so the choice is the maintainer's.
- **P3-3.** `docs/foundations/semantic-colours.md:111` The Brand section still says "Links, status and vehicles have their own colours". No `color.text.link` token exists, and Link takes the colour of the text around it (CR-2, question 2). This line could say that links wear the text's colour, so a later build does not read it as a missing token.
- **P3-4.** `docs/components/link.md:56` The Tokens prose says the layers "keep text at 4.5:1 on `default` and `raised`", which holds. But Link brings a pairing that no quiet control has: secondary text under the layer. Measured from computed colours, `color.text.secondary` on `color.surface.inset` in dark is 4.82:1 under the hover layer and 4.42:1 under the pressed layer. The accessibility page's text-contrast line names only the brand outline label as an `inset` miss. No story puts a Link on `inset`, so no story fails. The spec's line or the foundation's contrast check could name this pairing, as that line does for the brand outline label.
