# Review: LinkButton, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/LinkButton/LinkButton.tsx:27` The `variant` JSDoc says "for the one way on that a panel offers", and the `fullWidth` JSDoc at line 39 says "a bottom sheet's way on". The same words are in the spec's Props rows (`docs/components/link-button.md:48`, `:50`) and the `FullWidth` story comment (`LinkButton.stories.tsx:190`). "Way on" is an idiom used nowhere else in the docs or the glossary, so it fails content design's plain-sentence rule. This is a content-audit Polish finding. Better wording: "for the main place a panel leads to" and "such as a bottom sheet's main link".

## P3

- **P3-1.** `packages/perron/src/components/LinkButton/LinkButton.tsx:54` `LinkButtonProps` omits `render` from `useRender.ComponentProps<'a'>` and declares it again with its own JSDoc, which replaces Base UI's "Allows you to replace the component's HTML element…". The rubric names this "redeclared Base UI prop" as a P1, but the contract's Props section (`docs/components/README.md:57`, "a `render` the component declares itself says `@default <span />`"), the spec's Props row ("`useRender`'s `render`", not `inherited`) and the stable Delay all allow it for a root rendered by `useRender`. The question for the maintainer is whether the rubric should exempt `useRender` roots, or whether such components should inherit `render`.
- **P3-2.** `packages/perron/src/components/LinkButton/LinkButton.css:19` CR-11's `white-space: nowrap` lets a long label overflow at 320 px. In `components-linkbutton--full-width` (light) I swapped in a 50-character Danish label: the root is `clientWidth` 286, `scrollWidth` 297, and the text runs past the border. That breaks design-qa's Text line ("never overflow"). Button's CR-12 does the same, so whether to wrap, truncate or cap label length is a question for the maintainer, for the whole Actions family.
- **P3-3.** `packages/perron/src/components/LinkButton/LinkButton.tsx:65` LinkButton describes `className`, `style` and `ref` in Toolbar's and Delay's form ("Reaches the root. Merged after `pn-LinkButton`."), while its family sibling Button uses "Classes for the root, merged after `pn-Button`." and "Inline styles for the root." api-consistency's JSDoc rule wants one description per prop across siblings. The maintainer should pick one form, and Button may be the one to change.
