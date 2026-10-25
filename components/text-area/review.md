# Review: TextArea, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/TextArea/TextArea.tsx:14` `TextAreaProps` leaves out Base UI's `render`, following CR-15, spec line 53 and the answer to brief question 2. TextField inherits `render` from `Field.Control.Props`, and the contract's Props table lists `render` as the way to swap a root element. That makes TextArea the first text box in the Fields family whose root a caller cannot swap. The maintainer may want to confirm this before NumberField and the other text boxes copy it.
- **P3-2.** `packages/perron/src/components/TextArea/TextArea.css:24` The resize grip and the scrollbar are the browser's own. The dark renders show them following the page's `color-scheme`, but the grip is still well below `size.target-min` (24 px). The spec accepts that through WCAG 2.5.8's user-agent exception (`docs/components/text-area.md:158`). With the design deferred, the maintainer decides whether Mylder wants the native grip at all, as the brief's direction note asks.
- **P3-3.** `packages/perron/src/components/TextArea/TextArea.stories.tsx:443` The Validation story's message says "Write at least 10 letters", but its `validate` counts every character after `trim()`, spaces included, so "Late at Nø" passes with fewer than 10 letters. The same words are in the spec's Stories row (`docs/components/text-area.md:212`). "Write at least 10 characters" would match what the check measures, as content design's rule against claiming more than the data supports asks. This was raised in round 1 and is still open.
- **P3-4.** `docs/components/text-area.md:221` The first Don't sends callers to NumberField, whose registry entry is still `designing`, so a caller can't use it yet. In "take one line, its keys and its autofill", it is unclear what "its" refers to. A wording such as "TextField takes one line, with the keyboard and autofill it needs" would read more plainly. This is a content-audit Polish point, kept as a note.
