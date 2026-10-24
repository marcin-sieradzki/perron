# Review: StopTimeline, round 2

## P1

None.

## P2

- **P2-1.** `packages/perron/src/patterns/StopTimeline/StopTimeline.stories.tsx:98` The wrapper that round 2 added to `Default` sets `justifyItems: 'start'`, so the timeline shrinks to the width of its content: 219 px against the 332 px of every other story, measured in `patterns-stoptimeline--default` light and dark. As a result the times and delays sit right after the names instead of in their own columns at the panel's edge. This breaks design-qa's "The design" line against CR-7 and the root's `1fr` name column in the Tokens table, and it matters because `Default` is the drawing's one variant. The fix is for the timeline alone to stretch, for example `justifySelf: 'stretch'` on it, or to start-align only the two buttons.

## P3

- **P3-1.** `packages/perron/src/patterns/StopTimeline/StopTimeline.css:10` This is still open from round 1. `list-style: none` on the `<ol>` can make WebKit's VoiceOver drop the list role, so in Safari the spec's ARIA row ("`list`, from the native `<ol>`; its number of items") may not hold. It could not be checked in Chromium. The maintainer may want an explicit `role="list"`, weighed against the "native semantics first" checklist line.
- **P3-2.** `docs/patterns/stop-timeline.md:35` This is still open from round 1. StopTimeline drops `slotProps` because the contract keys them by inner Base UI part, but its Detail-category sibling DetailHeader gives its plain-element parts `slotProps` keys (`mark`, `title`, `subheader`, `action`). Patterns now have two forms (api-consistency, one idea one name), and the maintainer should say which one later patterns such as DetailPanel copy.
- **P3-3.** `docs/patterns/stop-timeline.md:116` This is still open from round 1. Passed stops set back their name, time and rail, but each Delay keeps its full kind colour (`patterns-stoptimeline--default` light and dark, rows 1 to 3), so a past "-1 min" carries the same weight as the next stop's "+3 min". This is a design question for the maintainer: keep it, or set passed delays back too.
