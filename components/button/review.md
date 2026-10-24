# Review: Button, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/Button/Button.css:16` With `white-space: nowrap` and no `max-inline-size: 100%`, ellipsis or wrap, a long translated label at 320 px overflows. A 46-character Swedish label on `SolidNeutralMediumDefault` pushes the button 22 px past its container and scrolls the page sideways. A Danish one on `FullWidth` covers the padding and runs 4 px from the edge. This breaks design-qa's Text line ("never overflow") and WCAG 1.4.10 reflow, so CR-12 (`docs/components/button.md:179`) needs an answer for a label wider than its container, such as truncating the label inside a button capped at its container's width.

## P3

- **P3-1.** `packages/perron/src/components/Button/Button.css:12` CR-11's transparent `border.width.025` sits outside `padding-inline: space.400`. Every button therefore renders 2 px wider than the read-back (141.28 against 140, and 133.28 against 132), with the label 17 px from the outer edge where Penpot's inner stroke leaves 16 (design-qa's The design line, `penpot/button.json`). Does the maintainer want `calc(space.400 - border.width.025)` padding, or the redraw to follow the code?
- **P3-2.** `.claude/skills/design-qa/SKILL.md:35` The Token use line names `color.text.brand` on a button as a Defect. The contract's Intents table and `docs/foundations/semantic-colours.md` make it the label of a brand outline button, which `Button.css:91` correctly uses, so the skill's example contradicts the foundations and should change.
