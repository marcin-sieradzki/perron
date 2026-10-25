# Review: VehicleDot, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/vehicle-dot.md:191` The `ForcedColours` story no longer claims to show its forced-colours look, so P2-2 from round 1 is fixed. The fix took the option of rewording the spec, though, so the story's first render (`VehicleDot.stories.tsx:522`) matches the medium row of `Sizes`. The docs page, the visual stage and the audits never see the shapes CR-9 promises: checked here with Playwright's `emulateMedia({ forcedColors: 'active' })`, the five shapes render correctly, but only this review saw them. The contract's Stories rule leaves this choice open. The maintainer may still prefer a first render that adopts the forced-colours sheet, such as a decorator, or a visual-stage capture under `forcedColors: 'active'`, as the build's direction note suggests.
- **P3-2.** `docs/components/vehicle-dot.md:34` Test coverage, missed in round 1. The "Base UI already does" line lists two behaviours that no `play` step in `packages/perron/src/components/VehicleDot/VehicleDot.stories.tsx` proves:
  1. The caller's `ref` reaches the root element. The Props row at line 53 says "Reaches the root".
  2. The caller's `style` is merged onto the root by `mergeProps`. The Props row at line 52 says "Reaches the root".

  A step in the `Live` story that passes a ref callback and a `style`, then checks the root element and its computed style, would tick both.

- **P3-3.** `packages/perron/src/components/VehicleDot/VehicleDot.stories.tsx:518` The new JSDoc on `ForcedColours` says the first render is shown by "the docs page and the visual stage". The spec's Shows cell at `docs/components/vehicle-dot.md:191`, following the contract's Stories rule, also names the audits. Adding the audits would make the two agree word for word.
