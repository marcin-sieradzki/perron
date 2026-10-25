# Review: Slider, round 7

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Slider/Slider.tsx:199` (still open from round 6, P3-1) In a range, `getAriaLabel` names each thumb only "Minimum" or "Maximum", so the field's label is not part of the thumb's name. In `components-slider--in-form` the tree lists `slider "Minimum"` and `slider "Maximum"`, so a screen with two range sliders lists two "Minimum" sliders in a screen reader's list of controls. The answer to question 9 settles this, but the maintainer may want each thumb named by the field's label together with the owned word.
- **P3-2.** `packages/perron/src/components/Slider/Slider.css:78` (still open from round 6, P3-2) With a real pointer in `components-slider--default`, the thumb's hover and pressed layers render at 5% then 9% alpha in light (6% then 9% in dark), over a disc about 14 px across inside its edge. This meets Pointer feedback as written. The design is deferred, so the maintainer may want a stronger step on a part this small.
- **P3-3.** `packages/perron/src/components/Slider/Slider.css:47` (still open from round 6, P3-3) The empty part of the track, `color.surface.inset`, is about 1.2:1 against the page in `components-slider--default` light, so it is hard to see where the range ends. The spec argues for this from Elevation and Meter's track (`slider.md:115`), and the fill and the thumb's edge pass 3:1. The design is deferred, so the maintainer may want an edge or a stronger track, to give the end of the range the 3:1 that Accessibility asks of a control's parts.
- **P3-4.** `docs/components/sheet.md:214` (still open from round 6, P3-4) This branch rewrote Sheet's Do and don't row, and the row still tells callers to mark a horizontal carousel with a bare `data-base-ui-swipe-ignore`. Slider's CR-11 (`slider.md:222`) and its Don't row (`slider.md:264`) explain that a bare value turns off the sheet's swipe for every touch that starts on the element. The maintainer may want the carousel advice to give `="x"`, as Slider's own control does.
