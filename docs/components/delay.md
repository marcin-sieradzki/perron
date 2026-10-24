# Delay

How late or early a vehicle or departure runs, as a short figure in the delay's colour, such as "+3 min", with the same thing said in words to a screen reader.

## Anatomy

Penpot page `Components/Delay`. Family: none. Shared parts: VisuallyHidden.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`), so the layers below are the ones the drawing will name. Delay has no Base UI part: it is display text with no behaviour, so its root renders through Base UI's `useRender` hook (`@base-ui/react/use-render`), which gives it the `render` prop, and its inner parts are plain elements.

| Part (Penpot layer) | What it is                                                                                                                          | Base UI part                                   | Class                               | `slotProps` key |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------- | --------------- |
| `root`              | The whole delay, one inline run of text: a `<span>` in the delay's colour                                                           | none: a `<span>` rendered by `useRender`       | `pn-Delay`                          | none            |
| `value`             | The visible figure: the signed whole minutes ("+3", "−1"), "On time", or "—" when unknown                                           | none: a plain `<span>`, no behaviour to borrow | `pn-Delay-value`                    | none            |
| `unit`              | "min", after a space, shown only after a signed figure                                                                              | none: a plain `<span>`, no behaviour to borrow | `pn-Delay-unit`                     | none            |
| `label`             | The words a screen reader hears in place of the figure: "3 min late", "1 min early", "Delay unknown". Not drawn, so no Penpot layer | none: the VisuallyHidden shared part           | `pn-VisuallyHidden`, the part's own | none            |

Delay shows a signed figure with its unit, "+3 min" late and "−1 min" early (the true minus sign), "On time" in words when on time, and "—" with no unit when unknown, as content design writes numbers: a space before units, the true minus sign for early and "—" for unknown.

Delay's one Penpot variant property is `delay`, with the values `on-time`, `slight`, `late`, `early` and `unknown`. The code map maps it to the CSS state `[data-delay]` with the same value rather than to a prop, since the component works it out from `minutes`. The variants are `OnTime`, `Slight`, `Late`, `Early` and `Unknown`, and the stories carry those names.

## Base UI parts

Delay imports no Base UI component. It uses two Base UI utilities, at the version pinned in `package.json`: `useRender` (`@base-ui/react/use-render`) for the root and `mergeProps` (`@base-ui/react/merge-props`) to merge the caller's props over its own.

| Base UI part                     | Renders  | Perron sets                                                                                                          | Passed through                                        |
| -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `useRender` (a hook, not a part) | `<span>` | `defaultTagName: 'span'`, `className` (`pn-Delay` first, then the caller's), `data-delay`, the children (CR-3, CR-4) | `render`, `ref`, `className`, `style`, the rest props |

Base UI already does: swapping the root element for the one `render` gives, keeping the class, data attribute and children; merging the caller's `ref` with the element's; and merging event handlers, `className` and `style` through `mergeProps`.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Delay takes no `children`: it writes its own figure and words. It has no `slotProps`, because the contract keys `slotProps` by inner Base UI part and Delay has none; a caller restyles it through `className` on the root.

The delay is given as `minutes: number | null`, required, in minutes (positive late, negative early, `0` on time, `null` unknown) and rounded to the nearest whole minute, not as `value` or in seconds: the contract's `value` belongs to controls with `defaultValue` and `onChange`, and the tokens, the words and the visible figure all count whole minutes.

| Name                 | Type                   | Default      | Base UI prop         | Description                                                                                                                                                                               |
| -------------------- | ---------------------- | ------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minutes`            | `number \| null`       | (required)   | none                 | The delay in minutes: positive when late, negative when early, `0` on time, `null` when no real-time data says (timetable only, no signal). Rounded to the nearest whole minute.          |
| `render`             | Base UI's `render`     |              | inherited            | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render. |
| `minutesUnitLabel`   | `string`               | The locale's | none                 | Overrides "min", the unit after the figure                                                                                                                                                |
| `minutesLateLabel`   | `string`               | The locale's | none                 | Overrides "min late", heard after the number when late                                                                                                                                    |
| `minutesEarlyLabel`  | `string`               | The locale's | none                 | Overrides "min early", heard after the number when early                                                                                                                                  |
| `onTimeLabel`        | `string`               | The locale's | none                 | Overrides "On time"                                                                                                                                                                       |
| `delayUnknownLabel`  | `string`               | The locale's | none                 | Overrides "Delay unknown", heard in place of "—"                                                                                                                                          |
| `className`, `style` | React's                |              | through `mergeProps` | Reach the root; `className` is merged after `pn-Delay`                                                                                                                                    |
| `ref`                | `Ref<HTMLSpanElement>` |              | `useRender`'s `ref`  | Reaches the root element                                                                                                                                                                  |

## Tokens

Delay is not interactive, so its one design state is rest; each row's state names the `data-delay` value it applies to. Delay is not one of the contract's families, so it draws no fill, border or radius.

