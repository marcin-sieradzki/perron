# Review: DayProfileChart, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/patterns/day-profile-chart.md:228` CR-8 keeps the tip clear of the point it describes, but the tip still covers the line next to it. In `patterns-dayprofilechart--default` in light and dark, the tip at 08:00 covers the line from 08:00 to about 11:00. At 23:00 it covers the 17:00–20:00 fall. At 00:00 in `patterns-dayprofilechart--unknown-hours` it covers the 06:00–08:00 rise. The question for the maintainer: should the tip move off the plot, for example into the space above it, so the whole line stays visible?
- **P3-2.** `packages/perron/src/patterns/DayProfileChart/DayProfileChart.tsx:252` When a hover tip shows and focus is elsewhere, Escape clears the tip and still passes the key on, so a detail panel that listens on the document closes in the same press. `docs/foundations/accessibility.md:72` says "Esc closes the topmost thing first: a dialog, then a detail panel, then a highlight". The maintainer could decide whether a hover tip is the topmost thing and should keep that press for itself.
- **P3-3.** `docs/patterns/day-profile-chart.md:224` CR-4 draws a lone known count as a dot from the line's round cap. In `patterns-dayprofilechart--unknown-hours` (12:00), in both themes, that dot is 2 px and hard to see. A marker-size token could give it a visible mark.
- **P3-4.** `docs/patterns/day-profile-chart.md:226` CR-6 points the plot's `role="group"` at a `listitem` through `aria-activedescendant`. Chromium's accessibility tree exposes this, but this pass could not check whether VoiceOver or NVDA announce active-descendant changes on a role that is not composite. If they don't, the arrow keys are silent. Worth testing in a real screen reader before `stable`.
- **P3-5.** `docs/patterns/day-profile-chart.md:222` CR-2 counts any finite number as known. A negative count plots below the baseline into the axis, and `grouped` (`DayProfileChart.tsx:109`) writes it with a hyphen-minus rather than content design's "−". A fractional count gets a "." in every locale. Should CR-2 treat these as unknown, or clamp them?
- **P3-6.** `packages/perron/src/locale/en.ts:55` The JSDoc for the `unknown` key names Stat, FactList, Count and Meter but not DayProfileChart's point list, where the word is heard after a time. Translators don't see that place.
- **P3-7.** `packages/perron/src/patterns/DayProfileChart/DayProfileChart.css:144` The forced-colours block has no rule for the gridline. It keeps `color.border.subtle`, which does not show in the forced-colours render of `patterns-dayprofilechart--default`, so the scale's top count has no line to mark. The Tokens table has no forced-colours row for the gridline, as it has `GrayText` for the baseline.
- **P3-8.** `packages/perron/src/patterns/DayProfileChart/DayProfileChart.tsx:70` The `<ol>` part's key, `slotProps.points`, has the same name as the `points` prop, which holds the data. This goes against api-consistency's "One idea, one name". ReportStrip and VehicleTable will copy whichever form this sets, so a part name such as `list` may be better.
- **P3-9.** `docs/patterns/day-profile-chart.md:235` The Stories intro, and the header comment in `DayProfileChart.stories.tsx:2-3`, call the 376 px container "the overview sheet's width". The Tokens row on line 107 gives the plot as 115 px in the overview sheet, which takes off the sheet's padding, but every story renders a 125 px plot. One of the two should say how wide the chart really is inside the sheet.
- **P3-10.** `docs/foundations/semantic-colours.md:14` The foundations still give axis labels `color.text.tertiary`, which axe fails on visible text. This chart moved its axis and scale to `color.text.secondary` (`docs/patterns/day-profile-chart.md:166`), and the next chart will hit the same failure. Should the foundations change the colour for axis labels?
- **P3-11.** `docs/components/README.md:113` The contract keys `slotProps` by Base UI part, which a pattern does not have. This spec gives one key per HTML part, as DataStatePanel and KioskBar do, while StopTimeline has none. The contract could say which form patterns use.
