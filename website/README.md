# Website mockups

The chosen design for Perron's website (ROADMAP 9.1): glass over a live map of Copenhagen, dark by default. Build the Next.js site from these pages. They fix the look, the layout and the behaviour; the values and parts come from `@mylder/perron`, never from the mockups' markup.

The pages are a design canvas's source files. The live canvas is https://claude.ai/artifact/5vBdMz6WDo93U1BCRDzxTW (private; ask the maintainer for access), and this folder is its snapshot of 2026-10-25.

## Pages

| File                           | Page                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `mockups/Home.dc.html`         | Home: hero over the live map, components shown working in glass panels, what the system is made of         |
| `mockups/Foundations.dc.html`  | Foundations index: one tile per foundation page, each drawn from its tokens                                |
| `mockups/Components.dc.html`   | Components index: every stable component as a card holding the component itself                            |
| `mockups/Button.dc.html`       | A component page, Button as the reference: in context on the map, variants × states, sizes, props, install |
| `mockups/Patterns.dc.html`     | Patterns: the map screen with each pattern in its place, then a card per stable pattern                    |
| `mockups/Agents.dc.html`       | The MCP server: setup, and a real call and answer for each tool                                            |
| `mockups/Phone-Home.dc.html`   | Home under `breakpoint.phone`, with the menu as a bottom sheet                                             |
| `mockups/Phone-Button.dc.html` | Button's page under `breakpoint.phone`                                                                     |
| `mockups/perron-tokens.css`    | A trimmed copy of the generated tokens, plus the `pn-*` helpers the pages share                            |

## Reading a page

- The page is the markup inside `<x-dc>`. The `<script type="text/x-dc">` at the end holds its logic: `renderVals()` returns the values that fill each `{{name}}`, and `data-props` holds the canvas controls, such as the theme.
- `<sc-for list="{{rows}}" as="r">` repeats its children per item, and `<sc-if value="{{flag}}">` renders them when the value is true.
- `support.js`, the canvas runtime, is not in this folder, so the files do not open in a browser as they are. Read them as markup, or open the live canvas.
- Every colour, size and type style is a `var(--perron-*)` custom property, so each value names its token. Read the token, not the number.

## Rules the pages follow

The build keeps each of these. Each comes from the foundation page named.

- **Vehicles glide.** The background maps' vehicles follow their lines, metros wait at stations, and a new report pulses once (`duration.report-pulse`). Under reduced motion they jump from report to report instead, and a vehicle with no signal stays where it was last seen ([Motion](../docs/foundations/motion.md), [Data states](../docs/foundations/data-states.md)). The mockups draw this with SVG `animateMotion` and two groups, `.pn-moving` and `.pn-still`, switched by `prefers-reduced-motion`.
- **Motion explains a change of place.** Nothing moves for decoration, and the blink loop is kept for following.
- **Shadows** are for floating panels (`shadow.panel`) and the selected segment (`shadow.thumb`). Cards show hover with `color.surface.hover` laid over them ([Elevation](../docs/foundations/elevation.md)).
- **Glass** is for panels over the map. On phones, a panel full of text is opaque, so text never sits on the moving map.
- **Every text is set in a type role.** Page titles take `typography.display`, and `typography.heading-lg` under `breakpoint.phone` (the `.pn-title` helper) ([Typography](../docs/foundations/typography.md)).
- **The brand yellow** marks the one main action of a screen. The interface around the map is ink, glass and neutral surfaces; line colours appear on the map and in line badges, with the line's name ([Foundations](../docs/foundations/README.md)).
- **Targets** are at least `size.target-min`, and every interactive element shows the focus ring ([Accessibility](../docs/foundations/accessibility.md)).
- **Words** follow [Content design](../docs/content-design.md): sentence case, the 24-hour clock, "−1 min" with the true minus, "~" before an estimated time.
- **Each preview is the component it names**, in its spec's anatomy and tokens. Build it with the component from `@mylder/perron` or `@mylder/perron/patterns`.

## Open before the build

- **No lead text role.** `typography.body` tops out at 14 px, which is small for a page's intro. The mockups use `body`; a lead role goes through the `design-tokens` skill.
- **No navigation component.** The header's section links and the phone menu are stand-ins: Perron's Link is still designing, and nothing yet covers a site's top navigation.
- **The wordmark.** The header shows the mark beside "Perron". Brand renders the mark beside "mylder", so the site needs Brand to take another name, or its own lockup.
- **Sections.** ROADMAP 9.1 names Foundations, Components, Patterns, Get started, Skills and Release log; the mockups draw Foundations, Components, Patterns and Agents, with Content in the header. Settle the list before the routes.
- **Penpot.** The website was designed on the canvas, outside Penpot. If its pages join the Penpot library, start from `penpot/README.md`.
