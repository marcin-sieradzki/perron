# Primitive colours

The palette holds Perron's raw colour values. Every `color` token points at a palette step in each theme, so retuning a step moves every colour built on it. Components and apps never read the palette: they use the `color` tokens on [Semantic colours](semantic-colours.md), and a new need gets a new `color` token, never a palette value.

## Steps

A neutral ramp runs from `0` (white) to `950`. Five hues, blue, green, orange, red and yellow, have five steps each. Steps rise as the colour darkens, and each hue step has one job:

- **100**: light-theme tint.
- **300**: dark-theme fill and text.
- **500**: light-theme fill.
- **700**: light-theme text, 4.5:1 on every light surface.
- **900**: dark-theme tint.

Gaps in the neutral ramp are room for new steps. A translucent colour is written in full on its `color` token, with a palette step's components plus an alpha, and a test checks its RGB is a palette step.

## Neutral

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

## Hues

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
