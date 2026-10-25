# Review: Slider, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/slider.md:262` The Don't cell tells a caller not to wrap the slider in another element with `data-base-ui-swipe-ignore`, and gives the wrong reason: a wrapper does not "let a drag along the slider move the sheet". In Base UI's `DrawerViewport` touchstart, a bare wrapper matches `[data-base-ui-swipe-ignore]:not([data-base-ui-swipe-ignore="y"])` and drops the swipe outright, so the real effect is that a touch drag across the slider stops swiping the sheet, which CR-11 (`slider.md:222`) promises still works. Meanwhile `docs/components/sheet.md:214` still tells callers to "Mark a horizontal carousel or slider inside a bottom sheet with `data-base-ui-swipe-ignore`", which is exactly what this cell forbids, and CR-11's last sentence ("then holds for Slider on its own") resolves neither. CR-11 holds: reword `sheet.md:214` to say Slider marks its own control, and give line 262 its real reason.

## P3

- **P3-1.** `docs/components/slider.md:165` The Keyboard rows at 165 and 166 say `ArrowRight` lowers the value in right-to-left text and `ArrowLeft` raises it, and the "Base UI already does" line (`slider.md:56`) says Base UI swaps the arrows in right-to-left text. Base UI's `SliderThumb` reads the direction only from its own `DirectionProvider` (`useDirection()`), and PerronProvider renders none. On a `dir="rtl"` page the arrows don't swap, and the thumbs sit half a thumb from the fill. No Mylder locale is right-to-left, so the effect is the spec's claim alone: either say these lines need Base UI's `DirectionProvider`, or have PerronProvider carry one.
- **P3-2.** `packages/perron/src/components/Slider/Slider.tsx:194` In a range, `getAriaLabel` names each thumb "Minimum" or "Maximum" alone. When `aria-label` is set, Base UI's `SliderThumb` drops `aria-labelledby`, so the field's label is no longer part of the thumb's name. Two range sliders on one screen then appear in a screen reader's list of controls as two "Minimum" sliders. Question 9's answer binds this, but the maintainer may want each thumb named by the field's label together with the owned word (for example, through `aria-labelledby`).
- **P3-3.** `packages/perron/src/components/Slider/Slider.css:78` The thumb's hover and pressed layers, `color.surface.hover` then `color.surface.selected` (the contract's quiet-part step), are hard to see on a disc of about 14 px inside the edge. The interior measures rgb(255,255,255) at rest, rgb(243,244,244) on hover and rgb(234,234,235) pressed in light, and rgb(29,36,40), rgb(41,48,52) and rgb(48,55,58) in dark (`components-slider--default`). This meets Pointer feedback as written, but the design is deferred, and the maintainer may want a stronger step for a part this small.
- **P3-4.** `docs/components/slider.md:192` The target-size checklist line says the control is `size.target-min` tall "across the field's width". The control spans only the first column: 293.6 of 320 px in `Default` and 257.6 in `Range`, since the figure takes its own column and `space.300` gap. The anatomy row at `slider.md:28` says this correctly ("across the first column").
