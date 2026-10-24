# Review: Text, round 2

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/Text/Text.css:7` `overflow-wrap: anywhere` makes every role's smallest width a single character, so in a plain flex row a short value splits before the sentence beside it wraps any further. At 320 px, a `data` Text with "08:17" next to a body Text in a 240 px flex row renders 22.8 px wide as "08:" over "17". With `break-word` it stays whole at 36 px. A `badge` "5C" can split the same way. This works against Typography's rule that `data` roles hold times and counts that line up down a column (`docs/foundations/typography.md`), and against the purpose of CR-11 (`docs/components/text.md:133`), which only means to break a word longer than its line. One fix is `overflow-wrap: normal` or `white-space: nowrap` on the four `data` rules and `badge`; the other is `overflow-wrap: break-word` on the root, with CR-11 updated to match.

## P3

- **P3-1.** `docs/components/text.md:89` CR-10 keeps `display`, `data-xl` and `stat` at full size on phones, against the step-down in `docs/foundations/typography.md`, and calls this a token gap for the `design-tokens` skill. Nothing in the repo or in GitHub issues tracks that gap. Should it get an issue before Text goes `stable`?
- **P3-2.** `packages/perron/src/components/Text/Text.tsx:56` `emphasis` is a new prop name that the next Display entries (Stat, Count, FactList) will copy. MUI's Typography does the same job through `color` (`'textPrimary' | 'textSecondary' | 'textDisabled'`). Should `emphasis` be the name for the whole family?
- **P3-3.** `packages/perron/src/components/Text/Text.tsx:10` `body` and `body-sm` default to `<p>`. That is invalid inside a `<button>`, a `<label>` or another body Text, and the caller's only way out is `render`. The brief's answer that chose this default was filled in by an agent, so the maintainer may want to confirm it.
- **P3-4.** `docs/components/text.md:108` On the checklist line "Every shape the type accepts renders, in every variant", no story shows a single element such as `<strong>` as `children`. Only `BodySmNeutralPrimary` shows a list, and every other story shows a string. The behaviour holds because `children` passes through `useRender` unchanged. Accept that, or add a story with a single element?
