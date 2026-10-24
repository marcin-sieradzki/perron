# Review: StopTimeline, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/patterns/StopTimeline/StopTimeline.stories.tsx:158` The step "Tab passes the timeline by" proves nothing: the Default story has nothing focusable, so Tab leaves focus on `<body>` (measured) and both assertions pass however the timeline behaves; it breaks the spec's Stories row for `Default` ("Tab passes the timeline by to the next focusable element") and the contract's Stories rule to copy the contract `Keyboard` pattern, so the story needs a focusable element before and after the list, as StationIcon's `OutlinedMedium` has.
- **P2-2.** `packages/perron/src/patterns/StopTimeline/StopTimeline.stories.tsx:168` No story or `play` test covers the CR-2 branches the spec's checklist says render: `nextStopIndex` negative, not a whole number, at the first stop or at the last stop, and an empty `stops`; this breaks the contract's Stories rule ("a `play` test for every behaviour the component promises") and the checklist line "Every shape the type accepts renders", and a step on each in an existing story would cover it.
- **P2-3.** `packages/perron/src/patterns/StopTimeline/StopTimeline.css:35` The marker's `margin-block-start` (line 35) and the rail's `inset-block` and `inset-inline-start` (lines 48 and 59) are lengths the spec's Tokens table gives no row, and they rebuild `typography.label` from `font.size.325` and `font.line-height.snug` by hand, so if the label role is retuned the markers and rail drift off the name's first line with no failing check; this breaks design-qa's Spacing line ("a part the table gives no token"), and adding rows to the Tokens table that name this derivation would fix it.

## P3

- **P3-1.** `packages/perron/src/patterns/StopTimeline/StopTimeline.css:10` `list-style: none` on the `<ol>` makes WebKit's VoiceOver drop the list role, so in Safari the spec's Keyboard and ARIA row ("`list`, from the native `<ol>`; its number of items") may not hold; this could not be checked here, and the maintainer may want an explicit `role="list"` beside the "native semantics first" checklist line.
- **P3-2.** `docs/patterns/stop-timeline.md:35` The spec drops `slotProps` because "the contract keys `slotProps` by inner Base UI part", but its Detail-category sibling DetailHeader, now on `main`, gives its plain-element parts `slotProps` keys (`mark`, `title`, `subheader`, `action`); patterns now have two forms (api-consistency, one idea one name), and the maintainer should say which one later patterns copy.
- **P3-3.** `docs/patterns/stop-timeline.md:110` Passed stops set back their name, time and rail, but each Delay keeps its full kind colour (`patterns-stoptimeline--default` light and dark, rows 1 to 3), so a past "+2 min" carries the same weight as the next stop's delay; a design question for the maintainer: keep it, or set passed delays back too.
