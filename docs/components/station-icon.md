# StationIcon

A small round marker that stands for a stop or station beside its name, in the colour of the line that serves it, as in a detail panel's header and on each stop of a stop timeline.

## Anatomy

Penpot page `Components/StationIcon`, not drawn yet: the design is deferred, so this spec decides the drawing. Family: none. Shared parts: none.

StationIcon is one round marker for every mode, a ring of `border.width.050` drawn in the line's colour (or `color.text.primary` with no line), not a glyph per mode or a lettered sign: outside a line badge the line colour is "a dot, a ring, a rail or a swatch" ([Semantic colours](../foundations/semantic-colours.md#line-colours)), it echoes how the map draws a station, it sits on a stop timeline's rail, and a lettered sign would read as a `LineBadge`.

| Part (Penpot layer) | What it is                                                                                      | Base UI part                                           | Class            | `slotProps` key |
| ------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------- | --------------- |
| `root`              | The marker itself: a circle with a ring in the line's colour, hollow or filled, holding no text | None: Base UI has no such part; `useRender` renders it | `pn-StationIcon` | none            |

## Base UI parts

No Base UI component: the registry gives StationIcon no `baseUiParts`, and Base UI has nothing that draws a marker. The root renders through Base UI's `useRender` hook, from `@base-ui/react/use-render`, so the contract's `render` prop works as on every other component, and its props are merged with `mergeProps` from `@base-ui/react/merge-props`.

| Base UI part | Renders  | Perron sets                                                                                                                              | Passed through                                                            |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `useRender`  | `<span>` | `defaultTagName: 'span'`; `className` `pn-StationIcon`; `aria-hidden="true"`; `data-variant`, `data-size` and `data-line` from the props | `render`, `className`, `style`, `ref` and the `<span>`'s other attributes |

The root renders a `<span>` drawn in CSS with a border and `radius.full`, not an inline `<svg>`: it is inline beside the name it marks, takes `render` through `useRender`, and its ring, fill and size are all tokens in CSS, with no SVG file to add to `packages/perron/icons/`.

