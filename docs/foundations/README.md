# Contents

Perron is the design system of Mylder, a live map of Copenhagen's public transport: every bus, S-tog, metro and regional train, where it is now, and how sure we are about that. The map is the product. Everything else floats over it on glass and says, in words and in the shape of every dot, how sure we are about what it shows.

## The brand

Mylder is Danish for a swarm or a throng: the city's vehicles, moving all at once. It has one look, in a light and a dark theme.

- **Honest.** Every vehicle shows how fresh its data is, and every sentence says no more than the data knows.
- **Calm.** The map and the vehicles carry the colour. The interface around them is ink, glass and neutral surfaces.
- **Of Copenhagen.** The operators' own line colours, the city's names, Danish and English side by side, the 24-hour clock.

The mark is on [Logos](logos.md), the brand colour on [Semantic colours](semantic-colours.md#brand), and the voice in [Content design](../content-design.md).

## Pages

Each page gives the rules for one foundation, then its tokens or files. The tables are rebuilt from the package's `tokens/`, `icons/` and `logos/` folders by `npm run tokens`, so a page always shows what the build ships. Edit the prose around a table, never the table.

| Page                                      | What it covers                                                        |
| ----------------------------------------- | --------------------------------------------------------------------- |
| [Accessibility](accessibility.md)         | The WCAG 2.2 AA target: what the build enforces, what a person checks |
| [Elevation](elevation.md)                 | The surface ladder, glass and shadows                                 |
| [Icons](icons.md)                         | The icon files, their size scale and style                            |
| [Layout](layout.md)                       | Breakpoints, the map screen, stacking and shared measures             |
| [Logos](logos.md)                         | The Mylder mark and how it is used                                    |
| [Motion](motion.md)                       | Durations, easing and reduced motion                                  |
| [Primitive colours](primitive-colours.md) | The palette every colour token points at                              |
| [Semantic colours](semantic-colours.md)   | Every colour token in both themes                                     |
| [Semantic spacing](semantic-spacing.md)   | Spacing, radius, border widths and the focus ring                     |
| [Typography](typography.md)               | The three families, the sixteen roles, sizes and line heights         |

Two more pages hold what only a live map needs:

| Page                          | What it covers                                       |
| ----------------------------- | ---------------------------------------------------- |
| [Data states](data-states.md) | The five Prik states, delays and kinds of disruption |
| [Map](map.md)                 | Line widths, dot sizes and dimming on the map canvas |

## Using the tokens

- Install `@mylder/perron` and load `@mylder/perron/perron.css` once at the app root. It brings the fonts, the custom properties for both themes and for reduced motion, the typography classes and a few page defaults.
- Pages name tokens the way the sources do, `color.text.primary`. In CSS that token is `var(--perron-color-text-primary)`: `--perron-`, then the name with dots as hyphens. Never copy a value.
- In script, `@mylder/perron/tokens.ts` has every value per theme, typed by name, and the reduced motion values under `modifiers`.
- Light is the default theme. Set `data-theme="dark"` on any element for dark; without it, the system's dark mode applies. Reduced motion follows the system setting on its own.
- Icons and logos are SVG files in `@mylder/perron/icons/` and `@mylder/perron/logos/`, listed with their use in `icons.json` and `logos.json`.
- A token changes only in Perron's own repository, in `packages/perron/tokens/*.tokens.json`, followed by `npm run tokens`. Never edit a generated file, or a table on these pages, by hand.
