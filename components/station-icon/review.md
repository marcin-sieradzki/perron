# Review: StationIcon, round 1

## P1

- **P1-1.** `packages/perron/src/components/StationIcon/StationIcon.stories.tsx:157` The `Lines` story fills 13 markers in one list and puts no words beside the filled ones, so the ear hears "M1, M1" while the eye sees a ring and then a dot. That breaks the first line of the contract's What axe won't catch ("an `aria-hidden` mark has a text equivalent, for every shape the prop accepts"), and the spec's checklist copy, which says a filled stop's meaning is in the caller's words. It also shows the spec's Do and don't "Don't fill several stops in one list, or use `filled` to mean a state the words don't say". Give each filled row words beside it, as the variant stories do with "Next stop" through `Stop`'s `note`.

## P2

- **P2-1.** `packages/perron/src/components/StationIcon/StationIcon.tsx:17` The `line` JSDoc ends with a note for whoever builds the next component ("whichever of the two is built second takes the other's name and type"). Every consumer sees it in their editor, and it does not tell a caller how to use the prop. That breaks content design's plain, caller-facing voice for JSDoc on `<Name>Props` in the content-audit. Keep the build note in the spec's prose and drop it from the Props table description and the JSDoc.

## P3

- **P3-1.** `packages/perron/src/components/StationIcon/StationIcon.css:12` The neutral marker (`color.text.primary`, #12181B light and #EBEEEB dark) cannot be told apart from `line='regional'` (`color.transit.mode.regional`, #232C31 and #EEF1F0) in either theme. In the `Lines` story, "Several lines" and "Regional train" render the same, so a marker for a station several lines serve reads as a regional-train stop. Question for the maintainer: keep it as is, since the words beside the marker carry the meaning, or give the neutral marker a different colour such as `color.text.secondary`.
- **P3-2.** `packages/perron/src/components/StationIcon/StationIcon.css:31` The outlined fill is always `color.surface.raised`. The stories render on `color.surface.default` (`StationIcon.stories.tsx:58`), so in dark the inside of the ring shows as a lighter disc (#1D2428 on #12181B). It would do the same on any surface other than a raised panel. Question for the maintainer: is raised the only surface a StationIcon sits on, so the stories should switch to `color.surface.raised`, or should the fill follow the surface it sits on?
- **P3-3.** `packages/perron/src/components/StationIcon/StationIcon.tsx:27` The `render` JSDoc says the root keeps "its class, data attributes and `aria-hidden`", and CR-3 says "a caller cannot unhide the marker". Both hold for the rest props. They do not hold for a `render` element's own props, because Base UI's `useRender` merges `render.props` last, so `render={<i aria-hidden={false} />}` unhides the marker. Question for the maintainer: narrow the wording in CR-3 and the JSDoc to the rest props, or accept this as Base UI's documented `render` behaviour.
