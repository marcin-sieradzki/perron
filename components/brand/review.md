# Review: Brand, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Brand/Brand.css:60` This carries over from rounds 1 and 2. CR-6 sets the wordmark to `CanvasText` in forced colours, and the root sets `text-decoration: none` (line 12). With `forcedColors: 'active'`, the link in the `Link` story therefore shows neither `LinkText` nor an underline, and only the focus ring marks it as a link. Should the wordmark inherit the link's system colour when Brand renders as an `<a>`? This is a question for the maintainer about CR-6.
- **P3-2.** `docs/components/brand.md:76` This carries over from rounds 1 and 2. The gap between the mark and the wordmark is `space.200` (8 px). That is less than the ring's width (8.9 px), which Logos asks for as clear space around the mark. A wider `space.*` step would settle it, or a line in Logos saying the lockup's own gap is not covered by that rule.
- **P3-3.** `docs/components/brand.md:21` This carries over from rounds 1 and 2. Layout's line "Under `breakpoint.compact-phone`, the brand mark goes" still reads as if the wordmark stays. This spec's Do and don't (line 150) forbids showing the wordmark alone, and offers hiding the whole Brand or using `variant='mark'` instead. The maintainer should settle which reading Layout means.
- **P3-4.** `packages/perron/src/components/Brand/Brand.tsx:28` This carries over from rounds 1 and 2. `ref` is typed `Ref<HTMLSpanElement>`, as in Delay, StationIcon and SeverityLabel. Yet Brand's spec leads with rendering it as a link: `Link`, `MarkLink` and `BrandNameLabel` all render an `<a>`. Text and Surface, the other `useRender` components swapped through `render`, type it `Ref<HTMLElement>` ("whichever element `render` makes it"). Both forms are established, so the question is which one Brand follows.
