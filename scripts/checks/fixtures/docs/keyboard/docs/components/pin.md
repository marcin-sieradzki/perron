# Pin

A pin on the map. Its Keyboard table names five keys; its stories press `Enter`, `Tab` and
`Shift+Tab`, but not `Space` or `Escape`.

## Keyboard and ARIA

| Key                | Does                     | From    |
| ------------------ | ------------------------ | ------- |
| `Enter`, `Space`   | Opens the pin's card     | Base UI |
| `Tab`, `Shift+Tab` | Moves focus past the pin | Browser |
| `Escape`           | Closes the card          | Base UI |
| Typing             | Nothing                  | none    |

| Element | Role     | Name    |
| ------- | -------- | ------- |
| `root`  | `button` | `label` |

## Stories

| Story     | Shows                     | `play` test        |
| --------- | ------------------------- | ------------------ |
| `Default` | A medium pin, the subject | Enter and Tab keys |
