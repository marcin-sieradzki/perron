# Semantic spacing

The spacing, radius and border tokens.

## Space

Every padding, margin and gap comes from the spacing scale: nine steps from 2 to 32 px on a 4 px base. The number divided by 100 is the count of 4 px units, so `space.300` is 12 px.

- Parts of a detail panel sit 12 px apart (`space.300`), and blocks of a pane 24 px apart (`space.600`).
- Panels sit 12 px from the screen edge and from each other (`size.panel-gap`, on [Layout](layout.md)).

<!-- tokens: space.* -->

| Token       | Value  |
| ----------- | ------ |
| `space.050` | `2px`  |
| `space.100` | `4px`  |
| `space.150` | `6px`  |
| `space.200` | `8px`  |
| `space.300` | `12px` |
| `space.400` | `16px` |
| `space.500` | `20px` |
| `space.600` | `24px` |
| `space.800` | `32px` |

<!-- /tokens -->

## Radius

Radius grows with the size of the thing it rounds.

<!-- tokens: radius.* -->

| Token         | Value    | Use                                     |
| ------------- | -------- | --------------------------------------- |
| `radius.xs`   | `4px`    | Small marks and ticks                   |
| `radius.sm`   | `6px`    | Line badges                             |
| `radius.md`   | `8px`    | Buttons, inputs, icon buttons, segments |
| `radius.lg`   | `12px`   | Cards and inset boxes                   |
| `radius.xl`   | `16px`   | Floating panels, sheets and dialogs     |
| `radius.full` | `9999px` | Pills: chips, tags, counts              |

<!-- /tokens -->

## Border widths

Two widths, numbered like the spacing scale: `border.width.025` is a quarter of 4 px, `border.width.050` half. Hairlines and the edges of inputs, cards and panels take the thin one. The focus ring, the selected state of a control and the line of a chart take the thick one.

<!-- tokens: border.width.* -->

| Token              | Value | Use                                                                  |
| ------------------ | ----- | -------------------------------------------------------------------- |
| `border.width.025` | `1px` | Hairlines, borders of inputs, cards and panels                       |
| `border.width.050` | `2px` | The focus ring, the selected state of a control, the line of a chart |

<!-- /tokens -->

## Focus ring

The ring is a solid outline, `focus.width` wide and `focus.offset` from the element, in `color.border.focus`. `perron.css` draws it on `:focus-visible` for every element; a component that draws its own ring uses the same three tokens.

<!-- tokens: focus.* -->

| Token          | Value                    | Use                                          |
| -------------- | ------------------------ | -------------------------------------------- |
| `focus.width`  | `2px` (border.width.050) | Width of the focus ring                      |
| `focus.offset` | `2px`                    | Gap between the focused element and its ring |

<!-- /tokens -->
