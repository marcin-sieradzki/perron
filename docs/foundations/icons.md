# Icons

One small set, drawn for Mylder. Perron draws its own stroke icons rather than use an icon font or a third-party set: there are few of them, each drawn on a grid near the size it shows at. The files are in `packages/perron/icons/`, and `icons.json` there lists them by category with the size and use of each.

## Sizes

Every icon renders at one of three steps, set with `--perron-icon-size` (one of the tokens below) and never with a raw width. Each icon is drawn on the grid closest to its step, so its stroke stays between 1.5 and 1.8 px. A larger icon is a new drawing, not a scaled one.

<!-- tokens: icon.size.* -->

| Token           | Value  | Use                                                      |
| --------------- | ------ | -------------------------------------------------------- |
| `icon.size.325` | `13px` | Inline with label and caption text: the disruption icons |
| `icon.size.400` | `16px` | Inside controls: search, zoom, locate, close             |
| `icon.size.450` | `18px` | Top bar buttons: kiosk mode, about                       |

<!-- /tokens -->

## Style

- Strokes with round caps and joins, 1.5 to 1.8 px on the icon's own grid. Fills only for a dot, such as the point of the info icon.
- Drawn in `currentColor`, so an icon takes the colour of the text around it. Set the colour on the text, never on the icon.
- The `.perron-icon` class in `perron.css` sizes an inline SVG icon from `--perron-icon-size`, and keeps it from shrinking in a flex row.
- An icon sits next to a word or inside a labelled button; it never carries meaning alone. Next to text it is hidden from screen readers (`aria-hidden="true"`). Alone, it needs an accessible name.
- No icon font, no emoji, no third-party icon set. A new icon follows this page, joins `icons.json`, and the check confirms its grid, stroke and colour.

## The set

<!-- files: icons -->

### Map

| Icon                                                      | Name     | Grid  | Size                   | Use                           |
| --------------------------------------------------------- | -------- | ----- | ---------------------- | ----------------------------- |
| <img src="../../packages/perron/icons/plus.svg" alt="">   | `plus`   | 16 px | `icon.size.400`, 16 px | Zoom in                       |
| <img src="../../packages/perron/icons/minus.svg" alt="">  | `minus`  | 16 px | `icon.size.400`, 16 px | Zoom out                      |
| <img src="../../packages/perron/icons/locate.svg" alt=""> | `locate` | 16 px | `icon.size.400`, 16 px | Centre the map on the network |

### Actions

| Icon                                                             | Name            | Grid  | Size                   | Use                                    |
| ---------------------------------------------------------------- | --------------- | ----- | ---------------------- | -------------------------------------- |
| <img src="../../packages/perron/icons/search.svg" alt="">        | `search`        | 16 px | `icon.size.400`, 16 px | The search field                       |
| <img src="../../packages/perron/icons/close.svg" alt="">         | `close`         | 16 px | `icon.size.400`, 16 px | Close a panel, a dialog or a highlight |
| <img src="../../packages/perron/icons/chevron-down.svg" alt="">  | `chevron-down`  | 16 px | `icon.size.400`, 16 px | Open a select's list                   |
| <img src="../../packages/perron/icons/chevron-right.svg" alt=""> | `chevron-right` | 16 px | `icon.size.400`, 16 px | A menu row that opens a submenu        |

### App

| Icon                                                       | Name      | Grid  | Size                   | Use            |
| ---------------------------------------------------------- | --------- | ----- | ---------------------- | -------------- |
| <img src="../../packages/perron/icons/monitor.svg" alt=""> | `monitor` | 18 px | `icon.size.450`, 18 px | Kiosk mode     |
| <img src="../../packages/perron/icons/info.svg" alt="">    | `info`    | 18 px | `icon.size.450`, 18 px | About and help |

### Disruptions

| Icon                                                            | Name           | Grid  | Size                   | Use                |
| --------------------------------------------------------------- | -------------- | ----- | ---------------------- | ------------------ |
| <img src="../../packages/perron/icons/warning.svg" alt="">      | `warning`      | 14 px | `icon.size.325`, 13 px | Delays             |
| <img src="../../packages/perron/icons/signal-off.svg" alt="">   | `signal-off`   | 14 px | `icon.size.325`, 13 px | Data feed problems |
| <img src="../../packages/perron/icons/diversion.svg" alt="">    | `diversion`    | 14 px | `icon.size.325`, 13 px | Diversions         |
| <img src="../../packages/perron/icons/calendar.svg" alt="">     | `calendar`     | 14 px | `icon.size.325`, 13 px | Planned works      |
| <img src="../../packages/perron/icons/check-circle.svg" alt=""> | `check-circle` | 14 px | `icon.size.325`, 13 px | Running normally   |

### Controls

| Icon                                                    | Name   | Grid  | Size                   | Use                                                |
| ------------------------------------------------------- | ------ | ----- | ---------------------- | -------------------------------------------------- |
| <img src="../../packages/perron/icons/tick.svg" alt=""> | `tick` | 14 px | `icon.size.325`, 13 px | A ticked checkbox, and the chosen option in a list |
| <img src="../../packages/perron/icons/dash.svg" alt=""> | `dash` | 14 px | `icon.size.325`, 13 px | A checkbox that stands for a set partly ticked     |

### Feedback

| Icon                                                                  | Name                 | Grid  | Size                   | Use              |
| --------------------------------------------------------------------- | -------------------- | ----- | ---------------------- | ---------------- |
| <img src="../../packages/perron/icons/exclamation-circle.svg" alt=""> | `exclamation-circle` | 14 px | `icon.size.325`, 13 px | A danger message |
| <img src="../../packages/perron/icons/info-circle.svg" alt="">        | `info-circle`        | 14 px | `icon.size.325`, 13 px | An info message  |

<!-- /files -->
