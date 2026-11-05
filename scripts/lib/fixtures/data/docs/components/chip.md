# Chip

A short label in a pill, such as "Night bus". It shows what a thing is, and does nothing when pressed.

<!-- run notes -->

A fixture: a spec moved over to the usage sections, of an entry deprecated in favour of Tag.

## When to use

Use Chip for a label that says what a thing is.

| Use instead                      | When                          |
| -------------------------------- | ----------------------------- |
| [Tag](tag.md)                    | Always: Tag replaces Chip     |
| [TagRow](../patterns/tag-row.md) | Several labels sit in one row |

## Props

| Name           | Type                   | Default    | Base UI prop   | Description                                |
| -------------- | ---------------------- | ---------- | -------------- | ------------------------------------------ |
| `variant`      | `'solid' \| 'outline'` | `'solid'`  | none           | How much the chip stands out.              |
| `outlined`     | `boolean`              | `false`    | none           | Draws an edge only. Use `variant` instead. |
| `children`     | `ReactNode`            | (required) | none           | The label.                                 |
| `render`       | Base UI's `render`     | none       | `render`       | Swaps the root element.                    |
| `nativeButton` | `boolean`              | `false`    | `nativeButton` | Whether `render` gives a native button.    |

## Do and don't

For a caller using the component, with the reason.

| Rule | Level  | Do                          | Don't                       | Checked by |
| ---- | ------ | --------------------------- | --------------------------- | ---------- |
| DD-1 | must   | Name the thing in a word    | Write a sentence in a chip  | review     |
| DD-2 | should | Take `variant` from its two | Write `variant="contained"` | types      |

## For agents

- Wrote `outlined`, which is deprecated.
  Write `variant="outline"`.
