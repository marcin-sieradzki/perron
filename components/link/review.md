# Review: Link, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/link.md:115` CR-4 says `border-radius: radius.xs` and `box-decoration-break: clone` round "the layer and the ring on every line the link runs over", and so do the Anatomy row for `focusRing` (line 20), the Tokens row for `box-decoration-break` (line 65), the comment at `packages/perron/src/components/Link/Link.css:15` and the comment at `packages/perron/src/components/Link/Link.stories.tsx:174`. But in Chromium, where the stories run, `clone` rounds only the hover and pressed layers on each line. The `:focus-visible` outline is drawn as one merged outline around all three line boxes of `components-link--wrapping`, light and dark. Rewrite these lines to say what renders: the layers are rounded on each line, and the ring is one outline round the whole run. This is the reviewer's rule that a spec line must agree with what the code renders.
- **P2-2.** `docs/components/link.md:148` The Do and don't row cites [Content design](../content-design.md) for not writing "Click here", "Read more" or a bare URL. `docs/content-design.md` has no rule on link text, and the spec's own Owned strings section says so at line 106 ("Content design gives no rule on links or new tabs"). Line 106 holds: drop the citation, or cite WCAG 2.4.4 (Link purpose) in its place. This breaks the reviewer's rule that a spec must not contradict itself, and the content-audit's docs step.
- **P2-3.** `docs/components/link.md:129` Test coverage: these lines from the spec have no `play` step that proves them.
  - (1) The spec's copy of the What axe won't catch checklist (line 95) promises that `children` renders "a string, an element and a list alike". Every story passes a string only, so no story renders an element or an array as the link's words, checks that it shows and checks the link's accessible name.
  - (2) CR-10 says `target`, `rel` and `download` reach the `<a>` as the caller gives them. `NewTab` checks `target` and `rel` only, so no story passes `download` and checks it on the `<a>`.

## P3

- **P3-1.** `packages/perron/src/components/Link/Link.css:6` In `components-link--in-text` and `components-link--wrapping`, light and dark, the `perron.css` focus ring sits `focus.offset` (2 px) out from an inline link, so it crosses the comma after "Rejseplanen" and the full stops of "day." and "today.". This meets the Focus rule in `docs/foundations/accessibility.md` as written, but it covers the text next to the link. Should inline text links get a smaller or zero offset? That is a decision for the contract or the foundations.
- **P3-2.** `docs/components/link.md:115` CR-4 allows no padding, so the hover and pressed layers cover only the 18 px content box of a 21 px `typography.body` line. In `components-link--in-text`, hover and pressed, the descenders of "j" and "p" and the underline sit on the layer's bottom edge. A vertical padding the line's leading can hold would change CR-4 and the target-size line of the checklist, so it is the maintainer's choice.
- **P3-3.** `docs/foundations/semantic-colours.md:111` The Brand section says "Links, status and vehicles have their own colours". No `color.text.link` token exists, and Link takes the colour of the text around it (CR-2, decided in question 2). The foundation line could say that links wear the text's colour, so a later build does not read it as a missing token.
- **P3-4.** `docs/components/link.md:120` CR-9 ends "this change touches no other component". The diff does edit `packages/perron/src/components/LinkButton/LinkButton.stories.tsx`, moving its `RouterLink` into the shared helpers in `packages/perron/src/testing/stories.ts`. The move is right under the contract's Shared helpers rule. The sentence could say it changes no other component's code or CSS.
