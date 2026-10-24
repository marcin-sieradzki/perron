# Review: Stat, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/Stat/Stat.css:5` The root's `display: flex` makes a block box that fills its container: it measured 768 px wide in the `Default` story at an 800 px viewport, where the label and figure take 78 px and 51 px. That breaks CR-10's "Stat sizes to its content". When a caller makes Stat a link through `render`, as the spec's Keyboard and ARIA section suggests, the hit area and focus ring then span the whole row. `width: fit-content` on the root, or `inline-flex`, keeps the flex column the Tokens prose asks for.

## P3

- **P3-1.** `packages/perron/src/components/Stat/Stat.css:32` `.pn-Stat[data-unknown] .pn-Stat-value` is the only descendant selector in the library's CSS. The contract's Styling rule asks for "one class, then attributes", but CR-3 asks the CSS to read the dash colour from the root's `data-unknown`. The maintainer may want to choose between them. One option is a `data-unknown` on the value part too, read as `.pn-Stat-value[data-unknown]`. That would also drop the selector's 0,3,0 specificity, which a caller's single `slotProps.value.className` can't override.
- **P3-2.** `packages/perron/src/components/Stat/Stat.tsx:16` `label` is a required `ReactNode` of visible content here, while IconButton's `label` (`packages/perron/src/components/IconButton/IconButton.tsx:18`) is a required `string` accessible name. That is one name with two types and two jobs, against the api-consistency rule "one name, one type". Later display components will copy one of the two forms. The options are to keep `label` as visible `ReactNode` content, or to rename it the way EmptyState names its visible heading (`title`).
- **P3-3.** `packages/perron/src/locale/en.ts:49` The new owned-string key `unknown` ("Unknown", "Ukendt", "Okänd", "Ukjent") is a bare data-state word that content design's table of data-state words does not list. It is also a generic key that a later component could reuse for another meaning. The maintainer may want to add it to the table in `docs/content-design.md`, or scope it as Delay's `delayUnknown` is scoped, such as `statUnknown` with `statUnknownLabel`.
- **P3-4.** `docs/components/stat.md:84` The typography foundation steps `typography.stat` down to `font.size.600` on phones. Stat keeps 28 px at every width because the contract allows no viewport query. The spec calls this a token gap for the `design-tokens` skill, and Text has the same gap. Until a phone modifier for the composite lands, a kiosk or phone screen gets the desktop size.
- **P3-5.** `docs/components/stat.md:160` The Do column says to use "Text with `variant='stat'` for a figure inside a sentence". But `typography.stat` is the 28 px key-figure role, and a figure inside a sentence takes the sentence's own role. The row likely means a figure shown on its own without a label, and should say so. Also, Text's `stat` variant does not set `tabular-nums` (`packages/perron/src/components/Text/Text.css`), so the two ways of showing a key figure render digits differently.
