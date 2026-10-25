# StopTimeline

The stops of one vehicle's trip, in order, on a rail in its line's colour: each stop's name, its time and how late the vehicle runs there, with the stops already passed set back and the next stop marked, as in a vehicle's detail panel.

## Anatomy

Penpot page `Patterns/StopTimeline`, not drawn yet: the design is deferred (`docs/adr/0010-unattended-runs-with-design-deferred.md`), so this spec decides the drawing. Family: none. Shared parts: VisuallyHidden.

StopTimeline is a pattern ([Patterns](../components/README.md#patterns)): it composes Perron's [StationIcon](../components/station-icon.md) for each stop's marker and [Delay](../components/delay.md) for each stop's delay, and takes a trip's stops as Mylder's domain data. It has no variant property: which stops are passed and which is next comes from the data, and `line` is a colour, not a variant. So the drawing has one variant, `Default`, a trip partway through. Its layers, top to bottom, are the parts below; `stop` repeats once per stop, holding that stop's `rail`, `marker`, `name`, `next` (the next stop only), `time` and `delay`.

| Part (Penpot layer) | What it is                                                                                                                                           | Base UI part                                          | Class                               | `slotProps` key |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------- | --------------- |
| `root`              | The whole timeline: an ordered list of the trip's stops, a grid whose columns the stops share                                                        | None: a pattern never imports Base UI; a plain `<ol>` | `pn-StopTimeline`                   | none            |
| `stop`              | One stop: a list item that lays its parts on the root's columns, and carries `data-stop` with `passed`, `next` or `upcoming`                         | None: a plain `<li>`                                  | `pn-StopTimeline-stop`              | none            |
| `rail`              | The piece of the rail from this stop's marker to the next stop's, in the line's colour, or set back once passed; absent on the last stop. Decorative | None: a plain `<span>`, `aria-hidden="true"`          | `pn-StopTimeline-rail`              | none            |
| `marker`            | The stop's marker on the rail: a StationIcon in the line's colour, `size='small'`, `filled` on the next stop and `outlined` on the rest              | None: the StationIcon component, itself hidden        | `pn-StopTimeline-marker`            | none            |
| `name`              | The stop's name, the caller's text                                                                                                                   | None: a plain `<span>`                                | `pn-StopTimeline-name`              | none            |
| `next`              | "Next stop", seen under the next stop's name                                                                                                         | None: a plain `<span>`                                | `pn-StopTimeline-next`              | none            |
| `passed`            | "Passed", heard after a passed stop's name. Not drawn, so no Penpot layer                                                                            | None: the VisuallyHidden shared part                  | `pn-VisuallyHidden`, the part's own | none            |
| `time`              | The stop's timetabled time, 24-hour, such as "08:14"                                                                                                 | None: a plain `<time>`                                | `pn-StopTimeline-time`              | none            |
| `delay`             | How late or early the vehicle runs at this stop: a Delay, after the time. Absent when the stop gives no `delay`                                      | None: the Delay component                             | `pn-StopTimeline-delay`             | none            |

## Base UI parts

No Base UI part: the registry gives StopTimeline no `baseUiParts`, and a pattern's code imports only Perron's components and parts, `PerronProvider`, React and its own files, never `@base-ui/react`, not even a type ([Patterns](../components/README.md#patterns); the `patterns` check). The root is a plain `<ol>` and the inner parts plain elements, StationIcon and Delay.

| Base UI part | Renders | Perron sets                                                                                                                | Passed through                                                |
| ------------ | ------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| None         | `<ol>`  | `className` (`pn-StopTimeline` first, then the caller's), `data-line`, `ref`, and the stops as its children (CR-1 to CR-4) | `className`, `style`, `ref` and the `<ol>`'s other attributes |

Base UI already does: nothing here. StationIcon and Delay bring their own Base UI underneath; StopTimeline adds layout, the rail and the words of a stop's place in the trip.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. StopTimeline takes no `children`: it writes its own stops from `stops`, so the props type leaves `children` out of the `<ol>`'s attributes. It has no `render`: the contract's `render` is Base UI's and inherited from a Base UI props type, which a pattern cannot import, and declaring it fails the `props` check. It has no `slotProps`, because the contract keys `slotProps` by inner Base UI part and StopTimeline has none; a caller restyles it through `className` on the root. The `<ol>`'s other attributes, such as `aria-labelledby`, reach the root and get no row, as in MUI's tables.

| Name                | Type                                                                                            | Default      | Base UI prop | Description                                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------- | ------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stops`             | `StopTimelineStop[]`                                                                            | (required)   | none         | The trip's stops, first to last: each one's name, and optionally its timetabled time and its delay in minutes.                                                                                                                                                    |
| `line`              | `'m1' \| 'm2' \| 'm3' \| 'm4' \| 'a' \| 'b' \| 'c' \| 'e' \| 'f' \| 'h' \| 'bus' \| 'regional'` |              | none         | The line or mode whose colour the rail and the markers take, as StationIcon's `line`. Left out, the rail and markers are neutral.                                                                                                                                 |
| `nextStopIndex`     | `number`                                                                                        |              | none         | The index in `stops` of the vehicle's next stop. The stops before it are passed and the ones after it upcoming; an index past the last stop means the trip is over and every stop passed. Left out, the vehicle's place is unknown and no stop is passed or next. |
| `nextStopLabel`     | `string`                                                                                        | The locale's | none         | Overrides "Next stop"                                                                                                                                                                                                                                             |
| `passedLabel`       | `string`                                                                                        | The locale's | none         | Overrides "Passed", heard after a passed stop's name                                                                                                                                                                                                              |
| `minutesUnitLabel`  | `string`                                                                                        | The locale's | none         | Overrides "min", the unit after each delay's figure; given to every Delay                                                                                                                                                                                         |
| `minutesLateLabel`  | `string`                                                                                        | The locale's | none         | Overrides "min late", heard after the number when late; given to every Delay                                                                                                                                                                                      |
| `minutesEarlyLabel` | `string`                                                                                        | The locale's | none         | Overrides "min early", heard after the number when early; given to every Delay                                                                                                                                                                                    |
| `onTimeLabel`       | `string`                                                                                        | The locale's | none         | Overrides "On time"; given to every Delay                                                                                                                                                                                                                         |
| `delayUnknownLabel` | `string`                                                                                        | The locale's | none         | Overrides "Delay unknown", heard in place of "—"; given to every Delay                                                                                                                                                                                            |
| `className`         | `string`                                                                                        |              | none         | Merged after `pn-StopTimeline` on the root                                                                                                                                                                                                                        |
| `style`             | `CSSProperties`                                                                                 |              | none         | Reaches the root                                                                                                                                                                                                                                                  |
| `ref`               | `Ref<HTMLOListElement>`                                                                         |              | none         | Reaches the root                                                                                                                                                                                                                                                  |

`stops` is an array of `StopTimelineStop`, a type the pattern exports beside `StopTimelineProps`:

| Field   | Type             | Description                                                                                                                                                                 |
| ------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`  | `string`         | The stop's name, as the operator writes it.                                                                                                                                 |
| `time`  | `string`         | Optional. The timetabled time at the stop, 24-hour `HH:MM`, such as `'08:14'`. Left out, the stop shows no time.                                                            |
| `delay` | `number \| null` | Optional. How late the vehicle runs at the stop, in minutes, as Delay's `minutes` takes it: positive late, negative early, `0` on time, `null` unknown. Left out, no Delay. |

A stop is a plain object with `name`, an optional `time` (`HH:MM`) and an optional `delay` in minutes (`number | null`, given to Delay's `minutes`), keyed in the list by its index, not a ReactNode name, a `Date` or an `id`: a trip's stops are data the pattern lays out, `HH:MM` is how content design writes a time, `delay` keeps Delay's minutes and its `null` for unknown, and a trip's stops never reorder, so the index is a stable key.

`line` is typed as StationIcon's `line`, through a type-only import of `StationIconProps['line']`, so the two never drift.

The vehicle's place is one number, `nextStopIndex`: the stops before it are passed, an index past the last stop means the trip is over, and none means the place is unknown. No stop carries a `passed` flag or a kind of its own, since one number can't describe two next stops or a passed stop after an upcoming one, and the name says which stop it points at without `value`, which the contract keeps for controls.

StopTimeline takes Delay's five label props, `minutesUnitLabel`, `minutesLateLabel`, `minutesEarlyLabel`, `onTimeLabel` and `delayUnknownLabel`, and gives them to every Delay it renders: the contract's checklist asks that every default label the pattern shows can be overridden on one instance, and the names stay Delay's, so a caller learns them once.

## Tokens

StopTimeline is not interactive, so its one design state is rest; a row's part names the `data-line` or `data-stop` value it applies to where it differs, carried on that part itself (CR-1, CR-2). The pattern is not one of the contract's families: it draws no fill, border or radius around itself, and no dividers, since the rail joins the stops. StationIcon and Delay keep their own tokens, as their specs give them.

| Part                           | State | Property                | Token                                                                                                                                   |
| ------------------------------ | ----- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `root`                         | rest  | `margin`, `padding`     | none: `0`                                                                                                                               |
| `root`                         | rest  | `list-style`            | none: the keyword `none`                                                                                                                |
| `root`                         | rest  | `grid-template-columns` | `icon.size.325` for the marker's column, then the name's (`1fr`), the time's (`auto`) and the delay's (`auto`)                          |
| `root`                         | rest  | `column-gap`            | `space.300`                                                                                                                             |
| `root`                         | rest  | `overflow-wrap`         | none: the keyword `break-word`, so a word longer than the name's column, a long station name or `nextStop` translated, breaks inside it |
| `stop`                         | rest  | `grid-template-columns` | none: the keyword `subgrid`, so every stop's time and delay line up down the list                                                       |
| `stop`                         | rest  | `padding-block`         | `space.150`                                                                                                                             |
| `stop`                         | rest  | `font`                  | `typography.label`, the name's, so `1lh` in the `marker` and the `rail`, which inherit it, is one line of the name                      |
| `stop`                         | rest  | `letter-spacing`        | `typography.label-tracking`                                                                                                             |
| `rail`                         | rest  | `inline-size`           | `border.width.050`, the weight of StationIcon's ring                                                                                    |
| `rail`                         | rest  | `inset-inline-start`    | none: `calc((icon.size.325 - border.width.050) / 2)`, centring it on the markers' column                                                |
| `rail`                         | rest  | `inset-block-start`     | none: `calc(space.150 + 1lh / 2)`, the stop's padding and half a line of the name, so it starts at its marker's centre (CR-6)           |
| `rail`                         | rest  | `inset-block-end`       | none: `calc(-1 * (space.150 + 1lh / 2))`, the same length past the stop's end, so it reaches the next stop's marker centre (CR-6)       |
| `rail`, no `data-line`         | rest  | `background`            | `color.text.primary`, as a neutral StationIcon                                                                                          |
| `rail`, `data-line='m1'`       | rest  | `background`            | `color.transit.line.m1`                                                                                                                 |
| `rail`, `data-line='m2'`       | rest  | `background`            | `color.transit.line.m2`                                                                                                                 |
| `rail`, `data-line='m3'`       | rest  | `background`            | `color.transit.line.m3`                                                                                                                 |
| `rail`, `data-line='m4'`       | rest  | `background`            | `color.transit.line.m4`                                                                                                                 |
| `rail`, `data-line='a'`        | rest  | `background`            | `color.transit.line.a`                                                                                                                  |
| `rail`, `data-line='b'`        | rest  | `background`            | `color.transit.line.b`                                                                                                                  |
| `rail`, `data-line='c'`        | rest  | `background`            | `color.transit.line.c`                                                                                                                  |
| `rail`, `data-line='e'`        | rest  | `background`            | `color.transit.line.e`                                                                                                                  |
| `rail`, `data-line='f'`        | rest  | `background`            | `color.transit.line.f`                                                                                                                  |
| `rail`, `data-line='h'`        | rest  | `background`            | `color.transit.line.h`                                                                                                                  |
| `rail`, `data-line='bus'`      | rest  | `background`            | `color.transit.mode.bus`                                                                                                                |
| `rail`, `data-line='regional'` | rest  | `background`            | `color.transit.mode.regional`                                                                                                           |
| `rail`, `data-stop='passed'`   | rest  | `background`            | `color.border.strong`, whatever the line                                                                                                |
| `marker`                       | rest  | `margin-block-start`    | none: `calc((1lh - icon.size.325) / 2)`, centring it on the name's first line (CR-7)                                                    |
| `marker`                       | rest  | every other property    | none: StationIcon's own, `size='small'` (`icon.size.325`), in the line's colour                                                         |
| `name`                         | rest  | `font`                  | `typography.label`                                                                                                                      |
| `name`                         | rest  | `letter-spacing`        | `typography.label-tracking`                                                                                                             |
| `name`                         | rest  | `color`                 | `color.text.primary`                                                                                                                    |
| `name`, `data-stop='passed'`   | rest  | `color`                 | `color.text.secondary`                                                                                                                  |
| `next`                         | rest  | `font`                  | `typography.caption`                                                                                                                    |
| `next`                         | rest  | `letter-spacing`        | `typography.caption-tracking`                                                                                                           |
| `next`                         | rest  | `color`                 | `color.text.secondary`                                                                                                                  |
| `passed`                       | rest  | none                    | none: the VisuallyHidden part's own styles, never seen                                                                                  |
| `time`                         | rest  | `font`                  | `typography.data`                                                                                                                       |
| `time`                         | rest  | `letter-spacing`        | `typography.data-tracking`                                                                                                              |
| `time`                         | rest  | `font-variant-numeric`  | none: the keyword `tabular-nums`, so times line up                                                                                      |
| `time`                         | rest  | `color`                 | `color.text.primary`                                                                                                                    |
| `time`, `data-stop='passed'`   | rest  | `color`                 | `color.text.secondary`                                                                                                                  |
| `delay`                        | rest  | every property          | none: Delay's own, `typography.data` in the delay's `color.transit.delay.*`, passed or not, so its kind's colour holds                  |

The text follows the contract's row treatment: a name in `typography.label`, its second line ("Next stop") in `typography.caption` with `color.text.secondary`. `typography.data` is the role for "times, delays, counts and percentages in lists", and matches Delay's, so a time and its delay read as one figure.

The stops the vehicle has passed are set back: their names and times in `color.text.secondary` and the rail behind them in `color.border.strong`, while the rail from the next stop on keeps the line's colour, and every marker keeps it too. It shows at a glance how far the trip has come without hiding what was passed (`color.text.secondary` still reaches 4.5:1 on every surface); the rail is decoration, so `color.border.strong` fits it; and StationIcon keeps line colours exact ([Semantic colours](../foundations/semantic-colours.md#line-colours)), so the markers are not recoloured.

## Keyboard and ARIA

No Base UI part, so nothing from Base UI here: the timeline is read, not operated. It takes no focus, and no key does anything.

| Key  | Does                                                        | From   |
| ---- | ----------------------------------------------------------- | ------ |
| None | The timeline is not focusable or operable; Tab passes it by | Perron |

| Element             | Role                               | Accessible name from                                                                                   | States announced                       |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `root`              | `list`, from the native `<ol>`     | None of its own; the caller's `aria-labelledby`, such as the detail panel's heading, when it gives one | Its number of items, from the `<ol>`   |
| `stop`              | `listitem`, from the native `<li>` | Its text, read in order: the name, "Passed" or "Next stop", the time, the delay's words                | `aria-current="step"` on the next stop |
| `rail` and `marker` | hidden, `aria-hidden="true"`       | None: decorative; the words say what they show                                                         | None                                   |
| `next`              | text                               | The owned string "Next stop"                                                                           | None                                   |
| `passed`            | text, visually hidden              | The owned string "Passed"                                                                              | None                                   |
| `time`              | `time`, from the native `<time>`   | Its text, "08:14", with `dateTime` set to the same `HH:MM`                                             | None                                   |
| `delay`             | Delay's own: generic text          | Delay's own words: "3 min late", "On time", "Delay unknown"                                            | None                                   |

A next stop reads "Nørreport, Next stop, 08:14, 3 min late", and a passed one "Forum, Passed, 08:10, On time".

The next stop's list item carries `aria-current="step"` beside its "Next stop" words: it is the attribute ARIA gives for the current step in a sequence, so a screen reader names the stop as current when it lands on it from anywhere in the list, while the words say why.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the filled marker and the "Next stop" words say which stop is next, heard as "Next stop" and `aria-current="step"`; the set-back colour of a passed stop is heard as "Passed"; the rail and the line's colour are decoration, the line named in words by the panel around the timeline; each Delay says its delay in words; a stop with no `time` or `delay` shows and says nothing for it; with no `nextStopIndex`, nothing is set back or marked, and nothing is said
- [ ] Every landmark and named region has an accessible name: none here; the root is a list, not a region, and takes the caller's `aria-labelledby` when the panel names it
- [ ] Every default label can be overridden: `nextStopLabel` and `passedLabel`, and Delay's five, `minutesUnitLabel`, `minutesLateLabel`, `minutesEarlyLabel`, `onTimeLabel` and `delayUnknownLabel`
- [ ] Every shape the type accepts renders, in every variant: an empty `stops` renders an empty list; one stop renders with no rail; each stop with and without `time` and `delay`, and `delay` as a number and `null`; `nextStopIndex` left out, at the first stop, in the middle, at the last stop and past it, negative or not a whole number (CR-2); every `line` value and none; a long name wraps under itself
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses. The `rail` and `marker` are `aria-hidden` because they are decoration, not copies
- [ ] Native semantics first: `<ol>` and `<li>` for the ordered stops, `<time>` for each time, `aria-current` the one attribute ARIA adds
- [ ] Focus moves in reading order and returns on close: the timeline takes no focus
- [ ] Every target is at least `size.target-min` square: no target; the stops are not pressed (CR-8)
- [ ] Loops stop when the system asks for less motion: none here; nothing moves

## Owned strings

The stop names, times and delays are the caller's data; the words of a stop's place in the trip are the pattern's own, and Delay's words are Delay's, overridable here through the props above. Each word is a text run of its own, so `expectOwnedStrings` reads it as a dictionary value.

| Key            | English         | Override            | Seen or heard where                                                                           |
| -------------- | --------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `nextStop`     | "Next stop"     | `nextStopLabel`     | `next`, seen under the next stop's name and read after it                                     |
| `passed`       | "Passed"        | `passedLabel`       | `passed`, heard after each passed stop's name; never seen                                     |
| `minutesUnit`  | "min"           | `minutesUnitLabel`  | Each `delay`, as Delay's spec gives it; an existing key in `packages/perron/src/locale/en.ts` |
| `minutesLate`  | "min late"      | `minutesLateLabel`  | Each `delay`, as Delay's spec gives it; an existing key                                       |
| `minutesEarly` | "min early"     | `minutesEarlyLabel` | Each `delay`, as Delay's spec gives it; an existing key                                       |
| `onTime`       | "On time"       | `onTimeLabel`       | Each `delay`, as Delay's spec gives it; an existing key                                       |
| `delayUnknown` | "Delay unknown" | `delayUnknownLabel` | Each `delay`, as Delay's spec gives it; an existing key                                       |

`nextStop` and `passed` are new, each with a JSDoc line like its neighbours in `en.ts`, and agents write their Danish, Swedish and Norwegian. Neither is a data-state, delay or disruption word, so neither joins content design's table.

The next stop shows "Next stop" in words under its name, as well as its filled marker, and a passed stop says "Passed" to the ear only: StationIcon's spec asks that a filled stop's meaning be said in words beside it, and a sighted rider learns the filled marker from the words; a passed stop's set-back colour is plain to the eye in its place in the list, so "Passed" in every passed row would only crowd it, while the ear, which can't see the colour, hears it.

## Component rules

- **CR-1.** The root is an `<ol>` with `className` `pn-StopTimeline` first, then the caller's, and `data-line` with the `line` value when one is given; with no `line`, `data-line` is absent and the rail is neutral. Each `rail` piece carries the same `data-line`, which its colour reads. The rest props are spread first, so the pattern's own class and data attribute win, and `stops`, `line`, `nextStopIndex` and every `*Label` prop are taken out of them, so none reaches the DOM.
- **CR-2.** Each stop's place comes from `nextStopIndex` alone: a stop before it is `passed`, the stop at it `next`, a stop after it `upcoming`, carried as `data-stop` on its `<li>` and on its `rail`, `name` and `time`, whose colours read it. An index at or past `stops.length` makes every stop `passed` and none `next`, a trip that is over. Left out, negative, or not a whole number, every stop is `upcoming`, with no `passed` or `next`, since the vehicle's place is unknown; `Infinity` is not a whole number, so it is unknown too, not past the last stop.
- **CR-3.** At most one stop is `next`. Its marker is `variant='filled'`, its `<li>` carries `aria-current="step"`, and its `next` part says the `nextStop` word under its name. Every other marker is `variant='outlined'`.
- **CR-4.** A `passed` stop says the `passed` word in the VisuallyHidden part, straight after its name, so it is heard before the time.
- **CR-5.** Every marker is a StationIcon with `size='small'` and the timeline's `line`, so its colour and the rail's agree. The pattern never restyles the marker: StationIcon keeps the line's colour exact and its ring's weight, and its `color.surface.raised` fill hides the rail behind it.
- **CR-6.** The rail runs through the centres of the markers, from the first stop's to the last's: each stop but the last holds the `rail` piece from its own marker to the next stop's. A piece leaving a `passed` stop is `color.border.strong`, so the piece the vehicle is on now, from the last passed stop to the next stop, is set back too; every other piece is the line's colour. One stop alone has no rail.
- **CR-7.** The stops share the root's columns through `subgrid`, so the times and the delays line up down the list, and a long name wraps within its column rather than pushing them. The marker sits beside the name's first line.
- **CR-8.** The stops are text: no stop is a link or a button, and the pattern shows every stop it is given. A caller that wants fewer stops, such as the next few, passes those.
- **CR-9.** Each `time` renders as `<time dateTime={time}>{time}</time>`, the `HH:MM` given, as content design writes a time. A stop without `time` renders no `time` part; a stop without `delay` renders no Delay; `delay={null}` renders Delay's unknown "—".
- **CR-10.** Every Delay gets the five Delay label props as StopTimeline was given them, so an override reaches every stop.
- **CR-11.** StopTimeline is not a live region. A screen that moves the vehicle on announces the new next stop in its own polite live region, as [Accessibility](../foundations/accessibility.md#what-a-person-checks) asks.
- **CR-12.** In `(forced-colors: active)`, the rail is `CanvasText` and a passed piece `GrayText`, so the trip's progress still shows when the system replaces colours; StationIcon keeps its own forced-colours rule.
- **CR-13.** StopTimeline composes the VisuallyHidden shared part, StationIcon and Delay from their folders in `packages/perron/src/`, and imports nothing from Base UI.

StopTimeline stays a plain list: every stop it is given is shown and none is pressable, with no "Show earlier stops" button folding the passed stops and no stop a link. The first version reads a trip; folding and links bring a button, its owned strings and focus rules that no screen has asked for yet, and each can join later as an optional prop without a break.

## Stories

No Penpot design yet. StopTimeline has no variant property, so its drawing's one variant is `Default` (the Conventions of `penpot/README.md`), and the meta's args are that trip, so the contract story renders it alone. The other stories show the shapes of the data, as StationIcon's `Lines` does. Each `play` test reads the accessibility tree, not the pixels.

| Story           | Shows                                                                                                                                                                      | `play` test                                                                                                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default`       | An S-tog A trip of seven stops, `nextStopIndex={3}`: three passed, one next, three upcoming; delays on time, slight, late and early; every stop with a time                | A list of seven items; only the fourth has `aria-current="step"` and "Next stop"; the first three say "Passed"; the markers and rails are `aria-hidden`; each `<time>` has its `dateTime`; Tab passes the timeline by to the next focusable element |
| `NotStarted`    | The same trip with no `nextStopIndex`: every stop upcoming, the whole rail in the line's colour, every marker outlined                                                     | No item has `aria-current`, and no "Passed" or "Next stop" is in the tree                                                                                                                                                                           |
| `Finished`      | The same trip with `nextStopIndex={7}`, past the last stop: every stop passed                                                                                              | Every item says "Passed", none has `aria-current`, and "Next stop" is not in the tree                                                                                                                                                               |
| `TimetableOnly` | The same trip with every `delay` `null`, as for a timetable-only or no-signal vehicle                                                                                      | Each stop's delay is "—" to the eye and "Delay unknown" to the ear                                                                                                                                                                                  |
| `WithoutTimes`  | A trip whose stops give only names, one with a long name that wraps, a one-stop timeline beside it, and a timeline of a stop with only a time and a stop with only a delay | In the names-only timelines no `<time>` and no Delay renders; the one-stop timeline has no rail; the stop with only a time renders its `<time>` and no Delay, the stop with only a delay its Delay and no `<time>`                                  |
| `Lines`         | A three-stop timeline, `nextStopIndex={1}`, for every `line` value and none                                                                                                | Each root carries its `data-line`, and none without a `line`                                                                                                                                                                                        |

## Do and don't

For a caller using the pattern, with the reason.

| Do                                                                                                                                  | Don't                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Name the line in words around the timeline, such as in the panel's header with a LineBadge, because the rail's colour is decoration | Rely on the rail's colour to say which line runs the trip: colour is never alone ([Accessibility](../foundations/accessibility.md#rules)) |
| Leave `nextStopIndex` out when no real-time data places the vehicle, so no stop claims to be next                                   | Guess a next stop from the timetable and pass it: it claims more certainty than the data has ([Content design](../content-design.md))     |
| Pass `delay: null` for a stop whose delay no real-time data says, and leave `delay` out where no delay belongs                      | Pass `0` for an unknown delay: "On time" claims a certainty the data doesn't have                                                         |
| Give the timetabled `time` and let Delay say how late the vehicle runs                                                              | Pass the expected time as `time` as well as a delay: the rider adds the delay twice                                                       |
| Point the root's `aria-labelledby` at the panel heading that names the trip                                                         | Wrap the timeline in a live region: every update rereads the whole trip                                                                   |
| Pass only the stops the screen needs, such as the next few, when the trip is long                                                   | Restyle the markers or the rail's width through `className`, which breaks the ring's and the rail's matching weight                       |
