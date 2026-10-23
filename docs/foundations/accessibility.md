# Accessibility

Perron targets [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA. Part of it the build proves on every change: `npm run check` fails when any check below breaks. The rest no build can see, so a person checks it on every screen before it ships.

## What the build checks

- **Text contrast (1.4.3).** Every text colour reaches 4.5:1 on `color.surface.default`, `raised` and `inset`, in both themes. The test lists the deliberate misses by name: `color.text.tertiary` and `color.transit.delay.unknown`, which are only for hints, captions and the "—" of an unknown delay, always next to stronger text. Status and brand text also reach 4.5:1 on their own tinted surfaces.
- **Non-text contrast (1.4.11).** What shows where a control is, or what state something is in, reaches 3:1 against every surface: `color.border.control`, the focus ring and the status fills. Decorative lines, `color.border.subtle` and `color.border.strong`, are exempt, and their descriptions say so.
- **The focus ring (2.4.7, 1.4.11)** reaches 3:1 on every surface and on the map's land, water and parks.
- **The surface ladder.** `color.surface.inset` stands apart from `color.surface.raised` by at least 1.15:1 in both themes, so an inset track reads without a border. See [Elevation](elevation.md#surfaces).
- **Line badges.** Label colours on line colours are measured, and the official pairs that miss are listed. See [Semantic colours](semantic-colours.md#line-colours).
- **Reduced motion (2.3.3, a AAA criterion met anyway)** lives in the tokens: when the system asks for less motion, transitions take 0.01 ms. See [Motion](motion.md).

### Text on surfaces

<!-- contrast 4.5: color.text.primary color.text.secondary color.text.tertiary color.text.success color.text.warning color.text.danger color.text.info color.text.brand color.transit.delay.* color.transit.severity.* on color.surface.default color.surface.raised color.surface.inset -->

| Colour                             | Light default | Light raised  | Light inset   | Dark default  | Dark raised   | Dark inset    |
| ---------------------------------- | ------------- | ------------- | ------------- | ------------- | ------------- | ------------- |
| `color.text.primary`               | 17.26:1       | 17.92:1       | 15.32:1       | 15.32:1       | 13.45:1       | 11.21:1       |
| `color.text.secondary`             | 7.63:1        | 7.92:1        | 6.77:1        | 7.80:1        | 6.85:1        | 5.71:1        |
| `color.text.tertiary`              | 3.85:1 (miss) | 4.00:1 (miss) | 3.42:1 (miss) | 4.48:1 (miss) | 3.93:1 (miss) | 3.28:1 (miss) |
| `color.text.success`               | 5.34:1        | 5.54:1        | 4.74:1        | 8.57:1        | 7.52:1        | 6.27:1        |
| `color.text.warning`               | 5.38:1        | 5.59:1        | 4.78:1        | 8.60:1        | 7.55:1        | 6.29:1        |
| `color.text.danger`                | 6.12:1        | 6.35:1        | 5.44:1        | 7.50:1        | 6.59:1        | 5.49:1        |
| `color.text.info`                  | 7.06:1        | 7.32:1        | 6.26:1        | 7.51:1        | 6.59:1        | 5.49:1        |
| `color.text.brand`                 | 5.41:1        | 5.62:1        | 4.81:1        | 9.82:1        | 8.62:1        | 7.19:1        |
| `color.transit.delay.on-time`      | 5.34:1        | 5.54:1        | 4.74:1        | 8.57:1        | 7.52:1        | 6.27:1        |
| `color.transit.delay.slight`       | 17.26:1       | 17.92:1       | 15.32:1       | 15.32:1       | 13.45:1       | 11.21:1       |
| `color.transit.delay.late`         | 6.12:1        | 6.35:1        | 5.44:1        | 7.50:1        | 6.59:1        | 5.49:1        |
| `color.transit.delay.early`        | 7.06:1        | 7.32:1        | 6.26:1        | 7.51:1        | 6.59:1        | 5.49:1        |
| `color.transit.delay.unknown`      | 3.85:1 (miss) | 4.00:1 (miss) | 3.42:1 (miss) | 4.48:1 (miss) | 3.93:1 (miss) | 3.28:1 (miss) |
| `color.transit.severity.delay`     | 6.12:1        | 6.35:1        | 5.44:1        | 7.50:1        | 6.59:1        | 5.49:1        |
| `color.transit.severity.data`      | 7.63:1        | 7.92:1        | 6.77:1        | 7.80:1        | 6.85:1        | 5.71:1        |
| `color.transit.severity.diversion` | 7.06:1        | 7.32:1        | 6.26:1        | 7.51:1        | 6.59:1        | 5.49:1        |
| `color.transit.severity.planned`   | 7.63:1        | 7.92:1        | 6.77:1        | 7.80:1        | 6.85:1        | 5.71:1        |

<!-- /contrast -->

### Controls, focus and status fills on surfaces

<!-- contrast 3: color.border.control color.border.focus color.status.* on color.surface.default color.surface.raised color.surface.inset -->

| Colour                 | Light default | Light raised | Light inset | Dark default | Dark raised | Dark inset |
| ---------------------- | ------------- | ------------ | ----------- | ------------ | ----------- | ---------- |
| `color.border.control` | 3.10:1        | 3.12:1       | 3.03:1      | 3.32:1       | 3.26:1      | 3.04:1     |
| `color.border.focus`   | 17.26:1       | 17.92:1      | 15.32:1     | 15.32:1      | 13.45:1     | 11.21:1    |
| `color.status.success` | 3.87:1        | 4.02:1       | 3.44:1      | 8.57:1       | 7.52:1      | 6.27:1     |
| `color.status.warning` | 4.12:1        | 4.28:1       | 3.66:1      | 8.60:1       | 7.55:1      | 6.29:1     |
| `color.status.danger`  | 4.99:1        | 5.18:1       | 4.43:1      | 7.50:1       | 6.59:1      | 5.49:1     |
| `color.status.info`    | 5.71:1        | 5.92:1       | 5.07:1      | 7.51:1       | 6.59:1      | 5.49:1     |

<!-- /contrast -->

### The focus ring on the map

<!-- contrast 3: color.border.focus on color.map.land color.map.water color.map.park -->

| Colour               | Light land | Light water | Light park | Dark land | Dark water | Dark park |
| -------------------- | ---------- | ----------- | ---------- | --------- | ---------- | --------- |
| `color.border.focus` | 15.48:1    | 11.78:1     | 13.61:1    | 14.88:1   | 16.27:1    | 13.89:1   |

<!-- /contrast -->

## Rules

- **Focus.** Every interactive element shows the ring on `:focus-visible`: a `focus.width` solid outline in `color.border.focus`, `focus.offset` away from the element. `perron.css` sets it for the whole page. Never remove an outline without drawing the ring another way.
- **Targets (2.5.8).** Anything people press is at least `size.target-min` square, or has that much room around it. Perron's controls are larger: the smallest, a small button, is `size.button-sm`.
- **Colour never alone (1.4.1).** A status colour comes with a word or an icon, a data state with its name next to the dot, a line colour with the line's name.
- **Hover (1.4.13).** Anything shown on hover is also reachable by selecting the item, because touch and keyboard users never see hover. A hover card stays while the pointer is over it and closes with Esc.
- **Keys.** Esc closes the topmost thing first: a dialog, then a detail panel, then a highlight. + and − zoom, arrow keys pan.
- **State in words.** Toggles say their state in words as well as in looks ("Follow" / "Following"). One primary action per panel.
- **Moving things.** Loops (the follow blink and the report and selection pulses) stop in their component when the system asks for less motion. The tokens only shorten transitions.

<!-- tokens: focus.* size.target-min -->

| Token             | Value                    | Use                                                                   |
| ----------------- | ------------------------ | --------------------------------------------------------------------- |
| `focus.width`     | `2px` (border.width.050) | Width of the focus ring                                               |
| `focus.offset`    | `2px`                    | Gap between the focused element and its ring                          |
| `size.target-min` | `24px`                   | Smallest touch or pointer target, from WCAG 2.2 target size (minimum) |

<!-- /tokens -->

## What a person checks

Before a screen ships, check what the build can't:

- **Keyboard.** Every action is reachable in a sensible order. Only an open dialog traps focus, and closing anything returns focus to where it came from.
- **Names.** Every control has an accessible name; an icon button carries a label. The map has a text alternative: the vehicle list.
- **Images.** Images and the mark have alt text, or are hidden from assistive technology when they are decoration.
- **Zoom and reflow (1.4.4, 1.4.10).** At 200% zoom and at 320 px wide, nothing is cut off or overlaps, and only the map scrolls sideways.
- **Text spacing (1.4.12).** Wider line, letter and word spacing breaks nothing.
- **Announcements.** Live updates, such as countdowns and moving vehicles, don't flood a screen reader: a polite live region announces changes of state only.
- **Forced colours.** In Windows' contrast themes, the focus ring and the selected state still show. The Prik shapes keep each data state readable without colour.
