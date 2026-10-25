# Review: Slider, round 6

## P1

None.

## P2

- **P2-1.** `docs/components/slider.md:242` The test coverage checklist has one line no `play` step ticks: when a press on the track starts a drag, the thumb being dragged shows the pressed layer. CR-12 (`slider.md:223`) and the Tokens intro (`slider.md:111`) promise this through the `.pn-Slider-thumb[data-dragging]:not([data-disabled]):focus-within` selector (`packages/perron/src/components/Slider/Slider.css:90`), and line 235 does not exempt it. The `Pressed` play cell promises no such step, and the `Pressed` story (`packages/perron/src/components/Slider/Slider.stories.tsx:416-431`) reads only the `:active` rules through `stateRules` and `pressedAfterHover`. Those rules leave out the `[data-dragging]` alternative, so nothing checks the thumb's `background-image` while `data-dragging` is set. A real mouse press on the track of `components-slider--default` does render `color.surface.selected` there. The play cell and the story should check the dragged thumb's pressed layer after the press at 80%, as the contract's Stories rule asks of every behaviour the component promises.

## P3

- **P3-1.** `packages/perron/src/components/Slider/Slider.tsx:199` In a range, `getAriaLabel` names each thumb only "Minimum" or "Maximum", so the field's label is not part of the thumb's name. In `components-slider--in-form` the thumbs are listed as `slider "Minimum"` and `slider "Maximum"`, so two range sliders on one screen would appear in a screen reader's list of controls as two "Minimum" sliders. The answer to question 9 sets this, but the maintainer may want each thumb named by the field's label together with the owned word.
- **P3-2.** `packages/perron/src/components/Slider/Slider.css:78` The thumb's hover and pressed layers, `color.surface.hover` and then `color.surface.selected`, render at 5% and 9% alpha over a disc about 14 px across inside its edge. This was measured with a real pointer in `components-slider--default` light. It meets Pointer feedback as written, but the design is deferred, and the maintainer may want a stronger step on a part this small.
- **P3-3.** `packages/perron/src/components/Slider/Slider.css:47` The empty part of the track, `color.surface.inset` (rgb(235, 238, 235) in light), is about 1.2:1 against the page in `components-slider--default` light, so it is hard to see where the range ends. The spec argues for this from Elevation and Meter's track (`slider.md:115`), and the fill and the thumb's edge pass 3:1. Since the design is deferred, the maintainer may want an edge or a stronger track, so the end of the range meets the 3:1 that Accessibility asks of a control's parts.
- **P3-4.** `docs/components/sheet.md:214` This diff rewrote Sheet's Do and don't row, and the row still tells callers to mark a horizontal carousel with a bare `data-base-ui-swipe-ignore`. Slider's CR-11 (`slider.md:222`) and its Don't row (`slider.md:264`) explain that a bare value turns off the sheet's swipe for every touch that starts on the element. The maintainer may want the carousel advice to give `="x"`, as Slider's control does.