Delay comes in one size, set in `typography.data`, with no `size` prop; a caller who needs it larger (beside a `typography.data-lg` countdown) sets the font through `className`. `typography.data` is the role for "times, delays, counts and percentages in lists and tables", where Delay sits, and a second size can join later as a `size` prop without a break.

| Part    | State                          | Property               | Token                                                  |
| ------- | ------------------------------ | ---------------------- | ------------------------------------------------------ |
| `root`  | rest, every `data-delay`       | `font`                 | `typography.data`                                      |
| `root`  | rest, every `data-delay`       | `letter-spacing`       | `typography.data-tracking`                             |
| `root`  | rest, every `data-delay`       | `font-variant-numeric` | none: the keyword `tabular-nums`, so figures line up   |
| `root`  | rest, every `data-delay`       | `white-space`          | none: the keyword `nowrap`, so "+3 min" never breaks   |
| `root`  | rest, `data-delay='on-time'`   | `color`                | `color.transit.delay.on-time`                          |
| `root`  | rest, `data-delay='slight'`    | `color`                | `color.transit.delay.slight`                           |
| `root`  | rest, `data-delay='late'`      | `color`                | `color.transit.delay.late`                             |
| `root`  | rest, `data-delay='early'`     | `color`                | `color.transit.delay.early`                            |
| `root`  | rest, `data-delay='unknown'`   | `color`                | `color.transit.delay.unknown`                          |
| `value` | rest, every `data-delay`       | `color`                | none: inherits the root's                              |
| `unit`  | rest, `data-delay` with a unit | `color`                | none: inherits the root's                              |
| `label` | rest                           | none                   | none: the VisuallyHidden part's own styles, never seen |

The space between `value` and `unit` is a text space, as content design writes "4 min", not a gap token, so a copied delay reads "+3 min".

## Keyboard and ARIA

Delay is text: it takes no focus, and no key does anything. A caller who makes it a link or button through `render` brings that element's own keys.

| Key  | Does                               | From   |
| ---- | ---------------------------------- | ------ |
| none | Delay is not focusable or operable | Perron |

| Element            | Role                         | Accessible name from                                                            | States announced |
| ------------------ | ---------------------------- | ------------------------------------------------------------------------------- | ---------------- |
| `root`             | none: a generic `<span>`     | Not named; its text is read in place, as part of the row or sentence it sits in | none             |
| `value` and `unit` | hidden, `aria-hidden="true"` | Not read, except "On time", which is read as shown (CR-3)                       | none             |
| `label`            | text                         | The owned strings: "3 min late", "1 min early", "Delay unknown"                 | none             |

The visible figure is `aria-hidden`, with a VisuallyHidden label saying the delay in words: the number without its sign and then "min late" or "min early" ("3 min late", "1 min early"), and "Delay unknown" in place of "—", while "On time" is read from the visible text. A screen reader reads "+3 min" as "plus 3 min" and skips or spells "—", so the ear would get less than the eye, and an `aria-label` on a role-less `<span>` is not allowed.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the colour and sign say late, slight, early or on time; the label says "N min late" or "N min early", "On time" is read as shown, and `null` says "Delay unknown". In forced colours the colour goes, and the sign and words still carry it.
- [ ] Every landmark and named region has an accessible name: none here; Delay is inline text.
- [ ] Every default label can be overridden: `minutesUnitLabel`, `minutesLateLabel`, `minutesEarlyLabel`, `onTimeLabel` and `delayUnknownLabel`.
- [ ] Every shape the type accepts renders, in every variant: `minutes` is a number or `null`; positive, negative, zero, fractional (rounded), `NaN` and infinite (both unknown, CR-1) all render, and a story's `play` test covers each kind.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; Delay does not animate. The visible figure is `aria-hidden` because the label speaks for it, not for animation.
- [ ] Native semantics first: a `<span>`, with no role and no ARIA beyond `aria-hidden` on the figure the label replaces.
- [ ] Focus moves in reading order and returns on close: Delay takes no focus.
- [ ] Every target is at least `size.target-min` square: no target; Delay is not pressed.
- [ ] Loops stop when the system asks for less motion: none here; Delay has no motion.

## Owned strings

Every word Delay shows or announces is its own; the caller gives only `minutes`. The number is never part of a string: it renders as its own text run beside the word, so the dictionaries stay plain strings (CR-3).

| Key            | English         | Override            | Seen or heard where                                         |
| -------------- | --------------- | ------------------- | ----------------------------------------------------------- |
| `minutesUnit`  | "min"           | `minutesUnitLabel`  | `unit`, seen after a signed figure, "+3 min"; `aria-hidden` |
| `minutesLate`  | "min late"      | `minutesLateLabel`  | `label`, heard after the number when late: "3 min late"     |
| `minutesEarly` | "min early"     | `minutesEarlyLabel` | `label`, heard after the number when early: "1 min early"   |
| `onTime`       | "On time"       | `onTimeLabel`       | `value`, seen and heard when `minutes` rounds to `0`        |
| `delayUnknown` | "Delay unknown" | `delayUnknownLabel` | `label`, heard in place of "—" when `minutes` is `null`     |

