# Map

The map is the ground every panel floats over, drawn quiet so the vehicles carry the colour.

## Colours

Land, water, parks, streets, rail, buildings and labels each have a colour per theme. Water is also the colour of the page behind the map. The aircraft have a colour of their own, on [Aircraft](#aircraft).

<!-- tokens: color.map.* -->

| Token                   | Light     | Dark      | Use                                                                           |
| ----------------------- | --------- | --------- | ----------------------------------------------------------------------------- |
| `color.map.water`       | `#C4D4DD` | `#0A1115` | Sea, lakes and the page behind the map                                        |
| `color.map.land`        | `#EDEFEB` | `#151B1E` | Land, the map's main ground                                                   |
| `color.map.park`        | `#D8E4D2` | `#16231E` | Parks and green areas                                                         |
| `color.map.street`      | `#FFFFFF` | `#252D31` | Streets                                                                       |
| `color.map.airport`     | `#E2E5E1` | `#1C2326` | Airport grounds                                                               |
| `color.map.runway`      | `#CBD1CE` | `#2B3438` | Runways and taxiways                                                          |
| `color.map.building`    | `#E2E5E0` | `#1A2125` | Building footprints at close zoom, on the flat map                            |
| `color.map.building-3d` | `#D3D9D4` | `#2A3338` | 3D buildings, walls and roofs: the map's light shades each face from it       |
| `color.map.rail`        | `#BCC4C1` | `#323C41` | Rail tracks without a coloured line on them                                   |
| `color.map.label`       | `#66737A` | `#7E8B91` | Place names                                                                   |
| `color.map.water-label` | `#5F7A88` | `#4B6774` | Water names                                                                   |
| `color.map.aircraft`    | `#B3127A` | `#F27BC8` | The aircraft glyph on the map, and nothing else; a no-signal aircraft is grey |

<!-- /tokens -->

## Lines and dots

Line widths, dot sizes and the gap between lines that share a track are canvas measures, in px at the default zoom.

Where lines share a track, such as A, B, C, E and H through the centre or M1 and M2, each is drawn as its own strand beside the others, never on top of them. A line's `map.strand.*` is its place from the track's centre, in steps of its mode's `map.track-spacing`: the app multiplies the two for the line's offset, such as MapLibre's `line-offset`, and gives a vehicle on that line the same offset, so it stays on its strand. The order keeps each line on one side of every track it shares, so a strand never crosses another: A, B, C, E, H from one side to the other through the centre, M1 beside M2 and M3 beside M4. The values are the full trunk's, where all five S-tog lines share the track; which lines share a stretch comes from the app's own timetable, and where only some do, the app keeps them in the strands' order, a track spacing apart and centred on the track, so C and H alone sit at −0.5 and +0.5, and a line alone on its track is drawn on the centre.

<!-- tokens: map.dot-radius.* map.line-width.* map.track-spacing.* map.strand.* -->

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

## Aircraft

Aircraft are the planes over the city, from a feed of their own. They are not vehicles: they have no mode and no line, and they are never counted with the vehicles. Each is drawn as the `aircraft` glyph, a plane seen from above, in `color.map.aircraft`, a magenta that no line, mode, status or the brand uses, so a plane never reads as a bus or a train. Aircraft are drawn above the vehicles.

- **The glyph** is the outline in `packages/perron/icons/aircraft.svg`, on its 14 px grid, pointing north. The aircraft's position is the centre of the grid, and the app turns the glyph about it to the aircraft's track, clockwise from north. Its box is `map.aircraft-size.air` wide in the air and `map.aircraft-size.ground` on the ground, scaled with the zoom as the vehicle dots are.
- **The halo** is the vehicle dots': the outline stroked in `color.data-state.halo`, `vehicle-dot.halo` wide on each side, under the glyph, so a plane stands off whatever it crosses.
- **The legend** shows the glyph beside "Planes" after the five states wherever the map shows aircraft: VehicleDotLegend's `aircraftVisible`.

An aircraft carries the data states in the vehicle dots' shapes, as far as a plane can take them. Timetable only never applies: an aircraft has no timetable.

| State     | Glyph                                                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Live      | The outline filled in `color.map.aircraft`                                                                                                   |
| Ageing    | Filled at `vehicle-dot.ageing.fill-opacity`, with a rim `map.aircraft-stroke-width.ageing` wide                                              |
| Estimated | Hollow: no fill, a line `map.aircraft-stroke-width.estimated` wide                                                                           |
| No signal | Filled in `color.data-state.no-signal`, cut by a gap `vehicle-dot.no-signal.cut-width` wide from the top left of its box to the bottom right |

- Rims are drawn inside the outline: clip to it and stroke twice the width. The glyph then keeps one outer size in every state, as a dot's insets keep its.
- The rims are thinner than a dot's: a plane is narrow, and a dot's 1.8 px ring would fill its body in, so estimated would read as live.
- The cut runs from the top left of the box to the bottom right on the screen, whatever the track, so it reads as the vehicle dots' cut does.

<!-- tokens: map.aircraft-* -->

| Token                                 | Value   | Use                                                              |
| ------------------------------------- | ------- | ---------------------------------------------------------------- |
| `map.aircraft-size.air`               | `18px`  | Aircraft glyph box on the map at the default zoom, in the air    |
| `map.aircraft-size.ground`            | `14px`  | Aircraft glyph box on the map at the default zoom, on the ground |
| `map.aircraft-stroke-width.ageing`    | `1px`   | Rim of an ageing aircraft, inside its outline                    |
| `map.aircraft-stroke-width.estimated` | `1.2px` | Outline of an estimated aircraft, inside its outline             |

<!-- /tokens -->

`color.map.aircraft`, in the [Colours](#colours) table, reaches 3:1 on every ground a plane flies or taxis over, in both themes, as WCAG asks of a mark that carries meaning:

<!-- contrast 3: color.map.aircraft on color.map.land color.map.water color.map.park color.map.airport color.map.runway -->

| Colour               | Light land | Light water | Light park | Light airport | Light runway | Dark land | Dark water | Dark park | Dark airport | Dark runway |
| -------------------- | ---------- | ----------- | ---------- | ------------- | ------------ | --------- | ---------- | --------- | ------------ | ----------- |
| `color.map.aircraft` | 5.53:1     | 4.20:1      | 4.86:1     | 5.03:1        | 4.13:1       | 6.99:1    | 7.65:1     | 6.53:1    | 6.41:1       | 5.11:1      |

<!-- /contrast -->

## 3D buildings

The map opens flat and north-up. 3D is a view the rider turns on: the map tilts, up to 60°, and turns, and the buildings rise.

- **Where.** Buildings rise from zoom 14, as the flat footprints appear.
- **Heights** come from OpenStreetMap and are approximate: a block may stand a storey off, and one with no height recorded stands at a default. Say so where the map credits its data.
- **Colour.** A 3D building is one colour, `color.map.building-3d`, walls and roof alike: the map's light shades each face from it, so a block reads as a block without a second colour. It is a step further from the land than `color.map.building`, darker in light and lighter in dark, so the walls stand off the ground they rise from.
- **Over and under.** The dots, lines and stops are drawn over the buildings, never hidden behind them. The buildings are drawn at `opacity.map-building-3d`, faint enough that a bus behind a block shows through it and reads as being there.

<!-- tokens: opacity.map-building-3d -->

| Token                     | Value | Use                                                                                    |
| ------------------------- | ----- | -------------------------------------------------------------------------------------- |
| `opacity.map-building-3d` | `0.7` | 3D buildings, faint enough that the dots, lines and stops drawn over them read through |

<!-- /tokens -->

## Focus and dimming

When a line is in focus, everything outside it dims: vehicles, lines, stations and labels each to their own opacity, so the focused line reads first without the rest vanishing. Lines at rest are drawn slightly translucent, and live vehicles leave a short trail.

<!-- tokens: opacity.map-dim-* opacity.map-line opacity.map-line-regional opacity.map-trail -->

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
