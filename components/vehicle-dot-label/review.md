# Review: VehicleDotLabel, round 2

## P1

None.

## P2

- **P2-1.** `docs/components/vehicle-dot-label.md:148` The `Wrapping` row's `play` cell, changed in this round, now promises that "in a row that wraps, in a row that never wraps and in an auto-layout table cell beside longer text, each label keeps the compound whole (CR-5)". The test does not do that. Each holder in `packages/perron/src/components/VehicleDotLabel/VehicleDotLabel.stories.tsx:415-441` renders two default "Timetable only" labels and checks only that "Timetable" stays whole; the compound never appears. The promise also can't hold in a row that wraps: `regionaltogsforbindelserne` measures 152 px in `typography.label-sm`, wider than the 120 px holders, so `max-inline-size: 100%` breaks it there, as CR-5's last sentence (line 131) says it must. CR-5 holds over the Stories cell, so the cell should read "each label keeps its longest word whole", which is what the test proves (contract Stories rule: each row's `play` cell is what its test checks).

## P3

- **P3-1.** `packages/perron/src/components/VehicleDotLabel/VehicleDotLabel.tsx:58` The round 1 note still stands. The `className` JSDoc and its spec row (`docs/components/vehicle-dot-label.md:57`) read "Merged after `pn-VehicleDotLabel` on the root". The contract's Props table and most siblings write "Reaches the root. `className` is merged after `pn-<Name>`.". VehicleDot, the one entry in `dependsOn`, uses the same form as this component, so the maintainer may want one form across the library (api-consistency, JSDoc rule).