No key in `packages/perron/src/locale/en.ts` says any of these, so all five are new, each with a JSDoc line like its neighbours.

"On time" and "Delay unknown" join the data-state and delay words table in `docs/content-design.md`, with their Danish, Swedish and Norwegian, so every screen says a delay the same way; content design says delays always use the words in that table, and its test then holds the locale files to them. "min", "min late" and "min early" stay out of it, as parts of a number's phrase rather than words a screen shows on their own.

## Component rules

- **CR-1.** Delay works out its kind from `minutes` after rounding it with `Math.round`: `null`, `NaN` or an infinite number is `unknown`; `0` (and `-0`) is `on-time`; `1` or `2` is `slight`; `3` or more is `late`; `-1` or less is `early`. Early has no slight step. These are the bounds the `color.transit.delay.*` tokens describe.
- **CR-2.** The visible figure is "+N" when late and "−N" when early, with U+2212, never a hyphen-minus, then a text space and the `minutesUnit` word in `unit`. On time, `value` is the `onTime` word and there is no `unit`. Unknown, `value` is "—" (U+2014) and there is no `unit`.
- **CR-3.** When late, early or unknown, `value` and `unit` are `aria-hidden="true"` and the VisuallyHidden `label` holds the words: the number without its sign, a space and `minutesLate` or `minutesEarly`, or `delayUnknown` alone. The number and each word are separate text runs, so `expectOwnedStrings` reads the words as dictionary values. On time, `value` is read as shown and there is no `label`.
- **CR-4.** The root always carries `data-delay` with the kind from CR-1, `on-time`, `slight`, `late`, `early` or `unknown`, and the CSS reads the colour from it, as [Tokens](#tokens) gives.
- **CR-5.** Delay takes no data state. A caller showing a timetable-only or no-signal vehicle passes `minutes={null}`, as [Data states](../foundations/data-states.md#delays) says those always show an unknown delay.
- **CR-6.** Delay is not a live region. A screen that updates delays announces changes of state in its own polite live region, as [Accessibility](../foundations/accessibility.md) asks.
- **CR-7.** Delay composes the VisuallyHidden shared part from its folder in `packages/perron/src/`, and never draws its own hiding styles. If no earlier component has added the part yet, Delay's build adds it, as the contract's [Shared parts](README.md#shared-parts) table already describes it.
- **CR-8.** The root renders through `useRender` with `mergeProps`: Delay's own props (`className` starting with `pn-Delay`, `data-delay`, the children) win over the caller's rest props, and `minutes` and every `*Label` prop are taken out of the rest before the merge, so none reaches the DOM.

## Stories

One per variant the deferred design will draw, named as CR-1's kinds in PascalCase. Each `play` test reads the accessibility tree, not the pixels.

| Story     | Shows                                          | `play` test                                                                                                              |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `OnTime`  | `minutes={0}`, "On time" in the on-time colour | `data-delay` is `on-time`; "On time" is visible and in the accessible text; no `label`; `minutes={0.4}` renders the same |
| `Slight`  | `minutes={2}`, "+2 min"                        | `data-delay` is `slight`; "+2 min" is visible and `aria-hidden`; the accessible text is "2 min late"                     |
| `Late`    | `minutes={7}`, "+7 min"                        | `data-delay` is `late`; the accessible text is "7 min late"; `minutes={2.6}` rounds to `late` and "+3 min"               |
| `Early`   | `minutes={-1}`, "−1 min" with U+2212           | `data-delay` is `early`; the figure starts with U+2212; the accessible text is "1 min early"                             |
| `Unknown` | `minutes={null}`, "—"                          | `data-delay` is `unknown`; "—" is `aria-hidden`; the accessible text is "Delay unknown"; `NaN` renders the same          |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                             | Don't                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Pass `minutes={null}` for a timetable-only or no-signal vehicle, because no real-time data says how late it is.                | Pass `0` when the delay is unknown: "On time" claims more certainty than the data has.                                         |
| Pass the delay in minutes, and let Delay round, sign and colour it.                                                            | Format the figure yourself and put it in a Text in a delay colour: the words for the ear and the `data-delay` kind go missing. |
| Set Delay beside stronger text, such as the departure time, because `color.transit.delay.unknown` is too faint to stand alone. | Use Delay alone as a row's only content when it may be unknown: "—" in that colour misses 4.5:1 by design.                     |
| Announce a changed delay in the screen's own polite live region, once, when its kind changes.                                  | Wrap Delay in a live region that reads every minute's change: it floods the screen reader.                                     |
| Use `color.transit.severity.delay` and its label for a delay disruption on a line.                                             | Use Delay for a line's disruption: it says how late one vehicle or departure runs.                                             |
