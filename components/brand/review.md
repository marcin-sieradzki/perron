# Review: Brand, round 2

## P1

None.

## P2

- **P2-1.** `docs/components/brand.md:33` The "Base UI already does" line ends "the caller's other props overwriting the component's". That contradicts CR-1 (`docs/components/brand.md:122`) and the contract's Root rule that `{...rest}` comes first so the component's own attributes win. It also contradicts the code, which merges `mergeProps<'span'>(rest, own)` with Brand's own props last (`packages/perron/src/components/Brand/Brand.tsx:75`). Rendered with `data-variant="zzz"` and `className="c"`, the root keeps `data-variant="full"` and `class="pn-Brand c"`. Drop the clause, or say that only a `render` element's own props are merged last, as CR-1 does.

## P3

- **P3-1.** `packages/perron/src/components/Brand/Brand.css:60` This carries over from round 1. CR-6 sets the wordmark to `CanvasText` in forced colours, and the root sets `text-decoration: none` (line 12). With `forcedColors: 'active'`, the `Link` story's link therefore shows neither `LinkText` nor an underline; only the focus ring marks it as a link. Should the wordmark inherit the link's system colour when Brand renders as an `<a>`? That is a question for the maintainer about CR-6.
- **P3-2.** `docs/components/brand.md:76` This carries over from round 1. The gap between the mark and the wordmark is `space.200` (8 px), below the ring's width (8.9 px) that Logos asks as clear space around the mark. Either a wider `space.*` step or a line in Logos that excludes the lockup's own gap would settle it.
- **P3-3.** `docs/components/brand.md:21` This carries over from round 1. Layout's "Under `breakpoint.compact-phone`, the brand mark goes" still reads as if the wordmark stays. This spec's Do and don't (line 150) forbids the wordmark alone and offers hiding the whole Brand or using `variant='mark'`. The maintainer should settle which reading Layout means.
- **P3-4.** `packages/perron/src/components/Brand/Brand.tsx:28` This carries over from round 1. `ref` is typed `Ref<HTMLSpanElement>`, as in Delay, StationIcon and SeverityLabel, although Brand's spec leads with rendering it as a link (`Link`, `MarkLink` and `BrandNameLabel` render an `<a>`). Text and Surface, the other `useRender` components swapped through `render`, type it `Ref<HTMLElement>` ("whichever element `render` makes it"). Both forms are established, so the question is which one Brand follows.
