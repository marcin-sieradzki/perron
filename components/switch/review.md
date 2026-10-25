# Review: Switch, round 1

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/switch.md:159` CR-11 names system colours for off, on, disabled and focus but none for invalid, so `packages/perron/src/components/Switch/Switch.css:119` keeps the theme's `color.status.danger` edge under `forced-color-adjust: none` (measured `#FF8655` in the dark theme, about 2.4:1 on a white forced `Canvas`), which ignores the user's contrast palette (Accessibility, "Forced colours"); the maintainer may want CR-11 to give invalid a system colour or keep `ButtonText`.
- **P3-2.** `docs/components/switch.md:94` The Tokens row gives invalid a `color.status.danger` edge "on and off" and says nothing of a disabled switch in an invalid Field, while `packages/perron/src/components/Switch/Switch.css:119` drops the edge when `[data-disabled]`, as Base UI drops `aria-invalid` while disabled (`field/root/useFieldValidation.js:301`); the spec's Tokens prose could say that disabled wins over invalid, and why.
- **P3-3.** `packages/perron/src/components/Switch/Switch.tsx:44` `readOnly`, `required` and `name` are declared again only to carry Perron's JSDoc over Base UI's, as question 4 decided. The rubric's redeclared-prop rule and the contract's [Props](docs/components/README.md#props) line "declares only its own members" would leave them inherited, and siblings declare again only `disabled`. Separately, the prose at `docs/components/switch.md:33` lists five omitted members where the `Omit` at `Switch.tsx:11` drops eleven. Please confirm the decision, or inherit the three and align the prose.
- **P3-4.** `docs/components/switch.md:35` `checked`/`defaultChecked` is a new state name beside FilterChip's and HighlightChip's `selected`/`defaultSelected` and the contract's `value`/`defaultValue` ([State and events](docs/components/README.md#state-and-events)), and Checkbox will copy it (api-consistency Direction); the spec's reason (MUI and Base UI both say `checked`) stands, but the maintainer may want the contract to name it.
- **P3-5.** `docs/foundations/accessibility.md:73` "State in words" still says toggles say their state in words, while `docs/components/switch.md:141` (question 10) limits it to toggle buttons; the foundation line could say so, so the next two-state control does not ask again.
- **P3-6.** `packages/perron/src/components/Switch/Switch.css:40` The off thumb is filled with `color.text.secondary`, whose job in `docs/foundations/semantic-colours.md` is "Supporting text" (design-qa "Token use"), as `docs/components/switch.md:70` and question 6 chose; the maintainer may want that row to name control marks, or another token for the thumb.
