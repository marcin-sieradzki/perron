# Semantic colours

Every colour token in both themes. A `color` token says what a colour is for and points at a [primitive colour](primitive-colours.md) in each theme.

## Light and dark

- Light is the default theme. Dark comes from `data-theme="dark"` on any element or, without an explicit theme, from the system's dark mode. `data-theme="light"` keeps an element light inside a dark page, so one page can show both themes side by side.
- Both themes define the same names, and the build fails when one is missing.
- Dark colours are their own palette steps, chosen for the dark surfaces, not an inversion of the light ones: 300 for status and brand fills and text, 900 for tints, the light neutrals for text.
- Base tokens never point at a theme token. A custom property resolves where it is declared, so a base token built from a theme colour would keep the root theme's value inside a nested `data-theme`.

## Text

- Three text colours for the interface. Use `color.text.primary` for what people read first, and `color.text.secondary` for supporting text. Keep `color.text.tertiary` for hints, axis labels, captions and the "—" of an unknown delay or figure, next to stronger text: it misses 4.5:1 on purpose (the figures are on [Accessibility](accessibility.md)), so set sentences people must read in primary or secondary.
- `color.text.inverse` sits on `color.surface.inverse`, the primary button and pressed toggles.
- On a coloured fill, text is `color.text.on-color.dark` or `color.text.on-color.light`, whichever the fill was paired with.

<!-- tokens: color.text.* -->

| Token                       | Light                             | Dark                              | Use                                                                                        |
| --------------------------- | --------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------ |
| `color.text.on-color.dark`  | `#12181B` (palette.neutral.900)   | `#12181B` (palette.neutral.900)   | Dark text on a coloured fill (bus, light line colours)                                     |
| `color.text.on-color.light` | `#FFFFFF` (palette.neutral.0)     | `#FFFFFF` (palette.neutral.0)     | White text on a coloured fill                                                              |
| `color.text.primary`        | `#12181B` (palette.neutral.900)   | `#EBEEEB` (palette.neutral.100)   | Main text and icons; also the focus ring                                                   |
| `color.text.secondary`      | `#47535A` (palette.neutral.600)   | `#A2ADB1` (palette.neutral.300)   | Supporting text                                                                            |
| `color.text.tertiary`       | `#74818A` (palette.neutral.500)   | `#74818A` (palette.neutral.500)   | Hints, captions, inactive controls                                                         |
| `color.text.inverse`        | `#FAFBF9` (color.surface.default) | `#12181B` (color.surface.default) | Text on inverse surfaces: tooltips, the chart's value tip                                  |
| `color.text.success`        | `#067849` (palette.green.700)     | `#3CCB80` (palette.green.300)     | Text in the success colour: on time, running normally                                      |
| `color.text.warning`        | `#965A00` (palette.orange.700)    | `#F0A43A` (palette.orange.300)    | Text in the warning colour                                                                 |
| `color.text.danger`         | `#AD3600` (palette.red.700)       | `#FF8655` (palette.red.300)       | Text in the danger colour: late, delay disruptions                                         |
| `color.text.info`           | `#2351AF` (palette.blue.700)      | `#7FA6FF` (palette.blue.300)      | Text in the info colour: early, diversions                                                 |
| `color.text.brand`          | `#896001` (palette.yellow.700)    | `#F2B630` (palette.yellow.300)    | Text in the brand colour: brand outline buttons and emphasis on the hero page; never links |

<!-- /tokens -->

## Surfaces

What each surface is for, and how they stack, is on [Elevation](elevation.md).

A control shows hover and pressed as two steps away from its rest look, each one the eye sees: the pressed step is further from rest than the hover step, so a press answers even under a pointer that is already hovering.

- A solid ink control takes `color.surface.inverse-hover` on hover and `color.surface.inverse-pressed` while pressed; a solid brand one takes `color.surface.brand-hover` and `color.surface.brand-pressed`. Each step is at least 1.2:1 from the one before it, and the label keeps 4.5:1 on all three.
- A quiet or outline control, transparent at rest, lays `color.surface.hover` over what it sits on while hovered and `color.surface.selected` while pressed. These layers step less than the solid fills: a denser pressed layer would take a brand outline label under 4.5:1 in light.

