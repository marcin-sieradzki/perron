# Review: StationIcon, round 2

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/StationIcon/StationIcon.stories.tsx:189` The `Lines` story puts each line's name where a stop's name goes, so every row is a marker beside a line name. That makes the story a legend of line swatches, which the spec's Do and don't advises against ("Use a StationIcon as a line's badge or swatch in a row of badges, where it reads as a stop"). It also leaves out the first Do ("Put the marker beside the stop's name, with the line named in words nearby"), and the filled rows read as stops called "M1" or "Several lines" ("Several lines Next stop"). Name a stop in each row with its line after it, for example "Nørreport, M1" and "Nørreport, M1 Next stop", so the story shows the use the spec asks for.

## P3

- **P3-1.** `packages/perron/src/components/StationIcon/StationIcon.css:12` In both themes you cannot tell the neutral marker (`color.text.primary`, rgb(18, 24, 27) light and rgb(235, 238, 235) dark) from `line='regional'` (`color.transit.mode.regional`, rgb(35, 44, 49) and rgb(238, 241, 240)). In the `Lines` story, "Regional train" and "Several lines" render the same, so a station that several lines serve looks like a regional-train stop. Question for the maintainer: keep it, since the words beside the marker carry the meaning, or give the neutral marker a colour of its own, such as `color.text.secondary`.
- **P3-2.** `packages/perron/src/components/StationIcon/StationIcon.css:31` The outlined fill is always `color.surface.raised`, but the stories render on `color.surface.default` (`StationIcon.stories.tsx:68`). In dark, the inside of the ring shows as a lighter disc (rgb(29, 36, 40) on rgb(18, 24, 27)), and it would do the same on any surface that is not a raised panel. Question for the maintainer: is raised the only surface a StationIcon sits on, so the stories should switch to `color.surface.raised`, or should the fill follow the surface behind it?
- **P3-3.** `packages/perron/src/components/StationIcon/StationIcon.tsx:26` The `render` JSDoc says the root keeps its `aria-hidden`, and CR-3 (`docs/components/station-icon.md:108`) says "a caller cannot unhide the marker". Both are true for the rest props, which `mergeProps(rest, own)` puts first. They are not true for a `render` element's own props, because `useRender` merges those last: `render={<i aria-hidden={false} />}` unhides the marker. Question for the maintainer: narrow the wording of CR-3 and the JSDoc to the rest props, or accept this as Base UI's documented `render` behaviour.
