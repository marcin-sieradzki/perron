# Data states

Every vehicle is a vehicle dot, drawn in its line colour in one of five states. The shapes are the system's signature: never reuse a ring or a dashed ring to mean anything else, and never draw a vehicle without its state.

| State          | Shape         | Means                                                  |
| -------------- | ------------- | ------------------------------------------------------ |
| Live           | A solid dot   | A GPS report under a minute old                        |
| Ageing         | A fainter dot | A report 1 to 5 minutes old                            |
| Estimated      | A ring        | Placed from the timetable and the latest delay         |
| Timetable only | A dashed ring | No real-time data at all                               |
| No signal      | A grey dot    | Silent for over 5 minutes, left where it was last seen |

- Always write the state in words next to the dot. Legends list all five states, in this order, even when one has no vehicles.
- `color.data-state.no-signal` means a vehicle has gone silent. Use it for that alone.
- On the map, draw dots on a canvas, with a halo of `color.data-state.halo` and, for light line colours on the light map, a hairline of `color.data-state.outline`.

## Geometry

The `vehicle-dot` tokens give the geometry of each shape at any size: insets, stroke widths, the dash, and the age thresholds between live, ageing and no signal.

<!-- tokens: vehicle-dot.* -->

| Token                                | Value         | Use                                                                                        |
| ------------------------------------ | ------------- | ------------------------------------------------------------------------------------------ |
| `vehicle-dot.inset`                  | `2px`         | Gap between the glyph box and the circle edge                                              |
| `vehicle-dot.halo`                   | `1.6px`       | Map only: land-coloured ring drawn under each dot                                          |
| `vehicle-dot.live-threshold`         | `60000ms`     | Reports younger than this are live                                                         |
| `vehicle-dot.ageing-threshold`       | `300000ms`    | Reports younger than this (and at least live-threshold old) are ageing; older is no signal |
| `vehicle-dot.ageing.fill-opacity`    | `0.42`        | Fill strength of an ageing dot, so it reads fainter than live                              |
| `vehicle-dot.ageing.stroke-width`    | `1.3px`       | Rim of an ageing dot                                                                       |
| `vehicle-dot.ageing.stroke-inset`    | `0.6px`       | Pulls the ageing rim in so the dot keeps its outer size                                    |
| `vehicle-dot.estimated.stroke-width` | `1.8px`       | Ring of an estimated dot                                                                   |
| `vehicle-dot.estimated.stroke-inset` | `0.9px`       | Pulls the estimated ring in so the dot keeps its outer size                                |
| `vehicle-dot.timetable.stroke-width` | `1.6px`       | Dashed ring of a timetable-only dot                                                        |
| `vehicle-dot.timetable.stroke-inset` | `0.9px`       | Pulls the timetable ring in so the dot keeps its outer size                                |
| `vehicle-dot.timetable.dash`         | `2.1px 1.7px` | Dash and gap of the timetable-only ring                                                    |

<!-- /tokens -->

<!-- tokens: color.data-state.* -->

| Token                        | Light                      | Dark                       | Use                                                        |
| ---------------------------- | -------------------------- | -------------------------- | ---------------------------------------------------------- |
| `color.data-state.no-signal` | `#9AA4A9`                  | `#5F6B71`                  | Vehicle dot fill when a vehicle has been silent for 5+ min |
| `color.data-state.halo`      | `#EDEFEB` (color.map.land) | `#151B1E` (color.map.land) | Map only: ring under each dot                              |
| `color.data-state.outline`   | `rgba(18, 24, 27, 0.45)`   | `rgba(0, 0, 0, 0)`         | Map only: outline around light line colours on a light map |

<!-- /tokens -->

## Delays

A delay is known only for live, ageing and estimated vehicles. Timetable only and no signal always show an unknown delay ("—"). Delay colours point at the status text colours; `color.transit.delay.unknown` is the one that misses 4.5:1, kept for the "—" next to stronger text.

<!-- tokens: color.transit.delay.* -->

| Token                         | Light                           | Dark                            | Use                                        |
| ----------------------------- | ------------------------------- | ------------------------------- | ------------------------------------------ |
| `color.transit.delay.on-time` | `#067849` (color.text.success)  | `#3CCB80` (color.text.success)  | Delay text when on time                    |
| `color.transit.delay.slight`  | `#12181B` (color.text.primary)  | `#EBEEEB` (color.text.primary)  | Late by 1–2 min                            |
| `color.transit.delay.late`    | `#AD3600` (color.text.danger)   | `#FF8655` (color.text.danger)   | Late by 3 min or more                      |
| `color.transit.delay.early`   | `#2351AF` (color.text.info)     | `#7FA6FF` (color.text.info)     | Delay text when early                      |
| `color.transit.delay.unknown` | `#74818A` (color.text.tertiary) | `#74818A` (color.text.tertiary) | Delay text when there is no real-time data |

<!-- /tokens -->

## Kinds of disruption

Each kind of disruption has its colour, always with its icon and its name.

<!-- tokens: color.transit.severity.* -->

| Token                              | Light                            | Dark                             | Use                              |
| ---------------------------------- | -------------------------------- | -------------------------------- | -------------------------------- |
| `color.transit.severity.delay`     | `#AD3600` (color.text.danger)    | `#FF8655` (color.text.danger)    | Icon and label for delays        |
| `color.transit.severity.data`      | `#47535A` (color.text.secondary) | `#A2ADB1` (color.text.secondary) | Data feed problems               |
| `color.transit.severity.diversion` | `#2351AF` (color.text.info)      | `#7FA6FF` (color.text.info)      | Icon and label for diversions    |
| `color.transit.severity.planned`   | `#47535A` (color.text.secondary) | `#A2ADB1` (color.text.secondary) | Icon and label for planned works |

<!-- /tokens -->
