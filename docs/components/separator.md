# Separator

A hairline that divides two groups of content, across a column (horizontal) or down a row (vertical), and tells a screen reader there is a break there.

<!-- run notes -->

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): there is no read-back, code map or export, and this spec decides what the drawing would, from the [contract](README.md), the [foundations](../foundations/README.md), the tokens, the Base UI reference for `Separator` (`@base-ui/react` 1.9.0, installed) and the three separators already merged, [Toolbar](toolbar.md)'s `ToolbarSeparator`, [Select](select.md)'s separator between groups and [Menu](menu.md)'s `MenuSeparator`, whose line it shares. Its registry entry has no `dependsOn`. No ROADMAP line names Separator, and the extracted prototype component is not in any branch this run can reach, so nothing here rests on it. The factory's brief for this slot put it in the Layout category, asked for a minimal API, and asked the spec to say whether the merged separators should later render it (CR-8).

## Anatomy

Penpot page `Components/Separator`. Family: none: the contract's [Families](README.md#families) have no divider of its own, and the line is the one the Rows family divides rows with, `border.width.025` in `color.border.subtle`. Shared parts: none.

The drawing has one board, `root`, a line with no content. Its one variant property is `orientation`, with the values `horizontal` and `vertical`, so its variants are `Horizontal` and `Vertical`. It has no `State` property: a separator is never interactive (CR-6) and has only its rest state.

| Part (Penpot layer) | What it is                                                                                                                                                         | Base UI part | Class          | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | -------------- | --------------- |
| `root`              | The line: a `<div role="separator">` of no size, drawn by one border, running across its container's width when horizontal and down its row's height when vertical | `Separator`  | `pn-Separator` | none            |

## Base UI parts

Imported from `@base-ui/react/separator`, at the version pinned in `packages/perron/package.json` (1.9.0).

