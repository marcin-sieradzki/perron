# Perron foundations

Perron is the design system of Mylder, a live map of Copenhagen's buses, S-tog, metro and regional trains. The map is the product; everything else floats over it on glass and says, in words and in the shape of every dot, how sure we are about what it shows.

## Content

- Say what is happening in plain sentences, then how sure we are. "Signal fault at Danshøj. Trains between Flintholm and Ny Ellebjerg run slower than planned." Never claim more certainty than the data has: a vehicle without a signal is "No signal since 08:02", not a guess.
- Sentence case everywhere: "Show whole line", "Back to the map", "Reporting live, by operator". Capitals come only from the `perron-typography-overline` style, so write the source text in sentence case.
- Speak about the city and its vehicles, not about the person. Address them only in instructions: "Try a line number such as 5C."
- Numbers: 24-hour clock ("08:14"), a space before units ("4 min", "45 km/h"), the true minus sign for early ("−1"), "—" for unknown, "≈" before estimates, "~" before estimated times. Countdowns under 45 seconds read "Now".
- Data states and delays always use the same words, in English and Danish, so every screen agrees. Live / Live, Ageing / Ældre, Estimated / Beregnet, Timetable only / Kun køreplan, No signal / Intet signal; Delays / Forsinkelser, Running normally / Kører normalt, Show on map / Vis på kort. Don't write your own wording for them.
- Name keys in help text: "Keys: + and − zoom, arrows pan, Esc closes panels."
- No emoji, no exclamation marks.

## Colour

- Colours come in two tiers. The palette (`perron-palette-*`) holds the raw values: a neutral ramp from `0` (white) to `950`, and five steps each of blue, green, orange, red and yellow. The `perron-color-*` tokens say what a colour is for and point at a palette step per theme. Components and apps use `perron-color-*` only; a new need gets a new `color` token, never a palette value.
- The map is the ground. Its colours are `perron-color-map-*`: land, water, park, street, rail, building and labels. Panels float over it in `perron-color-surface-overlay` with a 16 px backdrop blur; on phones, panels full of text use `perron-color-surface-default`.
- Inside a panel, set cards and inset boxes on `perron-color-surface-raised` or `perron-color-surface-inset`. Hover is `perron-color-surface-hover`, a selected row `perron-color-surface-selected`.
- Three text colours. `perron-color-text-primary` for what people read first; `perron-color-text-secondary` for supporting text (6.5:1 or better on every surface, both themes); `perron-color-text-tertiary` only for hints, axis labels and captions next to stronger text. Tertiary misses 4.5:1: 3.85:1 on `perron-color-surface-default` and 3.42:1 on `perron-color-surface-inset` in light, 4.48:1 and 3.75:1 in dark. Set sentences people must read in primary or secondary.
- Hairlines are `perron-color-border-subtle`; borders of inputs and outline buttons are `perron-color-border-strong`.
- Line colours are the operators' own (`perron-color-transit-line-<id>` for metro and S-tog, `perron-color-transit-mode-bus` and `perron-color-transit-mode-regional`). A line colour fills a shape only in a line badge; elsewhere it is a dot, a ring, a rail or a swatch. Text on a line colour always uses its `perron-color-transit-line-on-<id>` or `perron-color-transit-mode-on-*` partner. Several official pairs miss 4.5:1 (C 2.51:1, A 2.94:1, B 3.27:1, M4 3.56:1, M1 4.44:1); they stay exact, set bold, with the line always named in words nearby.
- Status colours are reserved for health, delays and problems: success, warning, danger and info. Each comes in three tokens: `perron-color-status-<status>` fills dots, meters, icons and counts; `perron-color-text-<status>` is text in that colour (4.7:1 or better on every surface, both themes); `perron-color-surface-<status>` is a tinted background for a message. Delays (`perron-color-transit-delay-*`) and kinds of disruption (`perron-color-transit-severity-*`) point at the status text colours. A status colour always comes with a word or an icon.
- The brand colour is the yellow of the bus dot in the Mylder mark. It belongs to the hero page and moments of emphasis: `perron-color-surface-brand` for bands and calls to action (text on it is `perron-color-text-on-color-dark`, 7.3:1), `perron-color-surface-brand-subtle` for a tinted background, `perron-color-text-brand` for a highlighted word. Inside the map app, actions stay ink, so the vehicles keep the colour.
- `perron-color-data-state-no-signal` grey means a vehicle has gone silent. Use it for that alone.
- `perron-color-surface-inverse` with `perron-color-text-inverse` is the primary button and pressed toggles (17.3:1 light, 15.3:1 dark).
- The focus ring is a solid 2 px outline in `perron-color-border-focus`, the same colour as primary text: 11.7:1 or better on every surface and on the map, in both themes.
- Light is the default theme. Dark comes from `[data-theme="dark"]` or, without an explicit theme, from the system's dark mode. Dark colours are their own palette steps, chosen for the dark surfaces, not an inversion of the light ones.

## Type

- Three families, self-hosted: Familjen Grotesk for headings and the wordmark, Schibsted Grotesk for text and labels, JetBrains Mono for data. Fonts load from this package, never from Google Fonts, which would send visitors' IP addresses to Google.
- Sixteen roles, one per job. Set every piece of text with a role, as a class (`perron-typography-body`) or a composite custom property (`font: var(--perron-typography-body)` plus `letter-spacing: var(--perron-typography-body-tracking)`).

