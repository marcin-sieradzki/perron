# Toolbar

A bar of actions that is one tab stop, moved through with the arrow keys, such as the map's zoom and locate controls or a glass group in the top bar.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): there is no read-back, code map or export, and this spec decides what the drawing would, from the contract, the foundations, the tokens and the Base UI reference. The extracted prototype component is not in any branch this run can reach.

## Anatomy

Penpot page `Components/Toolbar`. Family: none (the contract's [Families](README.md#families) have no bar of actions; the root borrows the Popups' glass, see Tokens). Shared parts: none (an icon-only button is named by the caller's `aria-label`, not by `VisuallyHidden`).

The `Toolbar` folder holds four components, `Toolbar`, `ToolbarButton`, `ToolbarGroup` and `ToolbarSeparator`, each exported with its props type from `Toolbar.tsx`, as an exception to the contract's "one component per folder": Toolbar's Base UI parts share one context (`Toolbar.Button`, `Toolbar.Group` and `Toolbar.Separator` read `Toolbar.Root`'s), so they can't be built or shown apart. The `props` and `api-compatibility` checks read only `ToolbarProps`, so the review holds the other three to the contract.

| Part (Penpot layer) | What it is                                                                                                                                  | Base UI part                         | Class                        | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------- | --------------- |
| `root`              | `Toolbar`: the bar, a flex row (or column when vertical) on glass, that holds the caller's buttons, groups and separators                   | `Toolbar.Root`                       | `pn-Toolbar`                 | none            |
| `button`            | `ToolbarButton`: the native `<button>` of one action, a flex row, centred, that holds the start icon, the label and the end icon            | `Toolbar.Button`                     | `pn-ToolbarButton`           | none            |
| `label`             | A `<span>` in `ToolbarButton` that holds the caller's `children`; only rendered when `children` is given                                    | none: a span inside `Toolbar.Button` | `pn-ToolbarButton-label`     | none            |
| `startIcon`         | A `<span>`, `aria-hidden`, in `ToolbarButton` that holds the caller's `startIcon` before the label; only rendered when `startIcon` is given | none: a span inside `Toolbar.Button` | `pn-ToolbarButton-startIcon` | none            |
| `endIcon`           | A `<span>`, `aria-hidden`, in `ToolbarButton` that holds the caller's `endIcon` after the label; only rendered when `endIcon` is given      | none: a span inside `Toolbar.Button` | `pn-ToolbarButton-endIcon`   | none            |
| `group`             | `ToolbarGroup`: a flex row (or column) of related buttons, with no look of its own                                                          | `Toolbar.Group`                      | `pn-ToolbarGroup`            | none            |
| `separator`         | `ToolbarSeparator`: a hairline between buttons or groups, across the bar                                                                    | `Toolbar.Separator`                  | `pn-ToolbarSeparator`        | none            |
| `focusRing`         | The keyboard focus ring on a button: the `:focus-visible` outline `perron.css` draws on `button`, not an element                            | `Toolbar.Button`                     | none                         | none            |

Base UI's `Toolbar.Link` and `Toolbar.Input` are not offered: the registry doesn't name them, a link among buttons reads as an action, and the Base UI guidance keeps inputs to one, last, since the arrow keys both move the caret and leave the field.

## Base UI parts

Imported from `@base-ui/react/toolbar`, at the version pinned in `package.json` (1.9.0 installed).

| Base UI part        | Renders                                                                                                                                     | Perron sets                                                                                                                                                                                                      | Passed through                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Toolbar.Root`      | `<div role="toolbar" aria-orientation>`, with `data-orientation` and, when disabled, `data-disabled`                                        | `className` (`pn-Toolbar`, then the caller's), `ref`, `orientation` and `disabled` from `Toolbar`'s props                                                                                                        | `loopFocus`, `render`, `style`, `aria-label`, `aria-labelledby` and every other prop of a `<div>`, through `{...rest}`                               |
| `Toolbar.Button`    | `<button type="button">`, with `data-orientation`, `data-disabled` when disabled and `data-focusable` when it stays focusable when disabled | `className` (`pn-ToolbarButton`, then the caller's), `ref`, `disabled`, `data-color` from `color` (default included), `data-icon-only` when it has a `startIcon` and no `children`, and the icon and label spans | `render`, `nativeButton`, `focusableWhenDisabled`, `style`, `onClick`, `aria-label` and every other prop of a native `<button>`, through `{...rest}` |
| `Toolbar.Group`     | `<div role="group">`, with `data-orientation` and, when disabled, `data-disabled`                                                           | `className` (`pn-ToolbarGroup`, then the caller's), `ref`, `disabled`                                                                                                                                            | `render`, `style`, `aria-label` and every other prop of a `<div>`, through `{...rest}`                                                               |
| `Toolbar.Separator` | `<div role="separator" aria-orientation>`, its orientation the opposite of the toolbar's, with `data-orientation`                           | `className` (`pn-ToolbarSeparator`, then the caller's), `ref`                                                                                                                                                    | `orientation`, `render`, `style` and every other prop of a `<div>`, through `{...rest}`                                                              |

Base UI already does: one tab stop for the whole toolbar, a roving `tabIndex` (0 on the item last focused, −1 on the rest), so Tab enters and leaves the bar in one step and comes back to the item it left; the arrow keys of the toolbar's orientation move between items, wrapping at the ends while `loopFocus` is on; the pointer moving over an item makes it the tab stop; a disabled `Toolbar.Root` or `Toolbar.Group` disables every button inside it; a disabled `Toolbar.Button` stays focusable by default (`focusableWhenDisabled` is `true`), with `aria-disabled` in place of `disabled` and its clicks stopped, so it stays in the arrow-key order and can carry a tooltip; a disabled button that isn't focusable leaves the arrow-key order; `Toolbar.Separator` sets its orientation across the toolbar's; Left and Right swap only under Base UI's `DirectionProvider` set to `rtl`, not from the `dir` attribute, and Perron doesn't set one up yet, as all four locales run left to right; `render` on `Toolbar.Button` makes a popup trigger (`Menu.Trigger`, `Popover.Trigger`, `Dialog.Trigger`) one element that joins the arrow-key order and keeps its popup behaviour, passing `disabled` on to it.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

`Toolbar` passes Base UI's `orientation` (default `'horizontal'`, for the map's vertical column of controls) and `disabled` through as its own props, and inherits `loopFocus` (default `true`) with its Base UI JSDoc.

### Toolbar

| Name                        | Type                         | Default        | Base UI prop         | Description                                                                                                                   |
| --------------------------- | ---------------------------- | -------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `orientation`               | `'horizontal' \| 'vertical'` | `'horizontal'` | `orientation`        | Which way the bar runs, and so which arrow keys move through it: Left and Right for `horizontal`, Up and Down for `vertical`. |
| `disabled`                  | `boolean`                    | `false`        | `disabled`           | Whether every button in the toolbar is disabled. The buttons stay focusable unless their `focusableWhenDisabled` is `false`.  |
| `loopFocus`                 | `boolean`                    | `true`         | `loopFocus`          | Inherited from Base UI with its JSDoc: whether the arrow keys wrap from one end of the toolbar to the other.                  |
| `render`                    | Base UI's `render`           | none           | `render`             | Inherited from Base UI: swaps the root element and keeps the behaviour, the class and the data attributes.                    |
| `children`                  | `ReactNode`                  | none           | none                 | The toolbar's `ToolbarButton`s, `ToolbarGroup`s and `ToolbarSeparator`s, in reading order.                                    |
| `className`, `style`, `ref` | React's                      | none           | `className`, `style` | Reach the root. `className` is merged after `pn-Toolbar`.                                                                     |

The caller names the toolbar with `aria-label` or `aria-labelledby`, which reach the root through `{...rest}`; Toolbar declares neither.

### ToolbarButton

`ToolbarButton` has one size, no `size` or `variant` prop, and a quiet neutral look: `size.control` tall and at least as wide, transparent at rest in `color.text.primary`, `color.surface.hover` on hover and press, as the toolbar's glass already marks the bar. `size.control` is the height of icon buttons and filter chips, so a toolbar of icon buttons matches the IconButtons beside it.

`ToolbarButton`'s `color` offers `'neutral' | 'brand'`, the contract's two intents for a toolbar's buttons, with `brand` drawn as a solid brand button (`color.surface.brand` with a `color.border.brand` edge and `color.text.on-color.dark`, `color.surface.brand-hover` on hover and press).

A `ToolbarButton` with a `startIcon` and no `children` is an icon-only button: square (`size.control` both ways, no inline padding), marked `data-icon-only`, and named by the caller's `aria-label`, which its JSDoc requires. The map's zoom and locate controls are icons alone, and the `props` check would not read a union type that enforces the label.

| Name                        | Type                   | Default     | Base UI prop            | Description                                                                                                                                                   |
| --------------------------- | ---------------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`                     | `'neutral' \| 'brand'` | `'neutral'` | none                    | The intent: `neutral` is ink on the toolbar's glass, for every action but the main one; `brand` is the brand yellow, for the one main action of a screen.     |
| `disabled`                  | `boolean`              | `false`     | `disabled`              | Whether the button ignores the pointer and the keys. It stays focusable, and in the arrow-key order, unless `focusableWhenDisabled` is `false`.               |
| `startIcon`                 | `ReactNode`            | none        | none                    | An icon before the label, in reading order. Hidden from screen readers. Alone, with no `children`, it makes an icon-only button, which needs an `aria-label`. |
| `endIcon`                   | `ReactNode`            | none        | none                    | An icon after the label, in reading order. Hidden from screen readers: the label names the button.                                                            |
| `focusableWhenDisabled`     | `boolean`              | `true`      | `focusableWhenDisabled` | Inherited from Base UI with its JSDoc: whether the button stays focusable when disabled.                                                                      |
| `nativeButton`              | `boolean`              | `true`      | `nativeButton`          | Inherited from Base UI with its JSDoc: set it to `false` when `render` gives an element that isn't a `<button>`.                                              |
| `render`                    | Base UI's `render`     | none        | `render`                | Inherited from Base UI: swaps the element, such as for a popup's trigger (`render={<Menu.Trigger />}`), which then joins the toolbar's arrow-key order.       |
| `children`                  | `ReactNode`            | none        | none                    | The label: the words that name the action, in sentence case. Leave it out only for an icon-only button with an `aria-label`.                                  |
| `className`, `style`, `ref` | React's                | none        | `className`, `style`    | Reach the root. `className` is merged after `pn-ToolbarButton`.                                                                                               |

### ToolbarGroup

| Name                        | Type               | Default | Base UI prop         | Description                                                                                                |
| --------------------------- | ------------------ | ------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `disabled`                  | `boolean`          | `false` | `disabled`           | Whether every button in the group is disabled.                                                             |
| `render`                    | Base UI's `render` | none    | `render`             | Inherited from Base UI: swaps the root element and keeps the behaviour, the class and the data attributes. |
| `children`                  | `ReactNode`        | none    | none                 | The group's `ToolbarButton`s, in reading order.                                                            |
| `className`, `style`, `ref` | React's            | none    | `className`, `style` | Reach the root. `className` is merged after `pn-ToolbarGroup`.                                             |

### ToolbarSeparator

| Name                        | Type                         | Default                          | Base UI prop         | Description                                                                                                |
| --------------------------- | ---------------------------- | -------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `orientation`               | `'horizontal' \| 'vertical'` | Across the toolbar's orientation | `orientation`        | Inherited from Base UI with its JSDoc: the separator's own orientation.                                    |
| `render`                    | Base UI's `render`           | none                             | `render`             | Inherited from Base UI: swaps the root element and keeps the behaviour, the class and the data attributes. |
| `className`, `style`, `ref` | React's                      | none                             | `className`, `style` | Reach the root. `className` is merged after `pn-ToolbarSeparator`.                                         |

No `slotProps`: each of the four components renders one Base UI part, its own root, which takes the component's own props, and the label and icon spans are not Base UI parts. No label-override props: the toolbar owns no strings.

## Tokens

One row per part, state and property. States are the contract's design states: rest is no selector, hover is `:hover` inside `@media (hover: hover)`, pressed is `:active`, focus is `:focus-visible`, disabled is `[data-disabled]`. Every `color` row on `button` sets the button's `color`, which the label and both icons take, since icons draw in `currentColor`.

The toolbar's root takes the Popups' glass (`color.surface.overlay`, a `backdrop-filter` of `effect.glass-blur` and `effect.glass-saturate`, `shadow.panel`, a `border.width.025` edge in `color.border.subtle`) and their nesting, `radius.lg` padded `space.100` so the buttons' `radius.md` nests, with `space.100` between items. The map's controls and the top bar's groups float over the map, which [Elevation](../foundations/elevation.md#surfaces) says is glass.

`ToolbarSeparator` is a `border.width.025` hairline in `color.border.subtle`, drawn as a border so forced colours keep it, running across the bar and inset `space.100` from the bar's padding at each end. `color.border.subtle` is the dividers' colour, and a divider only decorates.

The toolbar, its group and its separator:

| Part                    | State | Property              | Token                                                  |
| ----------------------- | ----- | --------------------- | ------------------------------------------------------ |
| `root`                  | rest  | `background-color`    | `color.surface.overlay`                                |
| `root`                  | rest  | `backdrop-filter`     | `effect.glass-blur` (blur) and `effect.glass-saturate` |
| `root`                  | rest  | `box-shadow`          | `shadow.panel`                                         |
| `root`                  | rest  | `border-width`        | `border.width.025`                                     |
| `root`                  | rest  | `border-color`        | `color.border.subtle`                                  |
| `root`                  | rest  | `border-radius`       | `radius.lg`                                            |
| `root`                  | rest  | `padding`             | `space.100`                                            |
| `root`                  | rest  | `gap`                 | `space.100`                                            |
| `group`                 | rest  | `gap`                 | `space.100`                                            |
| `separator`, vertical   | rest  | `border-inline-start` | `border.width.025` in `color.border.subtle`            |
| `separator`, vertical   | rest  | `margin-block`        | `space.100`                                            |
| `separator`, horizontal | rest  | `border-block-start`  | `border.width.025` in `color.border.subtle`            |
| `separator`, horizontal | rest  | `margin-inline`       | `space.100`                                            |

`ToolbarButton`, every colour:

| Part                   | State | Property                    | Token                                                                         |
| ---------------------- | ----- | --------------------------- | ----------------------------------------------------------------------------- |
| `button`               | rest  | `height`, `min-width`       | `size.control`                                                                |
| `button`               | rest  | `padding-inline`            | `space.300`; 0 when `data-icon-only`                                          |
| `button`               | rest  | `gap`                       | `space.150`                                                                   |
| `button`               | rest  | `border-radius`             | `radius.md`                                                                   |
| `button`               | rest  | `border-width`              | `border.width.025`                                                            |
| `label`                | rest  | `font`, `letter-spacing`    | `typography.label`, with its tracking twin                                    |
| `startIcon`, `endIcon` | rest  | `--perron-icon-size`        | `icon.size.400`                                                               |
| `button` (`focusRing`) | focus | `outline`, `outline-offset` | `focus.width` in `color.border.focus`, `focus.offset` (drawn by `perron.css`) |

`ToolbarButton`, `neutral`:

| Part     | State    | Property           | Token                 |
| -------- | -------- | ------------------ | --------------------- |
| `button` | rest     | `background-color` | `transparent`         |
| `button` | rest     | `border-color`     | `transparent`         |
| `button` | rest     | `color`            | `color.text.primary`  |
| `button` | hover    | `background-color` | `color.surface.hover` |
| `button` | pressed  | `background-color` | `color.surface.hover` |
| `button` | disabled | `background-color` | `transparent`         |
| `button` | disabled | `color`            | `color.text.tertiary` |

`ToolbarButton`, `brand`:

| Part     | State    | Property           | Token                       |
| -------- | -------- | ------------------ | --------------------------- |
| `button` | rest     | `background-color` | `color.surface.brand`       |
| `button` | rest     | `border-color`     | `color.border.brand`        |
| `button` | rest     | `color`            | `color.text.on-color.dark`  |
| `button` | hover    | `background-color` | `color.surface.brand-hover` |
| `button` | pressed  | `background-color` | `color.surface.brand-hover` |
| `button` | disabled | `background-color` | `color.surface.inset`       |
| `button` | disabled | `border-color`     | `transparent`               |
| `button` | disabled | `color`            | `color.text.tertiary`       |

A disabled brand button looks like a disabled neutral one on a fill, `color.surface.inset` with `color.text.tertiary` and no edge: disabled is a colour, and a yellow that can't be pressed shouldn't still mark the main action.

Highlighted, open, selected and invalid don't apply: a toolbar item takes focus rather than `data-highlighted`, a popup trigger rendered through `render` keeps the button's look when its popup is open, and a toolbar holds no choice or value.

## Keyboard and ARIA

From the Base UI reference for `Toolbar` and the installed `ToolbarRoot`, `ToolbarButton`, `ToolbarGroup`, `ToolbarSeparator` and the composite root they build on. "From" says who does it.

| Key                    | Does                                                                                                                                                                                                  | From                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `Tab`, `Shift+Tab`     | Moves focus into the toolbar, to the item that last had it (the first enabled item at first), and out of it again: the toolbar is one tab stop                                                        | Base UI                                        |
| `ArrowRight`           | In a horizontal toolbar, moves focus to the next item, wrapping from the last to the first while `loopFocus` is on; the previous item under an `rtl` `DirectionProvider`, which Perron doesn't set up | Base UI                                        |
| `ArrowLeft`            | In a horizontal toolbar, moves focus to the previous item, wrapping from the first to the last while `loopFocus` is on; the next item under an `rtl` `DirectionProvider`, which Perron doesn't set up | Base UI                                        |
| `ArrowDown`, `ArrowUp` | In a vertical toolbar, move focus to the next and the previous item, wrapping while `loopFocus` is on                                                                                                 | Base UI                                        |
| `Enter`, `Space`       | Activate the focused button: fire `onClick`, or open the popup of a trigger given through `render`                                                                                                    | The browser; Base UI for a non-button `render` |

`Home` and `End` do nothing: Base UI's toolbar doesn't turn them on (`enableHomeAndEndKeys` is off in the installed `ToolbarRoot`), and the component adds no keys of its own.

| Element                | Role                                                               | Accessible name from                                                                         | States announced                                                                    |
| ---------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `root`                 | `toolbar`, from Base UI                                            | The caller's `aria-label` or `aria-labelledby`                                               | `aria-orientation`                                                                  |
| `button`               | `button`, native; `role="button"` when `render` gives a non-button | Its text content, the label's `children`; for an icon-only button, the caller's `aria-label` | Disabled: `aria-disabled` while focusable when disabled, else the native `disabled` |
| `startIcon`, `endIcon` | none: `aria-hidden="true"`                                         | none                                                                                         | none                                                                                |
| `group`                | `group`, from Base UI                                              | The caller's `aria-label`, when the group needs one                                          | none                                                                                |
| `separator`            | `separator`, from Base UI                                          | none                                                                                         | `aria-orientation`, across the toolbar's                                            |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: a button's label is the text it is named by, and an icon-only button's `aria-label` says what its icon shows; the icons are `aria-hidden`; `color` carries emphasis, not meaning; disabled is announced by `aria-disabled` or `disabled`; the separator is announced as one.
- [ ] Every landmark and named region has an accessible name: the toolbar is named by the caller's `aria-label` or `aria-labelledby`, which every story sets, so two toolbars on a screen tell themselves apart.
- [ ] Every default label can be overridden: none here; the toolbar owns no strings.
- [ ] Every shape the type accepts renders, in every variant: a button's `children`, `startIcon` and `endIcon` render a string, an element and a list alike, in both colours and both orientations.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; the toolbar keeps no hidden copy and collapses nothing.
- [ ] Native semantics first: native `<button>`s from `Toolbar.Button`, and Base UI's `toolbar`, `group` and `separator` roles, with ARIA only for the toolbar's and an icon-only button's names.
- [ ] Focus moves in reading order and returns on close: the arrow keys move through the items in document order, swapped only under an `rtl` `DirectionProvider`, which Perron doesn't set up, and the toolbar opens nothing of its own; a popup opened through `render` returns focus to its trigger, by Base UI.
- [ ] Every target is at least `size.target-min` square: the smallest target is an icon-only button, `size.control` (34 px) square.
- [ ] Loops stop when the system asks for less motion: none here; the toolbar has no loop and no transition.

## Owned strings

No owned strings: every word comes from the caller, as a button's `children`, an icon-only button's `aria-label`, or the toolbar's `aria-label`.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** Base UI's toolbar already gives the one tab stop, the roving `tabIndex`, the arrow keys, the wrap and the disabled cascade from root and group to button, so the components rebuild none of it and add no key handlers.
- **CR-2.** `ToolbarButton`, `ToolbarGroup` and `ToolbarSeparator` only render inside a `Toolbar`: Base UI's parts read its context. Every story renders them in one.
- **CR-3.** Each of the four takes `{...rest}` before its own attributes and its own props out of `rest` first (`orientation`, `disabled`, `color`, `startIcon`, `endIcon`; an inherited Base UI prop such as `loopFocus` stays in `rest`, keeping Base UI's default), and merges `className` after its own `pn-` class; `ref` reaches its one element.
- **CR-4.** `ToolbarButton`'s root always carries `data-color`, default included, and `data-icon-only` when it has a `startIcon` and no `children`; the CSS selects on them, one class then attributes: `.pn-ToolbarButton[data-color='brand']`. The toolbar's layout reads Base UI's `data-orientation`: `.pn-Toolbar[data-orientation='vertical']` is a column.
- **CR-5.** The states keep the button's geometry: hover, pressed, focus and disabled change colours only, never the height, padding, gap, border width or radius. Every button draws a `border.width.025` border, `transparent` on a neutral button and a disabled brand one, so both colours share one size and Windows' forced colours draw an edge round each.
- **CR-6.** Hover is read inside `@media (hover: hover)`; pressed (`:active`) takes the hover tokens in a rule outside it, so a touch press shows. Neither applies to a disabled button: both rules exclude `[data-disabled]`, since a button focusable when disabled has no native `disabled` and still matches `:hover` and `:active`.
- **CR-7.** Focus uses the ring `perron.css` draws on `:focus-visible`; the component draws no ring of its own and never removes the outline. The root's `space.100` padding and gap leave the ring, `focus.offset` plus `focus.width` out, inside the bar.
- **CR-8.** The colour is set on the button's `color`; the label and the icons take it through `currentColor`. No rule sets a colour on an icon. The icon spans are `aria-hidden="true"`, rendered only when their prop is given, and set `--perron-icon-size` to `icon.size.400`.
- **CR-9.** A button's label stays on one line (`white-space: nowrap`), the button growing with it, rather than wrapping inside the fixed `size.control` height.
- **CR-10.** A `brand` button keeps its `color.border.brand` edge at rest, on hover and pressed: the light-theme yellow fill reaches only 2.1:1 on the surfaces, and the edge carries the 3:1 ([Semantic colours](../foundations/semantic-colours.md#brand)).
- **CR-11.** The separator is drawn as a border on a box of no size (`border-inline-start` across a horizontal toolbar, `border-block-start` across a vertical one), stretched across the bar with `align-self: stretch`, never as a background, which forced colours remove.
- **CR-12.** Changes of state are immediate: no `duration.*` token fits a button's state change, so the CSS has no transition.
- **CR-13.** The toolbar sizes to its content (`display: inline-flex`); placing it on the map, its `z-index` and its distance from the edge belong to the pattern that uses it, such as MapControls.

## Stories

The deferred design's page draws two components: the toolbar, with one variant property, `orientation` (`horizontal`, `vertical`), and its button, with `color` (`neutral`, `brand`) and `State` (`default`, `hover`, `focus`, `disabled`). Each story is named by its variant name (`penpot/README.md`, "Conventions").

The button's stories, and a later drawing's exports, are prefixed `Button`, as `ButtonNeutralDefault`, beside the toolbar's `Horizontal` and `Vertical`, since the Penpot conventions name a variant by its property values alone.

The toolbar stories render a toolbar named "Map controls" (zoom in, zoom out, a separator, then a group with "Show whole line" and a brand "Show departures"), with `packages/perron/icons/`'s `plus`, `minus` and `locate`. The button stories render one labelled button, "Show whole line", in a toolbar named "Actions", and set `disabled` for a `Disabled` story. The hover and focus stories render at rest: the visual check drives the state, and their `play` tests check it.

| Story                   | Shows                                                                                           | `play` test                                                                                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Horizontal`            | horizontal toolbar: two icon-only buttons, a separator, a group of two labelled buttons         | Tab focuses the first button; ArrowRight moves through each button, skipping the separator, and wraps to the first; ArrowLeft goes back; Enter fires `onClick` once; Shift+Tab leaves, and Tab returns to the last focused button |
| `Vertical`              | vertical toolbar: zoom in, zoom out, a separator, locate, all icon-only                         | ArrowDown and ArrowUp move between the buttons and ArrowRight doesn't; the separator's `aria-orientation` is `horizontal`                                                                                                         |
| `ButtonNeutralDefault`  | neutral button, at rest                                                                         | none                                                                                                                                                                                                                              |
| `ButtonNeutralHover`    | neutral button, hover                                                                           | Hovering lays `color.surface.hover` over the transparent fill                                                                                                                                                                     |
| `ButtonNeutralFocus`    | neutral button, focus                                                                           | Tab gives the button `:focus-visible` and the ring                                                                                                                                                                                |
| `ButtonNeutralDisabled` | neutral button, disabled                                                                        | The button has `aria-disabled` and `data-disabled`, Tab still reaches it, and a click fires no `onClick`                                                                                                                          |
| `ButtonBrandDefault`    | brand button, at rest                                                                           | none                                                                                                                                                                                                                              |
| `ButtonBrandHover`      | brand button, hover                                                                             | Hovering sets the `color.surface.brand-hover` fill and keeps the `color.border.brand` edge                                                                                                                                        |
| `ButtonBrandFocus`      | brand button, focus                                                                             | none                                                                                                                                                                                                                              |
| `ButtonBrandDisabled`   | brand button, disabled                                                                          | none                                                                                                                                                                                                                              |
| `IconOnly`              | horizontal toolbar of three icon-only neutral buttons, two given `false` and `''` as `children` | Each button is named by its `aria-label`, has `data-icon-only` and no label span, its icon span is `aria-hidden`, and it is `size.control` square                                                                                 |
| `Disabled`              | horizontal toolbar with `disabled`                                                              | Every button carries `data-disabled`, the arrow keys still move between them, and a click fires no `onClick`                                                                                                                      |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                                                       | Don't                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Name every toolbar with `aria-label` or `aria-labelledby`, such as "Map controls", so a screen reader tells it from the next one                         | Leave a toolbar unnamed: two on a screen are both announced as "toolbar"                                                             |
| Put each action in a `ToolbarButton`, so the arrow keys reach it                                                                                         | Put a Button, an IconButton or a plain `<button>` straight into the toolbar: it falls out of the arrow-key order and adds a tab stop |
| Give an icon-only button an `aria-label` that names the action: "Zoom in"                                                                                | Leave an icon-only button without one: its icon is `aria-hidden`, so the button has no name                                          |
| Open a menu, popover or dialog through `render`, `<ToolbarButton render={<Menu.Trigger />}>`, and set `disabled` on the `ToolbarButton`, not the trigger | Disable the trigger itself: Base UI says the button then leaves the toolbar's arrow-key order                                        |
| Wrap a button in a [Tooltip](tooltip.md) with `<Tooltip trigger={<ToolbarButton … />}>…</Tooltip>`, the tooltip around the button                        | Pass the tooltip's trigger to `ToolbarButton`'s `render`, as for popups                                                              |
| Give one button per screen `color="brand"`, for its main action                                                                                          | Mark several toolbar buttons `brand`, or use it for emphasis: a second yellow action leaves neither the main one                     |
| Keep a disabled button focusable, the default, so it can explain itself through a tooltip                                                                | Restyle a disabled button with `opacity`: disabled is `color.text.tertiary`, a colour                                                |
| Use a SegmentedControl or FilterChips for a choice or an on-and-off filter                                                                               | Build a toggle out of a `ToolbarButton`: it draws no selected state                                                                  |
| Place the toolbar over the map in a pattern, which sets its position and stacking                                                                        | Set a `z-index` or a margin from the screen edge on the toolbar itself: the component sizes to its content                           |
