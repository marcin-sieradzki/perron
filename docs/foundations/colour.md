# Colour

Colours come in two tiers. The palette holds the raw values. The `color` tokens say what a colour is for, and point at a palette step in each theme. Components and apps use `color` tokens only; a new need gets a new `color` token, never a palette value. Dark colours are their own palette steps, chosen for the dark surfaces, not an inversion of the light ones.

Surfaces, the scrim and the shadows are on [Elevation](elevation.md). The map's colours are on [Map](map.md), and the data-state and delay colours on [Data states](data-states.md).

## Palette

A neutral ramp from `0` (white) to `950`, and five steps each of blue, green, orange, red and yellow. Steps rise as the colour darkens, and each hue step has one job:

- **100**: light-theme tint.
- **300**: dark-theme fill and text.
- **500**: light-theme fill.
- **700**: light-theme text, 4.5:1 on every light surface.
- **900**: dark-theme tint.

Gaps in the neutral ramp are room for new steps.

<!-- tokens: palette.neutral.* -->

| Token                 | Value     |
| --------------------- | --------- |
| `palette.neutral.0`   | `#FFFFFF` |
| `palette.neutral.50`  | `#FAFBF9` |
| `palette.neutral.100` | `#EBEEEB` |
| `palette.neutral.300` | `#A2ADB1` |
| `palette.neutral.500` | `#74818A` |
| `palette.neutral.600` | `#47535A` |
| `palette.neutral.700` | `#283237` |
| `palette.neutral.800` | `#1D2428` |
| `palette.neutral.900` | `#12181B` |
| `palette.neutral.950` | `#0A0E10` |

<!-- /tokens -->

<!-- tokens: palette.blue.* palette.green.* palette.orange.* palette.red.* palette.yellow.* -->

| Token                | Value     |
| -------------------- | --------- |
| `palette.blue.100`   | `#EEF4FF` |
| `palette.blue.300`   | `#7FA6FF` |
| `palette.blue.500`   | `#2D5FC4` |
| `palette.blue.700`   | `#2351AF` |
| `palette.blue.900`   | `#202D49` |
| `palette.green.100`  | `#E5FAEC` |
| `palette.green.300`  | `#3CCB80` |
| `palette.green.500`  | `#13915A` |
| `palette.green.700`  | `#067849` |
| `palette.green.900`  | `#133622` |
| `palette.orange.100` | `#FEF1E4` |
| `palette.orange.300` | `#F0A43A` |
| `palette.orange.500` | `#B06A00` |
| `palette.orange.700` | `#965A00` |
| `palette.orange.900` | `#3F280A` |
| `palette.red.100`    | `#FEF0EC` |
| `palette.red.300`    | `#FF8655` |
| `palette.red.500`    | `#C2410C` |
| `palette.red.700`    | `#AD3600` |
| `palette.red.900`    | `#452417` |
| `palette.yellow.100` | `#FFF2DD` |
| `palette.yellow.300` | `#F2B630` |
| `palette.yellow.500` | `#D99A00` |
| `palette.yellow.700` | `#896001` |
| `palette.yellow.900` | `#3B2B07` |

<!-- /tokens -->

## Text

- Three text colours for the interface. Use `color.text.primary` for what people read first, and `color.text.secondary` for supporting text. Keep `color.text.tertiary` for hints, axis labels and captions next to stronger text: it misses 4.5:1 on purpose (the figures are on [Accessibility](accessibility.md)), so set sentences people must read in primary or secondary.
- `color.text.inverse` sits on `color.surface.inverse`, the primary button and pressed toggles.
- On a coloured fill, text is `color.text.on-color.dark` or `color.text.on-color.light`, whichever the fill was paired with.

<!-- tokens: color.text.* -->