<!-- tokens: color.surface.default color.surface.raised color.surface.inset color.surface.overlay color.surface.hover color.surface.selected color.surface.inverse color.surface.inverse-hover color.surface.inverse-pressed color.scrim -->

| Token                           | Light                           | Dark                            | Use                                                                                                       |
| ------------------------------- | ------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `color.surface.default`         | `#FAFBF9` (palette.neutral.50)  | `#12181B` (palette.neutral.900) | Opaque panel background; text on inverse surfaces                                                         |
| `color.surface.raised`          | `#FFFFFF` (palette.neutral.0)   | `#1D2428` (palette.neutral.800) | Inputs, selected segment                                                                                  |
| `color.surface.inset`           | `#EBEEEB` (palette.neutral.100) | `#283237` (palette.neutral.700) | Segmented control track, counts, inset boxes                                                              |
| `color.surface.overlay`         | `rgba(250, 251, 249, 0.9)`      | `rgba(18, 24, 27, 0.88)`        | Translucent floating panels over the map (used with backdrop blur)                                        |
| `color.surface.hover`           | `rgba(18, 24, 27, 0.05)`        | `rgba(235, 238, 235, 0.06)`     | Hover state layer                                                                                         |
| `color.surface.selected`        | `rgba(18, 24, 27, 0.09)`        | `rgba(235, 238, 235, 0.09)`     | Selected row; the pressed layer of a quiet or outline control, in place of color.surface.hover and denser |
| `color.surface.inverse`         | `#12181B` (color.text.primary)  | `#EBEEEB` (color.text.primary)  | Primary buttons, pressed icon buttons, chart tooltip                                                      |
| `color.surface.inverse-hover`   | `#283237` (palette.neutral.700) | `#A2ADB1` (palette.neutral.300) | Hover fill of a primary button, a step from color.surface.inverse the eye sees                            |
| `color.surface.inverse-pressed` | `#47535A` (palette.neutral.600) | `#8B979E` (palette.neutral.400) | Pressed fill of a primary button, a step further from color.surface.inverse than its hover                |
| `color.scrim`                   | `rgba(10, 14, 16, 0.42)`        | `rgba(10, 14, 16, 0.42)`        | Backdrop behind modal dialogs                                                                             |

<!-- /tokens -->

## Borders

- Use `color.border.subtle` for hairlines: dividers, and the edges of panels and cards.
- Use `color.border.control` for edges that show where a control is, such as inputs and outline buttons. It reaches 3:1 on every surface, as WCAG asks of anything that identifies a control.
- Use `color.border.strong` for lines that decorate, such as dashed tags and chart axes. A control's edge takes `color.border.control`, which stays visible where strong would fade.
- `color.border.focus` is the focus ring, in the colour of primary text. The ring's width and offset are on [Semantic spacing](semantic-spacing.md#focus-ring).

<!-- tokens: color.border.* -->

| Token                  | Light                          | Dark                           | Use                                                                                         |
| ---------------------- | ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------- |
| `color.border.subtle`  | `rgba(18, 24, 27, 0.11)`       | `rgba(235, 238, 235, 0.1)`     | Dividers and panel borders                                                                  |
| `color.border.strong`  | `rgba(18, 24, 27, 0.22)`       | `rgba(235, 238, 235, 0.2)`     | Dashed tags, axis lines: lines that decorate rather than show where a control is            |
| `color.border.control` | `rgba(18, 24, 27, 0.47)`       | `rgba(235, 238, 235, 0.39)`    | Edges that show where a control is: inputs, outline buttons. 3:1 or better on every surface |
| `color.border.brand`   | `#896001` (palette.yellow.700) | `#F2B630` (palette.yellow.300) | Edge of a brand button, solid or outline, so the yellow reaches 3:1 on every surface        |
| `color.border.focus`   | `#12181B` (color.text.primary) | `#EBEEEB` (color.text.primary) | Keyboard focus ring                                                                         |

