# MapControls

The map's zoom in, zoom out and centre buttons, in one glass bar that is one tab stop, named and labelled in the reader's language.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): there is no read-back, code map or export, and this spec decides what the drawing would, from the contract, the foundations, the tokens, the Base UI reference and the specs of the entries it depends on, [Toolbar](toolbar.md) and [IconButton](icon-button.md). The extracted prototype component is not in any branch this run can reach.

## Anatomy

Penpot page `Components/MapControls`. Family: none (the contract's [Families](README.md#families) have no bar of actions; the bar is Toolbar's, on the Popups' glass). Shared parts: none (each button is an icon-only `ToolbarButton`, named by its `aria-label` from an owned string, as Toolbar's icon-only buttons are).

Answered (recommended): MapControls renders Perron's `Toolbar`, vertical by default, holding three icon-only `ToolbarButton`s in the order zoom in, zoom out, a `ToolbarSeparator`, centre the map, with no `ToolbarGroup` and no IconButton, and the build drops `IconButton` from MapControls' `dependsOn` in `packages/perron/components.json`. The Toolbar spec's Do and don't says an IconButton inside a Toolbar "falls out of the arrow-key order and adds a tab stop", and the IconButton spec says a `neutral` icon button floated over the map "disappears on the land and water", so the controls are Toolbar's buttons on Toolbar's glass; this is the column Toolbar's `Vertical` story draws ("zoom in, zoom out, a separator, locate"); and a group would only need a name of its own for two buttons the separator already sets apart.

| Part (Penpot layer) | What it is                                                                                                                            | Base UI part                                                    | Class                      | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------- | --------------- |
| `root`              | Perron's `Toolbar`: the glass bar, a column (or a row when horizontal), named "Map controls"                                          | `Toolbar.Root`, through Perron's `Toolbar`                      | `pn-MapControls`           | none            |
| `zoomIn`            | A `ToolbarButton`, icon-only: the native `<button>` that zooms in, showing the `plus` icon                                            | `Toolbar.Button`, through Perron's `ToolbarButton`              | `pn-MapControls-zoomIn`    | none            |
| `zoomOut`           | A `ToolbarButton`, icon-only: the native `<button>` that zooms out, showing the `minus` icon                                          | `Toolbar.Button`, through Perron's `ToolbarButton`              | `pn-MapControls-zoomOut`   | none            |
| `separator`         | A `ToolbarSeparator`: the hairline across the bar between the zoom pair and the centre button                                         | `Toolbar.Separator`, through Perron's `ToolbarSeparator`        | `pn-MapControls-separator` | none            |
| `centerMap`         | A `ToolbarButton`, icon-only: the native `<button>` that centres the map on the network, showing the `locate` icon                    | `Toolbar.Button`, through Perron's `ToolbarButton`              | `pn-MapControls-centerMap` | none            |
| `icon`              | The inline SVG in each button: `plus`, `minus` or `locate` from `packages/perron/icons/`, inside `ToolbarButton`'s `aria-hidden` span | none: an `<svg>` inside the `startIcon` span of `ToolbarButton` | `perron-icon`              | none            |
| `focusRing`         | The keyboard focus ring on a button: the `:focus-visible` outline `perron.css` draws on `button`, not an element                      | `Toolbar.Button`                                                | none                       | none            |

Each part also keeps the class of the Perron component it is: the root `pn-Toolbar`, each button `pn-ToolbarButton`, the separator `pn-ToolbarSeparator`, which carry every look (see Tokens).

## Base UI parts

None imported here: MapControls composes Perron's `Toolbar`, `ToolbarButton` and `ToolbarSeparator` from `packages/perron/src/components/Toolbar/Toolbar.tsx`, which render Base UI's parts from `@base-ui/react/toolbar` at the version pinned in `packages/perron/package.json` (1.9.0), so the registry's `baseUiParts` is empty. The parts that reach the DOM:

