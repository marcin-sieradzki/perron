# Review: Brand, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/brand.md:98` The spec's copy of the "Every shape the type accepts renders, in every variant" checklist line says the `Full`, `Mark` and `Link` stories show each variant with and without `brandNameLabel` and as a link, but no story sets `brandNameLabel` and none renders `variant='mark'` through `render={<a href="/" />}`; that is the riskiest shape, a link named only by the `VisuallyHidden` label. The line's coverage claim is unmet (contract, What axe won't catch; Stories, a `play` test for every behaviour the component promises): add the stories, or make the line say what really shows it.
- **P2-2.** `packages/perron/src/components/Brand/Brand.css:10` The CSS sets properties that have no row in the spec's Tokens table: `vertical-align: middle` and `text-decoration: none` on `root` (line 12, which removes a caller's link underline), `white-space: nowrap` on `wordmark` (line 41) and `display: block` on `mark` (line 17). The template asks for "one row per part, state and property", and the spec already lists keyword rows such as `display` and `text-transform`, so these rows should be added.
- **P2-3.** `packages/perron/src/components/Brand/Brand.tsx:18` The `brandNameLabel` JSDoc, copied from the spec's Props row (`docs/components/brand.md:43`), reads only "Overrides \"Mylder\"". It does not say where the string is seen and heard, or that an override is shown lowercase in the wordmark: rendered, `brandNameLabel="Perron app"` shows "perron app". The sibling `*Label` props say where their string appears (Delay's "heard after the number when late"), and api-consistency asks that one kind of prop be described the same way everywhere.

## P3

- **P3-1.** `packages/perron/src/components/Brand/Brand.css:60` CR-6 sets the wordmark to `CanvasText` in forced colours, and the root sets `text-decoration: none`. In the `Link` story with `forcedColors: 'active'`, the Brand link therefore shows neither `LinkText` nor an underline; only position and the focus ring mark it as a link. Should the wordmark inherit the link's system colour when Brand is rendered as an `<a>`? That is a question for the maintainer about CR-6.
- **P3-2.** `docs/components/brand.md:71` The gap between the mark and the wordmark is `space.200` (8 px). Logos asks for clear space of "at least the ring's width" (8.9 px) around the mark, so the question is whether that rule covers the wordmark inside the lockup. The options are a wider `space.*` step, or a line in Logos that excludes the lockup's own gap.
- **P3-3.** `docs/components/brand.md:21` Layout says "Under `breakpoint.compact-phone`, the brand mark goes" (`docs/foundations/layout.md:12`). That reads as the wordmark staying, while this spec's Do and don't forbids the wordmark alone and offers hiding the whole Brand or `variant='mark'`. The maintainer should settle which reading Layout means.
- **P3-4.** `packages/perron/src/components/Brand/Brand.tsx:27` `ref` is typed `Ref<HTMLSpanElement>`, as in Delay, StationIcon and SeverityLabel, but Brand's spec leads with rendering it as a link. Text and Surface, the other `useRender` components that are swapped through `render`, type it `Ref<HTMLElement>` ("whichever element `render` makes it"). Two forms are established, so this is a question of which one Brand follows.
