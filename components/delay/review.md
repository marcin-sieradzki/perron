# Review: Delay, round 1

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Delay/Delay.tsx:49` `onTimeLabel` follows the contract's `<key>Label` rule for the key `onTime`, but `on` plus a capital is React's event-handler naming (`on[A-Z]`), so readers, IDE autocomplete and any Storybook `argTypesRegex` may take it for a callback. Since the next transit siblings will copy this name (api-consistency, "a new prop name the next siblings will copy"), should the locale key be renamed now, before Delay is `stable` (for example `punctual` / `punctualLabel`), or kept as it is?
- **P3-2.** `packages/perron/src/components/Delay/Delay.tsx:104` CR-3 puts the number in its own `<span>` inside the label only so `expectOwnedStrings` can read "min late" as a dictionary value. The ARIA tree reads it as "2 min late", but VoiceOver can split adjacent inline runs into separate stops ("2", then "min late"), and this pass could not check that in a real screen reader. Should the test helper learn to handle numbers next to words, so the label can be one text run, or should CR-3 stay as written?
- **P3-3.** `packages/perron/src/components/Delay/Delay.css:3` In `typography.data` (JetBrains Mono, 12 px), the unknown "—" (CR-2, content design's dash for unknown) is one mono cell, 7.2 px wide, and in the dark `components-delay--unknown` render it reads almost like a hyphen. The design is deferred, so this is a question for the Penpot drawing: keep the mono em dash, or ask for a wider mark for unknown?