| Base UI part        | Renders                                                                                                                            | Perron sets                                                                                                                                                                                            | Passed through                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `Toolbar.Root`      | `<div role="toolbar" aria-orientation>`, with `data-orientation` and, when disabled, `data-disabled`                               | Through `Toolbar`: `className` (`pn-Toolbar`, then `pn-MapControls`, then the caller's), `ref`, `orientation` (default `'vertical'`), `disabled`, and `aria-label` from the `mapControls` owned string | `loopFocus`, `render`, `style`, `aria-labelledby` and every other prop of a `<div>`, through `{...rest}` |
| `Toolbar.Button`    | `<button type="button">`, three times, with `data-orientation`, `data-disabled` when disabled and `data-focusable` while focusable | Through `ToolbarButton`: `className` (`pn-ToolbarButton`, then `pn-MapControls-<part>`), `color` `'neutral'`, `startIcon` (the icon), `aria-label` from its owned string, `onClick`, `disabled`        | Nothing: the caller reaches each button only through its `on…`, `…Disabled` and `…Label` props           |
| `Toolbar.Separator` | `<div role="separator" aria-orientation>`, its orientation across the toolbar's, with `data-orientation`                           | Through `ToolbarSeparator`: `className` (`pn-ToolbarSeparator`, then `pn-MapControls-separator`)                                                                                                       | Nothing                                                                                                  |

Base UI already does: one tab stop for the whole bar with a roving `tabIndex`, so Tab enters at the button last focused (zoom in at first) and leaves in one step; the arrow keys of the bar's orientation move between the three buttons, skipping the separator, and wrap at the ends while `loopFocus` is on; a disabled `Toolbar.Root` disables every button; a disabled `Toolbar.Button` stays focusable by default (`focusableWhenDisabled` is `true`), with `aria-disabled` in place of `disabled` and its clicks stopped, so it stays in the arrow-key order; `Toolbar.Separator` takes the orientation across the bar's.

## Props

In MUI's layout. Every prop MapControls declares gets this description as its JSDoc; the inherited rows keep Base UI's. Slots come last.

Answered (recommended): MapControls takes `orientation`, `'horizontal' | 'vertical'`, default `'vertical'`, passed to `Toolbar`, and redeclares it in `MapControlsProps` so its JSDoc gives that default. [Layout](../foundations/layout.md#page-shell) puts the controls at the bottom right, beside the scale, where the Toolbar spec gives `orientation` "for the map's vertical column of controls"; a screen that lays them along an edge, such as a phone's above the bottom sheet, sets `'horizontal'`.

Answered (recommended): MapControls takes one handler per button, `onZoomIn(event)`, `onZoomOut(event)` and `onCenterMap(event)`, each given to that `ToolbarButton`'s `onClick`, always renders all three buttons, and takes no `children`. The map, not the controls, holds the zoom level, so the screen does the zooming in a handler; three buttons always in one order keep every screen's controls alike, a button with no handler does nothing rather than vanish; and another map action, such as a layers switch, goes in a Toolbar of its own. Code names take the American spelling, as `color` does, and the English words the British, "Centre the map", as [Content design](../content-design.md) writes.

Answered (recommended): MapControls takes `zoomInDisabled` and `zoomOutDisabled`, booleans default `false`, that disable the one button at the map's zoom limits, leaving it focusable (`ToolbarButton`'s default `focusableWhenDisabled`). At the closest or farthest zoom a button that still looks pressable misleads; kept focusable, the button keeps the focus a keyboard user pressed it with, stays in the arrow-key order, and is announced as dimmed through `aria-disabled`.

Answered (recommended): MapControls takes no `slotProps`, and puts a `pn-MapControls-<part>` class on each button and the separator for a caller's CSS. The contract keys `slotProps` by Base UI part, and the three buttons share one, `Toolbar.Button`; every per-button need the sources name (handler, limit, words) is a prop above; and a `slotProps` key can join later as a new optional prop, which [Change](README.md#change) allows.

| Name                        | Type                                                   | Default      | Base UI prop                        | Description                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------------ | ------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orientation`               | `'horizontal' \| 'vertical'`                           | `'vertical'` | `orientation`, through `Toolbar`    | Which way the bar runs, and so which arrow keys move through it: Up and Down for `vertical`, the map's column at the bottom right; Left and Right for `horizontal`.                       |
| `disabled`                  | `boolean`                                              | `false`      | `disabled`, through `Toolbar`       | Whether every button is disabled, such as while the map loads. The buttons stay focusable and in the arrow-key order.                                                                     |
| `zoomInDisabled`            | `boolean`                                              | `false`      | none                                | Whether the zoom in button is disabled, at the map's closest zoom. It stays focusable and announces that it is dimmed, and a click fires no `onZoomIn`.                                   |
| `zoomOutDisabled`           | `boolean`                                              | `false`      | none                                | Whether the zoom out button is disabled, at the map's farthest zoom. It stays focusable and announces that it is dimmed, and a click fires no `onZoomOut`.                                |
| `onZoomIn`                  | `(event: React.MouseEvent<HTMLButtonElement>) => void` | none         | `onClick` of the `zoomIn` button    | Called when the zoom in button is pressed, by click, Enter or Space, with the click event. The screen zooms the map in by one step.                                                       |
| `onZoomOut`                 | `(event: React.MouseEvent<HTMLButtonElement>) => void` | none         | `onClick` of the `zoomOut` button   | Called when the zoom out button is pressed, by click, Enter or Space, with the click event. The screen zooms the map out by one step.                                                     |
| `onCenterMap`               | `(event: React.MouseEvent<HTMLButtonElement>) => void` | none         | `onClick` of the `centerMap` button | Called when the centre button is pressed, by click, Enter or Space, with the click event. The screen moves and zooms the map to show the whole network.                                   |
| `loopFocus`                 | `boolean`                                              | `true`       | inherited                           | If `true`, using keyboard navigation will wrap focus to the other end of the toolbar once the end is reached.                                                                             |
| `render`                    | Base UI's `render`                                     | none         | inherited                           | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render. |
| `mapControlsLabel`          | `string`                                               | The locale's | none                                | Overrides "Map controls", the bar's name.                                                                                                                                                 |
| `zoomInLabel`               | `string`                                               | The locale's | none                                | Overrides "Zoom in", the zoom in button's name.                                                                                                                                           |
| `zoomOutLabel`              | `string`                                               | The locale's | none                                | Overrides "Zoom out", the zoom out button's name.                                                                                                                                         |
| `centerMapLabel`            | `string`                                               | The locale's | none                                | Overrides "Centre the map", the centre button's name.                                                                                                                                     |
| `className`, `style`, `ref` | React's                                                | none         | `className`, `style`                | Reach the root, the `role="toolbar"` element. `className` is merged after `pn-Toolbar` and `pn-MapControls`.                                                                              |

No `slotProps`, as answered above. No `children`: the three buttons are the component's own.

## Tokens

MapControls sets no token of its own: every value below is Toolbar's and ToolbarButton's, from the [Toolbar](toolbar.md) spec's Tokens, so the controls match every other toolbar. `MapControls.css` holds no declaration that sets one (CR-9). States are the contract's design states: rest is no selector, hover is `:hover` inside `@media (hover: hover)`, pressed is `:active`, focus is `:focus-visible`, disabled is `[data-disabled]`. The three buttons are `neutral`; every `color` row sets the button's `color`, which the icon takes through `currentColor`.

| Part                             | State    | Property                    | Token                                                                         |
| -------------------------------- | -------- | --------------------------- | ----------------------------------------------------------------------------- |
| `root`                           | rest     | `background-color`          | `color.surface.overlay`                                                       |
| `root`                           | rest     | `backdrop-filter`           | `effect.glass-blur` (blur) and `effect.glass-saturate`                        |
| `root`                           | rest     | `box-shadow`                | `shadow.panel`                                                                |
| `root`                           | rest     | `border-width`              | `border.width.025`                                                            |
| `root`                           | rest     | `border-color`              | `color.border.subtle`                                                         |
| `root`                           | rest     | `border-radius`             | `radius.lg`                                                                   |
| `root`                           | rest     | `padding`                   | `space.100`                                                                   |
| `root`                           | rest     | `gap`                       | `space.100`                                                                   |
| `separator`, in a vertical bar   | rest     | `border-block-start`        | `border.width.025` in `color.border.subtle`                                   |
| `separator`, in a vertical bar   | rest     | `margin-inline`             | `space.100`                                                                   |
| `separator`, in a horizontal bar | rest     | `border-inline-start`       | `border.width.025` in `color.border.subtle`                                   |
| `separator`, in a horizontal bar | rest     | `margin-block`              | `space.100`                                                                   |
| `zoomIn`, `zoomOut`, `centerMap` | rest     | `width`, `height`           | `size.control`                                                                |
| `zoomIn`, `zoomOut`, `centerMap` | rest     | `padding-inline`            | 0, as icon-only buttons                                                       |
| `zoomIn`, `zoomOut`, `centerMap` | rest     | `border-radius`             | `radius.md`                                                                   |
| `zoomIn`, `zoomOut`, `centerMap` | rest     | `border-width`              | `border.width.025`                                                            |
| `zoomIn`, `zoomOut`, `centerMap` | rest     | `border-color`              | `transparent`                                                                 |
| `zoomIn`, `zoomOut`, `centerMap` | rest     | `background-color`          | `transparent`                                                                 |
| `zoomIn`, `zoomOut`, `centerMap` | rest     | `color`                     | `color.text.primary`                                                          |
| `zoomIn`, `zoomOut`, `centerMap` | hover    | `background-color`          | `color.surface.hover`                                                         |
| `zoomIn`, `zoomOut`, `centerMap` | pressed  | `background-color`          | `color.surface.hover`                                                         |
| `zoomIn`, `zoomOut`, `centerMap` | focus    | `outline`, `outline-offset` | `focus.width` in `color.border.focus`, `focus.offset` (drawn by `perron.css`) |
| `zoomIn`, `zoomOut`, `centerMap` | disabled | `background-color`          | `transparent`                                                                 |
| `zoomIn`, `zoomOut`, `centerMap` | disabled | `color`                     | `color.text.tertiary`                                                         |
| `icon`                           | rest     | `--perron-icon-size`        | `icon.size.400`, set by `ToolbarButton`'s icon span                           |

The bar's place on the map is not here: `z-index.map-controls` and `size.panel-gap` belong to the screen that places it (CR-10).

Highlighted, open, selected and invalid don't apply: a toolbar button takes focus rather than `data-highlighted`, and the controls open nothing and hold no choice or value.

## Keyboard and ARIA

From the Base UI reference for `Toolbar.Root`, `Toolbar.Button` and `Toolbar.Separator`, as the [Toolbar](toolbar.md) spec gives them. "From" says who does it.

| Key                       | Does                                                                                                                                       | From        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `Tab`, `Shift+Tab`        | Moves focus into the bar, to the button that last had it (zoom in at first), and out again: the bar is one tab stop                        | Base UI     |
| `ArrowDown`, `ArrowUp`    | In the vertical bar, the default, move focus to the next and the previous button, skipping the separator, wrapping while `loopFocus` is on | Base UI     |
| `ArrowRight`, `ArrowLeft` | In a horizontal bar, move focus to the next and the previous button, wrapping while `loopFocus` is on                                      | Base UI     |
| `Enter`, `Space`          | Press the focused button: call its `onZoomIn`, `onZoomOut` or `onCenterMap`, unless it is disabled                                         | The browser |

`Home` and `End` do nothing, as on Toolbar. `+` and `−` zoom the map from the map canvas ([Accessibility](../foundations/accessibility.md#rules)), not from these controls.

Answered (recommended): MapControls listens to no keys of its own and sets no `aria-keyshortcuts`, leaving `+` and `−` to the map. Accessibility gives those keys to the screen ("+ and − zoom, arrow keys pan"), the map canvas has focus when they are pressed, and the controls can't know that the screen binds them, so announcing a shortcut could promise one that does nothing.

| Element     | Role                       | Accessible name from                                                            | States announced                                     |
| ----------- | -------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `root`      | `toolbar`, from Base UI    | `aria-label`, the `mapControls` owned string, or the caller's `aria-labelledby` | `aria-orientation`                                   |
| `zoomIn`    | `button`, native           | `aria-label`, the `zoomIn` owned string                                         | `aria-disabled` when `zoomInDisabled` or `disabled`  |
| `zoomOut`   | `button`, native           | `aria-label`, the `zoomOut` owned string                                        | `aria-disabled` when `zoomOutDisabled` or `disabled` |
| `centerMap` | `button`, native           | `aria-label`, the `centerMap` owned string                                      | `aria-disabled` when `disabled`                      |
| `separator` | `separator`, from Base UI  | none                                                                            | `aria-orientation`, across the bar's                 |
| `icon`      | none: inside `aria-hidden` | none                                                                            | none                                                 |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: each icon is `aria-hidden` inside its button, and the button's `aria-label` says the action it shows ("Zoom in", "Zoom out", "Centre the map"); a dimmed button is announced through `aria-disabled`; the separator is announced as one.
- [ ] Every landmark and named region has an accessible name: the bar is a `toolbar` named "Map controls" by its owned string, so it tells itself apart from the top bar's toolbars.
- [ ] Every default label can be overridden: `mapControlsLabel`, `zoomInLabel`, `zoomOutLabel` and `centerMapLabel`.
- [ ] Every shape the type accepts renders, in every variant: the props take no `ReactNode`; both orientations, every `…Disabled` combination and `disabled` render all three buttons, square, in the same order.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; the controls keep no hidden copy and collapse nothing.
- [ ] Native semantics first: native `<button>`s from `Toolbar.Button`, Base UI's `toolbar` and `separator` roles, with ARIA only for the names an icon can't give.
- [ ] Focus moves in reading order and returns on close: the arrow keys move zoom in, zoom out, centre, in document order; the controls open nothing; a button that hits a zoom limit stays focusable, so focus never jumps away from the key a person pressed.
- [ ] Every target is at least `size.target-min` square: each button is `size.control` (34 px) square.
- [ ] Loops stop when the system asks for less motion: none here; the controls have no loop and no transition.

## Owned strings

Every word MapControls announces is its own; it shows none. No key in `packages/perron/src/locale/en.ts` says any of these, so all four are new, each with a JSDoc line like its neighbours, and agents write the Danish, Swedish and Norwegian.

Answered (recommended): the four new keys are `mapControls` "Map controls", `zoomIn` "Zoom in", `zoomOut` "Zoom out" and `centerMap` "Centre the map", overridden by `mapControlsLabel`, `zoomInLabel`, `zoomOutLabel` and `centerMapLabel`. They are the words the Toolbar spec's map stories and the IconButton spec's examples already use, `packages/perron/icons/icons.json` gives `locate` the use "Centre the map on the network", each names the action as a verb and what it acts on, in sentence case ([Content design](../content-design.md)), and the keys take the American spelling of code names.

| Key           | English          | Override           | Seen or heard where                                          |
| ------------- | ---------------- | ------------------ | ------------------------------------------------------------ |
| `mapControls` | "Map controls"   | `mapControlsLabel` | `root`, heard as the toolbar's name through `aria-label`     |
| `zoomIn`      | "Zoom in"        | `zoomInLabel`      | `zoomIn`, heard as the button's name through `aria-label`    |
| `zoomOut`     | "Zoom out"       | `zoomOutLabel`     | `zoomOut`, heard as the button's name through `aria-label`   |
| `centerMap`   | "Centre the map" | `centerMapLabel`   | `centerMap`, heard as the button's name through `aria-label` |

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** Perron's Toolbar already gives the one tab stop, the roving `tabIndex`, the arrow keys, the wrap, the disabled cascade and a disabled button that stays focusable, through Base UI, so MapControls rebuilds none of it, adds no key handler and sets no `aria-keyshortcuts`.
- **CR-2.** MapControls renders Perron's `Toolbar`, and in it, in this order, a `ToolbarButton` for zoom in, one for zoom out, a `ToolbarSeparator`, and one for centring the map, each button `color="neutral"` and icon-only (a `startIcon` and no `children`). It imports `Toolbar`, `ToolbarButton` and `ToolbarSeparator` from `packages/perron/src/components/Toolbar/Toolbar.tsx`, never `@base-ui/react/toolbar` or IconButton.
- **CR-3.** The root's `className` is `pn-MapControls` then the caller's, given to `Toolbar`, which puts `pn-Toolbar` first. Each button takes `pn-MapControls-zoomIn`, `pn-MapControls-zoomOut` or `pn-MapControls-centerMap`, and the separator `pn-MapControls-separator`, after the class of its own component.
- **CR-4.** `{...rest}` reaches `Toolbar` before MapControls' own attributes, and its own props are taken out of `rest` first (`orientation`, `zoomInDisabled`, `zoomOutDisabled`, `onZoomIn`, `onZoomOut`, `onCenterMap` and the four `…Label` props), so none reaches the DOM. `disabled`, `loopFocus`, `render`, `style`, `aria-labelledby` and `ref` pass through to `Toolbar`, and `ref` lands on the `role="toolbar"` element. The root's `aria-label` is set after `rest` from the `mapControls` string, so a caller renames the bar with `mapControlsLabel`.
- **CR-5.** `orientation` defaults to `'vertical'` in MapControls' own destructuring and is passed to `Toolbar`; `MapControlsProps` redeclares it with `@default 'vertical'`. The root carries Base UI's `data-orientation`; MapControls has no `variant`, `color` or `size` prop, so it sets no `data-variant`, `data-color` or `data-size`.
- **CR-6.** The words come from `useOwnedStrings({ mapControls: mapControlsLabel, zoomIn: zoomInLabel, zoomOut: zoomOutLabel, centerMap: centerMapLabel })`. Each button's `aria-label` is its string; the component shows no text and sets no `title`.
- **CR-7.** Each icon is an inline `<svg>` with the `perron-icon` class, `viewBox="0 0 16 16"`, `fill="none"`, `stroke="currentColor"`, round caps and joins, and the stroke width and path data of its file in `packages/perron/icons/` (`plus.svg` and `minus.svg` at 1.8, `locate.svg` at 1.6), with no `width`, `height` or colour of its own: `ToolbarButton`'s icon span sets `--perron-icon-size` to `icon.size.400` and hides it from screen readers.
- **CR-8.** `zoomInDisabled` and `zoomOutDisabled`, or `disabled`, set `disabled` on that `ToolbarButton`, which stays focusable (`focusableWhenDisabled` left at its `true` default), carries `aria-disabled` and `data-disabled`, and stops the click, so its handler never fires. Neither limit disables the other button or the centre button.
- **CR-9.** `MapControls.css`, imported by the TSX as the contract asks, sets no colour, size, spacing or state: every look is Toolbar's, so the controls match every other toolbar, and a change to Toolbar's look reaches them.
- **CR-10.** MapControls sizes to its content, as Toolbar does, and places nothing: no `position`, `inset`, `margin` or `z-index`. The screen puts it at the bottom right, `size.panel-gap` from the edges, at `z-index.map-controls` ([Layout](../foundations/layout.md#stacking)), a token outside a component's [Token families](README.md#token-families).
- **CR-11.** Each handler is given as its button's `onClick` and called once per press, by click, Enter or Space, with the click event; no handler is called on focus, hover or an arrow key.
- **CR-12.** Changes of state are immediate, as on Toolbar: MapControls adds no transition.

## Stories

Answered (recommended): MapControls' deferred drawing has one variant property, `orientation` (`vertical`, `horizontal`), and no `State`, leaving the buttons' hover, focus, pressed and disabled looks to ToolbarButton's variants on the Toolbar page, with the zoom limits, `disabled` and the label overrides as stories beside the two variants. The buttons are ToolbarButtons, already drawn and storied in every state, so redrawing them here would only be a second copy to keep alike; the limits and the overrides are behaviour, which the `play` tests check.

The stories render the bar on its own, in a `PerronProvider` in English unless the story says otherwise, with `fn()` handlers for `onZoomIn`, `onZoomOut` and `onCenterMap`. The contract story takes the alphabetically first, `CustomLabels`, whose args hold every word the caller gives.

| Story             | Shows                                                                     | `play` test                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Vertical`        | vertical bar, the default: zoom in, zoom out, a separator, centre the map | The toolbar is named "Map controls" and the buttons "Zoom in", "Zoom out", "Centre the map", each icon `aria-hidden`; Tab focuses zoom in; ArrowDown moves to zoom out, then centre, skipping the separator, and wraps; Enter fires `onZoomIn` once and Space `onCenterMap` once; Shift+Tab leaves |
| `Horizontal`      | horizontal bar, the same three buttons in a row                           | ArrowRight and ArrowLeft move between the buttons and ArrowDown doesn't; the separator's `aria-orientation` is `vertical`                                                                                                                                                                          |
| `ZoomInDisabled`  | vertical bar with `zoomInDisabled`, at the closest zoom                   | Zoom in has `aria-disabled` and `data-disabled`, the arrow keys still reach it, and a click and Enter fire no `onZoomIn`; zoom out and centre still fire                                                                                                                                           |
| `ZoomOutDisabled` | vertical bar with `zoomOutDisabled`, at the farthest zoom                 | Zoom out has `aria-disabled`, and a click fires no `onZoomOut`; zoom in still fires                                                                                                                                                                                                                |
| `Disabled`        | vertical bar with `disabled`                                              | Every button has `data-disabled`, the arrow keys still move between them, and no click fires a handler                                                                                                                                                                                             |
| `CustomLabels`    | vertical bar with all four `…Label` props set                             | The toolbar and the buttons are named by the overrides; rendered in `da` with no overrides, they are named by the Danish dictionary                                                                                                                                                                |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                        | Don't                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Use MapControls for the map's zoom and centre buttons, once per map                                       | Build the same bar from IconButtons or from your own Toolbar: an IconButton in a toolbar adds a tab stop, and a second copy drifts from this one |
| Place it from the screen, at the bottom right, `size.panel-gap` from the edges, at `z-index.map-controls` | Expect MapControls to position itself, or give it a `z-index` through the component: it sizes to its content and the screen places it            |
| Set `zoomInDisabled` or `zoomOutDisabled` when the map reaches a zoom limit                               | Hide or unmount a button at a limit: focus on it is lost and the bar changes shape under the pointer                                             |
| Centre the map on the whole network in `onCenterMap`, as its words promise                                | Wire it to the reader's own location: its words, "Centre the map", and the `locate` icon's use promise the network                               |
| Rename the bar or a button with its `…Label` prop, such as `zoomInLabel`                                  | Pass `aria-label` to the root: the bar's own name is set after it and replaces it                                                                |
| Bind `+` and `−` on the map canvas, where Accessibility puts them                                         | Expect MapControls to listen for keys: it adds none beyond the toolbar's arrows                                                                  |
| Put another map action, such as a layers switch, in a Toolbar of its own beside it                        | Wrap MapControls to add buttons inside it: it takes no `children`, so its three buttons stay the same on every screen                            |