| Token                       | Light                             | Dark                              | Use                                                                             |
| --------------------------- | --------------------------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| `color.text.on-color.dark`  | `#12181B` (palette.neutral.900)   | `#12181B` (palette.neutral.900)   | Dark text on a coloured fill (bus, light line colours)                          |
| `color.text.on-color.light` | `#FFFFFF` (palette.neutral.0)     | `#FFFFFF` (palette.neutral.0)     | White text on a coloured fill                                                   |
| `color.text.primary`        | `#12181B` (palette.neutral.900)   | `#EBEEEB` (palette.neutral.100)   | Main text and icons; also the focus ring                                        |
| `color.text.secondary`      | `#47535A` (palette.neutral.600)   | `#A2ADB1` (palette.neutral.300)   | Supporting text                                                                 |
| `color.text.tertiary`       | `#74818A` (palette.neutral.500)   | `#74818A` (palette.neutral.500)   | Hints, captions, inactive controls                                              |
| `color.text.inverse`        | `#FAFBF9` (color.surface.default) | `#12181B` (color.surface.default) | Text on inverse surfaces: tooltips, the chart's value tip                       |
| `color.text.success`        | `#067849` (palette.green.700)     | `#3CCB80` (palette.green.300)     | Text in the success colour: on time, running normally                           |
| `color.text.warning`        | `#965A00` (palette.orange.700)    | `#F0A43A` (palette.orange.300)    | Text in the warning colour                                                      |
| `color.text.danger`         | `#AD3600` (palette.red.700)       | `#FF8655` (palette.red.300)       | Text in the danger colour: late, delay disruptions                              |
| `color.text.info`           | `#2351AF` (palette.blue.700)      | `#7FA6FF` (palette.blue.300)      | Text in the info colour: early, diversions                                      |
| `color.text.brand`          | `#896001` (palette.yellow.700)    | `#F2B630` (palette.yellow.300)    | Text in the brand colour, for emphasis on the hero page; never links or buttons |

<!-- /tokens -->

## Borders

- Use `color.border.subtle` for hairlines: dividers, and the edges of panels and cards.
- Use `color.border.control` for edges that show where a control is, such as inputs and outline buttons. It reaches 3:1 on every surface, as WCAG asks of anything that identifies a control.
- Use `color.border.strong` for lines that decorate, such as dashed tags and chart axes. Never use it for a control's edge, which it would leave too faint.
- `color.border.focus` is the focus ring, in the colour of primary text. The ring's width and offset are on [Space and shape](space-and-shape.md).

<!-- tokens: color.border.* -->

| Token                  | Light                          | Dark                           | Use                                                                                         |
| ---------------------- | ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------- |
| `color.border.subtle`  | `rgba(18, 24, 27, 0.11)`       | `rgba(235, 238, 235, 0.1)`     | Dividers and panel borders                                                                  |
| `color.border.strong`  | `rgba(18, 24, 27, 0.22)`       | `rgba(235, 238, 235, 0.2)`     | Dashed tags, axis lines: lines that decorate rather than show where a control is            |
| `color.border.control` | `rgba(18, 24, 27, 0.47)`       | `rgba(235, 238, 235, 0.39)`    | Edges that show where a control is: inputs, outline buttons. 3:1 or better on every surface |
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

The brand colour is the yellow of the bus dot in the Mylder mark, for the hero page only. Its tokens and rules are on [Brand](brand.md).

## Line colours

- Line colours are the operators' own: `color.transit.line.<id>` for metro and S-tog, `color.transit.mode.bus` and `color.transit.mode.regional` for the rest.
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

## Charts

A chart with one series draws it in `color.chart.series`, with the area under a line at `opacity.series-fill`. Values and labels stay in text colours, never in the series colour.

<!-- tokens: color.chart.series opacity.series-fill -->

| Token                 | Light     | Dark      | Use                                            |
| --------------------- | --------- | --------- | ---------------------------------------------- |
| `color.chart.series`  | `#2B6C8C` | `#6DB3D8` | Single data series (vehicles in service curve) |
| `opacity.series-fill` | `0.12`    | `0.12`    | Area under a chart line                        |

<!-- /tokens -->
