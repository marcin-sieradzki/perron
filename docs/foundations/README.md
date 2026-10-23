# Perron foundations

Perron is the design system of Mylder, a live map of Copenhagen's buses, S-tog, metro and regional trains. The map is the product; everything else floats over it on glass and says, in words and in the shape of every dot, how sure we are about what it shows.

Each page gives the rules for one foundation, then its tokens. The token tables and contrast tables are rebuilt from `tokens/` by `npm run tokens`, so a page always shows the values the build ships. Edit the prose around a table, never the table.

| Page                                  | What it covers                                                          |
| ------------------------------------- | ----------------------------------------------------------------------- |
| [Brand](brand.md)                     | What Mylder is, its character, the mark and the brand colour            |
| [Content](content.md)                 | Voice, the fixed words for data states and delays, numbers and times    |
| [Accessibility](accessibility.md)     | The WCAG 2.2 AA target, what the build checks, what a person checks     |
| [Colour](colour.md)                   | The palette, text, borders, status, brand, line colours and charts      |
| [Typography](typography.md)           | The three families, the sixteen roles, sizes and line heights           |
| [Space and shape](space-and-shape.md) | Spacing, radius, border widths and the focus ring                       |
| [Elevation](elevation.md)             | The surface ladder, glass, shadows and stacking order                   |
| [Motion](motion.md)                   | Durations, easing and reduced motion                                    |
| [Layout](layout.md)                   | The map screen, breakpoints and shared measures                         |
| [Data states](data-states.md)         | The five Prik states, delays and kinds of disruption                    |
| [Map](map.md)                         | Map colours, line widths, dot sizes and dimming                         |
| [Themes and modes](themes.md)         | Light and dark, reduced motion, and how the build switches between them |
| [Iconography](iconography.md)         | Icons and the Mylder mark                                               |

## Using the tokens

- Load `perron.css` once at the app root. It brings the fonts, the custom properties for every theme and mode, the typography classes and a few page defaults.
- Pages name tokens the way the sources do, `color.text.primary`. In CSS that token is `var(--perron-color-text-primary)`: `--perron-`, then the name with dots as hyphens. Never copy a value.
- In script, `tokens/generated/tokens.ts` has every value per theme, typed by name, and the reduced motion values under `modifiers`.
- Light is the default theme. Set `data-theme="dark"` on any element for dark; without it, the system's dark mode applies. Reduced motion follows the system setting on its own.
- Change a token in `tokens/*.tokens.json`, then run `npm run tokens`. The generated files and the tables on these pages are never edited by hand.
