# Review: Kbd, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/kbd.md:53` A question for the maintainer: Kbd uses three tokens for jobs their foundation rows don't list. `typography.data-sm` is for "Counts in chips and tabs, chart axes, the time under a countdown" (`docs/foundations/typography.md:32`). `font.line-height.tight` is for "Headings, key figures and clocks" (`docs/foundations/typography.md:82`), and Kbd uses it in place of the role's own 1.3 (kbd.md:54). `color.surface.raised` is for "Inputs, selected segment" (`docs/foundations/semantic-colours.md:45`). Should those rows be widened to cover a key in help text, or should keys get a typography role of their own? This is round 2's P3-1, still open.
- **P3-2.** `docs/components/kbd.md:88` The checklist line says the build's self-gate checks string, element and list `children` in the `Default` story's canvas, but no story or `*.test.tsx` renders an element or a list for Kbd. FactList and Stat each keep a test that does, so nothing in the repo would catch a regression in those shapes. This is round 2's P3-2, still open.
