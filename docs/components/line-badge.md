# LineBadge

A small filled label that names one Copenhagen line, a metro, S-tog, bus or regional train, in the operator's own line colour.

## Anatomy

Penpot page `Components/LineBadge`. Family: none. Shared parts: none.

The design is deferred ([ADR 0010](../adr/0010-unattended-runs-with-design-deferred.md)), so this spec sets the layers the drawing will have: a `root` board holding one text layer, `label`.

| Part (Penpot layer) | What it is                                                                                                                                                                                                                                   | Base UI part                                  | Class          | `slotProps` key |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------- | --------------- |
| `root`              | The badge: a fixed-height box in the line's colour, with the label centred in it                                                                                                                                                             | none: a `<span>` rendered through `useRender` | `pn-LineBadge` | none            |
| `label`             | The line's short name, such as "M1", "A" or "5C", from the caller's `children`. The `label` layer is the root's own text, with no element, class or `slotProps` key of its own: the root holds the text directly, so there is no inner part. | none: the root's text                         | none           | none            |

## Base UI parts

No Base UI component: `baseUiParts` is empty in `packages/perron/components.json`, and a badge has no behaviour to borrow. The root renders through Base UI's `useRender` hook, from `@base-ui/react/use-render` at the version pinned in `packages/perron/package.json`, so the contract's `render` prop works, and the component's props are merged with `mergeProps` from `@base-ui/react/merge-props`.

| Base UI part | Renders  | Perron sets                                                                                                              | Passed through                                                                       |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `useRender`  | `<span>` | `defaultTagName: 'span'`; `className` `pn-LineBadge` then the caller's; `data-line` from `line`; `data-size` from `size` | `render`, `ref`, `children`, `className`, `style` and every other `<span>` attribute |

Base UI already does: swapping the root element for the `render` prop, merging the caller's `ref` with the element's under React 19, and merging `className`, `style` and event handlers in `mergeProps`.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. No slots: the badge has no inner part.

| Name       | Type                                                                                            | Default    | Base UI prop | Description                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `line`     | `'m1' \| 'm2' \| 'm3' \| 'm4' \| 'a' \| 'b' \| 'c' \| 'e' \| 'f' \| 'h' \| 'bus' \| 'regional'` | none       | none         | The line whose colours the badge takes: a metro line (`m1` to `m4`), an S-tog line (`a` to `h`), any bus (`bus`), or any regional or Øresund train (`regional`). Required, with these twelve values, one per `color.transit.line.*` and `color.transit.mode.*` fill, and no default; set on the root as `data-line`. A default would paint a colour the caller's data never gave, and `color` stays for intents. |
| `size`     | `'medium' \| 'large'`                                                                           | `'medium'` | none         | `medium` is the badge in rows and lists, `size.badge` tall; `large` is the badge in a panel's header, `size.badge-lg` tall. Both sizes set the label in `typography.badge`, since `docs/renames.md` merged `badge-lg` into `badge` and a component sets text only with a role.                                                                                                                                   |
| `children` | `ReactNode`                                                                                     | none       | none         | The line's short name as riders know it: "M1", "A", "5C", "RE". Required, and always the caller's, never derived from `line`: the caller's data holds the name (a bus's number can't be derived), and a badge without a name is colour alone.                                                                                                                                                                    |
| `render`   | Base UI's `render`                                                                              | none       | `render`     | Swaps the root `<span>` for another element, keeping the class and data attributes.                                                                                                                                                                                                                                                                                                                              |

`className`, `style` and `ref` reach the root, as the contract's [Root](README.md#root) says.

## Tokens

