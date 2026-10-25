# Review: Tag, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/tag.md:122` CR-6 asks for two things at once: keep whole words wherever they fit, and stay inside the container. Since `overflow-wrap: break-word` (`packages/perron/src/components/Tag/Tag.css:10`, the round 1 fix), a caller's flex row can no longer have both. The row in the test was 160 px wide, which is 320 px at 200% zoom, with "Nørreport St." beside the tag. In that row the tag ran past the row's edge by 43 px with "Erstatningsbus", by 52 px with "Ersättningsbuss" and by 22 px with "Replacement bus planned". A tag alone in a narrow block or flex box still wraps and stays inside. `anywhere` would keep it inside, but it breaks words mid-word, as round 1 found. Question for the maintainer: (a) keep `break-word` and have CR-6 and Do and don't say that a row holding a tag wraps (`flex-wrap`) or lets its text give way, or (b) go back to `anywhere` and accept mid-word breaks in tight rows?
- **P3-2.** `packages/perron/src/components/Tag/Tag.css:13` This is round 1's P3-1, still open. `radius.full` stays on a tag that wraps onto three or more lines, so a long compound in a 90 px box ("Togbusforbindelseserstatning") turns the pill into an oval whose curve crowds the first and last letters. Question for the maintainer: keep the pill at every height, or let a wrapped tag step down to a smaller radius (Tokens row at `docs/components/tag.md:63`)?
- **P3-3.** `packages/perron/src/components/Tag/Tag.tsx:9` This is round 1's P3-2, still open. `TagProps` inherits `className`, `style` and `ref` from `useRender.ComponentProps<'span'>`, so they carry no JSDoc. Yet spec line 30 says each Props row's description becomes its JSDoc, and rows 48–50 give those three descriptions. The Display family is split on this (Text, Brand and FactList declare them; Stat and LineBadge inherit them), and the contract's Props section allows both. Question for the maintainer: which form should the family follow?
