# Review: Count, round 1

## P1

- **P1-1.** `docs/components/count.md:142` The Stories prose says "Each story renders Count alone, from its args", which contradicts CR-9 (`docs/components/count.md:136`) and the spec's own checklist line (`docs/components/count.md:102`). Both say a status `color` comes with words that say what is counted, and both say the review holds the stories to it. As built, `packages/perron/src/components/Count/Count.stories.tsx:38-88` render `Danger` "3", `Info` "2", `Success` "0" and `Warning` "5" as bare tinted figures, with no words beside them, in both themes. The ear hears only "3", and the docs page will show the spec's own Don't ("Let the tint be the only sign", line 163). This breaks CR-9 and the contract's What axe won't catch line "Everything the eye is told, the ear is told". CR-9 holds over the prose. The fix is to rewrite line 142 and give each status story a `render` that sets the caller's words before the pill, such as `(args) => <>Delays <Count {...args} /></>`. The args stay Count alone, so the contract story still renders the subject alone.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Tabs/Tabs.css:60` A question for the maintainer. Tabs already draws its own count pill, `pn-Tab-count`, with `color.text.secondary`, no `padding-block` and no `min-width` (`docs/components/tabs.md:124-129`). Count's neutral pill uses `color.text.primary`, `space.050` block padding and a circle `min-width`, and its spec names "the '12' after 'Lines' on a tab" as its own use (`docs/components/count.md:3`). So the library now has two different count pills for the same job. The options are: Tab's `count` composes Count, the two specs agree on one ink and one geometry, or the difference is written down as deliberate.
- **P3-2.** `docs/foundations/semantic-colours.md:79` The foundation line "`color.status.<status>` fills dots, meters, icons and counts" contradicts the contract's [Intents](docs/components/README.md#intents) rule that status intents have no solid fill. Count's spec follows the contract and uses the tinted surfaces (`docs/components/count.md:48`), which is right, since the contract holds over the foundations. The maintainer may want to take "counts" out of that foundation line, or reword it, so the next count-like component does not read it as leave to use a solid status fill.