<!-- /tokens -->

## Status

Status colours are reserved for health, delays and problems: success, warning, danger and info. A status colour always comes with a word or an icon. Each status comes in three tokens:

- `color.status.<status>` fills dots, meters, icons and counts.
- `color.text.<status>` is text in that colour, 4.5:1 or better on every surface.
- `color.surface.<status>` is a tinted background for a message.

<!-- tokens: color.status.* color.surface.success color.surface.warning color.surface.danger color.surface.info -->

| Token                   | Light                          | Dark                           | Use                                                            |
| ----------------------- | ------------------------------ | ------------------------------ | -------------------------------------------------------------- |
| `color.status.success`  | `#13915A` (palette.green.500)  | `#3CCB80` (palette.green.300)  | Healthy, on time, live share at or above 70%                   |
| `color.status.warning`  | `#B06A00` (palette.orange.500) | `#F0A43A` (palette.orange.300) | Partial, live share 40–69%                                     |
| `color.status.danger`   | `#C2410C` (palette.red.500)    | `#FF8655` (palette.red.300)    | Late by 3 min or more, live share under 40%, delay disruptions |
| `color.status.info`     | `#2D5FC4` (palette.blue.500)   | `#7FA6FF` (palette.blue.300)   | Early, diversions                                              |
| `color.surface.success` | `#E5FAEC` (palette.green.100)  | `#133622` (palette.green.900)  | Tinted background for a success message                        |
| `color.surface.warning` | `#FEF1E4` (palette.orange.100) | `#3F280A` (palette.orange.900) | Tinted background for a warning message or count               |
| `color.surface.danger`  | `#FEF0EC` (palette.red.100)    | `#452417` (palette.red.900)    | Tinted background for a danger message                         |
| `color.surface.info`    | `#EEF4FF` (palette.blue.100)   | `#202D49` (palette.blue.900)   | Tinted background for an info message                          |

<!-- /tokens -->

## Brand

The brand colour is the yellow of the bus dot in the [Mylder mark](logos.md), and Perron's primary colour. It marks the main action, as a brand button, and moments of emphasis on the hero page: a band, a highlighted word. Text on the brand fill is always `color.text.on-color.dark`.

- A brand button, solid or outline, has a `color.border.brand` edge: the light-theme fill reaches only 2.1:1 on the surfaces, and the edge carries the 3:1. Its hover fill is `color.surface.brand-hover` and its pressed fill `color.surface.brand-pressed`.
- Ink actions (`color.surface.inverse`) stay for everything else, so the yellow keeps meaning the main action.
- A brand button shares the bus badge's fill and ink label. Keep it out of rows of line and mode badges, where it reads as one.
- Links, status and vehicles have their own colours.

<!-- tokens: color.surface.brand color.surface.brand-hover color.surface.brand-pressed color.surface.brand-subtle color.text.brand -->

| Token                         | Light                          | Dark                           | Use                                                                                               |
| ----------------------------- | ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `color.surface.brand`         | `#D99A00` (palette.yellow.500) | `#F2B630` (palette.yellow.300) | Brand fill: brand buttons, hero bands and calls to action. Text on it is color.text.on-color.dark |
| `color.surface.brand-hover`   | `#C48A02` (palette.yellow.550) | `#D99A00` (palette.yellow.500) | Hover fill of a brand button, a step from color.surface.brand the eye sees                        |
| `color.surface.brand-pressed` | `#B07B05` (palette.yellow.600) | `#B07B05` (palette.yellow.600) | Pressed fill of a brand button, a step further from color.surface.brand than its hover            |
| `color.surface.brand-subtle`  | `#FFF2DD` (palette.yellow.100) | `#3B2B07` (palette.yellow.900) | Tinted brand background                                                                           |
| `color.text.brand`            | `#896001` (palette.yellow.700) | `#F2B630` (palette.yellow.300) | Text in the brand colour: brand outline buttons and emphasis on the hero page; never links        |

