# Stat

A key figure with the words that say what it counts, such as "412" under "Reporting live", set large so it reads at a glance in a report, a panel or on the kiosk.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): this spec decides what the drawing would, from the [contract](README.md), the [foundations](../foundations/README.md), [content design](../content-design.md) and the tokens. Stat has no Base UI component and nothing in `dependsOn`, and the extracted prototype is not reachable from this branch, so nothing here rests on it.

## Anatomy

Penpot page `Components/Stat`. Family: none, since it is static content that sits on its container's surface and joins no family's treatment. Shared parts: VisuallyHidden, which says an unknown figure in words (CR-4).

The drawing will have a `root` board holding two layers, `label` and `value`, and no variant property, so its one variant is `Default` ([CR-1](#component-rules) and [Props](#props)). There is no `State` property: Stat is not interactive and has only its rest state.

| Part (Penpot layer) | What it is                                                                                                                                                                     | Base UI part                          | Class           | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | --------------- | --------------- |
| `root`              | A `div` stacking the label over the figure in a column                                                                                                                         | None: `useRender`, a `div` by default | `pn-Stat`       | none            |
| `label`             | A `div` holding the caller's `label`: what the figure counts, such as "Reporting live"                                                                                         | None: `useRender`, a `div` by default | `pn-Stat-label` | `label`         |
| `value`             | A `div` holding the caller's `children`: the figure, such as "412" or "4 min". With no figure it holds "—", hidden from screen readers, and the words "Unknown" for them alone | None: `useRender`, a `div` by default | `pn-Stat-value` | `value`         |

No part has a Base UI component, because none has behaviour for Base UI to give: no focus, keys, state or popup. Each part renders through Base UI's `useRender` hook instead, so the root takes `render` and each inner part takes one through its `slotProps` key, as EmptyState's parts do.

The label sits above the figure, first in the DOM and on screen, so a screen reader hears "Reporting live, 412" in the order the eye reads it: reading the name before the number tells the ear what the number is before it hears it, the visual order matches the reading order the contract asks for, and it is how a key-figure tile reads in most systems (Chakra's `Stat.Label` over `Stat.ValueText`).

The root and both parts are plain `div`s, with no `dl`, `dt` and `dd` and no `role="group"`: a single name and figure is not a list of terms (FactList is the component for those), a `dt` or `dd` outside a `dl` is invalid, and a group role adds "group" to every figure read. A caller showing several Stats as a list makes each an `li` through `render`.

## Base UI parts

No Base UI component: `baseUiParts` stays empty in `packages/perron/components.json`. Each part renders through the `useRender` hook from `@base-ui/react/use-render` and merges its props with `mergeProps` from `@base-ui/react/merge-props`, at the version pinned in `packages/perron/package.json` (1.9.0).

| Base UI part          | Renders | Perron sets                                                                                                                                                                              | Passed through                                                        |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `useRender` for root  | `div`   | `defaultTagName: 'div'`, `ref`, the class `pn-Stat`, `data-unknown` when the figure is unknown (CR-3), and the parts below as children                                                   | `render`, `className`, `style`, `ref` and the rest of the `div` props |
| `useRender` for label | `div`   | `defaultTagName: 'div'`, the class `pn-Stat-label`, `label` as children                                                                                                                  | `slotProps.label`                                                     |
| `useRender` for value | `div`   | `defaultTagName: 'div'`, the class `pn-Stat-value`, `data-unknown` when the figure is unknown (CR-3), `children` as children, or the "—" and its words when the figure is unknown (CR-4) | `slotProps.value`                                                     |

Base UI already does: swapping each part's element through `render` while keeping its class and props, joining `className` strings and `style` objects and chaining event handlers in `mergeProps`, and setting `ref` on the rendered element.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name              | Type                              | Default      | Base UI prop          | Description                                                                                                                                                                               |
| ----------------- | --------------------------------- | ------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `ReactNode`                       |              | none                  | What the figure counts, in a few words: "Reporting live", "Average delay". Required                                                                                                       |
| `children`        | `ReactNode`                       |              | none                  | The figure, formatted as content design writes numbers: "412", "4 min", "≈ 30". Leave it out when no data says it, and Stat shows "—" and says "Unknown"                                  |
| `render`          | Base UI's `render`                |              | inherited             | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render. |
| `unknownLabel`    | `string`                          | The locale's | none                  | Overrides "Unknown", heard in place of "—" when there is no figure                                                                                                                        |
| `className`       | `string`                          |              | none                  | Joined after `pn-Stat` on the root                                                                                                                                                        |
| `style`           | `CSSProperties`                   |              | none                  | Reaches the root                                                                                                                                                                          |
| `ref`             | `Ref<HTMLDivElement>`             |              | none                  | Reaches the root element                                                                                                                                                                  |
| `slotProps.label` | `useRender.ComponentProps<'div'>` |              | `useRender` for label | Props for the `label` part                                                                                                                                                                |
| `slotProps.value` | `useRender.ComponentProps<'div'>` |              | `useRender` for value | Props for the `value` part                                                                                                                                                                |

`render`, `className`, `style`, `ref` and the other `div` props reach the root, as the contract's Root section says; `render` is inherited from `useRender` as it is, with Base UI's JSDoc, and `StatProps` does not declare it again.

The figure is the `children` and its name is a required `label` prop, not a `value` prop: the contract's `value` belongs to controls with `defaultValue` and `onChange`, as Delay's spec reasons, the figure is the content the caller writes, and `<Stat label="Reporting live">412</Stat>` reads as the screen shows it. `label` is a name the contract's Names from other libraries table leaves free, and it is a `ReactNode`, not an owned-string override, since it has no `Label` suffix after a key.

Stat ships with no `color`, `variant` or `size`, one look everywhere: a status colour on a figure would say "good" or "bad" by colour alone, which [Accessibility](../foundations/accessibility.md) rules out, and the live-share thresholds the status colours carry belong to a meter's mark, not to text; one size is `typography.stat`, the role made for key figures. Any of the three can join later as an optional prop without a break.

Stat leaves number formatting to the caller, taking the figure as already-written text rather than a number it formats with the locale: the figures Mylder shows mix units ("4 min"), estimates ("≈ 30") and percentages, which one `Intl.NumberFormat` call can't cover, and the caller already formats them in the screen's locale. A bare number still renders as given (CR-2).

## Tokens

One row per part, state and property. Stat has no interactive state, so every row is rest; the unknown figure is rest with `data-unknown` on the value.

| Part    | State                | Property               | Token                                                                  |
| ------- | -------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `root`  | rest                 | `gap`                  | `space.100`                                                            |
| `label` | rest                 | `font`                 | `typography.label-sm`                                                  |
| `label` | rest                 | `letter-spacing`       | `typography.label-sm`, its tracking                                    |
| `label` | rest                 | `color`                | `color.text.secondary`                                                 |
| `value` | rest                 | `font`                 | `typography.stat`                                                      |
| `value` | rest                 | `letter-spacing`       | `typography.stat`, its tracking                                        |
| `value` | rest                 | `color`                | `color.text.primary`                                                   |
| `value` | rest                 | `font-variant-numeric` | none: the keyword `tabular-nums`, so a changing figure keeps its width |
| `value` | rest                 | `white-space`          | none: the keyword `nowrap`, so "4 min" never breaks from its unit      |
| `value` | rest, `data-unknown` | `color`                | `color.text.tertiary`                                                  |

The root is a flex column with `align-items: start` and the keyword `width: fit-content`, not a token, so it sizes to its content and a Stat made a link through `render` is no wider than its words (CR-10); every part and the root reset the margins their element may bring. `typography.label-sm`'s own use is "field and stat labels", and `typography.stat`'s is "key figures".

The root is a start-aligned flex column with `space.100` (4 px) between the label and the figure, and no fill, border, radius, padding or shadow of its own: Stat is content that takes the surface of the report, panel or kiosk bar it sits in, like EmptyState, and a box of its own would join no family. 4 px sets the small label close to the figure it names, as EmptyState spaces its title and sentence.

The figure uses tabular figures and never wraps, while the label wraps: tabular figures keep a figure that updates from shifting its width, and keep Stats side by side aligned, as the typography foundation asks for anything compared; a key figure is short, and a break inside "1 204" or between "4" and "min" would misread it, while a long Danish label must still fit 320 px.

[Typography](../foundations/typography.md#roles) steps `stat` down to `font.size.600` on phones, but the contract gives components no viewport query. Stat keeps `typography.stat` at every width, as Text does: the step-down is a token gap for the `design-tokens` skill, a phone modifier that redefines the composite on `:root`, so Stat, Text and the `perron-typography-stat` class step down together when it lands.

## Keyboard and ARIA

Stat has no keys of its own and is never focusable. A caller who makes it a link or button through `render` brings that element's own keys.

| Key  | Does                              | From   |
| ---- | --------------------------------- | ------ |
| None | Stat is not focusable or operable | Perron |

| Element                            | Role                         | Accessible name from                                    | States announced |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------- | ---------------- |
| `root`                             | None (generic `div`)         | Not named; its text is read in place, label then figure | None             |
| `label`                            | None (generic `div`)         | Its text, from `label`                                  | None             |
| `value`                            | None (generic `div`)         | Its text, from `children`                               | None             |
| The "—" in `value`, when unknown   | Hidden: `aria-hidden="true"` | Not read                                                | None             |
| The words in `value`, when unknown | Text, in VisuallyHidden      | The owned string "Unknown", or `unknownLabel`           | None             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the label and the figure are read as shown, label first; "—" is `aria-hidden` and the ear hears "Unknown" in its place (CR-4). No colour carries meaning: the figure is `color.text.primary`, and tertiary only for the "—" the words speak for.
- [ ] Every landmark and named region has an accessible name: none here; the root is not a landmark or region.
- [ ] Every default label can be overridden: `unknownLabel`.
- [ ] Every shape the type accepts renders, in every variant: `label` and `children` are `ReactNode`s; a string, a number, an element and a list each render, `0` is a figure and not unknown (CR-3), and `Stat.test.tsx` renders each shape. The `Default` story gives a string label and a string figure.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses. The "—" is `aria-hidden` because the words speak for it, not for animation.
- [ ] Native semantics first: plain `div`s, with no role and no ARIA beyond `aria-hidden` on the "—"; the caller's own element through `render`, such as an `li`.
- [ ] Focus moves in reading order and returns on close: Stat takes no focus and opens nothing.
- [ ] Every target is at least `size.target-min` square: no target; Stat is not pressed.
- [ ] Loops stop when the system asks for less motion: none here; Stat has no motion.

## Owned strings

Every word Stat shows comes from the caller, through `label` and `children`, but for the one it announces when there is no figure.

| Key       | English   | Override       | Seen or heard where                                                             |
| --------- | --------- | -------------- | ------------------------------------------------------------------------------- |
| `unknown` | "Unknown" | `unknownLabel` | `value`, heard in place of the `aria-hidden` "—" when there is no figure (CR-4) |

No key in `packages/perron/src/locale/en.ts` says it: `delayUnknown`, "Delay unknown", names a delay, so `unknown` is new, with a JSDoc line like its neighbours.

The new key is `unknown`, English "Unknown", with Danish "Ukendt", Swedish "Okänd" and Norwegian Bokmål "Ukjent": after the label it reads "Reporting live, Unknown", says no more than the data knows, as content design asks, and matches the "unknown" in "Delay unknown" in each language.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** Stat has one look: no `color`, `variant` or `size` prop and no `data-variant`, `data-color` or `data-size` attribute, as [Props](#props) sets out.
- **CR-2.** Stat doesn't format the figure: `children` renders as given, a number as React writes it, as [Props](#props) sets out.
- **CR-3.** The figure is unknown when `children` renders nothing (`null`, `undefined`, a boolean, `''`, or an array of only such values) or is a number that is not finite (`NaN`, `Infinity`). `0` and `'0'` are figures. When unknown, the root and the value part both carry the bare attribute `data-unknown`: the CSS reads the "—" colour from the value's, as `.pn-Stat-value[data-unknown]`, one class then an attribute, so a caller's `slotProps.value.className` can restyle it; the root's tells the caller the figure is unknown.
- **CR-4.** Stat shows an unknown figure itself, as "—" in `color.text.tertiary` with `aria-hidden="true"`, followed by the owned string "Unknown" in the VisuallyHidden shared part: content design writes "—" for unknown and the brand never shows a guess, while a screen reader skips or spells a bare "—", so the ear would get less than the eye; Delay does the same for an unknown delay. Tertiary is allowed because the "—" always sits under the stronger label.
- **CR-5.** The "—" is the character U+2014 in its own `span`, and the words are their own text run, so `expectOwnedStrings` reads them as a dictionary value.
- **CR-6.** Stat composes the VisuallyHidden shared part from `packages/perron/src/parts/VisuallyHidden/` and never draws its own hiding styles.
- **CR-7.** Each inner part's props are its `slotProps` value merged with `mergeProps`, the component's own props last, so its class and children stay while the caller's `className` joins and its `render` swaps the element.
- **CR-8.** `label`, `children`, `unknownLabel`, `slotProps` and `render` are taken out of the rest props before they reach the root, so none reaches the DOM as an attribute.
- **CR-9.** Stat is not a live region and never moves focus. A screen that updates its figures announces changes of state in its own polite live region, as [Accessibility](../foundations/accessibility.md) asks.
- **CR-10.** Stat sizes to its content, with no width of its own; the label wraps (`overflow-wrap: anywhere`) and the figure does not (see [Tokens](#tokens)).

## Stories

One per variant the deferred design will draw. It has no variant property, so its one variant is `Default`; `Unknown` is the same variant with no figure, and proves CR-3 and CR-4. The contract story renders `Default`.

| Story     | Shows                                                                                                             | `play` test                                                                                                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Default` | `label` "Reporting live" over the figure "412"; the contract story renders it, and its args pass every rule alone | The label comes before the figure in the accessible text; neither the root nor the value has `data-unknown`; the figure's computed `font-variant-numeric` is `tabular-nums`; nothing in it takes focus |
| `Unknown` | `label` "Reporting live" with no `children`: "—" under it                                                         | The root and the value carry `data-unknown`; "—" is `aria-hidden`; the accessible text is "Reporting live" then "Unknown"                                                                              |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                   | Don't                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Leave out `children` when no data gives the figure, so Stat shows "—" and says "Unknown"                             | Pass `0` or a guess when the figure is unknown: the brand never claims more than the data knows                                |
| Write the figure as content design does: "4 min" with a space, "≈ 30" for an estimate, "−1" with the true minus sign | Put the label's words inside the figure, such as "412 live": the figure stays short, and the label says what it counts         |
| Name the figure in a few words in `label`: "Reporting live", "Average delay"                                         | Leave `label` empty and rely on the layout to say what the number is: a figure without its name tells the ear nothing          |
| Say a status in words beside the figure, or show it with a Meter or a SeverityLabel                                  | Colour the figure through `className` to say it is good or bad: colour alone tells no screen reader and no colour-blind person |
| Use Delay for one vehicle's or departure's delay, and Text with `variant='stat'` for a figure inside a sentence      | Use Stat in a row of a list or table: it is set large for a key figure, and rows compare figures in a `data` role              |
| Announce a changed figure in the screen's own polite live region, when it changes state                              | Make a Stat a live region: a figure that updates every few seconds floods the screen reader                                    |
