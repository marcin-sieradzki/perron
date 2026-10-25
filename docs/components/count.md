# Count

A small pill holding how many there are, such as the "3" after "Delays" in a filter chip or the "12" after "Lines" on a tab, set in tabular figures on an inset or tinted surface.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): this spec decides what the drawing would, from the [contract](README.md), the [foundations](../foundations/README.md), [content design](../content-design.md), the tokens and the specs of its Display siblings, [Stat](stat.md)'s, [Text](text.md)'s and [LineBadge](line-badge.md)'s. Count has no Base UI component and nothing in `dependsOn`, and the extracted prototype is not reachable from this branch, so nothing here rests on it. The foundations already name its look: [Typography](../foundations/typography.md#roles) gives `typography.data-sm` to "counts in chips and tabs", [Elevation](../foundations/elevation.md) puts counts on `color.surface.inset`, [Semantic spacing](../foundations/semantic-spacing.md#radius) rounds them with `radius.full`, and [Semantic colours](../foundations/semantic-colours.md) gives `color.surface.warning` to "a warning message or count".

## Anatomy

Penpot page `Components/Count`. Family: none, since it is a static mark that joins no family's treatment: it is not pressed, takes no hover and is not one of the Rows, Fields, Popups, Panels or Tooltips. Shared parts: VisuallyHidden, which says an unknown count in words (CR-5).

The drawing will have a `root` board holding one text layer, `text`, and one variant property, `color`, with the values `neutral`, `success`, `warning`, `danger` and `info`, in that order. There is no `State` property: Count is not interactive and has only its rest state; the unknown count is rest with `data-unknown`.

| Part (Penpot layer) | What it is                                                                                                                                                                                                                    | Base UI part                                  | Class      | `slotProps` key |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------- | --------------- |
| `root`              | The pill: an inline `<span>` on the intent's surface, its text centred, at least as wide as it is tall, so a single digit sits in a circle                                                                                    | none: a `<span>` rendered through `useRender` | `pn-Count` | none            |
| `text`              | The count, such as "3" or "1 204", from the caller's `children`; the root's own text, with no element, class or `slotProps` key of its own. With no count it is "—", hidden from screen readers, and "Unknown" for them alone | none: the root's text                         | none       | none            |

No part has a Base UI component, because a count has no behaviour for Base UI to give: no focus, keys, state or popup. The root renders through Base UI's `useRender` hook instead, which gives it the `render` prop, as LineBadge's does. With the root holding the text directly there is no inner part, so Count takes no `slotProps`.

The root is a `<span>`: a count sits inside a chip's or a tab's `<button>`, a heading or a sentence, where only phrasing content is allowed.

## Base UI parts

No Base UI component: `baseUiParts` stays empty in `packages/perron/components.json`. The root renders through the `useRender` hook from `@base-ui/react/use-render` and merges its props with `mergeProps` from `@base-ui/react/merge-props`, at the version pinned in `packages/perron/package.json` (1.9.0). `get_reference` has no page for `useRender`; its types are in `node_modules/@base-ui/react/use-render/useRender.d.ts`.

| Base UI part | Renders  | Perron sets                                                                                                                                                                         | Passed through                                                           |
| ------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `useRender`  | `<span>` | `defaultTagName: 'span'`; `ref`; `props`: `mergeProps(rest, own)`, where `own` is `className: 'pn-Count'`, `data-color`, `data-unknown` when the count is unknown, and the children | `render`, `ref`, `className`, `style` and every other `<span>` attribute |

Base UI already does: swapping the root element for the `render` element or function while keeping Perron's class, data attributes and `ref`; joining `className` strings, merging `style` objects and chaining event handlers in `mergeProps`. Count adds no behaviour of its own.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. No slots: Count has no part but its root.