Base UI already does: swapping the root element for the caller's `render` element and merging the caller's props, `className` and `ref` onto it.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name        | Type                                                                                            | Default      | Base UI prop | Description                                                                                                                                                                                                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------- | ------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`   | `'outlined' \| 'filled'`                                                                        | `'outlined'` | none         | `outlined` is a ring around the surface colour, for any stop; `filled` is a solid dot in the line's colour, for the one stop that matters most, such as the vehicle's next stop.                                                                                                                                                 |
| `line`      | `'m1' \| 'm2' \| 'm3' \| 'm4' \| 'a' \| 'b' \| 'c' \| 'e' \| 'f' \| 'h' \| 'bus' \| 'regional'` |              | none         | The line or mode whose colour the marker takes: a metro or S-tog line by its id, or `bus` or `regional` for every line of that mode. Left out, the marker is neutral, for a station several lines serve. Named and typed exactly as LineBadge's line prop: whichever of the two is built second takes the other's name and type. |
| `size`      | `'small' \| 'medium' \| 'large'`                                                                | `'medium'`   | none         | The marker's diameter: `small` beside caption and label text, as on a stop timeline; `medium` inside controls and rows; `large` beside a panel title. The three sizes are the three icon sizes, so the marker matches an icon beside the same text.                                                                              |
| `render`    | Base UI's `render`                                                                              |              | `render`     | Swaps the root `<span>` for another element, keeping its class, data attributes and `aria-hidden`                                                                                                                                                                                                                                |
| `className` | `string`                                                                                        |              | none         | Merged after `pn-StationIcon` on the root                                                                                                                                                                                                                                                                                        |
| `style`     | `CSSProperties`                                                                                 |              | none         | Reaches the root                                                                                                                                                                                                                                                                                                                 |
| `ref`       | `Ref<HTMLSpanElement>`                                                                          |              | none         | Reaches the root                                                                                                                                                                                                                                                                                                                 |

No `slotProps`: the root is the only part. No label props: the component owns no strings (see [Owned strings](#owned-strings)). No `children`: the marker holds nothing, so the props type leaves `children` out.

## Tokens

One row per part, variant, line and property. StationIcon is not interactive, so its only design state is rest. The CSS sets `color` to the line's token and draws the ring, and the `filled` dot, in `currentColor`.

| Part                         | State | Property                    | Token                                                                                                           |
| ---------------------------- | ----- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `root`, `size='small'`       | rest  | `--perron-icon-size`        | `icon.size.325`                                                                                                 |
| `root`, `size='medium'`      | rest  | `--perron-icon-size`        | `icon.size.400`                                                                                                 |
| `root`, `size='large'`       | rest  | `--perron-icon-size`        | `icon.size.450`                                                                                                 |
| `root`                       | rest  | `inline-size`, `block-size` | `--perron-icon-size`, the size's `icon.size.*`                                                                  |
| `root`                       | rest  | `border-width`              | `border.width.050`                                                                                              |
| `root`                       | rest  | `border-radius`             | `radius.full`                                                                                                   |
| `root`                       | rest  | `border-color`              | `currentColor`, the line's colour below                                                                         |
| `root`, `variant='outlined'` | rest  | `background`                | `color.surface.raised`, so it hides a stop timeline's rail running behind it, as the map fills a station's ring |
| `root`, `variant='filled'`   | rest  | `background`                | `currentColor`, the line's colour below                                                                         |
| `root`, no `line`            | rest  | `color`                     | `color.text.primary`                                                                                            |
| `root`, `line='m1'`          | rest  | `color`                     | `color.transit.line.m1`                                                                                         |
| `root`, `line='m2'`          | rest  | `color`                     | `color.transit.line.m2`                                                                                         |
| `root`, `line='m3'`          | rest  | `color`                     | `color.transit.line.m3`                                                                                         |
| `root`, `line='m4'`          | rest  | `color`                     | `color.transit.line.m4`                                                                                         |
| `root`, `line='a'`           | rest  | `color`                     | `color.transit.line.a`                                                                                          |
| `root`, `line='b'`           | rest  | `color`                     | `color.transit.line.b`                                                                                          |
| `root`, `line='c'`           | rest  | `color`                     | `color.transit.line.c`                                                                                          |
| `root`, `line='e'`           | rest  | `color`                     | `color.transit.line.e`                                                                                          |
| `root`, `line='f'`           | rest  | `color`                     | `color.transit.line.f`                                                                                          |
| `root`, `line='h'`           | rest  | `color`                     | `color.transit.line.h`                                                                                          |
| `root`, `line='bus'`         | rest  | `color`                     | `color.transit.mode.bus`                                                                                        |
| `root`, `line='regional'`    | rest  | `color`                     | `color.transit.mode.regional`                                                                                   |

The light line colours, F (`#F5C200`), M2 (`#F0B400`) and bus (`#D99A00`), fall short of 3:1 on the light surfaces, and no token outlines them outside the map (`color.data-state.outline` is "Map only"). The marker keeps the exact line colour with no outline, as line badges keep their official pairs: it is decorative, the line and the stop are always named in words beside it, so 1.4.1 and 1.4.11 hold through the text.

## Keyboard and ARIA

No Base UI part, so nothing from Base UI here: the marker is decorative, never focusable, and hidden from assistive technology.

| Key  | Does                                                    | From   |
| ---- | ------------------------------------------------------- | ------ |
| None | The marker takes no focus and no keys; Tab passes it by | Perron |

| Element | Role                               | Accessible name from                                                   | States announced |
| ------- | ---------------------------------- | ---------------------------------------------------------------------- | ---------------- |
| `root`  | None: `aria-hidden="true"`, hidden | None: the stop's name, and the line's, are the caller's text beside it | None             |

