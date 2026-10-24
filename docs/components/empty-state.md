# EmptyState

Stands in for a list or panel that has nothing to show, and says in plain words what is empty, why, and what to try next.

The design is deferred ([ADR 0010](../adr/0010-unattended-runs-with-design-deferred.md)): this spec decides what the drawing would, from the [contract](README.md), the [foundations](../foundations/README.md), [content design](../content-design.md) and the tokens. EmptyState has no Base UI component and nothing in `dependsOn`.

## Anatomy

Penpot page `Components/EmptyState`. Family: none, since it is static content that sits on its container's surface and joins no family's treatment. Shared parts: none.

| Part (Penpot layer) | What it is                                                                                             | Base UI part                          | Class                       | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------- | --------------------------- | --------------- |
| `root`              | A `div` stacking the parts below in a centred column                                                   | None: `useRender`, a `div` by default | `pn-EmptyState`             | none            |
| `icon`              | A `div` holding the caller's `icon`, hidden from screen readers; rendered only when given              | None: `useRender`, a `div` by default | `pn-EmptyState-icon`        | `icon`          |
| `title`             | A `p` holding the caller's `title`: what is empty                                                      | None: `useRender`, a `p` by default   | `pn-EmptyState-title`       | `title`         |
| `description`       | A `div` holding the caller's `children`: why, and what to try; rendered only when given                | None: `useRender`, a `div` by default | `pn-EmptyState-description` | `description`   |
| `action`            | A `div` holding the caller's `action`, such as a button that clears a filter; rendered only when given | None: `useRender`, a `div` by default | `pn-EmptyState-action`      | `action`        |

No part has a Base UI component, because none has behaviour for Base UI to give: no focus, keys, state or popup. Each part renders through Base UI's `useRender` hook instead, so each takes `render`, as the root does and as its `slotProps` key does for an inner part.

- Decided: the title renders as a `p` by default, with no heading level of its own; a caller that wants it in the page's outline makes it a heading through `slotProps.title.render`, such as `render: <h3 />`. EmptyState sits inside panels whose heading levels it cannot know, and a wrong level breaks the outline where a `p` leaves it whole.

## Base UI parts

No Base UI component: each part renders through the `useRender` hook from `@base-ui/react/use-render`, and merges its props with `mergeProps` from `@base-ui/react/merge-props`, at the version pinned in `packages/perron/package.json` (1.9.0).

| Base UI part                | Renders | Perron sets                                                                                      | Passed through                                                        |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `useRender` for root        | `div`   | `defaultTagName: 'div'`, `ref`, the class `pn-EmptyState`, and the parts below as children       | `render`, `className`, `style`, `ref` and the rest of the `div` props |
| `useRender` for icon        | `div`   | `defaultTagName: 'div'`, the class `pn-EmptyState-icon`, `aria-hidden: true`, `icon` as children | `slotProps.icon`                                                      |
| `useRender` for title       | `p`     | `defaultTagName: 'p'`, the class `pn-EmptyState-title`, `title` as children                      | `slotProps.title`, its `render` making it a heading                   |
| `useRender` for description | `div`   | `defaultTagName: 'div'`, the class `pn-EmptyState-description`, `children` as children           | `slotProps.description`                                               |
| `useRender` for action      | `div`   | `defaultTagName: 'div'`, the class `pn-EmptyState-action`, `action` as children                  | `slotProps.action`                                                    |

Base UI already does: swapping each part's element through `render` while keeping its class and props, joining `className` strings and `style` objects and chaining event handlers in `mergeProps`, and setting `ref` on the rendered element.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name                    | Type                              | Default | Base UI prop                | Description                                                                                                |
| ----------------------- | --------------------------------- | ------- | --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `title`                 | `ReactNode`                       |         | none                        | What is empty, in a few words: "No matches for Nørrebro st". Required. Replaces the HTML `title` attribute |
| `children`              | `ReactNode`                       |         | none                        | The sentence under the title: why it is empty and what to try. "Try a line number such as 5C."             |
| `icon`                  | `ReactNode`                       |         | none                        | An icon from Perron's set above the title, for the eye only: it is hidden from screen readers              |
| `action`                | `ReactNode`                       |         | none                        | What the person can do about it, such as a button that clears the search, below the sentence               |
| `render`                | `useRender.RenderProp`            |         | `useRender`'s `render`      | Swaps the root element, keeping its class and props                                                        |
| `slotProps.icon`        | `useRender.ComponentProps<'div'>` |         | `useRender` for icon        | Props for the `icon` part                                                                                  |
| `slotProps.title`       | `useRender.ComponentProps<'p'>`   |         | `useRender` for title       | Props for the `title` part. Its `render` makes the title a heading: `render: <h3 />`                       |
| `slotProps.description` | `useRender.ComponentProps<'div'>` |         | `useRender` for description | Props for the `description` part                                                                           |
| `slotProps.action`      | `useRender.ComponentProps<'div'>` |         | `useRender` for action      | Props for the `action` part                                                                                |

