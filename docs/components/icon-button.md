# IconButton

A button that runs one action and shows it as an icon alone, such as zoom in or show help, named for screen readers by its required `label`.

<!-- run notes -->

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): there is no read-back, code map or export, and this spec decides what the drawing would, from the contract, the foundations, the tokens, the Base UI reference and the spec of its sibling [Button](button.md), a source it follows rather than a dependency: IconButton builds on Base UI's `Button` and the `VisuallyHidden` part, not on Perron's Button. The [Toolbar](toolbar.md) spec gives its icon-only buttons the look and size answered below, and this spec follows it so the two match side by side.

## Anatomy

Penpot page `Components/IconButton`. Family: none (the contract's [Families](README.md#families) give buttons only their text, and an icon button shows none). Shared parts: `VisuallyHidden`, which holds the label: the contract composes it in "any component with a word the eye gets from an icon or a shape".

| Part (Penpot layer) | What it is                                                                                                                                                                             | Base UI part                                           | Class                | `slotProps` key |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------- | --------------- |
| `root`              | The native `<button>`: a square, `size.control` both ways, that centres the icon                                                                                                       | `Button`                                               | `pn-IconButton`      | none            |
| `icon`              | A `<span>`, `aria-hidden`, that holds the caller's `children`, the icon                                                                                                                | none: a span inside `Button`, which has no inner parts | `pn-IconButton-icon` | none            |
| `label`             | The `VisuallyHidden` span that holds the caller's `label`, the words that name the button. Never seen, so a drawing has no layer for it                                                | none: the `VisuallyHidden` shared part inside `Button` | `pn-VisuallyHidden`  | none            |
| `focusRing`         | The keyboard focus ring, as on Button: the `:focus-visible` outline `perron.css` draws on the root, not an element. A drawing shows it as a layer named `focusRing` on the focus state | `Button`                                               | none                 | none            |

## Base UI parts

Imported from `@base-ui/react/button`, at the version pinned in `package.json` (1.9.0 installed).

| Base UI part | Renders                                                                                     | Perron sets                                                                                                                                                                                      | Passed through                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`     | `<button type="button">`, or the element `render` gives, with `data-disabled` when disabled | `className` (`pn-IconButton`, then the caller's), `style`, `ref`, `disabled` from `disabled`, `data-color` and `data-size` from their props (defaults included), and the icon and label children | `render`, `nativeButton`, `focusableWhenDisabled`, `type`, `onClick`, `aria-*` and every other prop of a native `<button>`, through `{...rest}` |

Base UI already does: it renders a native `<button>` with `type="button"`, which a caller's `type="submit"` overrides; Enter and Space activate it through the browser; when disabled it sets the native `disabled` attribute and `data-disabled`, and stops `onClick`, `onMouseDown` and `onPointerDown` from reaching the caller; with `focusableWhenDisabled` it sets `aria-disabled` in place of `disabled`, keeps the button in the tab order and lets only Tab through; with `render` and `nativeButton={false}` it gives a non-button element `role="button"`, a `tabIndex` and Enter and Space activation, and in development it warns when `nativeButton` doesn't match the rendered element.

## Props

In MUI's layout, as MUI's IconButton takes its icon as `children`. Every prop the component declares gets this description as its JSDoc; the inherited rows keep Base UI's. Slots come last.

The button is named by a required `label: string` prop, rendered as text inside the button through the `VisuallyHidden` shared part, rather than by the caller's `aria-label`. The type then makes the name impossible to forget, which Button's spec promises ("so it gets its required label"); the contract composes `VisuallyHidden` for a word the eye gets from an icon; and a page translator rewrites text inside the button, where it leaves an `aria-label` in the other language. A caller's `aria-label` or `aria-labelledby` still wins, through `{...rest}`.

IconButton takes a `size` of `'medium' | 'large'`, default `'medium'`, that keeps the `size.control` square and sets only the icon's step: `icon.size.400` for `medium`, `icon.size.450` for `large`. [Icons](../foundations/icons.md#sizes) gives `icon.size.450` to "top bar buttons" (`monitor` and `info`, drawn on the 18 px grid), which are icon buttons, and an icon drawn on one grid must not be scaled to another; no token gives an icon button a second box size.

IconButton leaves out MUI IconButton's `edge` and `loading`. No source asks for either: the screens place their buttons with layout gaps, and no Perron component shows a loading indicator yet. Each can join later as a new optional prop, which the contract's [Change](README.md#change) rule allows.

| Name                        | Type                   | Default     | Base UI prop         | Description                                                                                                                                                                                      |
| --------------------------- | ---------------------- | ----------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`                     | `string`               | none        | none                 | The words that name the action, in sentence case, such as "Zoom in". Required: the icon is hidden from screen readers, so these words are the button's name. Never seen, read by screen readers. |
| `color`                     | `'neutral' \| 'brand'` | `'neutral'` | none                 | The intent: `neutral` is quiet ink, for every action but the main one; `brand` is the brand yellow, for the one main action of a screen.                                                         |
| `size`                      | `'medium' \| 'large'`  | `'medium'`  | none                 | The icon's step in the `size.control` square: `medium` is `icon.size.400`, for icons drawn on the 16 px grid; `large` is `icon.size.450`, for the top bar's icons drawn on the 18 px grid.       |
| `disabled`                  | `boolean`              | `false`     | `disabled`           | Whether the button ignores the pointer and the keys. A disabled button leaves the tab order unless `focusableWhenDisabled` is set.                                                               |
| `focusableWhenDisabled`     | `boolean`              | `false`     | inherited            | Whether the button should be focusable when disabled.                                                                                                                                            |
| `nativeButton`              | `boolean`              | `true`      | inherited            | Whether the component renders a native `<button>` element when replacing it via the `render` prop. Set to `false` if the rendered element is not a button (for example, `<div>`).                |
| `render`                    | Base UI's `render`     | none        | inherited            | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render.        |
| `children`                  | `ReactNode`            | none        | none                 | The icon, such as an SVG from `packages/perron/icons/` with the `perron-icon` class. Hidden from screen readers: `label` names the button.                                                       |
| `className`, `style`, `ref` | React's                | none        | `className`, `style` | Reaches the root. `className` is merged after `pn-IconButton`.                                                                                                                                   |

No `slotProps`: IconButton has one Base UI part, `Button`, which is the root, and the root takes the component's own props. The icon span and the label's `VisuallyHidden` are not Base UI parts. No label-override props: `label` is the caller's word, not an owned string.

## Tokens

One row per part, state and property. States are the contract's design states; the deferred design's `State` values map as Button's do: `default` is rest, `hover` is `:hover` inside `@media (hover: hover)`, `focus` is `:focus-visible`, `disabled` is `[data-disabled]`; pressed, which the design doesn't draw, is `:active`. Every `color` row sets the root's `color`, which the icon takes through `currentColor`.

IconButton has no `variant` prop and one look per colour, as Toolbar's icon-only buttons have: `neutral` quiet (transparent at rest in `color.text.primary`, `color.surface.hover` on hover and press), `brand` a solid brand button (`color.surface.brand` with a `color.border.brand` edge and `color.text.on-color.dark`, `color.surface.brand-hover` on hover and press). Icon buttons sit on panels, sheets and the top bar's glass, which already mark where they are; the brand is calm, with ink and neutral surfaces around the map; MUI's IconButton has no `variant` either; and a toolbar of icon buttons then matches the IconButtons beside it.

IconButton leaves out a toggled ("pressed") state, `aria-pressed` and the `color.surface.inverse` fill whose description names "pressed icon buttons", leaving an icon that turns something on and off to a component on Base UI's `Toggle`. IconButton's one Base UI part is `Button`, which keeps no pressed state; [Accessibility](../foundations/accessibility.md#rules) wants a toggle's state said in words as well as looks, which a label-only button can't show; and FilterChip and HighlightChip, on `Toggle`, are the roadmap's toggles.

Every colour and size:

| Part        | State | Property                    | Token                                                                                                                                     |
| ----------- | ----- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `root`      | rest  | `width`, `height`           | `size.control`                                                                                                                            |
| `root`      | rest  | `padding`                   | 0                                                                                                                                         |
| `root`      | rest  | `border-radius`             | `radius.md`                                                                                                                               |
| `root`      | rest  | `border-width`              | `border.width.025`                                                                                                                        |
| `root`      | rest  | `--perron-icon-size`        | `icon.size.400` when `size` is `medium`, `icon.size.450` when `large`, inherited by the icon                                              |
| `root`      | focus | `outline`, `outline-offset` | `focus.width` in `color.border.focus`, `focus.offset` (drawn by `perron.css`)                                                             |
| `focusRing` | focus | ring corner radius          | `radius.lg`, as Button's: the outline follows the root's `radius.md` out by `focus.offset` plus `focus.width`, and the CSS sets no radius |

`neutral`:

| Part   | State    | Property           | Token                 |
| ------ | -------- | ------------------ | --------------------- |
| `root` | rest     | `background-color` | `transparent`         |
| `root` | rest     | `border-color`     | `transparent`         |
| `root` | rest     | `color`            | `color.text.primary`  |
| `root` | hover    | `background-color` | `color.surface.hover` |
| `root` | pressed  | `background-color` | `color.surface.hover` |
| `root` | disabled | `background-color` | `transparent`         |
| `root` | disabled | `color`            | `color.text.tertiary` |

`brand`:

| Part   | State    | Property           | Token                       |
| ------ | -------- | ------------------ | --------------------------- |
| `root` | rest     | `background-color` | `color.surface.brand`       |
| `root` | rest     | `border-color`     | `color.border.brand`        |
| `root` | rest     | `color`            | `color.text.on-color.dark`  |
| `root` | hover    | `background-color` | `color.surface.brand-hover` |
| `root` | pressed  | `background-color` | `color.surface.brand-hover` |
| `root` | disabled | `background-color` | `color.surface.inset`       |
| `root` | disabled | `border-color`     | `transparent`               |
| `root` | disabled | `color`            | `color.text.tertiary`       |

A disabled brand icon button looks like Button's disabled solid one, `color.surface.inset` with `color.text.tertiary` and no edge: disabled is a colour, and a yellow that can't be pressed shouldn't still mark the main action.

Pressed takes the hover row's tokens, in a rule outside `@media (hover: hover)` so a press on a touch screen shows, as on Button: no token is made for a pressed fill.

Highlighted, open, selected and invalid don't apply: Base UI's `Button` produces only `data-disabled`, a button takes focus rather than `data-highlighted`, a popup trigger given through `render` keeps the button's look while its popup is open, and an icon button holds no choice or value.

## Keyboard and ARIA

From the Base UI reference for `Button` and the installed `useButton`, as on Button. "From" says who does it.

| Key                | Does                                                                                            | From                                           |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `Tab`, `Shift+Tab` | Moves focus to the button and away; a disabled button is skipped unless `focusableWhenDisabled` | The browser, and Base UI                       |
| `Enter`            | Activates the button: fires `onClick`, or submits the form with `type="submit"`                 | The browser; Base UI for a non-button `render` |
| `Space`            | Activates the button on release                                                                 | The browser; Base UI for a non-button `render` |

| Element | Role                                                                                    | Accessible name from                                                                                              | States announced                                                                 |
| ------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `root`  | `button`, native; `role="button"` from Base UI when `render` gives a non-button element | Its text content: the `label` in the `VisuallyHidden` span; `aria-label` or `aria-labelledby` from the caller win | Disabled: the native `disabled`, or `aria-disabled` with `focusableWhenDisabled` |
| `icon`  | none: `aria-hidden="true"`                                                              | none                                                                                                              | none                                                                             |
| `label` | none: text inside the button                                                            | none: it is the name                                                                                              | none                                                                             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the icon is `aria-hidden` and `label` says in words what it shows, as [Icons](../foundations/icons.md#style) asks of an icon alone; `color` carries emphasis, not meaning; disabled is announced by the native attribute or `aria-disabled`.
- [ ] Every landmark and named region has an accessible name: none here; a button is neither.
- [ ] Every default label can be overridden: none here; IconButton owns no strings, and `label` is the caller's.
- [ ] Every shape the type accepts renders, in every variant: `children` renders a string, an element and a list alike, centred in the square, in both colours and both sizes, and the icon span clips a string wider than the square so it stays inside; `label` is a `string`.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; IconButton keeps no hidden copy and collapses nothing. The `VisuallyHidden` label is the name, not a copy.
- [ ] Native semantics first: a native `<button>` from Base UI's `Button`, named by its own text; with `render` and `nativeButton={false}`, Base UI's `role="button"`. No ARIA of its own.
- [ ] Focus moves in reading order and returns on close: the button is one tab stop in document order, and opens nothing of its own to return from.
- [ ] Every target is at least `size.target-min` square: every IconButton is `size.control` (34 px) square, in both sizes.
- [ ] Loops stop when the system asks for less motion: none here; IconButton has no loop and no transition.

## Owned strings

No owned strings: every word comes from the caller, as `label`.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** Base UI's `Button` already renders the native `<button type="button">`, activates on Enter and Space, sets `disabled` and `data-disabled`, and blocks the click of a disabled button, so the component rebuilds none of it and passes `disabled` straight to it.
- **CR-2.** The root always carries `data-color` and `data-size`, defaults included; the CSS selects on them, one class then attributes: `.pn-IconButton[data-color='brand']`, `.pn-IconButton[data-size='large']`.
- **CR-3.** The root is a `size.control` square in both sizes, with no padding, and centres the icon (`display: inline-flex`, `align-items` and `justify-content` `center`, `flex: none` so a flex row never squeezes it). The icon span is at most the square and clips what overflows it, so a long string stays inside the square and the root's ring and label are untouched. `size` changes only the icon's step.
- **CR-4.** The states keep the geometry: hover, pressed, focus and disabled change colours only, never the size, border width or radius. Both colours draw a `border.width.025` border, `transparent` on `neutral` and on a disabled `brand`, so the two share one box and Windows' forced colours draw an edge round every icon button.
- **CR-5.** Hover is read inside `@media (hover: hover)`; pressed (`:active`) takes the hover tokens in a rule outside it, so a touch press shows. Neither applies to a disabled button: both rules exclude `[data-disabled]`, since a native disabled button still matches `:hover`, and one with `focusableWhenDisabled` still matches `:active`.
- **CR-6.** Focus uses the ring `perron.css` draws on `:focus-visible`; the component draws no ring of its own and never removes the outline. The focus state otherwise looks like rest.
- **CR-7.** The colour is set on the root's `color`; the icon takes it through `currentColor`. No rule sets a colour on the icon.
- **CR-8.** The icon span is `aria-hidden="true"`, and the root sets `--perron-icon-size`, which the icon inherits: `icon.size.400` for `medium`, `icon.size.450` for `large`, on `.pn-IconButton` and `.pn-IconButton[data-size='large']` with no descendant selector, so an icon from `packages/perron/icons/` renders at the step its grid was drawn for.
- **CR-9.** The label is the caller's `label` inside the `VisuallyHidden` shared part, after the icon span, rendered on every button: the button is named by its own text, the component sets no `aria-label` and no `title`, and `label` is required in `IconButtonProps`.
- **CR-10.** A `brand` icon button keeps its `color.border.brand` edge at rest, on hover and pressed: the light-theme yellow fill reaches only 2.1:1 on the surfaces, and the edge carries the 3:1 ([Semantic colours](../foundations/semantic-colours.md#brand)).
- **CR-11.** Changes of state are immediate: no `duration.*` token fits a button's state change, so the CSS has no transition.
- **CR-12.** `{...rest}` reaches the root before the component's own attributes, and `label`, `color`, `size` and `children` are taken out of `rest` first, so none reaches the DOM as an attribute.
- **CR-13.** In forced colours, a disabled icon button draws its edge and its icon in `GrayText`, inside `@media (forced-colors: active)`, as Button does.
- **CR-14.** IconButton keeps no toggled state: it sets no `aria-pressed`, and no rule reads one.

## Stories

The deferred design's variant properties, in this order: `color` (`neutral`, `brand`), `size` (`medium`, `large`) and `State` (`default`, `hover`, `focus`, `disabled`). Each story is named by its variant name (`penpot/README.md`, "Conventions"). A `medium` story renders `packages/perron/icons/`'s `plus` with the label "Zoom in"; a `large` one renders `info`, drawn on the 18 px grid, with the label "Show help". A `Disabled` story sets `disabled`. The hover and focus stories render at rest: the visual check drives the state itself, and their `play` tests check it.

| Story                   | Shows                     | `play` test                                                                                                                                                     |
| ----------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NeutralMediumDefault`  | neutral, medium, at rest  | The button's accessible name is "Zoom in" and its icon span is `aria-hidden`; Tab focuses it, Enter and Space each fire `onClick` once, Shift+Tab returns focus |
| `NeutralMediumHover`    | neutral, medium, hover    | Hovering lays `color.surface.hover` over the transparent fill                                                                                                   |
| `NeutralMediumFocus`    | neutral, medium, focus    | Tab gives the root `:focus-visible` and the ring                                                                                                                |
| `NeutralMediumDisabled` | neutral, medium, disabled | The button has `disabled` and `data-disabled`, Tab skips it, and a click fires no `onClick`                                                                     |
| `NeutralLargeDefault`   | neutral, large, at rest   | The root is `size.control` square, as in `medium`, and the icon renders at `icon.size.450`                                                                      |
| `NeutralLargeHover`     | neutral, large, hover     | none                                                                                                                                                            |
| `NeutralLargeFocus`     | neutral, large, focus     | none                                                                                                                                                            |
| `NeutralLargeDisabled`  | neutral, large, disabled  | none                                                                                                                                                            |
| `BrandMediumDefault`    | brand, medium, at rest    | none                                                                                                                                                            |
| `BrandMediumHover`      | brand, medium, hover      | Hovering sets the `color.surface.brand-hover` fill and keeps the `color.border.brand` edge                                                                      |
| `BrandMediumFocus`      | brand, medium, focus      | none                                                                                                                                                            |
| `BrandMediumDisabled`   | brand, medium, disabled   | The disabled brand button has the `color.surface.inset` fill and a transparent edge                                                                             |
| `BrandLargeDefault`     | brand, large, at rest     | none                                                                                                                                                            |
| `BrandLargeHover`       | brand, large, hover       | none                                                                                                                                                            |
| `BrandLargeFocus`       | brand, large, focus       | none                                                                                                                                                            |
| `BrandLargeDisabled`    | brand, large, disabled    | none                                                                                                                                                            |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                                                         | Don't                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Give `label` the action in sentence case, as a verb and what it acts on: "Zoom in", "Centre the map"                                                       | Name the icon rather than the action ("Plus", "Magnifier"), or write Title Case or an exclamation mark ([Content design](../content-design.md)) |
| Use IconButton only where the icon is one people know at a glance, such as zoom, locate, close or search, and use [Button](button.md) with words otherwise | Put an icon whose meaning has to be guessed in an IconButton: the label reaches only screen readers, and the eye gets the icon alone            |
| Give `size="large"` to an icon drawn on the 18 px grid (`monitor`, `info`), and keep the default `medium` for the 16 px ones                               | Set `--perron-icon-size` or a width on the icon yourself, or give a 16 px icon `large`: an icon drawn on one grid blurs when scaled to another  |
| Give one action per screen `color="brand"`, for its main action                                                                                            | Use `brand` for emphasis, or set two brand actions on one screen                                                                                |
| Set icon buttons on a panel, a sheet or the top bar's glass, which mark where they sit                                                                     | Float a `neutral` icon button straight over the map: its transparent fill disappears on the land and water                                      |
| Put each action of a [Toolbar](toolbar.md) in a `ToolbarButton`, so the arrow keys reach it                                                                | Put an IconButton inside a Toolbar: it falls out of the arrow-key order and adds a tab stop                                                     |
| Use a toggle component, such as FilterChip, for an icon that turns something on and off                                                                    | Set `aria-pressed` on an IconButton and restyle it: IconButton keeps no pressed state, and a toggle says its state in words                     |
| Set `disabled` when the action can't run, with `focusableWhenDisabled` so the button can still be reached and its name heard                               | Restyle a disabled icon button with `opacity`: disabled is `color.text.tertiary`, a colour                                                      |
