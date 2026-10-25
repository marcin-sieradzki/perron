# Review: RadioGroup, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/RadioGroup/RadioGroup.css:119` With forced colours on, an invalid radio's edge keeps the theme's `color.status.danger` under `forced-color-adjust: none`. It renders as `rgb(194, 65, 12)` in the `Invalid` story, light theme, with forced colours emulated, and on a checked invalid radio the forced hover and press rules at `:161-165` turn that edge `Highlight`. CR-11 (`docs/components/radio-group.md:215`) names no invalid look, and Switch has the same gap. Should both controls use a system colour, such as `Highlight` or `Mark`? This was rounds 1 and 2's P3-1, still unanswered.
- **P3-2.** `packages/perron/src/components/RadioGroup/RadioGroup.css:105` The disabled radio follows Switch: an inset circle with a subtle edge, and when checked a `color.text.tertiary` fill with a raised dot. Checkbox draws disabled as a transparent box with a subtle edge, and when ticked an inset box with a tertiary mark, as the spec says at `docs/components/radio-group.md:113`. Which disabled look should the maintainer keep for both choice marks?
- **P3-3.** `packages/perron/src/components/RadioGroup/RadioGroup.css:23` The radio's row, and so its focus ring, takes `radius.md`. The row has no inline padding, so the ring sits `focus.offset` from the circle and from the last letter. Checkbox's matching row takes `radius.xs` (`packages/perron/src/components/Checkbox/Checkbox.css:16`). Should the two choice controls draw the ring the same way?
- **P3-4.** `packages/perron/src/components/RadioGroup/RadioGroup.css:33` The circle is sized by `icon.size.400`, an icon size, for a mark that is not an icon. Checkbox's 16 px box takes `size.checkbox` (`packages/perron/src/parts/CheckboxIndicator/CheckboxIndicator.css:13`), so the two marks agree in size but not in token (`docs/components/radio-group.md:109`). Should one choice-mark size token cover both, added through the `design-tokens` skill?
- **P3-5.** `docs/components/fieldset.md:143` Fieldset's Do row still says to give a group's description and error "through a Field round it, as CheckboxGroup and RadioGroup do", and its line 24 says the same ("CheckboxGroup and RadioGroup take them that way, through Field"). RadioGroup's CR-12 and Don't row (`docs/components/radio-group.md:216,254`) allow only Base UI's `Field.Root` with no `Field.Label`, never Perron's Field. Should Fieldset's lines name Base UI's `Field.Root` now, or wait until Field gains a group mode?
