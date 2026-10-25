# Review: TextArea, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/text-area.md:203` The placeholder example "Such as: the 5C waited at Nørreport for 10 minutes" puts a colon after "such as". Content design's own example ("Try a line number such as 5C.", `docs/content-design.md:7`) has no colon, and neither do the sibling forms: TextField's "Such as Nørreport St." and SearchField's "Line or stop, such as 5C". This is a content-audit Polish finding. The same string is in the spec's Props row (`docs/components/text-area.md:76`), the shipped JSDoc (`packages/perron/src/components/TextArea/TextArea.tsx:75`) and the stories (`packages/perron/src/components/TextArea/TextArea.stories.tsx:21`). All four should read "Such as the 5C waited at Nørreport for 10 minutes", without the colon.

## P3

- **P3-1.** `packages/perron/src/components/TextArea/TextArea.tsx:14` `TextAreaProps` leaves out Base UI's `render` (CR-15, spec line 53, brief question 2). TextField inherits `render` from `Field.Control.Props`, and the contract's Props and Customising sections describe `render` as the way to swap a root element. So TextArea is the first text box in the Fields family where the caller cannot swap the root. This follows the answered question, but the maintainer may want to confirm it before the next text boxes copy it.
- **P3-2.** `packages/perron/src/components/TextArea/TextArea.css:24` The resize grip and the scrollbar are the browser's own. In dark mode they follow the page's `color-scheme`, as the dark renders show. The grip is still well below `size.target-min`, and the spec accepts that through WCAG 2.5.8's user-agent exception (`docs/components/text-area.md:158`). With the design deferred, it is the maintainer's call whether Mylder wants the native grip at all, as the brief's direction note asks.
- **P3-3.** `packages/perron/src/components/TextArea/TextArea.stories.tsx:441` The Validation story's message says "Write at least 10 letters", but its `validate` counts every character after `trim()`, spaces included. So "Late at Nø" passes with fewer than 10 letters. "Write at least 10 characters" would match what the check measures, which content design's rule against claiming more than the data supports also asks for.
