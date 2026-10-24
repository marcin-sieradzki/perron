# Review: Stat, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Stat/Stat.css:34` `.pn-Stat[data-unknown] .pn-Stat-value` is still the library's only descendant selector, and the contract's Styling rule asks for "one class, then attributes". CR-3 is why it is there: it has the CSS read the dash colour from the root's `data-unknown`. The selector's 0,3,0 specificity also means a caller's single `slotProps.value.className` can't override the colour. The maintainer may want to choose between the two rules, for example by putting `data-unknown` on the value part as well and reading `.pn-Stat-value[data-unknown]`.
- **P3-2.** `packages/perron/src/components/Stat/Stat.tsx:16` Here `label` is a required `ReactNode` of visible content. In IconButton (`packages/perron/src/components/IconButton/IconButton.tsx:18`) `label` is a required `string` that gives the accessible name. That is one name with two types and two jobs, against the api-consistency rule "one name, one type", and the next display components will copy one form or the other. The options are to keep `label` as visible `ReactNode` content, or to rename it to `title`, as EmptyState names its visible heading.
- **P3-3.** `packages/perron/src/locale/en.ts:53` The new owned-string key `unknown` ("Unknown", "Ukendt", "Okänd", "Ukjent") is a bare data-state word, and content design's table of data-state words does not list it. The key name is also generic, so a later component could reuse it with another meaning. The maintainer may want to add the word to the table in `docs/content-design.md`, or scope the key as Delay's `delayUnknown` is scoped (`statUnknown` with `statUnknownLabel`). Separately, a native Swedish speaker may want to confirm "Okänd" over the neuter "Okänt" for a figure heard on its own.
- **P3-4.** `docs/components/stat.md:84` Stat keeps the 28 px `typography.stat` at every width, because the contract allows components no viewport query, while the typography foundation steps the role down to `font.size.600` on phones. The spec records this as a token gap for the `design-tokens` skill, and Text has the same gap. Until a phone modifier for the composite lands, phone and kiosk screens get the desktop size.
- **P3-5.** `docs/components/stat.md:160` The Do column says to use "Text with `variant='stat'` for a figure inside a sentence". But `typography.stat` is the 28 px key-figure role, and a figure inside a sentence takes the sentence's own role. The row likely means a figure shown on its own without a label, and should say so. Also, Text's `stat` variant does not set `tabular-nums` (`packages/perron/src/components/Text/Text.css`), so the two ways of showing a key figure render digits differently.
