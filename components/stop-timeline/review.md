# Review: StopTimeline, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/patterns/StopTimeline/StopTimeline.css:10` Still open from round 1: `list-style: none` on the `<ol>` can make WebKit's VoiceOver drop the list role, so in Safari the spec's ARIA row ("`list`, from the native `<ol>`; its number of items") may not hold. This review ran only in Chromium, which keeps the list role, so it could not check Safari. The maintainer may want an explicit `role="list"`, weighed against the "Native semantics first" checklist line.
- **P3-2.** `docs/patterns/stop-timeline.md:35` Still open from round 1: StopTimeline drops `slotProps` because the contract keys them by inner Base UI part, but DetailHeader, its sibling in the Detail category, gives its plain-element parts `slotProps` keys (`mark`, `title`, `subheader`, `action`), so patterns now have two forms (api-consistency, "one idea, one name"), and the maintainer should say which one later patterns such as DetailPanel copy.
- **P3-3.** `docs/patterns/stop-timeline.md:116` Still open from round 1: passed stops set back their name, time and rail, but each Delay keeps its full kind colour (`patterns-stoptimeline--default` and `--finished`, light and dark), so a past "-1 min" has the same weight as the next stop's "+3 min"; this is a design question for the maintainer, who can keep it or set passed delays back too.
