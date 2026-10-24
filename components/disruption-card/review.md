# Review: DisruptionCard, round 1

## P1

- **P1-1.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.tsx:131` When the card is a link (the `Link` story, light and dark), the list's `aria-label` replaces the badges' text in the link's accessible name, so Chromium names the link "Delays Affected lines Signal fault at Kongens Nytorv M2 and M3 trains…" and the ear never hears the badges' "M2" and "M3" on Tab, which breaks the spec's Keyboard and ARIA row for `root` ("as a link, its whole text content", `docs/patterns/disruption-card.md:123`) and the first line of What axe won't catch ("Everything the eye is told, the ear is told, for every shape each prop accepts").
- **P1-2.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.stories.tsx:157` The `Planned` story's 320 px container never wraps the header: in both themes the header is one row 22 px tall, with the SeverityLabel at 101 px and the list at 74 px inside a 294 px content box, so no story shows the CR-9 wrap that the spec's Stories row asks for ("in a 320 px container so the header wraps", `docs/patterns/disruption-card.md:184`).

## P2

- **P2-1.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.css:28` With no `lines`, the header is only the SeverityLabel's line, 15.6 px tall against 22 px with badges, so in the `Data` story (light and dark) the title sits 6.4 px higher than in every other variant and titles don't line up in a list of mixed cards; this is design-qa's Alignment line across the variants of a story set, and the fix is to keep the header one badge high (`size.badge`).
- **P2-2.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.tsx:56` The `slotProps` JSDoc reads "Props for each inner part, merged with the part's own, which win", where the sibling pattern DetailHeader (`packages/perron/src/patterns/DetailHeader/DetailHeader.tsx:43`) adds ": the caller's class follows the part's own"; api-consistency's JSDoc rule asks for one description of one prop in every member that has it.
- **P2-3.** `.changeset/disruption-card.md:5` The changeset reads only "Adds `DisruptionCard`." and leaves out the new owned string `affectedLines` in all four locales, which the package now ships; SeverityLabel's changeset names the owned strings it added, and content-audit says a changed owned string ships with its changeset.

## P3

- **P3-1.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.tsx:20` A line's short name is `{ line, name: string }` here, but DetailHeader has the flat `line` with `lineName: ReactNode` and LineBadge takes `children: ReactNode`; DepartureRow and VehicleTable will copy one of these shapes, so which should it be (api-consistency, One idea one name, One name one type)?
- **P3-2.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.css:44` `list-style: none` on the `<ul>` can make WebKit with VoiceOver drop the list role, and the "Affected lines, list, 2 items" announcement the spec relies on (`docs/patterns/disruption-card.md:130`) goes with it; should the list carry `role="list"` as an allowed exception to Native semantics first, or is Safari's behaviour accepted?
- **P3-3.** `packages/perron/src/patterns/DisruptionCard/DisruptionCard.tsx:80` The `classes` and `given` helpers (lines 80 and 86) are copied word for word from `packages/perron/src/patterns/DetailHeader/DetailHeader.tsx:62` and `:66`; should patterns share them from one internal file, or stay self-contained as the Patterns import rule reads today?