`className`, `style`, `ref` and the other `div` props reach the root, as the contract's Root section says. No owned string, so no `*Label` prop.

- Decided: `children` is the sentence under the title, the way MUI's `Alert` takes its message, rather than a separate `description` prop, so the common call reads `<EmptyState title="No departures">Nothing leaves this stop in the next hour.</EmptyState>`. The part keeps the name `description` for its class and `slotProps` key.
- Decided: the names `title`, `icon` and `action` are taken from MUI (`CardHeader`'s `title`, `Alert`'s `icon` and `action`), and `title` is taken out of the root's props so the HTML `title` attribute never reaches the element; an EmptyState has no use for a hover tooltip.
- Decided: EmptyState ships with no `variant`, `size` or `color`, one look everywhere. The uses known now (an empty search, an empty list in a sheet, a data panel with nothing to show) share one calm look, and any of the three can join later as an optional prop without a break.

## Tokens

One row per part, state and property. EmptyState has no interactive state of its own, so every row is rest; the caller's action keeps its own states.

| Part          | State | Property             | Token                                 |
| ------------- | ----- | -------------------- | ------------------------------------- |
| `root`        | rest  | `padding-block`      | `space.600`                           |
| `root`        | rest  | `padding-inline`     | `space.400`                           |
| `root`        | rest  | `gap`                | `space.100`                           |
| `icon`        | rest  | `color`              | `color.text.secondary`                |
| `icon`        | rest  | `--perron-icon-size` | `icon.size.450`                       |
| `icon`        | rest  | `margin-block-end`   | `space.200`                           |
| `title`       | rest  | `font`               | `typography.heading-sm`               |
| `title`       | rest  | `letter-spacing`     | `typography.heading-sm`, its tracking |
| `title`       | rest  | `color`              | `color.text.primary`                  |
| `description` | rest  | `font`               | `typography.body-sm`                  |
| `description` | rest  | `letter-spacing`     | `typography.body-sm`, its tracking    |
| `description` | rest  | `color`              | `color.text.secondary`                |
| `action`      | rest  | `gap`                | `space.200`                           |
| `action`      | rest  | `margin-block-start` | `space.300`                           |

The root is a flex column with `align-items: center` and `text-align: center`; the action is a flex row that wraps, centred. The spacing comes out as 12 px from icon to title (`space.100` and `space.200`), 4 px from title to sentence, and 16 px from sentence to action (`space.100` and `space.300`). Every part resets the margins a `p` brings.

- Decided: the root has no fill, border, radius or shadow, so EmptyState takes the surface of the panel, sheet or popup it sits in. It is content, not a card, and a surface of its own would join no family and stack a box inside a box.
- Decided: the layout is a centred column, padded `space.600` on the block axis and `space.400` on the inline axis, with the gaps in the table above. Centred is how an empty list reads at a glance in a narrow sheet, 24 px matches the space between blocks of a pane, and 16 px inline keeps text clear of a 320 px screen's edges.
- Decided: the icon is a bare icon from Perron's set at `icon.size.450`, in `color.text.secondary`, with no disc or tile behind it. The brand keeps the interface calm, the largest icon step is 18 px, and a disc would need a size token no foundation gives it.
- Decided: the title is `typography.heading-sm` in `color.text.primary`, and the sentence `typography.body-sm` in `color.text.secondary`. The roles' own uses are "card titles" and "the line under a title", and both colours meet 4.5:1 on every surface.

## Keyboard and ARIA

EmptyState has no keys of its own and is never focusable. The caller's action is reached in reading order.

| Key         | Does                                                                   | From        |
| ----------- | ---------------------------------------------------------------------- | ----------- |
| `Tab`       | Moves to the first focusable element in the action, after the sentence | The browser |
| `Shift+Tab` | Moves back out of the action, to whatever came before the EmptyState   | The browser |

| Element       | Role                                                               | Accessible name from             | States announced |
| ------------- | ------------------------------------------------------------------ | -------------------------------- | ---------------- |
| `root`        | None (generic `div`)                                               | None                             | None             |
| `icon`        | Hidden: `aria-hidden="true"`                                       | None                             | None             |
| `title`       | Paragraph, or a heading when `slotProps.title.render` makes it one | Its text, from `title`           | None             |
| `description` | None (generic `div`)                                               | None                             | None             |
| `action`      | None (generic `div`); the caller's controls carry their own roles  | The caller's controls' own names | Theirs           |

