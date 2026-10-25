# Data states

Every vehicle is a vehicle dot, drawn in its line colour in one of five states. The shapes are the system's signature: never reuse a ring, a dashed ring or a dot cut by a slash to mean anything else, and never draw a vehicle without its state.

| State          | Shape                     | Means                                                       |
| -------------- | ------------------------- | ----------------------------------------------------------- |
| Live           | A solid dot               | A GPS report younger than the live threshold                |
| Ageing         | A fainter dot             | A report past the live threshold, under the ageing one      |
| Estimated      | A ring                    | Placed from the timetable and the latest delay              |
| Timetable only | A dashed ring             | No real-time data at all                                    |
| No signal      | A grey dot cut by a slash | Silent past the ageing threshold, moved on by the timetable |

- Always write the state in words next to the dot. Legends list all five states, in this order, even when one has no vehicles.
- `color.data-state.no-signal` means a vehicle has gone silent. Use it for that alone.
- No signal is the one state cut by a slash: a diagonal gap, `vehicle-dot.no-signal.cut-width` wide, from the top left of the dot to the bottom right, which shows the surface beneath. Live and no signal are both solid dots, so without the cut they would differ by colour alone, and they would look the same in forced colours, where Windows' contrast themes replace every colour. The cut takes ink away rather than adding it, so the map grows no busier, and it reads down to the smallest dot.
- On the map, draw dots on a canvas, with a halo of `color.data-state.halo` and, for light line colours on the light map, a hairline of `color.data-state.outline`.

## No signal keeps moving

A vehicle with no signal keeps moving. From where it was last seen, it follows its path on the timetable plus its last known delay, drawn in the no signal glyph and labelled with the time of its last report: "No signal since 10:42". Left where it was last seen, it would mislead twice: an outage across a feed would look as if the city had stopped, and a dot frozen for twenty minutes would sit far from anywhere the vehicle can be. The glyph, not the position, carries the doubt: the cut dot and its words say the place is a guess, so the dot never needs to stand still to say so.

## Thresholds

The age of a vehicle's latest report decides between live, ageing and no signal, and how old is too old depends on how often the feed reports. So the thresholds are the app's. `vehicle-dot.live-threshold` (60 s) and `vehicle-dot.ageing-threshold` (5 min) are defaults that suit a feed reporting every few seconds; each app sets its live threshold from its own feed's interval between reports, so that one late report doesn't fade a vehicle that is still reporting, and keeps it under the ageing threshold. An app such as Mylder, whose feed reports once a minute at best, sets its live threshold to 2.5 times the interval between reports, 150 s at 60 s and at most 4 min, and keeps the ageing threshold at 5 min.

The components draw the state they are given and never work one out from a timestamp; the app compares each report's age with its thresholds. Where a screen explains the states, it gives the app's own figures, never the defaults' as fixed facts.

## Geometry

The `vehicle-dot` tokens give the geometry of each shape at any size: insets, stroke widths, the dash, the no-signal cut, and the default age thresholds between live, ageing and no signal, which each app sets for its own feed ([Thresholds](#thresholds)).

<!-- tokens: vehicle-dot.* -->

| Token                                | Value         | Use                                                                                                                                                    |
| ------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vehicle-dot.inset`                  | `2px`         | Gap between the glyph box and the circle edge                                                                                                          |
| `vehicle-dot.halo`                   | `1.6px`       | Map only: land-coloured ring drawn under each dot                                                                                                      |
| `vehicle-dot.live-threshold`         | `60000ms`     | Default: reports younger than this are live. Each app sets its own from its feed's interval between reports                                            |
| `vehicle-dot.ageing-threshold`       | `300000ms`    | Default: reports younger than this (and at least the live threshold old) are ageing; older is no signal. Each app sets its own with its live threshold |
| `vehicle-dot.ageing.fill-opacity`    | `0.42`        | Fill strength of an ageing dot, so it reads fainter than live                                                                                          |
| `vehicle-dot.ageing.stroke-width`    | `1.3px`       | Rim of an ageing dot                                                                                                                                   |
| `vehicle-dot.ageing.stroke-inset`    | `0.6px`       | Pulls the ageing rim in so the dot keeps its outer size                                                                                                |
| `vehicle-dot.estimated.stroke-width` | `1.8px`       | Ring of an estimated dot                                                                                                                               |
| `vehicle-dot.estimated.stroke-inset` | `0.9px`       | Pulls the estimated ring in so the dot keeps its outer size                                                                                            |
| `vehicle-dot.timetable.stroke-width` | `1.6px`       | Dashed ring of a timetable-only dot                                                                                                                    |
| `vehicle-dot.timetable.stroke-inset` | `0.9px`       | Pulls the timetable ring in so the dot keeps its outer size                                                                                            |
| `vehicle-dot.timetable.dash`         | `2.1px 1.7px` | Dash and gap of the timetable-only ring                                                                                                                |
| `vehicle-dot.no-signal.cut-width`    | `1.6px`       | Width of the diagonal cut, top left to bottom right, through a no-signal dot, the one shape no other state has                                         |

<!-- /tokens -->

<!-- tokens: color.data-state.* -->

| Token                        | Light                      | Dark                       | Use                                                                       |
| ---------------------------- | -------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| `color.data-state.no-signal` | `#9AA4A9`                  | `#5F6B71`                  | Vehicle dot fill when a vehicle has been silent past the ageing threshold |
| `color.data-state.halo`      | `#EDEFEB` (color.map.land) | `#151B1E` (color.map.land) | Map only: ring under each dot                                             |
| `color.data-state.outline`   | `rgba(18, 24, 27, 0.45)`   | `rgba(0, 0, 0, 0)`         | Map only: outline around light line colours on a light map                |

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

Each kind of disruption has its colour, always with its icon and its name. A service notice is the neutral kind, for a message whose fields don't say which of the other four it is: it is shown as received, never guessed into one of them.

<!-- tokens: color.transit.severity.* -->

| Token                              | Light                            | Dark                             | Use                                |
| ---------------------------------- | -------------------------------- | -------------------------------- | ---------------------------------- |
| `color.transit.severity.delay`     | `#AD3600` (color.text.danger)    | `#FF8655` (color.text.danger)    | Icon and label for delays          |
| `color.transit.severity.data`      | `#47535A` (color.text.secondary) | `#A2ADB1` (color.text.secondary) | Data feed problems                 |
| `color.transit.severity.diversion` | `#2351AF` (color.text.info)      | `#7FA6FF` (color.text.info)      | Icon and label for diversions      |
| `color.transit.severity.planned`   | `#47535A` (color.text.secondary) | `#A2ADB1` (color.text.secondary) | Icon and label for planned works   |
| `color.transit.severity.notice`    | `#47535A` (color.text.secondary) | `#A2ADB1` (color.text.secondary) | Icon and label for service notices |

<!-- /tokens -->