| Base UI part | Renders                                                                                                           | Perron sets                                            | Passed through                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `Separator`  | `<div role="separator" aria-orientation>`, with `data-orientation`, its `orientation` (`'horizontal'` by default) | `className` (`pn-Separator`, then the caller's), `ref` | `orientation`, `render`, `style`, `id`, `data-*`, `aria-*` and every other `<div>` attribute, through `{...rest}` |

Base UI already does: the `separator` role and `aria-orientation` from `orientation`, set before the caller's props so nothing Perron writes is needed for the ear; `data-orientation` for the CSS; no `tabIndex`, so the separator is not a tab stop; swapping the element for the `render` element or function while keeping the role, the class and the data attribute.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. No slots: the separator has no inner part.

| Name          | Type                         | Default        | Base UI prop | Description                                                                                                                                                                               |
| ------------- | ---------------------------- | -------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | inherited    | The orientation of the separator.                                                                                                                                                         |
| `render`      | Base UI's `render`           |                | inherited    | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render. |
| `className`   | `string`                     |                | none         | Joined after `pn-Separator` on the root                                                                                                                                                   |
| `style`       | `CSSProperties`              |                | none         | Reaches the root                                                                                                                                                                          |
| `ref`         | `Ref<HTMLDivElement>`        |                | none         | Reaches the root, the `role="separator"` element                                                                                                                                          |

`SeparatorProps` extends Base UI's `Separator.Props` without its `className`, `style`, `children` and `ref`, as `ToolbarSeparatorProps` does, and declares `className`, `style` and `ref` as React's; `orientation` and `render` are inherited as they are, with Base UI's JSDoc and `@default`, and `SeparatorProps` declares neither. It takes no `children` (CR-5). No `*Label` props: Separator owns no strings.

Separator ships one look, with no `variant`, `color`, `size` or inset prop. The API stays minimal; every divider Perron draws today, ToolbarSeparator's, Select's and MenuSeparator's, is the same hairline in the same colour, `color.border.subtle` is the one colour [Semantic colours](../foundations/semantic-colours.md#borders) gives dividers, and a line that only decorates carries no meaning an intent could add. An inset, as MUI's `variant="middle"`, is the container's padding; the props API only grows, so any of these can join later as an optional prop.

Separator is always announced as a separator, with no `decorative` prop that swaps its role for `none`. Base UI's `Separator` always sets `role="separator"`, and a caller's `role="none"` would leave its `aria-orientation` on an element with no role, which axe's `aria-allowed-attr` fails; a break the eye is shown is a break the ear is told, as the contract's checklist asks; and a line that is only decoration, such as a panel's edge, is that element's own border, not a Separator.

## Tokens

One row per part, state and property. Separator has one part, `root`, and one design state, rest (CR-6). The line is a border on a box of no size, never a background, so forced colours keep it (CR-3), and its colour is a token [Semantic colours](../foundations/semantic-colours.md#borders) gives for both themes, so it needs no rule for the dark theme. `color.border.subtle` is exempt from the 3:1 non-text contrast, as a line that decorates ([Accessibility](../foundations/accessibility.md#what-the-build-checks)): the separator's meaning reaches the ear through its role, not the eye through its contrast.

| Part               | State                | Property              | Token                                                                                                                         |
| ------------------ | -------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `root`, horizontal | rest                 | `border-block-start`  | `border.width.025` solid in `color.border.subtle`                                                                             |
| `root`, vertical   | rest                 | `border-inline-start` | `border.width.025` solid in `color.border.subtle`                                                                             |
| `root`             | rest                 | `flex`                | none: the keyword `none`, so a flex container never squeezes the line away                                                    |
| `root`             | rest                 | `align-self`          | none: the keyword `stretch`, so a vertical line takes its row's height and a horizontal one its column's width                |
| `root`             | rest                 | `margin`              | none: `0`, the space on either side of the line coming from its container                                                     |
| `root`             | rest                 | `border`              | none: `0`, set before the orientation's side, so a `render={<hr />}` drops the user agent's inset border                      |
| `root`, either     | rest, forced colours | `border`              | none: the same border, which Windows' contrast themes paint in the text colour, so the line stays where every fill is dropped |

Separator takes no margin of its own, leaving the space on either side of the line to its container's `gap` or padding. A component sizes to its container and the screen or pattern that uses it places it, as Toolbar's CR-13 says of the bar; the three merged separators get their space from where they sit, ToolbarSeparator from the bar's `space.100` gap, and Select's and MenuSeparator from `space.100` set on their own classes inside the list and the popup; and a margin on Separator would add to every container's `gap`, doubling the space in a flex column that already has one. A caller wanting Select's spacing gives the container `gap: var(--perron-space-100)`.

## Keyboard and ARIA

From the Base UI reference for `Separator` and the installed `Separator.js`. "From" says who does it.

No keys: the separator is not focusable and does nothing (CR-6).

| Element | Role                      | Accessible name from                                  | States announced                                   |
| ------- | ------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `root`  | `separator`, from Base UI | none: a separator that is not focusable needs no name | `aria-orientation`, from `orientation`, by Base UI |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the line the eye sees is the `separator` role the ear is told, in both orientations, with `aria-orientation` saying which.
- [ ] Every landmark and named region has an accessible name: none here; a separator is neither.
- [ ] Every default label can be overridden: none here; Separator owns no strings.
- [ ] Every shape the type accepts renders, in every variant: both `orientation` values draw the line on their side; Separator takes no `ReactNode` prop.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses.
- [ ] Native semantics first: Base UI renders a `<div>` with the `separator` role, the role an `<hr>` gives natively, and `render={<hr />}` stays open to a caller who wants the native element, drawn the same (CR-3); no other ARIA.
- [ ] Focus moves in reading order and returns on close: the separator is never a tab stop, so Tab passes from the content before it to the content after it.
- [ ] Every target is at least `size.target-min` square: none here; the separator is not a target.
- [ ] Loops stop when the system asks for less motion: none here; nothing moves.

## Owned strings

No owned strings: the separator shows and announces no words, only its role.

## Component rules

- **CR-1.** The root is Base UI's `Separator` from `@base-ui/react/separator`, which sets `role="separator"`, `aria-orientation` and `data-orientation` from `orientation`. Separator sets none of the three itself, and passes `orientation` through `{...rest}` untouched, so Base UI's default, `'horizontal'`, holds.
- **CR-2.** `{...rest}` comes first, then `ref`, then `className` from the shared `classes` helper in `packages/perron/src/internal/nodes.ts`: `pn-Separator` first, then the caller's.
- **CR-3.** The line is drawn as one border on a box of no size: `.pn-Separator` clears every border with `border: 0`, so an `<hr>` from `render` keeps none of the user agent's, then `border-block-start` on `.pn-Separator[data-orientation='horizontal']`, `border-inline-start` on `.pn-Separator[data-orientation='vertical']`, as ToolbarSeparator's CR-11 draws its own, never as a background or a `block-size` of `border.width.025`, which forced colours would drop.
- **CR-4.** The root sets `flex: none`, `align-self: stretch` and `margin: 0`, and no size of its own, its spacing coming from its container's `gap` or padding (Tokens), so a vertical separator in a flex row is as tall as the row and a horizontal one in a block or a flex column is as wide as its container. A vertical separator outside a flex or grid row, and a horizontal one inside a flex row, have no length and draw nothing; the stories and Do and don't show the right container.
- **CR-5.** `SeparatorProps` omits `children`, so a caller can't put words in the line: the `separator` role makes its children presentational, and a labelled break, such as "Earlier today", is a heading, which a screen reader can move to.
- **CR-6.** Separator is never interactive: no `tabIndex`, no handler, no hover, focus or pressed look, and no cursor. A focusable separator is ARIA's window splitter, which takes a value and arrow keys, and is a component of its own if a screen needs one.
- **CR-7.** The line's two tokens, `border.width.025` and `color.border.subtle`, are the ones `ToolbarSeparator`, Select's separator and `MenuSeparator` draw with, so the four dividers look alike in both themes. A change to one is a change to all four, in the same pull request.
- **CR-8.** ToolbarSeparator, Select's separator and MenuSeparator keep their own Base UI parts and never render Separator, with no follow-up change. `Toolbar.Separator` reads the toolbar's context to run across the bar's orientation, which Separator can't; Select's separator is Base UI's `Select.Separator`, a `role="presentation"` inside a `listbox`, where a `separator` role is not an allowed child and axe's `aria-required-children` fails; and MenuSeparator is Base UI's `Menu.Separator`, the same Base UI `Separator` under the menu's name, kept as its own component because its look is the menu's: it leaves out `orientation`, a menu being a column, and its margins run it across the popup's padding to its edge with `space.100` above and below, where Separator takes no margin. Each keeps its Base UI part and its own class, and shares Separator's look through CR-7; Separator is for content outside those three, such as between a panel's facts and its actions.
- **CR-9.** Separator has one look and one role: `SeparatorProps` declares no `variant`, `color`, `size`, inset or `decorative` prop (Props), and Separator sets no `role` of its own, so Base UI's `separator` is the one it announces.

## Stories

One per variant the drawing has, `Horizontal` and `Vertical`. Each story's `render` places the separator between two short lines of text in the container its orientation needs (CR-4), set in `typography.body` with the shared `typography` helper; the args hold only `orientation`, so the contract story renders the separator alone.

| Story        | Shows                                                                                                                                                              | `play` test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Horizontal` | `orientation: 'horizontal'`, the default, between "Line 5C to Husum Torv" and "Next departure in 4 min" in a flex column with a `space.100` gap; the subject story | The root has the `separator` role and `aria-orientation="horizontal"`, `pn-Separator` and `data-orientation="horizontal"`; its `border-block-start` renders as `border.width.025` in `color.border.subtle` (`resolve`, `colour`) and it has no other border; it is as wide as its column; it has no `tabindex`, and `focus()` on it leaves `document.activeElement` where it was; a `render={<hr />}` mounted in the column is an `<hr>` with the same one border, none of the user agent's, and `border.width.025` tall |
| `Vertical`   | `orientation: 'vertical'` between "Bus" and "Metro" in a flex row with a `space.100` gap                                                                           | The root has `aria-orientation="vertical"` and `data-orientation="vertical"`; its `border-inline-start` renders as `border.width.025` in `color.border.subtle`; it is as tall as the row and `border.width.025` wide                                                                                                                                                                                                                                                                                                     |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                                                           | Don't                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Put a Separator where two groups of content meet and the layout doesn't already set them apart, such as between a vehicle's facts and its actions in a panel | Put one between every row of a list or after every paragraph: the interface around the map stays calm, and white space sets most things apart without a line                        |
| Space the line with its container's `gap` or padding, from the `space.*` scale                                                                               | Give the separator a margin of its own: it adds to the container's gap, and two screens end up with two spacings                                                                    |
| Put a vertical Separator in a flex row, and a horizontal one in a block or a flex column, so the line runs the container's length                            | Put a vertical one in block flow or a horizontal one in a flex row, where it has no length and draws nothing                                                                        |
| Use `ToolbarSeparator` inside a `Toolbar` and `MenuSeparator` inside a `Menu`, and let Select draw its own between groups                                    | Put a Separator in a toolbar, where it doesn't run across the bar, in a menu, where it isn't the menu's own part, or in a list, where a `separator` is not a listbox's child (CR-8) |
| Give a break that needs words a heading                                                                                                                      | Put text in the separator, or swap its role for `none` to hide it: a break the eye sees is one the ear is told                                                                      |
| Draw a panel's or card's edge with its own border                                                                                                            | Use a Separator as an element's edge: it announces a break between two groups, which an edge is not                                                                                 |
