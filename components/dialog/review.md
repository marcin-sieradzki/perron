# Review: Dialog, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/Dialog/Dialog.stories.tsx:225` In the `LongContent` story (`components-dialog--long-content`, light and dark), the paragraphs are bare `<p>` elements that keep the browser's 14px margins. That puts 26px between the description and the first paragraph instead of the spec's `space.300` between parts, and leaves 14px of untokened space between paragraphs and before the bottom padding. This breaks the design-qa Spacing and Token use lines ("a browser default ... is a Defect") and the spec's Tokens prose ("its parts `space.300` apart"). Render the paragraphs with Perron's `Text`, whose root has `margin: 0`.

## P3

- **P3-1.** `docs/components/dialog.md:188` CR-5 says the trigger's id comes from `slotProps.trigger.id` or `useId`. The Base UI parts table (`docs/components/dialog.md:38`) and the code (`packages/perron/src/components/Dialog/Dialog.tsx:146`) take the `trigger` element's own `id` first. The code is right, so CR-5 should name the trigger's own id as the first source, to match.
- **P3-2.** `docs/components/dialog.md:13` The Anatomy prose tells the build what to do ("When its folder ... does not exist on `main` yet, the Dialog build adds it exactly as the Sheet build (branch `component/sheet`) draws it"). Once this merges, the shipped spec will point at a run and a branch rather than describe the component. The maintainer may want this paragraph to say only what the `CloseButton` part draws.
- **P3-3.** `packages/perron/src/components/Dialog/Dialog.stories.tsx:27` The `LongContent` filler starts each paragraph with "Line 1:", "Line 2:" and so on. In Mylder, "line" means a transit line, so a reader of the docs page can take "Line 5" for a route. Content design asks for words that mean one thing, so filler such as "Step 1:" or plain key help would avoid the clash.
