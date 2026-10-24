# Review: DisruptionCard, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.tsx:22` DisruptionCard and its siblings use different shapes for a line's short name, and DepartureRow and VehicleTable will copy one of them, so which should it be: `name: string`, `lineName: ReactNode`, or MUI-style `label`? (api-consistency: One idea, one name; One name, one type.) Here it is a `DisruptionCardLine` `{ line, name: string }`, in the sibling pattern DetailHeader it is a flat `line` with `lineName: ReactNode` (`packages/perron/src/patterns/DetailHeader/DetailHeader.tsx:32`), and LineBadge takes `children: ReactNode`.
- **P3-2.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.css:46` The spec's Tokens row asks for `list-style: none` on the `lines` `<ul>`, and in WebKit with VoiceOver that can drop the list role and with it the "Affected lines, list, 2 items" announcement the spec relies on (`docs/patterns/disruption-card.md:132`). Should the list carry `role="list"` as an allowed exception to the checklist's Native semantics first line, or is Safari's behaviour accepted?
- **P3-3.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.tsx:85` The `classes` and `given` helpers (lines 85 and 91) are copied word for word from `packages/perron/src/patterns/DetailHeader/DetailHeader.tsx:66` and `:62`. Should patterns share them from one internal file, or stay self-contained as the contract's Patterns import rule reads today?
