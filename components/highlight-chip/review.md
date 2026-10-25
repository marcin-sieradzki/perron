# Review: HighlightChip, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/HighlightChip/HighlightChip.css:32` The round 2 P1 is fixed. At 320 px, a 62-letter Danish word now breaks inside a 288 px chip in light and dark, with `scrollWidth` equal to `clientWidth`, and the new `Default` play test guards it. The contract's CSS Long words rule (`docs/components/README.md:164-165`) gives `anywhere` to a box that takes its container's width and `break-word` to a content-sized box in a row, and the chip is a content-sized box that floats alone, so it fits neither line. The spec's reason at `docs/components/highlight-chip.md:85` and CR-7 holds: with `break-word`, the anonymous flex item that holds the words never gets narrower than its longest word. Still, a screen that put the chip in a flex row could now squeeze it to one letter a line, which is the case the contract warns about. The maintainer may want the contract to name an `inline-flex` root whose words are an anonymous flex item.
- **P3-2.** `packages/perron/src/components/HighlightChip/HighlightChip.css:25` The chip writes the glass fill, `backdrop-filter` and `shadow.panel` itself. The contract's Glass line (`docs/components/README.md:206`) exempts only "a Base UI popup or panel" from composing Surface with `variant='glass'`. The maintainer may widen that line to cover any element Base UI renders, such as a Toggle, or have the chip compose Surface through `render`.
- **P3-3.** `docs/components/highlight-chip.md:58` The spec reads Base UI's `[data-pressed]` as the Selected design state, as FilterChip does. The contract's Design states table (`docs/components/README.md:147-150`) lists `[data-pressed]` under Pressed and only `[data-selected]` and `[data-checked]` under Selected. The contract could name a Toggle's `[data-pressed]` under Selected, so the Toggle-based chips rest on a written rule.
- **P3-4.** `packages/perron/src/components/HighlightChip/HighlightChip.css:96` `forced-color-adjust: none` is inherited. In a contrast theme, a LineBadge the spec suggests putting in `children` (line 41) therefore keeps its theme line colours inside a selected chip, and the chip keeps its theme `shadow.panel`. FilterChip, by contrast, hands its inner Count back to the system with `forced-color-adjust: auto`. The maintainer may want the chip's content returned to system colours too.
- **P3-5.** `packages/perron/src/components/HighlightChip/HighlightChip.css:89` A disabled chip at rest has no forced-colours rule and relies on the browser greying a natively disabled `<button>`. A `render` with `nativeButton={false}` gets only `aria-disabled` and `data-disabled`, so the browser does not grey it. FilterChip and SegmentedControl both set `GrayText` explicitly on `[data-disabled]`, and the three toggles could share that form.
