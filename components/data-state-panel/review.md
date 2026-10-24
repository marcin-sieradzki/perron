# Review: DataStatePanel, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/patterns/DataStatePanel/DataStatePanel.stories.tsx:138` The `ErrorRetry` play test ends with the status at loading and focus on the message part, and so does the story when Storybook renders it. That keeps the spec (`docs/patterns/data-state-panel.md:133`) but not the literal wording of the contract's Stories rule that a play test ends "in the resting state: popups closed and focus back where it started", which a one-way change of status cannot meet. Question for the maintainer: does the contract allow an exception for a story that tests a change of state, or should the rule say so?
- **P3-2.** `docs/patterns/data-state-panel.md:117` CR-6 also fires when `status` becomes `'ready'` while focus sits on the message part. Focus then stays on the empty, zero-height `role="status"` div, and its 2 px focus ring draws as a thin bar above the data view. Seen on the Empty story: focus "Clear filters", set `'loading'`, then `'ready'`. Question for the maintainer: should focus stay on the empty region, move to the start of `children`, or be left to the caller once the data arrives?
- **P3-3.** `docs/patterns/data-state-panel.md:78` The ARIA table says the region announces "the empty or error title with the sentence". EmptyState renders the action inside the `role="status"` region (`packages/perron/src/patterns/DataStatePanel/DataStatePanel.tsx:157`), so its label ("Clear filters", "Try again") is announced too, and a control sits inside a live region. Options: accept this and say so in the spec, or render the action outside the message part.
- **P3-4.** `docs/patterns/data-state-panel.md:125` `status` works as this pattern's Penpot variant property, and the root carries `data-status` (`DataStatePanel.tsx:155`). The contract's Props and data-attribute rules name the variant property `variant`, with `data-variant` on the root. ReportStrip, VehicleTable and DayProfileChart will copy this, so the maintainer should decide now: either allow `status` with `data-status` as a second name for a variant property, or have the contract name this case.
- **P3-5.** `packages/perron/src/patterns/DataStatePanel/DataStatePanel.stories.tsx:14` The stories write station names as "Buddinge st" and "Ballerup st". DetailHeader writes "Nørreport St.", and neither `docs/content-design.md` nor `docs/glossary.md` says which form is right. Content design should pick one form for station names.
