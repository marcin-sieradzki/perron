# Logos

The Mylder mark, and how it is used. The files are in `logos/`, and `logos/logos.json` lists them with the ground each is drawn for.

## The mark

The mark is a bus dot, an S-tog dot and an estimated ring: three of the ways a vehicle can look on the map. Its colours are tokens, each in its theme's value: the bus dot is `color.transit.mode.bus`, the S-tog dot line A's `color.transit.line.a`, the ring `color.text.primary`. A file is an image and can't follow the theme, so there is one file per theme, and the check holds each file's colours to its theme's tokens.

<!-- tokens: color.transit.mode.bus color.transit.line.a color.text.primary -->

| Token                    | Light                           | Dark                            | Use                                      |
| ------------------------ | ------------------------------- | ------------------------------- | ---------------------------------------- |
| `color.transit.mode.bus` | `#D99A00` (palette.yellow.500)  | `#F2B630` (palette.yellow.300)  | All bus lines                            |
| `color.transit.line.a`   | `#00A1DE`                       | `#00A1DE`                       | S-tog A                                  |
| `color.text.primary`     | `#12181B` (palette.neutral.900) | `#EBEEEB` (palette.neutral.100) | Main text and icons; also the focus ring |

<!-- /tokens -->

## Usage

- Keep the mark as drawn: its three shapes and colours are data states, so a recoloured, outlined or rearranged mark says something else.
- Set it beside the wordmark: "mylder" in lowercase, in `typography.heading-md` set bold. The mark alone stands in only where space is tight, such as an app icon.
- Keep clear space of at least the ring's width around it, and set it no smaller than its drawn size, 27 × 19 px.
- Use the file drawn for the ground it sits on: `mylder-mark.svg` on light, `mylder-mark-dark.svg` on dark.

## Files

<!-- files: logos -->

### Brand

| Logo                                                | File                         | Theme | Use              |
| --------------------------------------------------- | ---------------------------- | ----- | ---------------- |
| <img src="../../logos/mylder-mark.svg" alt="">      | `logos/mylder-mark.svg`      | Light | On light grounds |
| <img src="../../logos/mylder-mark-dark.svg" alt=""> | `logos/mylder-mark-dark.svg` | Dark  | On dark grounds  |

<!-- /files -->
