# DetailHeader

The top of the detail panel: it names what the panel shows, a line's vehicle by its line badge and destination or a stop by its marker and name, with a line under it and room for the panel's own controls.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): this spec decides what the drawing would, from the [contract](../components/README.md) and its Patterns section, the [foundations](../foundations/README.md), [content design](../content-design.md), the tokens and the specs of the two components in `dependsOn`, [LineBadge](../components/line-badge.md) and [StationIcon](../components/station-icon.md). The extracted prototype is not reachable from this branch, so nothing here rests on it. DetailHeader is the first pattern, so it also sets how a pattern takes a line.

## Anatomy

Penpot page `Patterns/DetailHeader`. Family: none, since it is content that sits on the detail panel's surface and draws no surface of its own. Shared parts: `VisuallyHidden`.

The drawing will have a `root` board holding four layers: `mark`, `title`, `subheader` and `action`.

| Part (Penpot layer) | What it is                                                                                                                                                                              | Base UI part                                         | Class                       | `slotProps` key |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------- | --------------- |
| `root`              | A `div` laying the parts out in a three-column grid: mark, then title over subheader, then action                                                                                       | None: a pattern never imports Base UI; a plain `div` | `pn-DetailHeader`           | none            |
| `mark`              | A `div` holding a `large` LineBadge (variant `line`) or a `large` outlined StationIcon (variant `stop`), hidden from screen readers; rendered only when it has something to show (CR-3) | None: a plain `div` around a Perron component        | `pn-DetailHeader-mark`      | `mark`          |
| `title`             | An `h2` holding the caller's `title`: the destination, or the stop's name. In the `line` variant it starts with the line's name in a `VisuallyHidden` span (CR-4)                       | None: a plain `h2`                                   | `pn-DetailHeader-title`     | `title`         |
| `subheader`         | A `div` holding the caller's `subheader`: one supporting line, such as the next stop or the lines a stop has; rendered only when given                                                  | None: a plain `div`                                  | `pn-DetailHeader-subheader` | `subheader`     |
| `action`            | A `div` holding the caller's `action`, such as the panel's close button, at the end of the row; rendered only when given                                                                | None: a plain `div`                                  | `pn-DetailHeader-action`    | `action`        |