- Decided: the root carries no live-region role, leaving the caller to add `role="status"` when the EmptyState replaces results while the person types or filters. An empty state shown with the page on load needs no announcement, the accessibility rules ask for live regions on changes of state only, and a search field such as SearchField announces its own empty results.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the icon is `aria-hidden` and decorative, and the title, read as text, says what the icon shows.
- [ ] Every landmark and named region has an accessible name: none here; the root is not a landmark or region.
- [ ] Every default label can be overridden: none here; EmptyState owns no string.
- [ ] Every shape the type accepts renders, in every variant: `title`, `children`, `icon` and `action` each render a string, an element and an array; `description` and `action` are `div`s, so block content such as a list is valid inside them, and the title takes phrasing content as a `p` or a heading does.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses.
- [ ] Native semantics first: a `p` for the title, made a native `h2` to `h6` through `render` when it heads a section; the action holds the caller's own `button` or `a href`.
- [ ] Focus moves in reading order and returns on close: the action follows the sentence in the DOM and on screen; EmptyState never moves focus when it appears, and nothing in it closes.
- [ ] Every target is at least `size.target-min` square: EmptyState has no target of its own; the action's targets are the caller's components, which keep their own sizes.
- [ ] Loops stop when the system asks for less motion: none here; nothing moves.

## Owned strings

No owned strings: every word EmptyState shows comes from the caller, through `title`, `children` and `action`, and the icon is hidden from screen readers.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** The optional parts render only when given: no `icon` part without `icon`, no `description` part without `children`, no `action` part without `action`. A `null`, `undefined` or `false` value counts as not given, so no empty wrapper takes up a gap.
- **CR-2.** The `icon` part always carries `aria-hidden="true"`, after the caller's `slotProps.icon`, so a caller cannot make the icon speak; the title says what it shows.
- **CR-3.** `title`, `icon`, `action`, `children`, `slotProps` and `render` are taken out of the rest props before they reach the root, so the HTML `title` attribute never reaches the element.
- **CR-4.** Each inner part's props are its `slotProps` value merged with `mergeProps`, the component's own props last, so its class, `aria-hidden` and children stay while the caller's `className` joins and its `render` swaps the element.
- **CR-5.** EmptyState never moves focus, sets no `tabindex` and adds no role to the root; the caller decides whether it is announced.
- **CR-6.** It sizes to its container, with no width or max-width of its own, and long words wrap (`overflow-wrap: anywhere`), so a long Danish stop name in the title fits a 320 px screen.
- **CR-7.** Colour sits on the parts that hold text, and the icon takes `currentColor` from its part, as the icon foundation asks.

## Stories

One per variant and state the Penpot design shows, named as Penpot names it. The design is deferred and has no variant property, so its one variant is `Default`; `TitleOnly` is the same variant with the optional props left out, and proves CR-1.

| Story       | Shows                                                                                                                                                          | `play` test                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default`   | Every part: the `search` icon, `title` "No matches for Nørrebro st", the sentence "Try a line number such as 5C." and an action button "Clear search", at rest | The icon part is `aria-hidden`; Tab reaches the "Clear search" button and Shift+Tab leaves it, so focus ends where it started                             |
| `TitleOnly` | `title` "No departures in the next hour", with no icon, sentence or action                                                                                     | Only the root and the title render: no `pn-EmptyState-icon`, `pn-EmptyState-description` or `pn-EmptyState-action` element, and nothing in it takes focus |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                         | Don't                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Say what is empty, then what to try, in plain sentences: "No matches for Nørrebro st" over "Try a line number such as 5C." | Write "Oops! Nothing here!": content design has no exclamation marks, and the title should name what is missing                             |
| Say only what the data knows: "No departures in the next hour" when the timetable covers an hour                           | Write "No departures" when there may be some later: the brand never claims more certainty than the data has                                 |
| Use it for a list, a search or a panel with nothing in it                                                                  | Use it for loading or for missing real-time data: loading says "Loading", and missing data uses the data-state words such as "No signal"    |
| Give one neutral action at most, such as clearing the search or the filters                                                | Add a `brand` action when the panel already has one: a screen has one brand action at most                                                  |
| Pick a decorative icon from Perron's set that matches the title, or none                                                   | Let the icon carry meaning alone, or use an emoji: the icon is hidden from screen readers and Mylder uses no emoji                          |
| Make the title a heading through `slotProps.title.render` when the EmptyState stands in for a whole section                | Wrap the title in your own heading element inside `title`: the part is a `p` until `render` swaps it, and a heading inside a `p` is invalid |
| Add `role="status"` on the root when it replaces results as the person types or filters, so the change is announced        | Add a live region to an EmptyState shown on load: there is no change to announce, and it adds noise                                         |
