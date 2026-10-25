# Review: Fieldset, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/fieldset.md:89` The ARIA table's root row says the disabled state is announced "on the group and on each native control in it", and the checklist line at `docs/components/fieldset.md:94` repeats it ("the disabled state the browser announces on the group"). In Chromium's accessibility tree for the `Disabled` story, the `<fieldset disabled>` group has no `disabled` property, and only the three checkboxes carry `disabled=true` (read with CDP `Accessibility.getFullAXTree`). Both lines contradict what the code renders. Because CR-7 and the native-semantics line say Perron adds no ARIA, the code holds and the two spec lines should say that the ear hears the state on each control.
- **P2-2.** `docs/components/fieldset.md:112` CR-1 says "Realtidsdataforsinkelser" in a 320 px column wraps inside the root, but the word is about 152 px wide in `typography.label`, so it fits on one line at 320 px. The Stories row at `docs/components/fieldset.md:126` and the play test at `packages/perron/src/components/Fieldset/Fieldset.stories.tsx:115` use a 120 px column for this reason. The Stories row and the code are right, and CR-1 should name the width at which the word actually wraps.
- **P2-3.** `docs/components/fieldset.md:30` The Base UI parts table puts `style` under "Perron sets" for `Fieldset.Root`. In the code (`packages/perron/src/components/Fieldset/Fieldset.tsx:65-70`), `style` reaches the root through `{...rest}` like the props listed under "Passed through". The code is right, and `style` belongs in the Passed through column.
- **P2-4.** `docs/components/fieldset.md:141` In the Do and don't table, the Don't reason "a `group` with nothing to fill in tells a screen reader there is" stops before it says what the screen reader is told. This breaks content design's "plain sentences" rule and the section's rule that each row gives its reason. A fix: "tells a screen reader there is something to fill in".

## P3

- **P3-1.** `docs/components/fieldset.md:45` The `render` row gives a Perron paraphrase plus a sentence about CheckboxGroup, not Base UI's description. The contract's Props section asks an inherited row for Base UI's description, and so do `docs/components/TEMPLATE.md:43` and the inherited rows of most specs. Siblings are split: Button, SegmentedControl and Tabs use this paraphrase, while SearchField, HighlightChip and EmptyState use Base UI's text. The maintainer may want to pick one form, and the CheckboxGroup sentence could move to prose.
- **P3-2.** `docs/components/fieldset.md:74` The legend uses `typography.label`, as the answer to the brief's question 2 decided. The typography foundation's role table (`docs/foundations/typography.md:24-25`) still lists "field ... labels" under `typography.label-sm` and not under `typography.label`. The foundation table, SearchField's label and Field need to be brought into line by the maintainer.
- **P3-3.** `packages/perron/src/components/Fieldset/Fieldset.css:28` With forced colours emulated, the disabled legend renders in CanvasText (rgb(0, 0, 0)), the same as an enabled one, so it looks live. The contract has no forced-colours rule for disabled text, and Button already maps `[data-disabled]` to GrayText. A library-wide rule is a decision for the maintainer.
