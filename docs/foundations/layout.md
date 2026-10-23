# Layout

## The map screen

- A top bar of glass groups runs along the top: brand, clock, filters and settings.
- The overview sheet sits on the left and the detail panel on the right.
- Map controls and the scale sit at the bottom right, and the legend at the bottom centre.
- Panels keep `size.panel-gap` from the screen edge and from each other.

<!-- tokens: size.top-bar size.top-bar-phone size.sheet-width size.detail-width size.sheet-peek size.panel-gap -->

| Token                | Value   | Use                                                                  |
| -------------------- | ------- | -------------------------------------------------------------------- |
| `size.top-bar`       | `46px`  | Top bar group height (42 on phones)                                  |
| `size.top-bar-phone` | `42px`  | Height of a top bar group on phones                                  |
| `size.sheet-width`   | `376px` | Overview sheet width on desktop                                      |
| `size.detail-width`  | `364px` | Detail panel width on desktop                                        |
| `size.sheet-peek`    | `182px` | Bottom sheet height when closed on phones                            |
| `size.panel-gap`     | `12px`  | Distance between floating panels and the viewport edge (8 on phones) |

<!-- /tokens -->

## Breakpoints

Each breakpoint is the width below which the screen changes.

- Under `breakpoint.desktop`, the filters that are coming later go.
- Under `breakpoint.tablet`, the city name, the date and the legend go.
- Under `breakpoint.phone`, the sheet and the detail panel become bottom sheets, and the top bar shrinks to `size.top-bar-phone`.
- Under `breakpoint.compact-phone`, the brand mark goes.

<!-- tokens: breakpoint.* -->

| Token                      | Value    | Use                            |
| -------------------------- | -------- | ------------------------------ |
| `breakpoint.compact-phone` | `380px`  | Hide the brand mark            |
| `breakpoint.phone`         | `760px`  | Bottom sheets, compact top bar |
| `breakpoint.tablet`        | `1180px` | Hide city name, day and legend |
| `breakpoint.desktop`       | `1400px` | Hide "Later" chips             |

<!-- /tokens -->

## Shared measures

A measure lives here when two places must agree on it, such as a component and the list that virtualises its rows. A measure only one component's CSS reads stays in that CSS.

<!-- tokens: size.control size.button size.button-sm size.input size.segment size.badge size.badge-lg size.vehicle-row size.target-min -->

| Token              | Value  | Use                                                                   |
| ------------------ | ------ | --------------------------------------------------------------------- |
| `size.control`     | `34px` | Icon buttons and filter chips                                         |
| `size.button`      | `36px` | Buttons                                                               |
| `size.button-sm`   | `30px` | Small buttons                                                         |
| `size.input`       | `38px` | Search field                                                          |
| `size.segment`     | `32px` | Segmented control item                                                |
| `size.badge`       | `22px` | Line badge height                                                     |
| `size.badge-lg`    | `34px` | Large line badge height                                               |
| `size.vehicle-row` | `52px` | Vehicle table row height (virtualised list relies on it)              |
| `size.target-min`  | `24px` | Smallest touch or pointer target, from WCAG 2.2 target size (minimum) |

<!-- /tokens -->
