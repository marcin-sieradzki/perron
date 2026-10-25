# Review: VehicleDotLabel, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/VehicleDotLabel/VehicleDotLabel.tsx:58` This note from rounds 1 and 2 still stands. The `className` JSDoc and its spec row (`docs/components/vehicle-dot-label.md:57`) read "Merged after `pn-VehicleDotLabel` on the root". The contract's Props table (`docs/components/README.md:55`) reads "Reaches the root", and most siblings write "Reaches the root. Merged after `pn-<Name>`." (Tabs, Toolbar, Accordion, Checkbox). VehicleDot, Brand, StationIcon and StopTimeline use this component's form, so the maintainer may want one form across the library (api-consistency, JSDoc rule).
