# Pin

A pin on the map. Its Keyboard table names six keys; its stories press `Enter`, `Tab` and
`Shift+Tab`, but not `Space` or `Escape`, nor `Home`, whose row says why it is untested.

## Keyboard and ARIA

| Key                | Does                                                                                                | From    |
| ------------------ | --------------------------------------------------------------------------------------------------- | ------- |
| `Enter`, `Space`   | Opens the pin's card                                                                                | Base UI |
| `Tab`, `Shift+Tab` | Moves focus past the pin                                                                            | Browser |
| `Escape`           | Closes the card                                                                                     | Base UI |
| `Home`             | Moves to the first pin after a press on the map. Untested: user-event cannot press the map's canvas | Base UI |
| Typing             | Nothing                                                                                             | none    |

| Element | Role     | Name    |
| ------- | -------- | ------- |
| `root`  | `button` | `label` |

## Stories

| Story     | Shows                     | `play` test        |
| --------- | ------------------------- | ------------------ |
| `Default` | A medium pin, the subject | Enter and Tab keys |
