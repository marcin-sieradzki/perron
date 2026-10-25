# Review: Section, round 1

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/section.md:127` CR-6 says `overflow-wrap: anywhere` lets "Driftsforstyrrelser" fit a 320 px screen beside an action, but `flex-wrap` breaks the header line on the title's max-content basis, so in the 320 px story frame (a section 262 px wide) the action moves below the title, and the property only breaks a word too long to sit on a line alone; no story or test checks the 320 px case, so the CR's reasoning should be reworded or given a story (Text line of the design-qa checklist).
- **P3-2.** `packages/perron/src/components/Section/Section.css:17` With `align-items: center` and a 30 px small LinkButton in the header, the gap from the title text to the content measures about 20 px in `components-section--default`, against 12 px in `TitleOnly` and `HeadingLevel`, so sections with and without an action place their headings differently and the spec's "a heading sits 12 px from its own content" (line 82) holds only without an action; a question for the maintainer: accept it, or let the action overhang the header's block size (Spacing, design deferred).
- **P3-3.** `docs/components/section.md:23` Every Section is a named `region` landmark by default, so a stop panel with several sections adds a landmark for each group; the Do and don't table already warns about this, but the maintainer may want the default to be a plain group with the region opt-in, or keep it as it is (What axe won't catch, landmarks).
