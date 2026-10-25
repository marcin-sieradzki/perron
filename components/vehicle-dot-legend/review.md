# Review: VehicleDotLegend, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/vehicle-dot-legend.md:142` Still open from round 1 (its P3-1). CR-9 still says "VehicleDot's stories already declare that reading of the sheets as `forcedColourSheet`" and that the helper takes "the class to look for". On this branch, VehicleDot's stories import the shared helper, and `forcedColourSheet(...classes)` (`packages/perron/src/testing/stories.ts:382`) takes several classes, as the contract's Shared helpers row already says (`docs/components/README.md:282`). The rule should describe the code as it now stands.
- **P3-2.** `docs/components/vehicle-dot-legend.md:103` Still open from round 1 (its P3-2). The ARIA table promises the root announces "Its number of items, from the `<ul>`". Safari with VoiceOver drops the list role from a `<ul>` with `list-style: none` (`packages/perron/src/components/VehicleDotLegend/VehicleDotLegend.css:11`) unless it has `role="list"`. This is a library-wide question about the contract's "Native semantics first" line, for the maintainer to settle.
- **P3-3.** `packages/perron/src/testing/stories.ts:379` Still open from round 1 (its P3-3). The shared helper's JSDoc breaks its sentence after "A play test cannot" and carries on at "turn forced colours on" on the next line, a wrap left over from an edit. Reflowing the comment would read better.