<!-- /tokens -->

## Line colours

- Line colours are the operators' own: `color.transit.line.<id>` for metro and S-tog, `color.transit.mode.bus` and `color.transit.mode.regional` for the rest. They stay exact, never adjusted to the brand.
- A line colour fills a shape only in a line badge. Elsewhere it is a dot, a ring, a rail or a swatch.
- Text on a line colour always uses its partner, `color.transit.line-on.<id>` or `color.transit.mode.on-*`.
- Several official pairs miss 4.5:1: C 2.51:1, A 2.94:1, B 3.27:1, M4 3.56:1 and M1 4.44:1. They stay exact, set bold, with the line always named in words nearby. The test lists them.

<!-- tokens: color.transit.line.* color.transit.line-on.* color.transit.mode.* -->

| Token                            | Light                                 | Dark                                  | Use                                 |
| -------------------------------- | ------------------------------------- | ------------------------------------- | ----------------------------------- |
| `color.transit.line.m1`          | `#0B8A44`                             | `#0B8A44`                             | Metro M1                            |
| `color.transit.line.m2`          | `#F0B400`                             | `#F0B400`                             | Metro M2                            |
| `color.transit.line.m3`          | `#E2231A`                             | `#E2231A`                             | Metro M3 (Cityringen)               |
| `color.transit.line.m4`          | `#0090D0`                             | `#0090D0`                             | Metro M4                            |
| `color.transit.line.a`           | `#00A1DE`                             | `#00A1DE`                             | S-tog A                             |
| `color.transit.line.b`           | `#4BA046`                             | `#4BA046`                             | S-tog B                             |
| `color.transit.line.c`           | `#F18A00`                             | `#F18A00`                             | S-tog C                             |
| `color.transit.line.e`           | `#7D5AA6`                             | `#7D5AA6`                             | S-tog E                             |
| `color.transit.line.f`           | `#F5C200`                             | `#F5C200`                             | S-tog F                             |
| `color.transit.line.h`           | `#DD1F2A`                             | `#DD1F2A`                             | S-tog H                             |
| `color.transit.line-on.m1`       | `#FFFFFF` (color.text.on-color.light) | `#FFFFFF` (color.text.on-color.light) | Label text on the M1 line badge     |
| `color.transit.line-on.m2`       | `#12181B` (color.text.on-color.dark)  | `#12181B` (color.text.on-color.dark)  | Label text on the M2 line badge     |
| `color.transit.line-on.m3`       | `#FFFFFF` (color.text.on-color.light) | `#FFFFFF` (color.text.on-color.light) | Label text on the M3 line badge     |
| `color.transit.line-on.m4`       | `#FFFFFF` (color.text.on-color.light) | `#FFFFFF` (color.text.on-color.light) | Label text on the M4 line badge     |
| `color.transit.line-on.a`        | `#FFFFFF` (color.text.on-color.light) | `#FFFFFF` (color.text.on-color.light) | Label text on the A line badge      |
| `color.transit.line-on.b`        | `#FFFFFF` (color.text.on-color.light) | `#FFFFFF` (color.text.on-color.light) | Label text on the B line badge      |
| `color.transit.line-on.c`        | `#FFFFFF` (color.text.on-color.light) | `#FFFFFF` (color.text.on-color.light) | Label text on the C line badge      |
| `color.transit.line-on.e`        | `#FFFFFF` (color.text.on-color.light) | `#FFFFFF` (color.text.on-color.light) | Label text on the E line badge      |
| `color.transit.line-on.f`        | `#12181B` (color.text.on-color.dark)  | `#12181B` (color.text.on-color.dark)  | Label text on the F line badge      |
| `color.transit.line-on.h`        | `#FFFFFF` (color.text.on-color.light) | `#FFFFFF` (color.text.on-color.light) | Label text on the H line badge      |
| `color.transit.mode.bus`         | `#D99A00` (palette.yellow.500)        | `#F2B630` (palette.yellow.300)        | All bus lines                       |
| `color.transit.mode.regional`    | `#232C31`                             | `#EEF1F0`                             | Regional and Øresund trains         |
| `color.transit.mode.on-bus`      | `#12181B` (color.text.on-color.dark)  | `#12181B` (color.text.on-color.dark)  | Label text on bus badges            |
| `color.transit.mode.on-regional` | `#FAFBF9` (color.surface.default)     | `#12181B` (color.surface.default)     | Label text on regional train badges |