StationIcon is always decorative: Perron sets `aria-hidden="true"` after the caller's props so it wins, with no accessible name and no label prop, as an icon next to text is ([Icons](../foundations/icons.md#style)). It always sits beside the stop's name, and the line is named in words nearby, so it adds nothing for the ear.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the marker tells the eye the line's colour and, filled, which stop matters; the caller's text beside it names the stop and the line, and a filled stop's meaning (such as "Next stop"), as [Do and don't](#do-and-dont) says
- [ ] Every landmark and named region has an accessible name: none here, the marker is not a region
- [ ] Every default label can be overridden: none here, the marker owns no label
- [ ] Every shape the type accepts renders, in every variant: every `line` value, and none, in both variants and all three sizes, shown by the `Lines` story and the six variant stories
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here, nothing animates or collapses
- [ ] Native semantics first: a plain `<span>` with `aria-hidden="true"`, no role
- [ ] Focus moves in reading order and returns on close: the marker is never focused, so focus passes it in reading order
- [ ] Every target is at least `size.target-min` square: none here, the marker is not a target; a caller that makes a stop pressable makes its whole row the target
- [ ] Loops stop when the system asks for less motion: none here, nothing moves

## Owned strings

No owned strings: the marker shows and announces no words, and the stop's and line's names come from the caller beside it.

## Component rules

- **CR-1.** The root renders through `useRender` with `defaultTagName: 'span'`, so `render`, `className`, `style` and `ref` behave as the contract's [Root](README.md#root) and [Customising](README.md#customising) say, with no Base UI component underneath.
- **CR-2.** The root always carries `data-variant` and `data-size`, defaults included, and `data-line` with the `line` value when one is given; with no `line`, `data-line` is absent and the neutral colour applies. CSS selects on these: `.pn-StationIcon[data-line='m1']`.
- **CR-3.** `aria-hidden="true"` is set after the rest props, so a caller cannot unhide the marker; it never takes `tabIndex`, a role or an accessible name.
- **CR-4.** The marker's diameter is `--perron-icon-size`, which the root sets from `size` to its `icon.size.*` token, and the ring is `border.width.050` at every size, so it reads as the same mark beside caption, label and title text.
- **CR-5.** The ring and the filled dot are both drawn in `currentColor`, and the root sets `color` to the line's token, so one rule per line colours both variants.
- **CR-6.** Line colours stay exact: the marker never adjusts, tints or outlines them, as [Semantic colours](../foundations/semantic-colours.md#line-colours) says.
- **CR-7.** In `(forced-colors: active)`, the ring is `CanvasText` and the filled dot's background is `CanvasText`, so filled and outlined stay apart when the system replaces colours ([Accessibility](../foundations/accessibility.md#what-a-person-checks), "Forced colors").
- **CR-8.** The marker does not shrink in a flex row (`flex: none`), as an icon doesn't, so a long stop name wraps rather than squeezing it.

## Stories

No Penpot design yet, so the stories are named by the variant names the design will have: `variant`, then `size`, each in PascalCase ([Penpot conventions](../../penpot/README.md#conventions)). `line` is a colour, not a Penpot variant property, and the `Lines` story shows every value.

| Story            | Shows                                                                                                 | `play` test                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `OutlinedSmall`  | `variant='outlined'`, `size='small'`, no line, beside a caption-sized stop name                       | none                                                                                               |
| `OutlinedMedium` | `variant='outlined'`, `size='medium'`, no line, beside a label-sized stop name                        | The root is `aria-hidden`, has no role or name, and Tab passes it by to the next focusable element |
| `OutlinedLarge`  | `variant='outlined'`, `size='large'`, no line, beside a panel-title stop name                         | none                                                                                               |
| `FilledSmall`    | `variant='filled'`, `size='small'`, no line                                                           | none                                                                                               |
| `FilledMedium`   | `variant='filled'`, `size='medium'`, no line                                                          | none                                                                                               |
| `FilledLarge`    | `variant='filled'`, `size='large'`, no line                                                           | none                                                                                               |
| `Lines`          | Every `line` value, and none, in both variants at `size='medium'`, each with the line named beside it | Each marker carries its `data-line`, and none without a `line`                                     |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                           | Don't                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Put the marker beside the stop's name, with the line named in words nearby, because the marker is hidden from screen readers | Use it alone, or as the only sign of which line serves a stop: colour is never alone ([Accessibility](../foundations/accessibility.md#rules)) |
| Leave `line` out for a station several lines serve, so the marker is neutral                                                 | Pick one of several lines' colours for a shared station, which tells the eye only one line stops there                                        |
| Use `filled` for the one stop that matters most in a list, such as the next stop, and say why in words beside it             | Fill several stops in one list, or use `filled` to mean a state the words don't say                                                           |
| Use a `LineBadge` to name a line                                                                                             | Use a StationIcon as a line's badge or swatch in a row of badges, where it reads as a stop                                                    |
| Pick the `size` that matches the text beside it: `small` for captions, `medium` for labels, `large` for panel titles         | Resize it with `className` or a raw width, which breaks the ring's weight against its icon-sized neighbours                                   |
| Make the whole row pressable when a stop opens something, at least `size.target-min` tall                                    | Make the marker itself a button or link: it is too small a target and has no name                                                             |
