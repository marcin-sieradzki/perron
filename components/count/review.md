# Review: Count, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Tabs/Tabs.css:60` Still open from rounds 1 and 2, as a question for the maintainer. Tabs draws its own count pill, `pn-Tab-count`, in `color.text.secondary`, with no `padding-block` and no `min-width`. Count's neutral pill uses `color.text.primary`, `space.050` block padding and a circle `min-width`, and Count's spec names "the '12' after 'Lines' on a tab" as its own use (`docs/components/count.md:3`). So two pills now do the same job with different ink and shape, which goes against api-consistency's "One idea, one name" and the contract's Families. There are three options: Tab's `count` composes Count, the two specs agree on one ink and one shape, or the difference is written down as deliberate.
- **P3-2.** `docs/foundations/semantic-colours.md:79` Still open from rounds 1 and 2. The foundation line "`color.status.<status>` fills dots, meters, icons and counts" contradicts the contract's Intents rule that status intents have no solid fill. Count follows the contract and uses the tinted surfaces (`docs/components/count.md:48`), which is right. The maintainer may want to take "counts" out of that line, so the next count-like component does not read it as leave to use a solid status fill.
