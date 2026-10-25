# Review: Kbd, round 2

## P1

None.

## P2

- **P2-1.** `docs/components/kbd.md:63` The spec says that at 11 px the key sits "two under `typography.body` (14 px)". On the `font.size.*` scale (`docs/foundations/typography.md`, 275 to 300 to 325 to 350) and in the role table (caption 12, body-sm 13, body 14), 11 px is three steps under 14 px. The foundation is right, so the rerun changes "two" to "three", or drops the step count. This is a wrong fact in the spec's prose, Polish under the `content-audit` docs step.

## P3

- **P3-1.** `docs/components/kbd.md:53` A question for the maintainer: Kbd uses three tokens outside the jobs their foundation rows give them. `typography.data-sm` is for "Counts in chips and tabs, chart axes, the time under a countdown" (`docs/foundations/typography.md`). `font.line-height.tight` is for "headings and figures" and replaces the role's own `snug` (kbd.md:54; the foundation gives `none` to "single lines in a fixed box"). `color.surface.raised` is for "Inputs, selected segment" (`docs/foundations/semantic-colours.md:45`). Should those rows be widened to cover a key in help text, or should keys get a role of their own? This carries over round 1's P3-2 with the new role and line height.
- **P3-2.** `docs/components/kbd.md:88` The checklist line says the build's self-gate checks string, element and list `children` in the `Default` story's canvas, but no story or `*.test.tsx` renders an element or a list for Kbd. FactList and Stat each keep a test that does. Nothing in the repo would catch a regression in those shapes. This is round 1's P3-3, still open.