- DetailHeader has two variants, the Penpot `variant` property: `line` (a LineBadge and a destination, for a vehicle or a line), first and so the default, and `stop` (a StationIcon and a stop's name), so the drawing has one variant per kind of panel and the stories pair with them.

## Base UI parts

No Base UI part: `baseUiParts` is empty in `packages/perron/components.json`, and the contract's Patterns section forbids a pattern to import `@base-ui/react`, so every part is a plain element and the marks come from Perron's own components, `LineBadge` and `StationIcon`, and the `VisuallyHidden` shared part.

| Base UI part          | Renders | Perron sets                                                                                                                                                        | Passed through                                              |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| None, for `root`      | `div`   | The class `pn-DetailHeader` then the caller's, `data-variant` from `variant`, and the parts below as children                                                      | `className`, `style`, `ref` and the rest of the `div` props |
| None, for `mark`      | `div`   | The class `pn-DetailHeader-mark`, `aria-hidden="true"`, and a `LineBadge` or `StationIcon` from `variant`, `line` and `lineName`                                   | `slotProps.mark`                                            |
| None, for `title`     | `h2`    | The class `pn-DetailHeader-title`, an `id` (the caller's from `slotProps.title`, or one from React's `useId`), and `title` as children, after the hidden line name | `slotProps.title`                                           |
| None, for `subheader` | `div`   | The class `pn-DetailHeader-subheader`, `subheader` as children                                                                                                     | `slotProps.subheader`                                       |
| None, for `action`    | `div`   | The class `pn-DetailHeader-action`, `action` as children                                                                                                           | `slotProps.action`                                          |

Base UI already does: nothing here. The behaviour the parts need comes from the browser (a heading, reading order) and from the composed components, which bring their own: LineBadge sets its line's fill and label colours, and StationIcon hides itself and sets its line's colour.

- DetailHeader has no `render`, on the root or in `slotProps`: a pattern can't import `useRender`, so the root is a `div` that never swaps and each `slotProps` value takes its part's HTML props only. ROADMAP 7.1's pattern contract is to say so for every pattern.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name                  | Type                                                                                            | Default  | Base UI prop | Description                                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------- | -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`             | `'line' \| 'stop'`                                                                              | `'line'` | none         | What the panel shows: `line` heads a vehicle or a line with its line badge and destination; `stop` heads a stop or station with its marker and name. Set on the root as `data-variant`.                                |
| `line`                | `'m1' \| 'm2' \| 'm3' \| 'm4' \| 'a' \| 'b' \| 'c' \| 'e' \| 'f' \| 'h' \| 'bus' \| 'regional'` |          | none         | The line whose colours the mark takes, typed as LineBadge's and StationIcon's `line`. In `line`, the badge's colours, needed with `lineName`; in `stop`, the marker's colour, left out for a stop several lines serve. |
| `lineName`            | `ReactNode`                                                                                     |          | none         | The line's short name as riders know it, "5C", "M2" or "A": the badge's label in `line`, also read first in the title. Not used in `stop`.                                                                             |
| `title`               | `ReactNode`                                                                                     |          | none         | The panel's title: the destination in `line` ("Husum Torv"), the stop's name in `stop` ("Nørreport St."). Required. Replaces the HTML `title` attribute.                                                               |
| `subheader`           | `ReactNode`                                                                                     |          | none         | One supporting line under the title, such as "Next stop: Nørreport St." or the lines a stop has.                                                                                                                       |
| `action`              | `ReactNode`                                                                                     |          | none         | The panel's controls at the end of the row, such as its close button.                                                                                                                                                  |
| `slotProps.mark`      | `ComponentPropsWithRef<'div'>`                                                                  |          | none         | Props for the `mark` part                                                                                                                                                                                              |
| `slotProps.title`     | `ComponentPropsWithRef<'h2'>`                                                                   |          | none         | Props for the `title` part. Its `id` is the one the panel's `aria-labelledby` points at.                                                                                                                               |
| `slotProps.subheader` | `ComponentPropsWithRef<'div'>`                                                                  |          | none         | Props for the `subheader` part                                                                                                                                                                                         |
| `slotProps.action`    | `ComponentPropsWithRef<'div'>`                                                                  |          | none         | Props for the `action` part                                                                                                                                                                                            |

`className`, `style`, `ref` and the other `div` props reach the root, as the contract's [Root](../components/README.md#root) says. `title`, `children`, `variant`, `line`, `lineName`, `subheader`, `action` and `slotProps` are taken out of the rest props first, so the HTML `title` attribute never reaches the element. The props type leaves out `children`: the header's words come through the named props. No `render` (see [Base UI parts](#base-ui-parts)), and no `*Label` prop, since DetailHeader owns no string.

- A pattern takes a line as two flat props: `line`, the id, typed exactly as LineBadge's and StationIcon's `line`, and `lineName`, the short name, the badge's children; not one `line` object such as `{ id, name }`. The id passes straight to LineBadge and StationIcon, and the patterns after this one (DepartureRow, DisruptionCard, VehicleTable) take the same two.
- The text props take MUI `CardHeader`'s names, `title`, `subheader` and `action`, as EmptyState took `title` and `action`, with no `children`.
- The panel's close button comes in through `action`, from DetailPanel, which gets it from Sheet's `Drawer.Close`; DetailHeader has no `onClose` prop and no "Close" owned string. It then needs no IconButton or CloseButton (neither is built yet), owns no string, and Esc and focus return stay with the Sheet that owns the panel.

## Tokens

One row per part, state and property. DetailHeader has no interactive state of its own, so every row is rest; the controls in `action` keep their own states, and the marks their own tokens through their props.

| Part        | State                | Property             | Token                                                                                |
| ----------- | -------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `root`      | rest                 | `column-gap`         | `space.300`, the 12 px between parts of a detail panel                               |
| `mark`      | rest, `variant` line | `height`             | `size.badge-lg`, through LineBadge's `size='large'`, "the badge in a panel's header" |
| `mark`      | rest, `variant` stop | `--perron-icon-size` | `icon.size.450`, through StationIcon's `size='large'`, "beside a panel title"        |
| `title`     | rest                 | `font`               | `typography.heading-md`, the role for panel titles: a stop or a destination          |
| `title`     | rest                 | `letter-spacing`     | `typography.heading-md-tracking`, the role's twin                                    |
| `title`     | rest                 | `color`              | `color.text.primary`                                                                 |
| `subheader` | rest                 | `font`               | `typography.body-sm`, the role for the line under a title                            |
| `subheader` | rest                 | `letter-spacing`     | `typography.body-sm-tracking`, the role's twin                                       |
| `subheader` | rest                 | `color`              | `color.text.secondary`                                                               |
| `subheader` | rest                 | `margin-block-start` | `space.100`                                                                          |
| `action`    | rest                 | `column-gap`         | `space.200`, between two controls                                                    |

The root is a grid of three columns, `auto`, `minmax(0, 1fr)` and `auto`: the mark in the first and the action in the last, each spanning the title's and the subheader's rows and centred in them, and the title over the subheader in the middle. With no mark or no action, the middle column takes their room. Every part resets the margins an `h2` brings, but for the subheader's own.

- DetailHeader draws no fill, border, padding or shadow of its own, taking the detail panel's surface and padding from DetailPanel: it is the top of a panel, not a card. `space.300` between mark, text and action is what Semantic spacing gives between parts of a detail panel, `space.100` from title to subheader matches EmptyState's title-to-sentence gap, and `space.200` sits between controls in the action.
- In the `stop` variant the marker is StationIcon's `outlined` variant, since the header names one stop and has no list to single it out from; `filled` is kept for the one stop that matters most in a list.

## Keyboard and ARIA

DetailHeader has no keys of its own and is never focusable. The controls in `action` follow the title in the DOM and on screen, so Tab reaches them in reading order.

| Key         | Does                                                              | From        |
| ----------- | ----------------------------------------------------------------- | ----------- |
| `Tab`       | Moves to the first focusable element in `action`, after the title | The browser |
| `Shift+Tab` | Moves back out of `action`, to whatever came before the header    | The browser |

| Element     | Role                                                              | Accessible name from                                                                            | States announced |
| ----------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `root`      | None (generic `div`)                                              | None                                                                                            | None             |
| `mark`      | Hidden: `aria-hidden="true"`                                      | None: the title says the line in words                                                          | None             |
| `title`     | Heading, level 2                                                  | Its text: in `line`, the hidden `lineName` then `title`, as "5C Husum Torv"; in `stop`, `title` | None             |
| `subheader` | None (generic `div`)                                              | None                                                                                            | None             |
| `action`    | None (generic `div`); the caller's controls carry their own roles | The caller's controls' own names                                                                | Theirs           |

- The title is always an `h2`, with an `id` the caller can set through `slotProps.title` (React's `useId` otherwise), so DetailPanel can name its Sheet with `aria-labelledby` pointing at it: the header heads one panel over a page whose own heading is the `h1`, and with no `render` a pattern can't swap the level.
- In the `line` variant the mark is `aria-hidden` and the title starts with `lineName` in a `VisuallyHidden` span and a space, so the heading, and the panel name taken from it, reads "5C Husum Torv" rather than "Husum Torv" with the badge read apart before it: a screen reader moving by headings, and the panel's name, then carry the line, and the badge is read once.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the badge's line name is read in the title (CR-4), and the StationIcon is decorative beside the stop's name, which the title says; the line's colour is never the only sign of the line.
- [ ] Every landmark and named region has an accessible name: none here, the root is not a landmark; the title's `id` lets DetailPanel name its panel from the heading (CR-5).
- [ ] Every default label can be overridden: none here; DetailHeader owns no string.
- [ ] Every shape the type accepts renders, in every variant: `title`, `lineName`, `subheader` and `action` each render a string, an element and a list alike; `subheader` and `action` are `div`s, so block content is valid there, and the title takes phrasing content as an `h2` does.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses. The `mark` is `aria-hidden` because the title repeats it, not for animation.
- [ ] Native semantics first: an `h2` for the title, plain `div`s for the rest, and the caller's own `button` or `a href` in the action; no ARIA but `aria-hidden` on the mark.
- [ ] Focus moves in reading order and returns on close: the action follows the title and subheader in the DOM and on screen; DetailHeader never moves focus, and the Sheet around it returns focus on close.
- [ ] Every target is at least `size.target-min` square: DetailHeader has no target of its own; the action's controls keep their own sizes, `size.control` for an icon button.
- [ ] Loops stop when the system asks for less motion: none here; nothing moves.

## Owned strings

No owned strings: every word DetailHeader shows or announces comes from the caller, through `lineName`, `title`, `subheader` and `action`, and the panel's close label belongs to the Sheet's close button that DetailPanel puts in `action`.

## Component rules

Rules for this pattern alone, numbered so the build and the review can cite them.

- **CR-1.** The pattern imports only `LineBadge`, `StationIcon`, the `VisuallyHidden` part, `PerronProvider` if it needs it, and React, as the contract's Patterns section says; never `@base-ui/react`. A type-only import is fine.
- **CR-2.** The root always carries `data-variant`, the default `line` included, and the CSS selects on it: `.pn-DetailHeader[data-variant='stop']`.
- **CR-3.** The `mark` part renders only when it has a mark to hold: in `line`, when both `line` and `lineName` are given, holding `<LineBadge line={line} size="large">{lineName}</LineBadge>`; in `stop`, always, holding `<StationIcon variant="outlined" size="large" line={line} />`, neutral when `line` is left out. `subheader` renders only when `subheader` is given and `action` only when `action` is; a value that renders nothing (`null`, `undefined`, a boolean, `''`, or an array of only such values) counts as not given, so no empty cell takes up a gap.
- **CR-4.** In `line`, when the mark renders, the title starts with `lineName` and a space inside a `VisuallyHidden` span, and the mark carries `aria-hidden="true"` after the caller's `slotProps.mark` props, so the line is read once, in the heading. In `stop`, the mark is `aria-hidden` too, and StationIcon hides itself as well.
- **CR-5.** The title is always an `h2`. Its `id` is `slotProps.title.id` when given, else one from React's `useId`, so DetailPanel can point its Sheet's `aria-labelledby` at it.
- **CR-6.** Each inner part's props are its `slotProps` value with the pattern's own laid over it: the class joins the part's own, such as `pn-DetailHeader-mark`, first, then the caller's, and `aria-hidden` on the mark and the children of every part are the pattern's.
- **CR-7.** DetailHeader sizes to its container, with no width of its own; the middle column is `minmax(0, 1fr)`, and the title and subheader wrap long words (`overflow-wrap: anywhere`), so a long Danish name fits the panel at 320 px with the action beside it. The mark and the action never shrink.
- **CR-8.** No fill, border, radius, padding or shadow on any part: the header takes the detail panel's surface and padding. Colour sits on the title and subheader only.

## Stories

Stories are titled `Patterns/DetailHeader`. No Penpot design yet, so the variant stories are named by the variant names the design will have, the `variant` values in PascalCase (the Conventions of `penpot/README.md`). `Line` comes first and gives the contract story its args: every word in them is a string arg, and bus 5C is a line pair that meets 4.5:1, so axe's `color-contrast` rule stays on. Two more stories prove the action and the wrapping.

| Story        | Shows                                                                                                                                                       | `play` test                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Line`       | `variant` line, `line` bus, `lineName` "5C", `title` "Husum Torv", `subheader` "Next stop: Nørreport St.", no action                                        | The heading level 2 is named "5C Husum Torv"; the mark is `aria-hidden`; nothing in the header takes focus   |
| `Stop`       | `variant` stop, no `line`, `title` "Nørreport St.", `subheader` "Metro, S-tog and buses", no action                                                         | The heading level 2 is named "Nørreport St."; the marker is neutral, with no `data-line`                     |
| `WithAction` | `Line`'s args, with an outlined neutral Button "Show on map" in `action`                                                                                    | Tab reaches the button after the title, and Shift+Tab leaves it, so focus ends where it started              |
| `LongTitle`  | `variant` stop, `line` m3, `title` "Københavns Hovedbanegård (Tietgensgade)", a two-line `subheader`, and `WithAction`'s button, in a 320 px wide container | The title wraps inside the middle column and the button stays whole: the root is no wider than its container |

## Do and don't

For a caller using the pattern, with the reason.

| Do                                                                                                   | Don't                                                                                                                       |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Give the destination as `title` and the line's short name as `lineName`: "Husum Torv" with "5C"      | Put the line in the title as well, "5C Husum Torv": the header already reads the line first, so it would be said twice      |
| Leave `line` off in `stop` for a station several lines serve, and name its lines in `subheader`      | Pick one line's colour for a shared station, which tells the eye only one line stops there                                  |
| Keep `subheader` to one plain line that says no more than the data knows: "Next stop: Nørreport St." | Put a list of departures or delays in `subheader`; they belong in the panel's body                                          |
| Put the panel's close button, from the Sheet, in `action`, with at most one other control            | Add a `brand` action there when the panel already has its main action, or more controls than the row has room for at 320 px |
| Use one DetailHeader at the top of a detail panel, and name the panel from its title's `id`          | Use it to head a section inside a panel: its title is always an `h2`                                                        |
| Let the panel set the surface and padding around it                                                  | Give it a fill or a border with `className`; it would draw a card inside the panel                                          |
