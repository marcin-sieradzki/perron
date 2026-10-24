# Prik

A Prik is one vehicle drawn as a dot in its line colour, its shape saying how fresh the vehicle's data is: one of the five data states on [Data states](../foundations/data-states.md), for lists, rows and legends outside the map canvas.

The design is deferred ([ADR 0010](../adr/0010-unattended-runs-with-design-deferred.md)): this spec decides the variants, parts and tokens a drawing would have, from the contract, [Data states](../foundations/data-states.md), [Semantic colours](../foundations/semantic-colours.md#line-colours), [Icons](../foundations/icons.md#sizes) and the tokens.

## Anatomy

Penpot page `Components/Prik`. Family: none, a glyph sized like an icon. Shared parts: none; Prik names its state itself (see CR-6).

| Part (Penpot layer) | What it is                                                                                            | Base UI part | Class         | `slotProps` key                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------- | ------------ | ------------- | ---------------------------------------------------------------------- |
| `root`              | The glyph box: an `<svg>`, `--perron-icon-size` square, coloured by the line, named by the data state | none         | `pn-Prik`     | none                                                                   |
| `dot`               | The `<circle>` inside the box, drawn in the shape of the data state                                   | none         | `pn-Prik-dot` | none: the contract keys `slotProps` by Base UI part, and Prik has none |

Answered: yes, as recommended (unattended run, to confirm). The question was: Is the root an `<svg role="img">` holding the one `<circle>`, with `ref` on the `<svg>`, the rest props typed as the `<svg>`'s, and no `children`? Recommended: yes; a span around an svg adds an element and nothing else, and a glyph has no content for `children` to give.

## Base UI parts

No Base UI part: Prik is a static glyph with no behaviour, and its entry in `packages/perron/components.json` lists none in `baseUiParts`. It takes no `render` prop, since there is no Base UI root to swap and nothing else a dot could render as.

Base UI already does: nothing here; Perron draws and names the dot itself.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. No slots (see Anatomy).

| Name                 | Type                                                                                            | Default      | Base UI prop | Description                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------------ | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `state`              | `'live' \| 'ageing' \| 'estimated' \| 'timetable-only' \| 'no-signal'`                          | `'live'`     | none         | How fresh the vehicle's data is: a solid dot, a fainter dot, a ring, a dashed ring or a grey dot                      |
| `line`               | `'m1' \| 'm2' \| 'm3' \| 'm4' \| 'a' \| 'b' \| 'c' \| 'e' \| 'f' \| 'h' \| 'bus' \| 'regional'` |              | none         | The vehicle's line, which gives the dot its colour: a metro or S-tog line, or every bus or every regional train       |
| `size`               | `'small' \| 'medium' \| 'large'`                                                                | `'medium'`   | none         | The glyph box: `icon.size.325` beside caption text, `icon.size.400` beside label text, `icon.size.450` in larger rows |
| `liveLabel`          | `string`                                                                                        | The locale's | none         | Overrides "Live"                                                                                                      |
| `ageingLabel`        | `string`                                                                                        | The locale's | none         | Overrides "Ageing"                                                                                                    |
| `estimatedLabel`     | `string`                                                                                        | The locale's | none         | Overrides "Estimated"                                                                                                 |
| `timetableOnlyLabel` | `string`                                                                                        | The locale's | none         | Overrides "Timetable only"                                                                                            |
| `noSignalLabel`      | `string`                                                                                        | The locale's | none         | Overrides "No signal"                                                                                                 |

[PENDING] The earlier answer named the data state `state`, but the contract's "Names from other libraries" table lists `state`, and the `props` gate (`scripts/checks/props.ts`) fails any props type that declares it, so the build could not pass `npm run check` without an allowance. Is the data state the contract's `variant` instead, with the same five values in kebab-case (`'live' | 'ageing' | 'estimated' | 'timetable-only' | 'no-signal'`), default `'live'`, the first, and the root's `data-variant` attribute, so the `state` row above, CR-7's `data-state` and the Penpot variant property all become `variant`? Recommended: yes; it keeps every contract rule with no `perron-allow` exception, the Penpot variant property `variant` can't be mistaken for the interaction property `State`, and the story names (`Live`, `Ageing`, …) stay the same.

Answered: yes, as recommended (unattended run, to confirm). The question was: Is the line colour the required prop `line`, taking the ids of the `color.transit.line.*` tokens plus `'bus'` and `'regional'` for `color.transit.mode.*`, with no default and the root's `data-line` attribute? Recommended: yes; a Prik in the wrong colour would name the wrong line, so no default is safe, and `color` is kept for the contract's intents. LineBadge, the next component to take a line, uses the same values.

Answered: yes, as recommended (unattended run, to confirm). The question was: Does `size` map `'small'`, `'medium'` and `'large'` to `icon.size.325`, `icon.size.400` and `icon.size.450`, set as `--perron-icon-size` on the root, default `'medium'`? Recommended: yes; `prik.inset` is the gap inside a glyph box, the icon steps are the glyph boxes the system has, and the three line up with caption, label and top-bar text.

## Tokens

One row per part, state and property. Prik has one design state, rest: it is not focusable, hoverable or pressable. The data states and lines are props, written in the Part column as the root's attribute.

| Part                             | State | Property                    | Token                                                  |
| -------------------------------- | ----- | --------------------------- | ------------------------------------------------------ |
| `root` (`size='medium'`)         | rest  | `--perron-icon-size`        | `icon.size.400`                                        |
| `root` (`size='small'`)          | rest  | `--perron-icon-size`        | `icon.size.325`                                        |
| `root` (`size='large'`)          | rest  | `--perron-icon-size`        | `icon.size.450`                                        |
| `root`                           | rest  | `inline-size`, `block-size` | `icon.size.*`, through `--perron-icon-size`            |
| `root` (`line='m1'`)             | rest  | `color`                     | `color.transit.line.m1`                                |
| `root` (`line='m2'`)             | rest  | `color`                     | `color.transit.line.m2`                                |
| `root` (`line='m3'`)             | rest  | `color`                     | `color.transit.line.m3`                                |
| `root` (`line='m4'`)             | rest  | `color`                     | `color.transit.line.m4`                                |
| `root` (`line='a'`)              | rest  | `color`                     | `color.transit.line.a`                                 |
| `root` (`line='b'`)              | rest  | `color`                     | `color.transit.line.b`                                 |
| `root` (`line='c'`)              | rest  | `color`                     | `color.transit.line.c`                                 |
| `root` (`line='e'`)              | rest  | `color`                     | `color.transit.line.e`                                 |
| `root` (`line='f'`)              | rest  | `color`                     | `color.transit.line.f`                                 |
| `root` (`line='h'`)              | rest  | `color`                     | `color.transit.line.h`                                 |
| `root` (`line='bus'`)            | rest  | `color`                     | `color.transit.mode.bus`                               |
| `root` (`line='regional'`)       | rest  | `color`                     | `color.transit.mode.regional`                          |
| `dot` (`state='live'`)           | rest  | `r`                         | `calc(50% - prik.inset)`                               |
| `dot` (`state='live'`)           | rest  | `fill`                      | `currentColor`, the line                               |
| `dot` (`state='ageing'`)         | rest  | `r`                         | `calc(50% - prik.inset - prik.ageing.stroke-inset)`    |
| `dot` (`state='ageing'`)         | rest  | `fill`                      | `currentColor`, the line                               |
| `dot` (`state='ageing'`)         | rest  | `fill-opacity`              | `prik.ageing.fill-opacity`                             |
| `dot` (`state='ageing'`)         | rest  | `stroke`                    | `currentColor`, the line                               |
| `dot` (`state='ageing'`)         | rest  | `stroke-width`              | `prik.ageing.stroke-width`                             |
| `dot` (`state='estimated'`)      | rest  | `r`                         | `calc(50% - prik.inset - prik.estimated.stroke-inset)` |
| `dot` (`state='estimated'`)      | rest  | `fill`                      | `none`                                                 |
| `dot` (`state='estimated'`)      | rest  | `stroke`                    | `currentColor`, the line                               |
| `dot` (`state='estimated'`)      | rest  | `stroke-width`              | `prik.estimated.stroke-width`                          |
| `dot` (`state='timetable-only'`) | rest  | `r`                         | `calc(50% - prik.inset - prik.timetable.stroke-inset)` |
| `dot` (`state='timetable-only'`) | rest  | `fill`                      | `none`                                                 |
| `dot` (`state='timetable-only'`) | rest  | `stroke`                    | `currentColor`, the line                               |
| `dot` (`state='timetable-only'`) | rest  | `stroke-width`              | `prik.timetable.stroke-width`                          |
| `dot` (`state='timetable-only'`) | rest  | `stroke-dasharray`          | `prik.timetable.dash`                                  |
| `dot` (`state='no-signal'`)      | rest  | `r`                         | `calc(50% - prik.inset)`                               |
| `dot` (`state='no-signal'`)      | rest  | `fill`                      | `color.data-state.no-signal`                           |

`cx` and `cy` are `50%`. On a square box, `r: 50%` is half its side, so each radius keeps the dot `prik.inset` inside the box; each `stroke-inset` pulls a rim in by about half its width, so every state has the same outer size.

Not read: `prik.halo`, `color.data-state.halo` and `color.data-state.outline` are for the map canvas alone; `prik.live-threshold` and `prik.ageing-threshold` are for whoever decides the state (see CR-3).

Answered: yes, as recommended (unattended run, to confirm). The question was: Does Prik leave out the `color.data-state.outline` hairline, so a light line colour (M2, F, bus) shows its ring or ageing dot without an outline on a light surface? Recommended: yes; the token's description keeps it to the map, the state's word always sits next to the dot, and the design run can widen it through the `design-tokens` skill if the drawing shows the faint rings need it.

## Keyboard and ARIA

No keys: Prik is not focusable and does nothing when pressed. A caller who makes a row interactive puts the Prik inside a button or link, which takes the focus.

| Element | Role  | Accessible name from                                                                                        | States announced |
| ------- | ----- | ----------------------------------------------------------------------------------------------------------- | ---------------- |
| `root`  | `img` | `aria-label`, the owned string for its `state` (`live`, `ageing`, `estimated`, `timetableOnly`, `noSignal`) | none             |
| `dot`   | none  | none: inside the `img`, its children are presentational                                                     | none             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: each of the five shapes is named by its state's word; the line colour is not named, because the caller names the line in words nearby, as [Semantic colours](../foundations/semantic-colours.md#line-colours) asks.
- [ ] Every landmark and named region has an accessible name: none here.
- [ ] Every default label can be overridden: `liveLabel`, `ageingLabel`, `estimatedLabel`, `timetableOnlyLabel`, `noSignalLabel`.
- [ ] Every shape the type accepts renders, in every variant: every `state` on every `line` at every `size`, in the `Lines` and `Sizes` stories; Prik takes no `ReactNode`.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses.
- [ ] Native semantics first: an `<svg>` with `role="img"`, the role the SVG accessibility mapping gives a named graphic; no element says "image" more natively for an inline drawing.
- [ ] Focus moves in reading order and returns on close: Prik takes no focus and opens nothing.
- [ ] Every target is at least `size.target-min` square: Prik is not a target.
- [ ] Loops stop when the system asks for less motion: none here; the report and selection pulses belong to the map canvas.

## Owned strings

Every word the component shows or announces on its own. All five keys exist in `packages/perron/src/locale/en.ts`, held to the table in [Content design](../content-design.md#data-state-and-delay-words); Prik adds none.

| Key             | English        | Override             | Seen or heard where                                   |
| --------------- | -------------- | -------------------- | ----------------------------------------------------- |
| `live`          | Live           | `liveLabel`          | The root's `aria-label` when `state='live'`           |
| `ageing`        | Ageing         | `ageingLabel`        | The root's `aria-label` when `state='ageing'`         |
| `estimated`     | Estimated      | `estimatedLabel`     | The root's `aria-label` when `state='estimated'`      |
| `timetableOnly` | Timetable only | `timetableOnlyLabel` | The root's `aria-label` when `state='timetable-only'` |
| `noSignal`      | No signal      | `noSignalLabel`      | The root's `aria-label` when `state='no-signal'`      |

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** Every state keeps one outer size. The radius of each state is `calc(50% - prik.inset)` less its own `stroke-inset`, so swapping the state never moves or resizes the dot, and a column of Priks lines up.
- **CR-2.** The line colour is set once, as the root's `color`, and the dot draws in `currentColor`. `state='no-signal'` fills with `color.data-state.no-signal` whatever the line, because a silent vehicle is grey ([Data states](../foundations/data-states.md)).
- **CR-3.** Prik draws the state it is given. It never works one out from a timestamp: the caller compares a report's age with `prik.live-threshold` and `prik.ageing-threshold`.
- **CR-4.** No halo, outline, trail or pulse. Those are drawn on the map canvas, which never renders this component.
- **CR-5.** Prik is never the only place a state is said to the eye: a screen writes the state in words next to it, as PrikLabel and PrikLegend do ([Data states](../foundations/data-states.md)).
- **CR-6.** The root is `role="img"` with `aria-label` set to the state's owned string, so a Prik on its own is never silent. A caller that shows the same word next to it, such as PrikLabel, passes `aria-hidden`, which reaches the root with the rest props, so the word is heard once.
- **CR-7.** The root sets `data-state`, `data-line` and `data-size`, defaults included, and the CSS selects on them: `.pn-Prik[data-state='ageing'] .pn-Prik-dot`.
- **CR-8.** In forced colours the shapes carry the state. Inside `@media (forced-colors: active)`, the root's `color` is `CanvasText`, so live, ageing, estimated and timetable only keep their fills and rings in the system's text colour, and no signal fills with `GrayText`.

Answered: yes, as recommended (unattended run, to confirm). The question was: In forced colours, is no signal filled with `GrayText`, so it stays apart from a live dot, which otherwise has the same shape? Recommended: yes; `GrayText` is one of the system colours the contract allows there, and it keeps "a grey dot" grey.

## Stories

One per variant, named by its variant name ([penpot/README.md](../../penpot/README.md), "Conventions"). The meta's `args` are `line: 'm1'` and `size: 'medium'`.

| Story           | Shows                                       | `play` test                                                                                                                                         |
| --------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Live`          | `state='live'`: a solid dot                 | The root is an `img` named "Live"                                                                                                                   |
| `Ageing`        | `state='ageing'`: a fainter dot with a rim  | The root is an `img` named "Ageing"                                                                                                                 |
| `Estimated`     | `state='estimated'`: a ring                 | The root is an `img` named "Estimated"                                                                                                              |
| `TimetableOnly` | `state='timetable-only'`: a dashed ring     | The root is an `img` named "Timetable only"                                                                                                         |
| `NoSignal`      | `state='no-signal'`: a grey dot             | The root is an `img` named "No signal", its dot filled grey whatever the line                                                                       |
| `Sizes`         | Each state at `small`, `medium` and `large` | Each size's box is its `icon.size.*` square, and in each box every state's outer edge (`r` plus half its stroke) is within 0.1 px of the live dot's |
| `Lines`         | Each state on each of the twelve lines      | none                                                                                                                                                |

Answered: yes, as recommended (unattended run, to confirm). The question was: Are Prik's Penpot variants the five states alone, `state` its one variant property, with `line` and `size` shown in the `Sizes` and `Lines` stories rather than as variants? Recommended: yes; five states by three sizes by twelve lines would be 180 variants of one circle, and `line` and `size` only swap a token.

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                              | Don't                                                                                                    |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Write the state in words next to the dot, or use PrikLabel, which does                          | Show a Prik alone in a list and trust the shape to carry the state: colour and shape are never alone     |
| Pass `aria-hidden` when the state's word is already beside the Prik                             | Let a screen reader hear "Live" twice, once from the dot and once from the text                          |
| Name the line in words nearby, such as in a LineBadge                                           | Let the dot's colour be the only sign of the line: several line colours miss 3:1 on light surfaces       |
| Use a ring or a dashed ring only to mean estimated or timetable only                            | Reuse the Prik shapes, or `color.data-state.no-signal`, for anything but a vehicle's data state          |
| Work out the state from the report's age with `prik.live-threshold` and `prik.ageing-threshold` | Pass `live` for a vehicle whose last report is minutes old: the dot would claim more than the data knows |
| Draw vehicles on the map canvas with the map's own dot sizes and halo                           | Render a Prik per vehicle on the map: it is for lists, rows and legends                                  |
