# Review: Count, round 2

## P1

- **P1-1.** `docs/components/count.md:142` The Stories prose says "`Neutral` and `Unknown` render Count alone". The foundations allow `color.text.tertiary` for "the '—' of an unknown delay or figure, always next to stronger text" (`docs/foundations/accessibility.md:7`, `docs/foundations/semantic-colours.md:14`), and the spec relies on that permission itself at `docs/components/count.md:122`. As built, `packages/perron/src/components/Count/Count.stories.tsx:108` renders the bare "—" with no words beside it. Measured in `components-count--unknown`, it is 3.42:1 on `color.surface.inset` in light and 3.28:1 in dark. A screen reader hears only "Unknown", where the spec promises "Delays Unknown" (line 122). This breaks the design-qa Contrast line, the accessibility foundation's deliberate-miss rule and the contract's What axe won't catch line "Everything the eye is told, the ear is told". The foundations hold over the spec's prose, so line 142 changes. Stat's and FactList's `Unknown` stories already put their dash beside a label. The fix is to rewrite line 142 so that `Unknown`, like the status stories, sets the caller's words before the pill. Give the story `render: after('Delays')`, keep its args Count's alone, and change its `play` to expect "Delays Unknown" or to read the pill's text alone.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Tabs/Tabs.css:60` This is still open from round 1, as a question for the maintainer. Tabs draws its own count pill, `pn-Tab-count`, in `color.text.secondary`, with no `padding-block` and no `min-width`. Count's neutral pill uses `color.text.primary`, `space.050` block padding and a circle `min-width`. Count's spec names "the '12' after 'Lines' on a tab" as its own use (`docs/components/count.md:3`), so two pills now do the same job with different ink and shape. The options are: Tab's `count` composes Count, the two specs agree on one ink and one shape, or the difference is written down as deliberate.
- **P3-2.** `docs/foundations/semantic-colours.md:79` This is still open from round 1. The foundation line "`color.status.<status>` fills dots, meters, icons and counts" contradicts the contract's Intents rule that status intents have no solid fill. Count follows the contract and uses the tinted surfaces (`docs/components/count.md:48`), which is right. The maintainer may want to take "counts" out of that line, so the next count-like component does not read it as leave to use a solid status fill.
