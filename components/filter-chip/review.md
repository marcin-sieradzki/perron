# Review: FilterChip, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/filter-chip.md:68` The spec reads Toggle's `[data-pressed]` as the selected state (CR-4). The contract's Design states table (`docs/components/README.md:147`) lists `[data-pressed]` under Pressed, but Base UI's Toggle uses it to mean "on". The brief already said the contract row is the one to change, and the maintainer has not decided yet.
- **P3-2.** `docs/components/filter-chip.md:210` The label is the same whether the chip is on or off, so only `aria-pressed` tells a screen reader the state. `docs/foundations/accessibility.md` asks toggles to "say their state in words as well as in looks", and no rule says whether `aria-pressed` alone is enough for a chip whose label never changes. The maintainer decides.
- **P3-3.** `packages/perron/src/components/FilterChip/FilterChip.tsx:36` FilterChip is the first member of the Inputs family with a boolean state, so HighlightChip and Switch will copy its `selected`, `defaultSelected` and `onChange(event, value: boolean, details)`. The contract's State and events section (`docs/components/README.md:95`) names only `value`, and MUI's ToggleButton pairs `selected` with an `onChange` that passes the button's own `value`. The maintainer can either name the boolean case in the contract or keep `value` for every control.
- **P3-4.** `packages/perron/src/components/FilterChip/FilterChip.tsx:107` FilterChip and Tab take the same `count?: number` prop but draw it two ways. FilterChip composes Count and leaves out a number that is not finite. Tab draws its own `pn-Tab-count` pill and prints `NaN` or `Infinity` as text (`packages/perron/src/components/Tabs/Tabs.tsx:155`). Moving Tab onto Count would give one look and one rule, which the brief also noted.
- **P3-5.** `docs/components/filter-chip.md:112` A disabled chip that is on has a `color.surface.inset` fill, the same colour as the Count's pill. I measured `rgb(235, 238, 235)` in light and `rgb(40, 50, 55)` in dark on `components-filterchip--selected-disabled`. The pill disappears and only the tertiary figure is left. Line 129 now says so plainly, but it is still a design question: give the count a different pill when the chip is disabled, or give the chip a different fill.
- **P3-6.** `docs/components/filter-chip.md:171` CR-1 spells "the cancelable change" in American English. The content-audit skill asks for British spelling ("cancellable"). The build fixed "canceled" in the stories last round (round 2 P3-6) but missed this one.
- **P3-7.** `packages/perron/src/components/FilterChip/FilterChip.stories.tsx:33` `resolve` is a third copy of the probe helper already in `Button.stories.tsx:29` and `IconButton.stories.tsx:33`. For colours it does what the shared `colour` in `packages/perron/src/testing/stories.ts` does. The contract's Shared helpers rule (`docs/components/README.md:222`, "A helper a second component needs joins this table first") suggests moving the length-and-colour probe into that file once, for all three stories.
