# Review: VehicleDot, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/VehicleDot/VehicleDot.tsx:48` The five owned-string overrides are documented only as `Overrides "Live"`, `Overrides "Ageing"`, `Overrides "Estimated"`, `Overrides "Timetable only"` and `Overrides "No signal"` (lines 48, 53, 58, 63 and 68, with the same text in the spec's Props rows at `docs/components/vehicle-dot.md:46-50`). Every other `*Label` in the library also says where its word is seen or heard. Its Transit sibling SeverityLabel, for example, reads `Overrides "Delays", the name shown for `severity='delay'``. This breaks the form the siblings share (api-consistency, JSDoc rule). Write each one as, for example, `Overrides "Live", heard as the dot's name when `variant='live'``, in both the JSDoc and the Props row.
- **P2-2.** `docs/components/vehicle-dot.md:191` The `ForcedColours` row says the story shows "the five states on M1, as forced colours draw them". The contract's Stories rule says the docs page, the visual stage and the audits show each story's first render. That first render is in normal colours: the forced-colours sheet is only adopted while `play` runs (`VehicleDot.stories.tsx:438`). As shipped, the story looks the same as the medium row of `Sizes`. Either reword the Shows cell to say the forced-colours look exists only in the `play` test, or make the first render draw it.
- **P2-3.** `docs/components/vehicle-dot.md:182` Test coverage: these lines from the spec have no `play` step that proves them:
  1. `ageingLabel`, `estimatedLabel`, `timetableOnlyLabel` and `noSignalLabel` each rename their state's root (Owned strings table; the checklist line "Every default label can be overridden"). Only `liveLabel` is pressed into a test, so a wrong key in `LABEL_KEY` or `useOwnedStrings` would pass.
  2. With `variant` and `size` left out, the root still carries `data-variant="live"` and `data-size="medium"` and draws a live dot at `icon.size.400` (CR-7, "defaults included"). Every story passes both props explicitly.
  3. No signal never takes a ring (CR-8): the `NoSignal` story never asserts `stroke: none` on its dot.
  4. The cut is not mirrored in right-to-left text (CR-8): no step renders the dot under `dir="rtl"`.
  5. `render` swaps the root element and keeps the class, `data-*` attributes and glyph children ("Base UI already does", line 34).
  6. The class order on the root is `pn-VehicleDot` first, then the caller's `className` (Base UI parts row, line 32; Props row `className`).

## P3

- **P3-1.** `packages/perron/src/components/VehicleDot/VehicleDot.stories.tsx:363` In the `Lines` table each dot is a named `img` under a column header with the same word, so a screen reader hears "Live" twice. The spec's Do and Don't (line 200) says to pass `aria-hidden` when the word is already beside the dot. A table cell read without its header may still want the name, so whether the story's dots pass `aria-hidden` is the maintainer's call, together with the open question about VehicleDotLegend.
- **P3-2.** `packages/perron/src/components/VehicleDot/VehicleDot.css:118` As the spec chose (line 118, question 5), the timetable-only dash keeps the token's 2.1 px / 1.7 px at every size, so on the medium ring it repeats about 8.4 times and the last dash runs into the first. An even dash at every size still needs a token change through the `design-tokens` skill.
- **P3-3.** `docs/components/vehicle-dot.md:116` Light-theme no signal (`#9AA4A9`) measures about 2.4:1 on `color.surface.default`. The spec accepts this because the word beside the dot (CR-5) and the cut also tell the state. Whether the existing `color.data-state.no-signal` token should reach 3:1 for a non-text mark is a token question for the maintainer.
