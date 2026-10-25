# Review: Fieldset, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/fieldset.md:45` The inherited `render` row paraphrases Base UI's description ("swaps the root element and keeps the behaviour, the class and the data attributes") and adds a sentence about CheckboxGroup. The contract's Props section and `docs/components/TEMPLATE.md` ask an inherited row to give Base UI's own description: "Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render." Siblings do it both ways (Button, SegmentedControl and Tabs paraphrase; SearchField, HighlightChip and EmptyState quote), so the maintainer may want to choose one form. The CheckboxGroup sentence could move to the prose.
- **P3-2.** `docs/components/fieldset.md:74` The legend uses `typography.label`, as the brief's question 2 decided. The typography foundation's role table still lists "field and stat labels" under `typography.label-sm` (`docs/foundations/typography.md:25`), not under `typography.label` (`docs/foundations/typography.md:24`). The maintainer needs to bring the foundation table, SearchField's label and Field into line.
- **P3-3.** `packages/perron/src/components/Fieldset/Fieldset.css:28` With forced colours emulated, the disabled legend in the `Disabled` story renders in CanvasText (rgb(0, 0, 0)), the same as an enabled one, while the browser greys out the native checkboxes under it, so the legend looks live. The contract's Media queries section allows `GrayText` but has no rule for disabled text, and Button already maps `[data-disabled]` to GrayText. A library-wide rule is a decision for the maintainer.
- **P3-4.** `docs/components/fieldset.md:137` The Don't cell gives a reason for "Put a heading element inside `legend`" (it adds an entry to the outline) but none for "or type it in capitals". Content design's sentence-case rule (`docs/content-design.md:6`, capitals come only from the overline style) is the missing reason, and the Do and don't section asks each row to give its reason. A fix: add "capitals come only from the overline style", or move the capitals point to the Do cell beside "sentence case".