| Name           | Type                                                        | Default      | Base UI prop | Description                                                                                                                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------- | ------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`        | `'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'`  | none         | The intent: what the count means. `neutral` is a plain tally, such as lines on a tab; the status intents tint the pill for a count of good or bad news, such as `danger` for lines with delays. Always beside words that say what is counted, such as "Delays": colour is never the only sign. |
| `children`     | `ReactNode`                                                 |              | none         | The count, written as the screen shows it: `3`, `'1 204'`, `'99+'`. Leave it out when no data gives the count, and Count shows "—" and says "Unknown". `0` is a count, and shows.                                                                                                              |
| `render`       | Base UI's `render`                                          |              | inherited    | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render.                                                                                                      |
| `unknownLabel` | `string`                                                    | The locale's | none         | Overrides "Unknown", heard in place of "—" when there is no count                                                                                                                                                                                                                              |
| `className`    | `string`                                                    |              | none         | Joined after `pn-Count` on the root                                                                                                                                                                                                                                                            |
| `style`        | `CSSProperties`                                             |              | none         | Reaches the root                                                                                                                                                                                                                                                                               |
| `ref`          | `Ref<HTMLSpanElement>`                                      |              | none         | Reaches the root element                                                                                                                                                                                                                                                                       |

`render`, `className`, `style`, `ref` and the other `<span>` attributes reach the root, as the contract's [Root](README.md#root) says; `render` is inherited from `useRender` as it is, with Base UI's JSDoc, and `CountProps` does not declare it again.

Count offers `color` with `neutral` and the four status intents, `success`, `warning`, `danger` and `info`, and not `brand`. Each of the five has a text token and a tinted surface in the contract's [Intents](README.md#intents) table, and [Accessibility](../foundations/accessibility.md) measures each status text at 4.5:1 on its own tint, so every pill's figure reads; the foundations already give status tints to counts. `brand` is left out because the contract keeps it for the main action, and a count is never an action. The status intents take their tinted surface, not `color.status.*` as a solid fill, since the contract gives them no solid fill: no text colour is measured on `color.status.*`.

Count ships with one size and one look, with no `size` and no `variant` prop. `typography.data-sm` is the role made for "counts in chips and tabs", the only places a count goes so far, and both props can join later as optional props without a break. With neither, the root carries `data-color` alone of the contract's three attributes.

Count takes the count as `children`, written by the caller, and neither formats it nor caps it, with no `max` prop. As Stat's spec reasons, the caller already writes numbers in the screen's locale ("1 204" in English, "1.204" in Danish) and content design's way, a `value` prop belongs to controls with `defaultValue` and `onChange`, and `<Count>3</Count>` reads as the screen shows it; a caller who caps writes `'99+'` itself. A bare number still renders as given (CR-2), and a `max` can join later without a break.

## Tokens

One row per part, state and property. Count has one design state, rest: it is never interactive (CR-8). The unknown count is rest with `data-unknown` on the root. The text layer has no element, so every row is the root's.

| Part   | State                           | Property               | Token                                                                                                               |
| ------ | ------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `root` | rest, `color` neutral           | `background`           | `color.surface.inset`                                                                                               |
| `root` | rest, `color` neutral           | `color`                | `color.text.primary`                                                                                                |
| `root` | rest, `color` success           | `background`           | `color.surface.success`                                                                                             |
| `root` | rest, `color` success           | `color`                | `color.text.success`                                                                                                |
| `root` | rest, `color` warning           | `background`           | `color.surface.warning`                                                                                             |
| `root` | rest, `color` warning           | `color`                | `color.text.warning`                                                                                                |
| `root` | rest, `color` danger            | `background`           | `color.surface.danger`                                                                                              |
| `root` | rest, `color` danger            | `color`                | `color.text.danger`                                                                                                 |
| `root` | rest, `color` info              | `background`           | `color.surface.info`                                                                                                |
| `root` | rest, `color` info              | `color`                | `color.text.info`                                                                                                   |
| `root` | rest, `data-unknown`            | `background`           | `color.surface.inset`, whatever its `color` (CR-6)                                                                  |
| `root` | rest, `data-unknown`            | `color`                | `color.text.tertiary`, whatever its `color` (CR-6)                                                                  |
| `root` | rest                            | `font`                 | `typography.data-sm`                                                                                                |
| `root` | rest                            | `letter-spacing`       | `typography.data-sm`, its tracking                                                                                  |
| `root` | rest                            | `border-radius`        | `radius.full`                                                                                                       |
| `root` | rest                            | `padding-block`        | `space.050`                                                                                                         |
| `root` | rest                            | `padding-inline`       | `space.150`                                                                                                         |
| `root` | rest                            | `min-width`            | `space.050`, as `calc(1lh + 2 * var(--perron-space-050))`: one line of the count plus its block padding, its height |
| `root` | rest                            | `font-variant-numeric` | none: the keyword `tabular-nums`, so a changing count keeps its width                                               |
| `root` | rest                            | `white-space`          | none: the keyword `nowrap`, so "1 204" never breaks                                                                 |
| `root` | rest, `(forced-colors: active)` | `outline`              | `border.width.025`, `solid` in the system colour `CanvasText` (CR-7)                                                |

The root is `display: inline-block` with `box-sizing: border-box`, `text-align: center` and `vertical-align: baseline`, keywords all, so its figure sits on the baseline of the words beside it. Its height is one line of `typography.data-sm` (11 px at 1.3, 14.3 px) and `space.050` above and below, about 18 px; `min-width` is the same, so "3" sits in a circle and "12" or "1 204" stretches into a pill.

The pill is padded `space.050` (2 px) above and below and `space.150` (6 px) either side, at least `calc(1lh + 2 * var(--perron-space-050))` wide, with a `border.width.025` outline in `CanvasText` in forced colours. No `size.*` token holds a count's height, and none is needed: the line height and the block padding give it, about 18 px, small enough to sit inside a 34 px `size.control` chip beside its `typography.label` words; 6 px either side matches LineBadge's medium padding, and the `min-width` makes one digit a circle rather than a squeezed oval, using the `1lh` the contract allows. Forced colours drop the background, so without the outline the pill would vanish into the words beside it; an outline takes no space, so the geometry holds in both modes.

## Keyboard and ARIA

Count has no keys of its own and is never focusable. A caller who makes it a link or button through `render` brings that element's own keys, and its target size with them.

| Key  | Does                               | From   |
| ---- | ---------------------------------- | ------ |
| None | Count is not focusable or operable | Perron |

| Element                           | Role                         | Accessible name from                                                        | States announced |
| --------------------------------- | ---------------------------- | --------------------------------------------------------------------------- | ---------------- |
| `root`                            | None (generic `<span>`)      | Not named; its text is read in place, after the words beside it: "Delays 3" | None             |
| The "—" in `root`, when unknown   | Hidden: `aria-hidden="true"` | Not read                                                                    | None             |
| The words in `root`, when unknown | Text, in VisuallyHidden      | The owned string "Unknown", or `unknownLabel`                               | None             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the count is read as shown, as part of the text around it; "—" is `aria-hidden` and the ear hears "Unknown" in its place (CR-5). A status `color` tells the eye nothing the caller's words beside it don't say ("Delays 3"), and the review holds the stories to it (CR-9).
- [ ] Every landmark and named region has an accessible name: none here; the root is not a landmark or region.
- [ ] Every default label can be overridden: `unknownLabel`.
- [ ] Every shape the type accepts renders, in every variant: `children` is a `ReactNode`; a number, a string, an element and a list each render, `0` and `'0'` are counts and not unknown (CR-4), and `Count.test.tsx` renders each shape. The colour stories give a number or a string.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses. The "—" is `aria-hidden` because the words speak for it, not for animation.
- [ ] Native semantics first: a plain `<span>`, with no role and no ARIA beyond `aria-hidden` on the "—"; the caller's own element through `render`.
- [ ] Focus moves in reading order and returns on close: Count takes no focus and opens nothing.
- [ ] Every target is at least `size.target-min` square: no target; Count is not pressed. The chip or tab it sits in is the target, and meets the size itself.
- [ ] Loops stop when the system asks for less motion: none here; Count has no motion.

## Owned strings

Every word Count shows comes from the caller, as `children`, but for the one it announces when there is no count.

| Key       | English   | Override       | Seen or heard where                                                           |
| --------- | --------- | -------------- | ----------------------------------------------------------------------------- |
| `unknown` | "Unknown" | `unknownLabel` | `root`, heard in place of the `aria-hidden` "—" when there is no count (CR-5) |

`unknown` is the key `packages/perron/src/locale/en.ts` already has for Stat and FactList, with its Danish, Swedish and Norwegian; the build adds Count to its JSDoc line and adds no key.

With no count, Count shows "—" in `color.text.tertiary` on `color.surface.inset`, whatever its `color`, `aria-hidden`, followed by the owned string "Unknown" in VisuallyHidden, as Stat and FactList do. Content design writes "—" for unknown and the brand never shows a guess, so Count shows neither `0` nor nothing when the data is missing; a screen reader skips or spells a bare "—", so the ear gets "Delays Unknown". An unknown count says nothing good or bad, so it drops its status tint; `color.text.tertiary` is allowed for the "—" of an unknown figure, always next to stronger text, as [Accessibility](../foundations/accessibility.md) lists it. A caller who wants no pill at all renders no Count.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** Count renders one `<span>` through `useRender`, `defaultTagName: 'span'`. `render` swaps it, and the swapped element keeps `pn-Count`, the data attributes and the `ref`. Props merge as `mergeProps(rest, own)`, the caller's first, so Count's own class and data attributes win and `className` reads `pn-Count` and then the caller's. `color`, `children`, `unknownLabel` and `render` are taken out of `rest` before the merge, so none reaches the DOM as an attribute.
- **CR-2.** Count doesn't format or cap the count: `children` renders as given, a number as React writes it, as [Props](#props) decides for `children`.
- **CR-3.** The root always carries `data-color` with the prop's value, the default included, and no `data-variant` or `data-size`: Count has neither prop, as [Props](#props) decides.
- **CR-4.** The count is unknown when `children` renders nothing (`null`, `undefined`, a boolean, `''`, or an array of only such values) or is a number that is not finite (`NaN`, `Infinity`), as Stat decides it. `0` and `'0'` are counts. When unknown, the root carries the bare attribute `data-unknown`.
- **CR-5.** An unknown count shows "—", the character U+2014 in its own `aria-hidden="true"` `<span>`, followed by the owned string "Unknown" (or `unknownLabel`) in the VisuallyHidden shared part, its own text run so `expectOwnedStrings` reads it as a dictionary value. Count composes VisuallyHidden from `packages/perron/src/parts/VisuallyHidden/` and never draws its own hiding styles.
- **CR-6.** `.pn-Count[data-unknown]` sets `background` to `color.surface.inset` and `color` to `color.text.tertiary`, and comes after the `[data-color]` rules, so it wins over every intent at the same specificity: an unknown count has no status to tint, as [Owned strings](#owned-strings) decides.
- **CR-7.** Inside `@media (forced-colors: active)`, the root draws an `outline` of `border.width.025` in `CanvasText`, since forced colours drop its background and the pill would vanish into the words beside it. An outline takes no space, so the pill keeps its geometry, as [Tokens](#tokens) sets it.
- **CR-8.** Count is not interactive: no `tabIndex`, no handler of its own, no hover. The caller's handlers and attributes reach the root unchanged.
- **CR-9.** A status `color` comes with words that say what is counted: "Delays 3", not a red "3" alone. Count can't hold this for the caller, so its JSDoc for `color` says it and the review holds the stories to it.
- **CR-10.** Count is not a live region and never moves focus. A screen whose counts update announces changes of state in its own polite live region, as [Accessibility](../foundations/accessibility.md) asks.
- **CR-11.** Count sizes to its content: no width of its own beyond its `min-width`, and it never wraps or truncates (see [Tokens](#tokens)).

## Stories

One per variant the deferred design will draw, named by the Penpot convention: the `color` value in PascalCase. `Unknown` is the neutral variant with no count, and proves CR-4 to CR-6. With no `Default` story, the [subject story](README.md#root) is the alphabetically first export, `Danger`. Each story renders Count alone, from its args.

| Story     | Shows                                                                                                                    | `play` test                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Danger`  | `color='danger'`, the count `3`; the subject story, which the contract story renders, and its args pass every rule alone | The root carries `data-color='danger'`                                                                                                                                                                                                    |
| `Info`    | `color='info'`, the count `2`                                                                                            | none                                                                                                                                                                                                                                      |
| `Neutral` | `color='neutral'`, the default, the count `'12'`                                                                         | The root is a `<span>` with class `pn-Count` and `data-color='neutral'`, without `data-unknown`, and the `ref` reaches it; its computed `font-variant-numeric` is `tabular-nums` and `white-space` is `nowrap`; nothing in it takes focus |
| `Success` | `color='success'`, the count `0`, which shows as a count                                                                 | The text is "0" and the root has no `data-unknown`                                                                                                                                                                                        |
| `Warning` | `color='warning'`, the count `5`, a single digit                                                                         | Its rendered width and height differ by less than 1 px, so one digit sits in a circle                                                                                                                                                     |
| `Unknown` | `color='neutral'` with no `children`: "—"                                                                                | The root carries `data-unknown`; "—" is `aria-hidden`; the accessible text is "Unknown"                                                                                                                                                   |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                      | Don't                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Put a Count after the words that say what it counts, with a space between them in the markup: `Delays <Count>3</Count>` | Leave the space out: the accessible name may run the words together, "Delays3"                                           |
| Leave out `children` when no data gives the count, so Count shows "—" and says "Unknown"                                | Pass `0` or a guess when the count is unknown: the brand never claims more than the data knows                           |
| Render no Count when there is nothing to count and the screen hides empty tallies                                       | Rely on Count to hide itself at `0`, as MUI's Badge does: `0` is a count, and Count shows it                             |
| Write the count in the screen's locale, and cap it yourself if the space is short: `'1 204'`, `'99+'`                   | Squeeze a long count into a narrow chip and let it overflow: Count never wraps or truncates                              |
| Use a status `color` for a count of good or bad news beside the words that name it, such as `danger` after "Delays"     | Let the tint be the only sign, or colour a plain tally such as the number of lines on a tab                              |
| Use Stat for a key figure and Text with a `data` role for a number in a row or a sentence                               | Use Count as a key figure or inside running text as a number: it is a small pill for tallies in chips, tabs and headings |
| Use LineBadge to name a line                                                                                            | Put a line's name in a Count: it takes the operator's colour, not an intent                                              |
| Announce a changed count in the screen's own polite live region, when it changes state                                  | Make a Count a live region: a tally that updates every few seconds floods the screen reader                              |
