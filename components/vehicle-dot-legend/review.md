# Review: VehicleDotLegend, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/vehicle-dot-legend.md:87` The Tokens prose says "`color.text.primary` reaches 15:1 or more on every surface" and talks of "the 1.6 px rings". Both are wrong. The [Accessibility](../foundations/accessibility.md#text-on-surfaces) contrast table gives `color.text.primary` 13.45:1 on dark raised and 11.21:1 on dark inset. The `vehicle-dot.*` tokens draw the rings at 1.3 px (ageing) and 1.8 px (estimated), and only the timetable dash at 1.6 px. The foundation and the tokens hold, so the line must give their figures (for example "11:1 or more on every surface", and the rings' real widths).

## P3

- **P3-1.** `docs/components/vehicle-dot-legend.md:142` CR-9 still says "VehicleDot's stories already declare that reading of the sheets as `forcedColourSheet`" and that the helper takes "the class to look for". After this branch, VehicleDot's stories import the shared helper (`VehicleDot.stories.tsx:12`), and `forcedColourSheet(...classes)` takes several classes (`packages/perron/src/testing/stories.ts:382`). The rule should describe the code as it now stands.
- **P3-2.** `docs/components/vehicle-dot-legend.md:103` The ARIA table promises the root announces "Its number of items, from the `<ul>`". Safari with VoiceOver drops the list role from a `<ul>` styled `list-style: none` (`VehicleDotLegend.css:11`) unless it has `role="list"`, so the count is not announced there. The build raised this as a library-wide direction (StopTimeline, KioskBar and others do the same). The maintainer may want to settle it in the contract's "Native semantics first" line before this ships.
- **P3-3.** `packages/perron/src/testing/stories.ts:379` The new shared helper's JSDoc breaks its sentence after "A play test cannot" and carries on at "turn forced colours on" on the next line, a wrap left over from an edit. Reflowing the comment would read better.
