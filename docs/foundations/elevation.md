# Elevation

The surface and shadow tokens. The map is the ground; everything else floats over it, and depth shows first in the surface colour, then in a shadow.

## Surfaces

- Floating panels are glass: `color.surface.overlay` with a backdrop blur of `effect.glass-blur` and a saturation of `effect.glass-saturate`. On phones, panels full of text use `color.surface.default` instead, so text never sits on moving map.
- Inside a panel, cards and inputs sit on `color.surface.raised`, and tracks, counts and inset boxes on `color.surface.inset`.
- Hover is `color.surface.hover`, laid over whatever is beneath. A selected row is `color.surface.selected`, which is also the pressed layer of a quiet or outline control.
- `color.surface.inverse` is the primary button, pressed toggles and the chart's value tip, with `color.text.inverse` on it.

<!-- tokens: color.surface.default color.surface.raised color.surface.inset color.surface.overlay color.surface.hover color.surface.selected color.surface.inverse effect.* -->

| Token                    | Light                           | Dark                            | Use                                                                                                       |
| ------------------------ | ------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `color.surface.default`  | `#FAFBF9` (palette.neutral.50)  | `#12181B` (palette.neutral.900) | Opaque panel background; text on inverse surfaces                                                         |
| `color.surface.raised`   | `#FFFFFF` (palette.neutral.0)   | `#1D2428` (palette.neutral.800) | Inputs, selected segment                                                                                  |
| `color.surface.inset`    | `#EBEEEB` (palette.neutral.100) | `#283237` (palette.neutral.700) | Segmented control track, counts, inset boxes                                                              |
| `color.surface.overlay`  | `rgba(250, 251, 249, 0.9)`      | `rgba(18, 24, 27, 0.88)`        | Translucent floating panels over the map (used with backdrop blur)                                        |
| `color.surface.hover`    | `rgba(18, 24, 27, 0.05)`        | `rgba(235, 238, 235, 0.06)`     | Hover state layer                                                                                         |
| `color.surface.selected` | `rgba(18, 24, 27, 0.09)`        | `rgba(235, 238, 235, 0.09)`     | Selected row; the pressed layer of a quiet or outline control, in place of color.surface.hover and denser |
| `color.surface.inverse`  | `#12181B` (color.text.primary)  | `#EBEEEB` (color.text.primary)  | Primary buttons, pressed icon buttons, chart tooltip                                                      |
| `effect.glass-blur`      | `16px`                          | `16px`                          | Backdrop blur behind glass panels                                                                         |
| `effect.glass-saturate`  | `1.3`                           | `1.3`                           | Backdrop saturation behind glass panels                                                                   |

<!-- /tokens -->

Inset stands apart from raised in both themes, so a track reads without a border: a step darker in light, a step lighter in dark. The build keeps the two at least 1.15:1 apart.

<!-- contrast 1.15: color.surface.inset on color.surface.raised -->

| Colour                | Light raised | Dark raised |
| --------------------- | ------------ | ----------- |
| `color.surface.inset` | 1.17:1       | 1.20:1      |

<!-- /contrast -->

## Shadows

Floating panels carry `shadow.panel`. Nothing else casts a shadow, except the selected segment of a segmented control, with `shadow.thumb`. Both are set per theme: a dark surface needs a darker, wider shadow to show at all.

<!-- tokens: shadow.* -->

| Token          | Light                                                                             | Dark                                                                         | Use                                     |
| -------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| `shadow.panel` | `0px 1px 2px 0px rgba(18, 24, 27, 0.06), 0px 10px 30px 0px rgba(18, 24, 27, 0.1)` | `0px 1px 2px 0px rgba(0, 0, 0, 0.35), 0px 14px 36px 0px rgba(0, 0, 0, 0.38)` | Floating panels                         |
| `shadow.thumb` | `0px 1px 2px 0px rgba(0, 0, 0, 0.14)`                                             | `0px 1px 2px 0px rgba(0, 0, 0, 0.4)`                                         | Selected segment in a segmented control |

<!-- /tokens -->

Stacking order is on [Layout](layout.md#stacking).
