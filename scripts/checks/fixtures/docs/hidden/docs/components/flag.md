# Flag

A short flag.

## Props

| Name          | Type                   | Default      | Base UI prop | Description            |
| ------------- | ---------------------- | ------------ | ------------ | ---------------------- |
| `label`       | `string`               | (required)   | none         | The flag's words       |
| `variant`     | `'quiet' \| 'loud'`    | `'quiet'`    | none         | How loud the flag is   |
| `render`      | Base UI's `render`     | `<span />`   | `render`     | Swaps the root element |
| `closedLabel` | `string`               | The locale's | none         | Overrides "Closed"     |
| `openLabel`   | `string`               | The locale's | none         | Overrides "Open"       |
| `ref`         | `Ref<HTMLSpanElement>` |              | `ref`        | Reaches the root       |
| `className`   | `string`               |              | none         | Joined on the root     |
| `style`       | `CSSProperties`        |              | none         | Reaches the root       |