| Role                         | Size  | Use                                                          |
| ---------------------------- | ----- | ------------------------------------------------------------ |
| `display`                    | 48    | Hero headline                                                |
| `heading-lg`                 | 24    | Dialog and page titles                                       |
| `heading-md`                 | 20    | Panel titles; the wordmark is heading-md set bold            |
| `heading-sm`                 | 14    | Card titles                                                  |
| `body`, `body-sm`, `caption` | 14–12 | Sentences, supporting sentences, notes and second lines      |
| `label`, `label-sm`          | 13–12 | Buttons, tabs, chips and list names; legend and field labels |
| `overline`                   | 11    | Section headings and tags, in capitals                       |
| `badge`                      | 12    | Line badge labels                                            |
| `stat`                       | 28    | Key figures                                                  |
| `data-xl` to `data-sm`       | 48–11 | Clocks, countdowns, times, delays, counts and percentages    |

- Anything people compare down a column is a `data` role: times, countdowns, counts, delays, percentages. They use tabular figures, so columns line up.
- Sizes come from one scale, `perron-font-size-275` (11 px) to `perron-font-size-1200` (48 px), numbered like the spacing scale. Roles use it; components reach for a size directly only for a responsive step a role names: on phones `display` and `data-xl` step down to `perron-font-size-800` (32 px) and `stat` to `perron-font-size-600` (24 px).
- Line heights are four: `none` for single lines in a fixed box, `tight` for headings and figures, `snug` for labels and data, `normal` for running text.

## Space, shape and depth

- Every padding, margin and gap comes from the spacing scale: nine steps from 2 to 32 px on a 4 px base, `perron-space-050` to `perron-space-800` (the number divided by 100 is the count of 4 px units). Stack blocks with it: parts of a detail panel 12 px apart (`perron-space-300`), blocks of a pane 24 px apart (`perron-space-600`), panels 12 px from the screen edge and from each other (`perron-size-panel-gap`).
- Radius grows with size: `perron-radius-xs` (4 px) for small marks, `perron-radius-sm` (6 px) for line badges, `perron-radius-md` (8 px) for buttons, inputs and icon buttons, `perron-radius-lg` (12 px) for cards and inset boxes, `perron-radius-xl` (16 px) for floating panels, sheets and dialogs, and `perron-radius-full` for chips, tags and counts.
- Floating panels carry `perron-shadow-panel`; nothing else casts a shadow except the selected segment's `perron-shadow-thumb`.
- Layout over the map: a 46 px top bar of glass groups (brand, clock, filters, settings), the 376 px overview sheet on the left, the 364 px detail panel on the right, map controls and scale at the bottom right, the legend at the bottom centre. Under 760 px the sheet and detail become bottom sheets and the top bar shrinks to 42 px; under 1180 px the city name, date and legend go; under 1400 px the filters that are coming later go.
- Stacking order, lowest first: map controls, sheet, highlight chip, detail, top bar, tooltip, dialog (`perron-z-index-*`).

## Data states

- Every vehicle is a Prik, drawn in its line colour in one of five states. Live: a solid dot, a GPS report under a minute old. Ageing: a fainter dot, a report 1 to 5 minutes old. Estimated: a ring, placed from the timetable and the latest delay. Timetable only: a dashed ring, no real-time data at all. No signal: a grey dot, silent for over 5 minutes and left where it was last seen.
- The `perron-prik-*` tokens give the geometry of each shape at any size: insets, stroke widths, the dash and the age thresholds (1 and 5 minutes).
- The shapes are the system's signature. Never reuse a ring or a dashed ring to mean anything else, and never draw a vehicle without its state.
- Always write the state in words next to the dot. Legends list all five states, in this order, even when one has no vehicles.
- On the map, draw dots on a canvas with a halo of `perron-color-data-state-halo` and, for light line colours on the light map, a hairline of `perron-color-data-state-outline`.
- A delay is known only for live, ageing and estimated vehicles. Timetable only and no signal always show an unknown delay ("—").

## Motion

- Motion explains a change of place: the sheet slides (`perron-duration-sheet`, 320 ms, `perron-easing-sheet`), the camera eases to a selection (`perron-duration-camera`, 750 ms), meters ease to new values (`perron-duration-meter`).
- Vehicles glide between reports instead of jumping; a new report pulses once (`perron-duration-report-pulse`). A following indicator blinks (`perron-duration-blink`).
- When the person prefers reduced motion, cut transitions and stop blinking and pulsing.

## Interaction

- Anything shown on hover must also be reachable by selecting the item, because touch and keyboard users never see hover.
- Esc closes the topmost thing first: a dialog, then a detail panel, then a highlight.
- Keys: + and − zoom, arrow keys pan.
- One primary action per panel. Toggles say their state in words as well as in looks ("Follow" / "Following").

## Iconography

- Perron draws its own small set of stroke icons: round caps and joins, a 1.5 to 1.8 px stroke, on 14, 16 and 18 px grids, in `currentColor` so they take the colour of the text around them. The icon set arrives with the components.
- Icons sit next to a word or inside a labelled button; they never carry meaning alone.
- No icon font, no emoji, no third-party icon set.
- The Mylder mark is a bus dot, an S-tog dot and an estimated ring: the three ways a vehicle can look. Don't recolour it.

## Using the tokens

- Load `perron.css` once at the app root: it brings the fonts, the custom properties for both themes, the typography classes and a few page defaults.
- Read tokens as custom properties, `var(--perron-<group>-<name>)`: `--perron-color-text-primary`, `--perron-space-300`, `--perron-radius-lg`. Never copy a value.
- In script, `tokens/generated/tokens.ts` has every value per theme, typed by name.
- Light is the default theme. Set `data-theme="dark"` on any element for dark; without it, the system's dark mode applies.
- Change a token in `tokens/*.tokens.json`, then run `npm run tokens`. The generated files are never edited by hand.
