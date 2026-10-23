# Brand

Mylder is a live map of Copenhagen's public transport: every bus, S-tog, metro and regional train, where it is now, and how sure we are about that. The name is Danish for a swarm or a throng, the city's vehicles moving all at once. Read this page before designing a screen, the hero page or any asset.

## Character

- **Honest.** Every vehicle shows how fresh its data is, and every sentence says no more than the data knows. The [data states](data-states.md) and the [content rules](content.md) are the brand at work.
- **Calm.** The map and the vehicles carry the colour. The interface around them is ink, glass and neutral surfaces, so it never competes with what moves.
- **Of Copenhagen.** The operators' own line colours, the city's names, Danish and English side by side, the 24-hour clock.

## The mark

The Mylder mark is a bus dot, an S-tog dot and an estimated ring: three of the ways a vehicle can look on the map. It takes its colours from tokens, each in its theme's value: the bus dot is the bus colour, the S-tog dot line A's blue, the ring primary text.

<!-- tokens: color.transit.mode.bus color.transit.line.a color.text.primary -->

| Token                    | Light                           | Dark                            | Use                                      |
| ------------------------ | ------------------------------- | ------------------------------- | ---------------------------------------- |
| `color.transit.mode.bus` | `#D99A00` (palette.yellow.500)  | `#F2B630` (palette.yellow.300)  | All bus lines                            |
| `color.transit.line.a`   | `#00A1DE`                       | `#00A1DE`                       | S-tog A                                  |
| `color.text.primary`     | `#12181B` (palette.neutral.900) | `#EBEEEB` (palette.neutral.100) | Main text and icons; also the focus ring |

<!-- /tokens -->

- Don't recolour, outline or rearrange the mark. Its shapes are data states, so changing them changes what it says.
- Set it beside the wordmark: "mylder" in lowercase, `typography.heading-md` set bold. The mark alone stands in only where space is tight, such as an app icon.
- Keep clear space of at least the ring's width around it, and don't set it smaller than its drawn size, 27 × 19 px.
- The mark's SVG files and the lockup arrive with the components.

## The brand colour

The brand colour is the yellow of the bus dot. It belongs to the hero page and to moments of emphasis there: a band, a call to action, a highlighted word. Text on the brand fill is always `color.text.on-color.dark`.

<!-- tokens: color.surface.brand color.surface.brand-subtle color.text.brand -->

| Token                        | Light                          | Dark                           | Use                                                                                                 |
| ---------------------------- | ------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `color.surface.brand`        | `#D99A00` (palette.yellow.500) | `#F2B630` (palette.yellow.300) | Brand fill: hero bands and calls to action on the hero page. Text on it is color.text.on-color.dark |
| `color.surface.brand-subtle` | `#FFF2DD` (palette.yellow.100) | `#3B2B07` (palette.yellow.900) | Tinted brand background                                                                             |
| `color.text.brand`           | `#896001` (palette.yellow.700) | `#F2B630` (palette.yellow.300) | Text in the brand colour, for emphasis on the hero page; never links or buttons                     |

<!-- /tokens -->

- Inside the map app, actions stay ink (`color.surface.inverse`), so the vehicles keep the colour.
- Never use the brand colour for links, for status or for a vehicle.

## What is not the brand

- **Line colours** belong to the operators. They stay exact, even where an official pair misses contrast; see [Colour](colour.md).
- **Status colours and the Prik shapes** carry meaning. They are never decoration, and never restyled to suit a page.

## Type and voice

Familjen Grotesk, the display family, is the brand's face: headings, figures on the hero page, the wordmark. The voice is in [Content](content.md): plain sentences, exact about certainty, sentence case, no emoji and no exclamation marks.