One row per part, state and property. The badge has one design state, rest: it is never interactive (CR-2). Each `line` value sets the fill and its partner label colour, as [Semantic colours](../foundations/semantic-colours.md#line-colours) pairs them.

| Part   | State                 | Property         | Token                                                                                                                                                |
| ------ | --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root` | rest, `line` m1       | `background`     | `color.transit.line.m1`                                                                                                                              |
| `root` | rest, `line` m1       | `color`          | `color.transit.line-on.m1`                                                                                                                           |
| `root` | rest, `line` m2       | `background`     | `color.transit.line.m2`                                                                                                                              |
| `root` | rest, `line` m2       | `color`          | `color.transit.line-on.m2`                                                                                                                           |
| `root` | rest, `line` m3       | `background`     | `color.transit.line.m3`                                                                                                                              |
| `root` | rest, `line` m3       | `color`          | `color.transit.line-on.m3`                                                                                                                           |
| `root` | rest, `line` m4       | `background`     | `color.transit.line.m4`                                                                                                                              |
| `root` | rest, `line` m4       | `color`          | `color.transit.line-on.m4`                                                                                                                           |
| `root` | rest, `line` a        | `background`     | `color.transit.line.a`                                                                                                                               |
| `root` | rest, `line` a        | `color`          | `color.transit.line-on.a`                                                                                                                            |
| `root` | rest, `line` b        | `background`     | `color.transit.line.b`                                                                                                                               |
| `root` | rest, `line` b        | `color`          | `color.transit.line-on.b`                                                                                                                            |
| `root` | rest, `line` c        | `background`     | `color.transit.line.c`                                                                                                                               |
| `root` | rest, `line` c        | `color`          | `color.transit.line-on.c`                                                                                                                            |
| `root` | rest, `line` e        | `background`     | `color.transit.line.e`                                                                                                                               |
| `root` | rest, `line` e        | `color`          | `color.transit.line-on.e`                                                                                                                            |
| `root` | rest, `line` f        | `background`     | `color.transit.line.f`                                                                                                                               |
| `root` | rest, `line` f        | `color`          | `color.transit.line-on.f`                                                                                                                            |
| `root` | rest, `line` h        | `background`     | `color.transit.line.h`                                                                                                                               |
| `root` | rest, `line` h        | `color`          | `color.transit.line-on.h`                                                                                                                            |
| `root` | rest, `line` bus      | `background`     | `color.transit.mode.bus`                                                                                                                             |
| `root` | rest, `line` bus      | `color`          | `color.transit.mode.on-bus`                                                                                                                          |
| `root` | rest, `line` regional | `background`     | `color.transit.mode.regional`                                                                                                                        |
| `root` | rest, `line` regional | `color`          | `color.transit.mode.on-regional`                                                                                                                     |
| `root` | rest                  | `font`           | `typography.badge`                                                                                                                                   |
| `root` | rest                  | `letter-spacing` | `typography.badge-tracking`, the role's twin                                                                                                         |
| `root` | rest                  | `border-radius`  | `radius.sm`                                                                                                                                          |
| `root` | rest, `size` medium   | `height`         | `size.badge`                                                                                                                                         |
| `root` | rest, `size` large    | `height`         | `size.badge-lg`                                                                                                                                      |
| `root` | rest, `size` medium   | `min-width`      | `size.badge`, so a one-letter line is square. The badge is at least as wide as it is tall, `size.badge` or `size.badge-lg`.                          |
| `root` | rest, `size` large    | `min-width`      | `size.badge-lg`                                                                                                                                      |
| `root` | rest, `size` medium   | `padding-inline` | `space.150`, 6 px either side of a longer label such as "5C" in a 22 px badge.                                                                       |
| `root` | rest, `size` large    | `padding-inline` | `space.200`, 8 px in a 34 px badge, the same proportion as medium.                                                                                   |
| `root` | rest, forced colours  | `border`         | `border.width.025` in `transparent`, which Windows' contrast themes paint in the text colour, so the badge keeps its shape when the fill is dropped. |

## Keyboard and ARIA

No keys: the badge is not focusable and does nothing when pressed (CR-2).

| Element | Role                               | Accessible name from              | States announced |
| ------- | ---------------------------------- | --------------------------------- | ---------------- |
| `root`  | none: a `<span>`, read as its text | Its text, the caller's `children` | none             |

The label alone is what a screen reader hears, with no owned word for the mode ("Bus", "Metro") and no `aria-label`: the label is the line's name as riders say it, the colour only repeats it, and the row the badge sits in names the rest. A `<span>` without a role can't carry `aria-label` reliably either.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the colour names the line, and the label, which a screen reader reads, names it too, for every `line` value; `children` is required.
- [ ] Every landmark and named region has an accessible name: none here; the badge is inline text.
- [ ] Every default label can be overridden: no owned strings, so no `*Label` props.
- [ ] Every shape the type accepts renders, in every variant: `children` renders as a string, an element and a list alike, inside the fixed-height box, on one line.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; the badge has no motion.
- [ ] Native semantics first: a plain `<span>`, no ARIA.
- [ ] Focus moves in reading order and returns on close: never focused; it has no tab stop.
- [ ] Every target is at least `size.target-min` square: no target; a pressable line is the caller's button or link around the badge, which meets the minimum itself.
- [ ] Loops stop when the system asks for less motion: none here; the badge has no motion.

## Owned strings

No owned strings: the label is the caller's `children`, and the badge announces nothing else.

## Component rules

- **CR-1.** The root sets `data-line` and `data-size` with the props' values, the default size included, and the CSS selects on them: `.pn-LineBadge[data-line='m1']`, `.pn-LineBadge[data-size='large']`.
- **CR-2.** The badge is never interactive: no hover, focus, pressed or selected look, no tab stop, no role. A line the rider can press is a Perron button or link with the badge inside it.
- **CR-3.** The label sits on one line, centred both ways (`display: inline-flex`, `white-space: nowrap`), and the badge grows wider for a longer label; it never wraps or truncates.
- **CR-4.** The fill and the label colour are always the pair the line's tokens give, in both themes, never adjusted: `color.transit.line.<id>` with `color.transit.line-on.<id>`, `color.transit.mode.bus` with `color.transit.mode.on-bus`, `color.transit.mode.regional` with `color.transit.mode.on-regional`.
- **CR-5.** The CSS reads only the component layer's [token families](README.md#token-families), `color.transit.*` among them, and no `opacity`.
- **CR-6.** The stories of the five lines whose official pairs miss 4.5:1 (M1, M4, A, B and C, listed on [Semantic colours](../foundations/semantic-colours.md#line-colours)) turn off axe's `color-contrast` rule in their own `parameters.a11y`, with a comment citing that list, while every other story keeps it: the pairs stay exact by rule, so axe would fail them on every run.

## Stories

One per variant the deferred design will show: the Penpot properties `line` and `size`, in that order, with no `State` property, since the badge has one state. The design has these 24 variants, every `line` at both sizes, each story named `<Line><Size>` and showing that line's short name as `children`; the first, `M1Medium`, gives the contract story its args.

| Story            | Shows                                | `play` test |
| ---------------- | ------------------------------------ | ----------- |
| `M1Medium`       | `line` m1, `size` medium, "M1"       | none        |
| `M2Medium`       | `line` m2, `size` medium, "M2"       | none        |
| `M3Medium`       | `line` m3, `size` medium, "M3"       | none        |
| `M4Medium`       | `line` m4, `size` medium, "M4"       | none        |
| `AMedium`        | `line` a, `size` medium, "A"         | none        |
| `BMedium`        | `line` b, `size` medium, "B"         | none        |
| `CMedium`        | `line` c, `size` medium, "C"         | none        |
| `EMedium`        | `line` e, `size` medium, "E"         | none        |
| `FMedium`        | `line` f, `size` medium, "F"         | none        |
| `HMedium`        | `line` h, `size` medium, "H"         | none        |
| `BusMedium`      | `line` bus, `size` medium, "5C"      | none        |
| `RegionalMedium` | `line` regional, `size` medium, "RE" | none        |
| `M1Large`        | `line` m1, `size` large, "M1"        | none        |
| `M2Large`        | `line` m2, `size` large, "M2"        | none        |
| `M3Large`        | `line` m3, `size` large, "M3"        | none        |
| `M4Large`        | `line` m4, `size` large, "M4"        | none        |
| `ALarge`         | `line` a, `size` large, "A"          | none        |
| `BLarge`         | `line` b, `size` large, "B"          | none        |
| `CLarge`         | `line` c, `size` large, "C"          | none        |
| `ELarge`         | `line` e, `size` large, "E"          | none        |
| `FLarge`         | `line` f, `size` large, "F"          | none        |
| `HLarge`         | `line` h, `size` large, "H"          | none        |
| `BusLarge`       | `line` bus, `size` large, "5C"       | none        |
| `RegionalLarge`  | `line` regional, `size` large, "RE"  | none        |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                                        | Don't                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Name the line in words near the badge, such as "M1 towards Vanløse", because five official pairs (M1, M4, A, B, C) miss 4.5:1 and stay so | Rely on the badge's label alone where the line matters, such as the only mention of a line in a disruption           |
| Pass the name riders know as `children`: "5C", "A", "RE"                                                                                  | Pass a sentence or a mode word ("Bus 5C"); the colour already says the mode, and the badge is sized for a short name |
| Use a line colour as a fill only in a LineBadge, and as a dot, ring, rail or swatch elsewhere, as Semantic colours says                   | Fill another shape, such as a chip or a panel header, with a line colour                                             |
| Wrap the badge in a Perron button or link when the rider can open the line                                                                | Add `onClick` or `tabIndex` to the badge; it has no focus ring, role or target size                                  |
| Keep brand buttons out of rows of line badges                                                                                             | Put a brand button beside bus badges, where its yellow fill and ink label read as one more bus                       |
| Choose `large` only for the one badge that heads a panel                                                                                  | Mix sizes in one row or list                                                                                         |
