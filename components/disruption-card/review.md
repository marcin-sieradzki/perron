# Review: DisruptionCard, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.tsx:22` Here a line's short name is `DisruptionCardLine` `{ line, name: string }`. In the sibling pattern DetailHeader it is a flat `line` with `lineName: ReactNode` (`packages/perron/src/patterns/DetailHeader/DetailHeader.tsx:26`), and LineBadge takes `children: ReactNode`. DepartureRow and VehicleTable will copy one of these shapes, so which one should it be: `name: string`, `lineName: ReactNode`, or MUI-style `label`? (api-consistency: One idea, one name; One name, one type.)
- **P3-2.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.css:46` The spec's Tokens row asks for `list-style: none` on the `lines` `<ul>`. In WebKit with VoiceOver, that can drop the list role, and with it the "Affected lines, list, 2 items" announcement that the spec relies on (`docs/patterns/disruption-card.md:184`). Should the list carry `role="list"` as an allowed exception to Native semantics first, or is Safari's behaviour accepted?
- **P3-3.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.tsx:85` The `classes` and `given` helpers (lines 85 and 91) are copied word for word from `packages/perron/src/patterns/DetailHeader/DetailHeader.tsx:66` and `:62`. Should patterns share them from one internal file, or stay self-contained as the contract's Patterns import rule reads today?