<!-- /tokens -->

## Delays and disruptions

Delay and disruption colours point at the status text colours. When each is used is on [Data states](data-states.md).

<!-- tokens: color.transit.delay.* color.transit.severity.* -->

| Token                              | Light                            | Dark                             | Use                                        |
| ---------------------------------- | -------------------------------- | -------------------------------- | ------------------------------------------ |
| `color.transit.delay.on-time`      | `#067849` (color.text.success)   | `#3CCB80` (color.text.success)   | Delay text when on time                    |
| `color.transit.delay.slight`       | `#12181B` (color.text.primary)   | `#EBEEEB` (color.text.primary)   | Late by 1–2 min                            |
| `color.transit.delay.late`         | `#AD3600` (color.text.danger)    | `#FF8655` (color.text.danger)    | Late by 3 min or more                      |
| `color.transit.delay.early`        | `#2351AF` (color.text.info)      | `#7FA6FF` (color.text.info)      | Delay text when early                      |
| `color.transit.delay.unknown`      | `#74818A` (color.text.tertiary)  | `#74818A` (color.text.tertiary)  | Delay text when there is no real-time data |
| `color.transit.severity.delay`     | `#AD3600` (color.text.danger)    | `#FF8655` (color.text.danger)    | Icon and label for delays                  |
| `color.transit.severity.data`      | `#47535A` (color.text.secondary) | `#A2ADB1` (color.text.secondary) | Data feed problems                         |
| `color.transit.severity.diversion` | `#2351AF` (color.text.info)      | `#7FA6FF` (color.text.info)      | Icon and label for diversions              |
| `color.transit.severity.planned`   | `#47535A` (color.text.secondary) | `#A2ADB1` (color.text.secondary) | Icon and label for planned works           |
| `color.transit.severity.notice`    | `#47535A` (color.text.secondary) | `#A2ADB1` (color.text.secondary) | Icon and label for service notices         |

<!-- /tokens -->

## Data states

<!-- tokens: color.data-state.* -->

| Token                        | Light                      | Dark                       | Use                                                                       |
| ---------------------------- | -------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| `color.data-state.no-signal` | `#9AA4A9`                  | `#5F6B71`                  | Vehicle dot fill when a vehicle has been silent past the ageing threshold |
| `color.data-state.halo`      | `#EDEFEB` (color.map.land) | `#151B1E` (color.map.land) | Map only: ring under each dot                                             |
| `color.data-state.outline`   | `rgba(18, 24, 27, 0.45)`   | `rgba(0, 0, 0, 0)`         | Map only: outline around light line colours on a light map                |

<!-- /tokens -->

## Charts

A chart with one series draws it in `color.chart.series`, with the area under a line at `opacity.series-fill`. Values and labels stay in text colours, never in the series colour.

<!-- tokens: color.chart.series opacity.series-fill -->

| Token                 | Light     | Dark      | Use                                            |
| --------------------- | --------- | --------- | ---------------------------------------------- |
| `color.chart.series`  | `#2B6C8C` | `#6DB3D8` | Single data series (vehicles in service curve) |
| `opacity.series-fill` | `0.12`    | `0.12`    | Area under a chart line                        |

<!-- /tokens -->

## Map

The map's ground. How the map is drawn is on [Map](map.md).

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
