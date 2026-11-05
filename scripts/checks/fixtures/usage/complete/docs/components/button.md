# Button

A button that runs one action on the screen it sits on.

<!-- run notes -->

Made for the usage gate's tests: every part moved over.

## When to use

Use Button for an action named in words that runs where it sits.

| Use instead                                  | When                                         |
| -------------------------------------------- | -------------------------------------------- |
| [IconButton](icon-button.md)                 | The action shows as an icon alone            |
| [DepartureRow](../patterns/departure-row.md) | The row is a departure, which opens its stop |

## Anatomy

Filled.

## Do and don't

For a caller using the component, with the reason.

| Rule | Level  | Do                                                | Don't                                                                 | Checked by |
| ---- | ------ | ------------------------------------------------- | --------------------------------------------------------------------- | ---------- |
| DD-1 | must   | Name the action in words                          | Leave the button with no words: it has no name                        | review     |
| DD-2 | should | Pick `variant` from `solid` and `outline`         | Write MUI's `variant="contained"`                                     | types      |
| DD-3 | must   | Keep the button at least `size.target-min` square | Shrink it below the target size of WCAG 2.2's success criterion 2.5.8 | review     |

## For agents

- Wrote MUI's `variant="contained"`: Button's variants are `solid` and `outline`.
