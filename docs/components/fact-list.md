# FactList

A short list of facts about one thing, each a name and what it is, such as "Operator: Movia" and "Last report: 08:14" about a vehicle, set as a description list in a detail panel or a report.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): this spec decides what the drawing would, from the [contract](README.md), the [foundations](../foundations/README.md), [content design](../content-design.md), the tokens and the specs of its Display siblings, [Stat](stat.md)'s and [Text](text.md)'s. FactList has no Base UI component and nothing in `dependsOn`, and the extracted prototype is not reachable from this branch, so nothing here rests on it.

## Anatomy

Penpot page `Components/FactList`. Family: none, since it is static content that sits on its container's surface: it is not one of the Rows family's options, menu items or list rows, which are pressed and take a hover, and it draws no surface of its own. Shared parts: VisuallyHidden, which says an unknown value in words (CR-5).

The drawing will have a `root` board holding one `item` board per fact, each holding two layers, `label` and `value`, and no variant property, so its one variant is `Default` ([Props](#props) and CR-1). There is no `State` property: FactList is not interactive and has only its rest state.

| Part (Penpot layer) | What it is                                                                                                                                                          | Base UI part                          | Class               | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------- | --------------- |
| `root`              | A `dl` laying the facts out in a grid of two columns, names in the first and values in the second                                                                   | None: `useRender`, a `dl` by default  | `pn-FactList`       | none            |
| `item`              | A `div` holding one fact's name and value, one per entry of `items`, laid on the root's two columns                                                                 | None: `useRender`, a `div` by default | `pn-FactList-item`  | `item`          |
| `label`             | A `dt` holding the fact's name, the item's `label`: "Operator"                                                                                                      | None: `useRender`, a `dt` by default  | `pn-FactList-label` | `label`         |
| `value`             | A `dd` holding what the fact is, the item's `value`: "Movia". With no value it holds "—", hidden from screen readers, and the words "Unknown" for them alone (CR-5) | None: `useRender`, a `dd` by default  | `pn-FactList-value` | `value`         |

No part has a Base UI component, because none has behaviour for Base UI to give: no focus, keys, state or popup. Each part renders through Base UI's `useRender` hook instead, so the root takes `render` and each inner part takes one through its `slotProps` key, as EmptyState's and Stat's parts do.

A `dl` with a `div` around each `dt` and `dd` is HTML's own element for name and value groups, which the contract's "native semantics first" asks for: most screen readers say it is a list and how many facts it holds, and reads each name as a term and each value as its definition. The `div` is the one wrapper HTML allows inside a `dl`, and it is what lets each fact be styled, keyed and given props as one row.

The name comes first in the DOM and on screen, at the start of its row, so the ear hears "Operator, Movia" in the order the eye reads it.

## Base UI parts

No Base UI component: `baseUiParts` stays empty in `packages/perron/components.json`. Each part renders through the `useRender` hook from `@base-ui/react/use-render` and merges its props with `mergeProps` from `@base-ui/react/merge-props`, at the version pinned in `packages/perron/package.json` (1.9.0).

| Base UI part          | Renders | Perron sets                                                                                                                                                                                       | Passed through                                                       |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `useRender` for root  | `dl`    | `defaultTagName: 'dl'`, `ref`, the class `pn-FactList`, and one item part per entry of `items` as children                                                                                        | `render`, `className`, `style`, `ref` and the rest of the `dl` props |
| `useRender` for item  | `div`   | `defaultTagName: 'div'`, the class `pn-FactList-item`, `data-unknown` when the fact's value is unknown (CR-4), the React `key` from the entry's `key` or its index, and the label and value parts | `slotProps.item`, on every item                                      |
| `useRender` for label | `dt`    | `defaultTagName: 'dt'`, the class `pn-FactList-label`, the entry's `label` as children                                                                                                            | `slotProps.label`, on every label                                    |
| `useRender` for value | `dd`    | `defaultTagName: 'dd'`, the class `pn-FactList-value`, `data-unknown` when unknown (CR-4), the entry's `value` as children, or the "—" and its words when unknown (CR-5)                          | `slotProps.value`, on every value                                    |

Base UI already does: swapping each part's element through `render` while keeping its class and props, joining `className` strings and `style` objects and chaining event handlers in `mergeProps`, and setting `ref` on the rendered element.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name              | Type                              | Default      | Base UI prop          | Description                                                                                                                                                                               |
| ----------------- | --------------------------------- | ------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`           | `ReadonlyArray<FactListItem>`     |              | none                  | The facts, in reading order, each `{ label, value, key }`: `label` names the fact, `value` says what it is, and `key` is its React key when the facts change order. Required              |
| `render`          | Base UI's `render`                |              | inherited             | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render. |
| `unknownLabel`    | `string`                          | The locale's | none                  | Overrides "Unknown", heard in place of "—" for a fact with no value                                                                                                                       |
| `className`       | `string`                          |              | none                  | Joined after `pn-FactList` on the root                                                                                                                                                    |
| `style`           | `CSSProperties`                   |              | none                  | Reaches the root                                                                                                                                                                          |
| `ref`             | `Ref<HTMLDListElement>`           |              | none                  | Reaches the root element                                                                                                                                                                  |
| `slotProps.item`  | `useRender.ComponentProps<'div'>` |              | `useRender` for item  | Props for every `item` part                                                                                                                                                               |
| `slotProps.label` | `useRender.ComponentProps<'dt'>`  |              | `useRender` for label | Props for every `label` part                                                                                                                                                              |
| `slotProps.value` | `useRender.ComponentProps<'dd'>`  |              | `useRender` for value | Props for every `value` part                                                                                                                                                              |

`FactListItem`, exported from `FactList.tsx` beside `FactListProps`, is `{ label: ReactNode; value?: ReactNode; key?: Key }`, each member with its JSDoc: `label` the fact's name, required; `value` what it is, left out when no data says it; `key` the React key for its row, the entry's index when left out.

`render`, `className`, `style`, `ref` and the other `dl` props, such as `aria-label`, reach the root, as the contract's Root section says; `render` is inherited from `useRender` as it is, with Base UI's JSDoc, and `FactListProps` does not declare it again. `FactListProps` leaves out the `dl`'s `children`: the facts come from `items` alone.

FactList takes its facts as one `items` prop, an array of `{ label, value, key }`, not as children written with a FactListItem component. The contract makes a child the caller writes many times a component of its own folder and registry entry, and `packages/perron/components.json` has one entry, FactList; an array keeps every row's `dt`, `dd` and unknown value FactList's own, so a caller can't put a stray element in the `dl` that breaks its grouping. The item's fields are `label` and `value`, as Chakra's DataList names them, since they are fields of an entry and not props of FactList, so the contract's `value`, a control's state with `defaultValue` and `onChange`, never reaches them; `label` is the name Stat gives its own name. Every name here is one the contract's Names from other libraries table leaves free.

FactList ships one look, with no `variant`, `color` or `size`. Every fact list on Mylder's screens is a short block of names and values in a detail panel or report, so one look keeps them alike; a status colour on a value would say good or bad by colour alone, which [Accessibility](../foundations/accessibility.md) rules out; and a stacked layout, a name over its value, can join later as an optional `variant` without a break.

FactList leaves formatting to the caller, as Stat does: each `value` renders as given, so the caller writes it as content design writes numbers, "32 km/h", "08:14", "≈ 30", in the screen's locale.

## Tokens

One row per part, state and property. FactList has no interactive state, so every row is rest; an unknown value is rest with `data-unknown` on the value.

| Part    | State                | Property               | Token                                                                      |
| ------- | -------------------- | ---------------------- | -------------------------------------------------------------------------- |
| `root`  | rest                 | `column-gap`           | `space.300`                                                                |
| `root`  | rest                 | `row-gap`              | `space.200`                                                                |
| `item`  | rest                 | `border`               | none: no divider between rows                                              |
| `label` | rest                 | `font`                 | `typography.label-sm`                                                      |
| `label` | rest                 | `letter-spacing`       | `typography.label-sm`, its tracking                                        |
| `label` | rest                 | `color`                | `color.text.secondary`                                                     |
| `value` | rest                 | `font`                 | `typography.label`                                                         |
| `value` | rest                 | `letter-spacing`       | `typography.label`, its tracking                                           |
| `value` | rest                 | `color`                | `color.text.primary`                                                       |
| `value` | rest                 | `font-variant-numeric` | none: the keyword `tabular-nums`, so a figure that updates keeps its width |
| `value` | rest, `data-unknown` | `color`                | `color.text.tertiary`                                                      |

The layout is two aligned columns, every name at the start of its row and every value start-aligned in a second column, with `space.300` between the columns and `space.200` between the rows. The root is a grid with `grid-template-columns: minmax(0, max-content) minmax(0, 1fr)`, keywords and not tokens, and each item spans both columns with `grid-template-columns: subgrid` and `align-items: baseline`, so the names size to the longest, the values line up down one edge whatever their length, and the 12 px name sits on the 13 px value's baseline. A value that wraps then reads as running text, where an end-aligned one would be ragged on its left. 12 px is the measure [Semantic spacing](../foundations/semantic-spacing.md#space) gives a detail panel's parts, set apart here as name and value, and 8 px keeps the rows of one block closer than the panel's parts. Both columns wrap (`overflow-wrap: anywhere`), so a long Danish name or a long value still fits 320 px; the root and every part reset the margins their element brings, the `dd`'s inline indent among them.

The rows are undivided, with no hairline between them. The brand asks for calm, and a few facts spaced `space.200` apart read as rows without lines; the panel around them already has its edge, and a divider is the Rows family's mark for pressable rows. A caller who wants one adds it through `slotProps.item.className`, in `border.width.025` and `color.border.subtle` as the Rows family draws it.

The name is in `typography.label-sm` and `color.text.secondary`, and the value in `typography.label` and `color.text.primary` with tabular figures. `typography.label-sm` is the role for "field and stat labels" and the one Stat names its figure with, so the Display family names things alike; `typography.label` is the role for "names in lists", a value one step stronger than its name, so the eye reads the value first; tabular figures keep a time or speed that updates from shifting, as [Typography](../foundations/typography.md#roles) asks for anything compared.

## Keyboard and ARIA

FactList has no keys of its own and is never focusable. A value the caller makes a link or button brings that element's own keys, in reading order.

| Key  | Does                                  | From   |
| ---- | ------------------------------------- | ------ |
| None | FactList is not focusable or operable | Perron |

| Element                            | Role                                                 | Accessible name from                                         | States announced                                      |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| `root`                             | None in ARIA: the browser exposes a description list | Not named, or the caller's `aria-label` or `aria-labelledby` | None; most screen readers say how many facts it holds |
| `item`                             | None (generic `div`)                                 | Not named; its name and value are read in place, name first  | None                                                  |
| `label`                            | `term`, from the `dt`                                | Its text, from the item's `label`                            | None                                                  |
| `value`                            | `definition`, from the `dd`                          | Its text, from the item's `value`                            | None                                                  |
| The "—" in `value`, when unknown   | Hidden: `aria-hidden="true"`                         | Not read                                                     | None                                                  |
| The words in `value`, when unknown | Text, in VisuallyHidden                              | The owned string "Unknown", or `unknownLabel`                | None                                                  |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: each name and value is read as shown, name first; "—" is `aria-hidden` and the ear hears "Unknown" in its place (CR-5). No colour carries meaning: values are `color.text.primary`, and tertiary only for the "—" the words speak for.
- [ ] Every landmark and named region has an accessible name: none here; the `dl` is a list, not a landmark or region, and a caller who names it gives `aria-label` or `aria-labelledby` on the root.
- [ ] Every default label can be overridden: `unknownLabel`.
- [ ] Every shape the type accepts renders, in every variant: `label` and `value` are `ReactNode`s; a string, a number, an element and a list each render, `0` is a value and not unknown (CR-4), an empty `items` renders an empty `dl` (CR-8), and `FactList.test.tsx` renders each shape. The `Default` story gives string names and values.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses. The "—" is `aria-hidden` because the words speak for it, not for animation.
- [ ] Native semantics first: `dl`, `div`, `dt` and `dd`, HTML's description list, with no role and no ARIA beyond `aria-hidden` on the "—".
- [ ] Focus moves in reading order and returns on close: FactList takes no focus and opens nothing; focusable values, such as links, come in the order of `items`.
- [ ] Every target is at least `size.target-min` square: no target of its own; a link a caller puts in a value is the caller's to size.
- [ ] Loops stop when the system asks for less motion: none here; FactList has no motion.

## Owned strings

Every word FactList shows comes from the caller, through each item's `label` and `value`, but for the one it announces for a fact with no value.

| Key       | English   | Override       | Seen or heard where                                                               |
| --------- | --------- | -------------- | --------------------------------------------------------------------------------- |
| `unknown` | "Unknown" | `unknownLabel` | `value`, heard in place of the `aria-hidden` "—" when an item has no value (CR-5) |

A fact with no value shows "—" and says "Unknown", reusing Stat's `unknown` key. Content design writes "—" for unknown and the brand never shows a guess, while a screen reader skips or spells a bare "—", so the ear would hear a name with nothing after it; Stat and Delay do the same, and one word across the Display family keeps every screen agreeing. `unknown`, "Unknown", is the key Stat added to `packages/perron/src/locale/en.ts`, with Danish "Ukendt", Swedish "Okänd" and Norwegian Bokmål "Ukjent"; its JSDoc, which names Stat alone, widens to name any figure or value no data gives.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** FactList has one look: no `variant`, `color` or `size` prop and no `data-variant`, `data-color` or `data-size` attribute, as [Props](#props) sets out.
- **CR-2.** FactList renders one item part per entry of `items`, in the array's order, each holding its label part then its value part, and nothing else inside the `dl`, so the description list stays valid.
- **CR-3.** FactList doesn't format a value: each `value` renders as given, a number as React writes it.
- **CR-4.** A value is unknown when it renders nothing (`null`, `undefined`, a boolean, `''`, or an array of only such values) or is a number that is not finite (`NaN`, `Infinity`). `0` and `'0'` are values. When unknown, the item and the value part both carry the bare attribute `data-unknown`: the CSS reads the "—" colour from the value's, as `.pn-FactList-value[data-unknown]`, one class then an attribute, so a caller restyles it through `slotProps.value.className`, selected with `[data-unknown]` as FactList's is; the item's lets a caller style the whole row.
- **CR-5.** FactList shows an unknown value itself, as "—" in `color.text.tertiary` with `aria-hidden="true"`, followed by the owned string "Unknown" in the VisuallyHidden shared part, as Stat does. The "—" is the character U+2014 in its own `span`, and the words are their own text run, so `expectOwnedStrings` reads them as a dictionary value. Tertiary is allowed because the "—" always sits beside its name.
- **CR-6.** FactList composes the VisuallyHidden shared part from `packages/perron/src/parts/VisuallyHidden/` and never draws its own hiding styles.
- **CR-7.** Each inner part's props are its `slotProps` value merged with `mergeProps`, the component's own props last, so its class, `data-unknown` and children stay while the caller's `className` joins and its `render` swaps the element. One `slotProps` value reaches every item, label or value alike; a caller's `id` there would repeat, so FactList's docs say to give none.
- **CR-8.** An empty `items` renders an empty `dl`. Every shape the type accepts renders, the `ref` and `className` still land, and a list with no facts is the caller's to replace with EmptyState, as [Do and don't](#do-and-dont) says; returning nothing would leave a `ref` that is sometimes `null`.
- **CR-9.** `items`, `unknownLabel`, `slotProps` and `render` are taken out of the rest props before they reach the root, so none reaches the DOM as an attribute.
- **CR-10.** FactList is not a live region and never moves focus. A screen that updates its facts announces changes of state in its own polite live region, as [Accessibility](../foundations/accessibility.md) asks.
- **CR-11.** FactList fills its container's width, as a block, and its columns size as [Tokens](#tokens) sets out, with logical properties only, so the name stays at the start of its row in right-to-left text.

## Stories

One per variant the deferred design will draw. It has no variant property, so its one variant is `Default`; `Unknown` is the same variant with one fact that has no value, and proves CR-4 and CR-5. The contract story renders `Default`.

| Story     | Shows                                                                                                                                                                     | `play` test                                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default` | Four facts about a bus: "Operator" "Movia", "Vehicle" "8412", "Speed" "32 km/h", "Last report" "08:14"; the contract story renders it, and its args pass every rule alone | The root is a `dl` with four `div` items, each a `dt` then a `dd`; each name comes before its value in the accessible text; no item has `data-unknown`; a value's computed `font-variant-numeric` is `tabular-nums`; nothing takes focus |
| `Unknown` | "Operator" "Movia", "Speed" with no value, "Last report" "08:14": "—" beside "Speed"                                                                                      | The "Speed" item and its value carry `data-unknown` and the others don't; "—" is `aria-hidden`; the accessible text of that item is "Speed" then "Unknown"                                                                               |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                | Don't                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Leave out an item's `value` when no data gives it, so FactList shows "—" and says "Unknown"                       | Write "0", "n/a" or a guess for a value nobody knows: the brand never claims more than the data knows                        |
| Name each fact in a word or two, "Operator", "Last report", and write its value as content design does, "32 km/h" | Put the name inside the value, such as "Speed 32 km/h": the name and value then read as one term with no definition          |
| Use FactList for several facts about one thing, such as a vehicle in its detail panel                             | Use it for one key figure, which is a Stat, or for rows people compare across many things, which is a table                  |
| Name the list with `aria-labelledby` pointing at the panel's heading when the panel holds more than one list      | Give the list a heading inside `items`: every entry is a fact, a name and its value                                          |
| Say a status in words in the value, or show it with a SeverityLabel or a Delay                                    | Colour a value through `className` to say it is good or bad: colour alone tells no screen reader and no colour-blind person  |
| Show EmptyState in place of FactList when there are no facts to show                                              | Render FactList with an empty `items` and nothing beside it: an empty list tells the person nothing                          |
| Keep `render` on the root to another `dl`, or a component that renders one                                        | Swap the root for a `ul` or `div` through `render`: its `dt` and `dd` would sit outside a `dl`, which HTML and axe both fail |
| Announce a changed fact in the screen's own polite live region, when it changes state                             | Make FactList a live region: a speed or report time that updates every few seconds floods the screen reader                  |
