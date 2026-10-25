# Review: Accordion, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/accordion.md:201` The Stories table still leaves these coverage lines unticked: (1) the Keyboard row "Base UI for a non-button `render`" (line 146), with no story giving `slotProps.trigger` a non-button `render` and pressing Enter or Space on it; (2) line 148 says the arrow keys, Home and End do nothing, and no `play` presses one and checks that focus and `aria-expanded` stay put; (3) an item given no `value` gets one Base UI generates (lines 40 and 76), and no story renders an item without one; (4) under reduced motion the panel and the chevron change at once (CR-10, checklist line 169), and no `play` reads `duration.switch` under `(prefers-reduced-motion: reduce)`. The contract's Stories rule asks for a `play` test for every behaviour the component promises. These gaps were already in the code that round 1 read, so this is a note here.
- **P3-2.** `packages/perron/src/components/Accordion/Accordion.stories.tsx:719` The `KeepMounted` play shows that Tab goes from the first trigger to the second once its panel closes, as line 218 promises. That panel holds only text, though, so the step would pass even if a `hidden` panel stayed focusable. A focusable element in the kept-mounted panel, as `FocusInPanel` has, would let the step prove CR-9 and the checklist's "collapsed region" line.
- **P3-3.** `docs/components/accordion.md:13` The Anatomy calls exporting `AccordionItem` from `Accordion.tsx` "an exception to the contract's 'one component per folder'". The contract's Files rule now names this shape as the rule: a child the caller writes many times is a part with its own `*Props`, exported from its parent's `<Name>.tsx`, and only the parent joins the registry. The contract holds, and the line could say that it follows the rule rather than breaks it.
- **P3-4.** `docs/components/accordion.md:165` Carried from round 1: the contract's checklist asks that "a collapsed region is `inert`". The spec meets it by unmounting the panel or keeping it `hidden`, so a closing panel stays in the tree for `duration.switch` under a trigger that already says `aria-expanded="false"`. The maintainer may want the contract line to read "hidden or inert".
- **P3-5.** `packages/perron/src/components/Accordion/Accordion.tsx:105` Carried from round 1: two Layout siblings put the heading-level override on different slots, Accordion's `slotProps.header.render` and Section's `slotProps.title.render`. Each follows its own part's name, but it is one idea under two names (api-consistency). Should the contract say which part a heading-level override targets?
- **P3-6.** `packages/perron/src/components/Accordion/Accordion.css:37` Carried from round 1: each heading renders smaller than its panel's text, `typography.label` (13 px, 600) over `typography.body` (14 px, 400). The family text rule allows it, but the maintainer may want a heading role for a disclosure heading.
- **P3-7.** `packages/perron/src/components/Accordion/Accordion.stories.tsx:42` Carried from round 1: "A pale dot hasn't reported for over a minute." describes a data state without the fixed word content design gives it ("Ageing"). It recurs at lines 444, 498, 539 and 584.
- **P3-8.** `packages/perron/src/components/Accordion/Accordion.tsx:17` Carried from round 1: the local type `Inherited<P, own>` is copied into a fifth file, after Tabs, Toolbar, SegmentedControl and Menu. The Shared helpers rule means it to be declared once, in `packages/perron/src/internal/`.
