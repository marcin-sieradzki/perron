# Review: Prik, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/Prik/Prik.css:100` The `prik.timetable.dash` pattern (2.1px dash, 1.7px gap) doesn't fit evenly around the medium ring. The circumference is 2π × 5.1px ≈ 32.0px, which is 8.43 repeats. The leftover 1.6px dash runs into the first dash at three o'clock and shows as one dash about 3.7px long (`components-prik--sizes` and `components-prik--timetable-only`, light and dark, `dot`). The small ring fits about 5.95 repeats and the large about 10.09, so they look close to even. This is a design-qa Polish finding ("uneven optical weight"). A fix means a dash that fits each ring size exactly, for example a `pathLength`-normalised dash per size, and that change goes through the `design-tokens` skill.

## P3

- **P3-1.** `docs/components/prik.md:136` CR-8 says "the shapes carry the state", but live and no signal are the same solid dot. In forced colours they differ only by `CanvasText` against `GrayText`. Under Chromium's emulated contrast theme that is rgb(0, 0, 0) against rgb(96, 0, 0), about 1.5:1, so the two can't be told apart (`components-prik--lines` with forced colours). This conflicts with `docs/foundations/accessibility.md:96`: "The Prik shapes keep each data state readable without colour." The cause is the shape set in `docs/foundations/data-states.md`, not the build. Options for the maintainer:
  - give no signal its own shape in forced colours;
  - reword the foundation line to rely on the state's word beside the dot (CR-5).
- **P3-2.** `docs/components/prik.md:90` Some shapes miss the 3:1 non-text contrast that `docs/foundations/accessibility.md:8` sets for "what state something is in":
  - `color.data-state.no-signal` measures 2.45:1 on light default, 2.18:1 on light inset and 2.39:1 on dark inset.
  - The rings and ageing rims of M2 (1.80:1), F (1.61:1), bus (2.36:1), C (2.42:1) and A (2.83:1) miss it on the light default surface.

  The spec deliberately leaves out `color.data-state.outline` and relies on the word beside the dot (CR-5). WCAG may then not count the dot as required, but the foundation's wording does not make that exception. The maintainer should confirm the unattended answer, or widen the outline or the no-signal token through `design-tokens`.

- **P3-3.** `packages/perron/src/components/Prik/Prik.tsx:15` Two prop names here are new, and PrikLabel, PrikLegend, LineBadge and DepartureRow will copy them (api-consistency: a new name siblings will copy is Direction). Both were answered "to confirm" in an unattended run:
  - `variant` is used for the data state, not a visual variant, so a later PrikLabel couldn't also have a visual `variant`.
  - `line` mixes line ids with the two modes, `'bus'` and `'regional'`.
- **P3-4.** `docs/components/prik.md:154` The recorded question still calls `state` Prik's "one variant property". The answer at line 39 renamed it to `variant`, and the spec reads as if it contradicts itself. Content audit asks for one term per thing; this answer could add a note that the property is now `variant`.
- **P3-5.** `scripts/lib/site.ts:37` The build changed the whole docs site in this component's branch: every repo Markdown file a page links to is now copied onto the site, and `scripts/lib/site.test.ts:25` now expects a `## Specs` group. The check passes. But the copy only follows links one level deep, so links inside the copied ADR and `penpot/README.md` won't be followed. The maintainer may want this change in its own PR.
