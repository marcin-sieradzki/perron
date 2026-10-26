# Map

The map is the ground every panel floats over, drawn quiet so the vehicles carry the colour.

## Colours

Land, water, parks, streets, rail, buildings and labels each have a colour per theme. Water is also the colour of the page behind the map.

<!-- tokens: color.map.* -->

| Token                   | Light     | Dark      | Use                                         |
| ----------------------- | --------- | --------- | ------------------------------------------- |
| `color.map.water`       | `#C4D4DD` | `#0A1115` | Sea, lakes and the page behind the map      |
| `color.map.land`        | `#EDEFEB` | `#151B1E` | Land, the map's main ground                 |
| `color.map.park`        | `#D8E4D2` | `#16231E` | Parks and green areas                       |
| `color.map.street`      | `#FFFFFF` | `#252D31` | Streets                                     |
| `color.map.airport`     | `#E2E5E1` | `#1C2326` | Airport grounds                             |
| `color.map.runway`      | `#CBD1CE` | `#2B3438` | Runways and taxiways                        |
| `color.map.building`    | `#E2E5E0` | `#1A2125` | Building footprints at close zoom           |
| `color.map.rail`        | `#BCC4C1` | `#323C41` | Rail tracks without a coloured line on them |
| `color.map.label`       | `#66737A` | `#7E8B91` | Place names                                 |
| `color.map.water-label` | `#5F7A88` | `#4B6774` | Water names                                 |

<!-- /tokens -->

## Lines and dots

Line widths, dot sizes and the gap between lines that share a track are canvas measures, in px at the default zoom.

Where lines share a track, such as A, B, C, E and H through the centre or M1 and M2, each is drawn as its own strand beside the others, never on top of them. A line's `map.strand.*` is its place from the track's centre, in steps of its mode's `map.track-spacing`: the app multiplies the two for the line's offset, such as MapLibre's `line-offset`, and gives a vehicle on that line the same offset, so it stays on its strand. The order keeps each line on one side of every track it shares, so a strand never crosses another: A, B, C, E, H from one side to the other through the centre, M1 beside M2 and M3 beside M4. Which stretches are shared comes from the app's own timetable, so a line alone on its track is drawn on the centre, whatever its strand.

<!-- tokens: map.* -->

| Token                        | Value   | Use                                                                   |
| ---------------------------- | ------- | --------------------------------------------------------------------- |
| `map.dot-radius.bus`         | `3.3px` | Bus dot radius on the map at the default zoom                         |
| `map.dot-radius.metro`       | `4.6px` | Metro dot radius on the map at the default zoom                       |
| `map.dot-radius.stog`        | `4.8px` | S-tog dot radius on the map at the default zoom                       |
| `map.dot-radius.regional`    | `5.3px` | Regional train dot radius on the map at the default zoom              |
| `map.line-width.metro`       | `3.2px` | Metro line stroke on the map                                          |
| `map.line-width.stog`        | `2.5px` | S-tog line stroke on the map                                          |
| `map.line-width.regional`    | `2.1px` | Regional line stroke on the map                                       |
| `map.line-width.focus-extra` | `1.6px` | Added to the width of a focused line                                  |
| `map.line-width.bus-focus`   | `4px`   | Bus route drawn only when focused                                     |
| `map.track-spacing.metro`    | `3.4px` | Gap between parallel metro lines sharing a track                      |
| `map.track-spacing.stog`     | `2.8px` | Gap between parallel S-tog lines sharing a track                      |
| `map.track-spacing.regional` | `2.8px` | Gap between parallel regional lines sharing a track                   |
| `map.strand.m1`              | `-0.5`  | Line M1's strand on a shared track, in track spacings from its centre |
| `map.strand.m2`              | `0.5`   | Line M2's strand on a shared track, in track spacings from its centre |
| `map.strand.m3`              | `-0.5`  | Line M3's strand on a shared track, in track spacings from its centre |
| `map.strand.m4`              | `0.5`   | Line M4's strand on a shared track, in track spacings from its centre |
| `map.strand.a`               | `-2`    | Line A's strand on a shared track, in track spacings from its centre  |
| `map.strand.b`               | `-1`    | Line B's strand on a shared track, in track spacings from its centre  |
| `map.strand.c`               | `0`     | Line C's strand on a shared track, in track spacings from its centre  |
| `map.strand.e`               | `1`     | Line E's strand on a shared track, in track spacings from its centre  |
| `map.strand.f`               | `0`     | Line F's strand on a shared track, in track spacings from its centre  |
| `map.strand.h`               | `2`     | Line H's strand on a shared track, in track spacings from its centre  |

<!-- /tokens -->

## Focus and dimming

When a line is in focus, everything outside it dims: vehicles, lines, stations and labels each to their own opacity, so the focused line reads first without the rest vanishing. Lines at rest are drawn slightly translucent, and live vehicles leave a short trail.

<!-- tokens: opacity.map-* -->

| Token                       | Value  | Use                                 |
| --------------------------- | ------ | ----------------------------------- |
| `opacity.map-dim-vehicle`   | `0.28` | Vehicles on lines outside the focus |
| `opacity.map-dim-line`      | `0.16` | Rail lines outside the focus        |
| `opacity.map-dim-station`   | `0.3`  | Stations outside the focus          |
| `opacity.map-dim-label`     | `0.45` | Station labels outside the focus    |
| `opacity.map-line`          | `0.78` | Metro and S-tog lines at rest       |
| `opacity.map-line-regional` | `0.5`  | Regional lines at rest              |
| `opacity.map-trail`         | `0.32` | Motion trail behind live vehicles   |

<!-- /tokens -->
