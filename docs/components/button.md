# Button

A button that runs one action on the screen it sits on, such as "Show departures", in ink (`neutral`) or, for the one main action of a screen, in the brand yellow (`brand`). Given `selected`, it is a toggle that turns one thing on and off, such as "Follow", with `aria-pressed`.

<!-- run notes -->

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): this spec decides what the drawing would. The read-back `penpot/button.json`, drawn before the contract gave action components the `brand` colour, is one source among the contract, the foundations and the tokens, and the spec follows it wherever it holds.

## When to use

Use Button for an action that runs on the screen it sits on and is named in words, such as "Show departures", or, given `selected`, for a toggle whose words are an action, such as "Follow".

| Use instead                              | When                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| [LinkButton](link-button.md)             | The action takes the reader to another page or place, such as "Back to the map"      |
| [Link](link.md)                          | The words that go to another page or place sit in a sentence, or stand as plain text |
| [IconButton](icon-button.md)             | The action shows as an icon alone, with no words                                     |
| [Toolbar](toolbar.md)                    | Several actions sit together in one bar, one tab stop moved through with the arrows  |
| [Menu](menu.md)                          | More actions than the screen has room for open from one button                       |
| [FilterChip](filter-chip.md)             | The thing turned on and off is a filter, in a row of filters                         |
| [Switch](switch.md)                      | The thing turned on and off is a setting, which takes effect at once                 |
| [SegmentedControl](segmented-control.md) | The choice is one of two to five ways to show one view                               |

## Anatomy

Penpot page `Components/Button`. Family: none (the contract's [Families](README.md#families) give buttons only their text, `typography.label`). Shared parts: none.

| Part (Penpot layer) | What it is                                                                                                                                                  | Base UI part                                           | Class                 | `slotProps` key |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------- | --------------- |
| `root`              | The native `<button>`, with `aria-pressed` when it is a toggle: a flex row, centred, that holds the start icon, the label and the end icon in reading order | `Button`                                               | `pn-Button`           | none            |
| `label`             | A `<span>` that holds the caller's `children`                                                                                                               | none: a span inside `Button`, which has no inner parts | `pn-Button-label`     | none            |
| `startIcon`         | A `<span>`, `aria-hidden`, that holds the caller's `startIcon` before the label; only rendered when `startIcon` is given                                    | none: a span inside `Button`                           | `pn-Button-startIcon` | none            |
| `endIcon`           | A `<span>`, `aria-hidden`, that holds the caller's `endIcon` after the label; only rendered when `endIcon` is given. Not in the read-back: see Props        | none: a span inside `Button`                           | `pn-Button-endIcon`   | none            |
| `focusRing`         | The keyboard focus ring. The code map lands it on `root`: it is the `:focus-visible` outline `perron.css` draws on the root, not an element                 | `Button`                                               | none                  | none            |

## Base UI parts

Imported from `@base-ui/react/button`, at the version pinned in `package.json` (1.9.0 installed).

| Base UI part | Renders                                                                                     | Perron sets                                                                                                                                                                                                                                                                                                                                                  | Passed through                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`     | `<button type="button">`, or the element `render` gives, with `data-disabled` when disabled | `className` (`pn-Button`, then the caller's), `style`, `ref`, `disabled` from `disabled`, `data-variant`, `data-color` and `data-size` from their props (defaults included), `data-full-width` when `fullWidth`, `aria-pressed` from `selected` when it is given and `data-selected` while it is `true`, and the children: the icon spans and the label span | `render`, `nativeButton`, `focusableWhenDisabled`, `type`, `onClick` and every other prop of a native `<button>`, through `{...rest}` |

Base UI already does: it renders a native `<button>` with `type="button"`, which a caller's `type="submit"` overrides; Enter and Space activate it through the browser; when disabled it sets the native `disabled` attribute and `data-disabled`, and stops `onClick`, `onMouseDown` and `onPointerDown` from reaching the caller; with `focusableWhenDisabled` it sets `aria-disabled` in place of `disabled`, keeps the button in the tab order and lets only Tab through; with `render` and `nativeButton={false}` it gives a non-button element `role="button"`, a `tabIndex` and Enter and Space activation, and in development it warns when `nativeButton` doesn't match the rendered element.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name                        | Type                   | Default     | Base UI prop            | Description                                                                                                                                                                                                                                                                     |
| --------------------------- | ---------------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`                   | `'solid' \| 'outline'` | `'solid'`   | none                    | How much the button stands out: `solid` is filled, for the action a panel is for; `outline` is an edge only, for the actions beside it.                                                                                                                                         |
| `color`                     | `'neutral' \| 'brand'` | `'neutral'` | none                    | The intent: `neutral` is ink, for every action but the main one; `brand` is the brand yellow, for the one main action of a screen.                                                                                                                                              |
| `size`                      | `'small' \| 'medium'`  | `'medium'`  | none                    | The button's height: `medium` is `size.button`, `small` is `size.button-sm`, for dense rows and panels.                                                                                                                                                                         |
| `disabled`                  | `boolean`              | `false`     | `disabled`              | Whether the button ignores the pointer and the keys. A disabled button leaves the tab order unless `focusableWhenDisabled` is set.                                                                                                                                              |
| `fullWidth`                 | `boolean`              | `false`     | none                    | Whether the button fills the width of its container, such as a bottom sheet's main action. Sets `data-full-width`.                                                                                                                                                              |
| `selected`                  | `boolean`              | none        | none                    | Whether the button, a toggle such as "Follow", is on: `true` or `false` sets `aria-pressed` and draws the button on or off, and `true` sets `data-selected`. Left out, the button is no toggle and has no `aria-pressed`. The caller keeps the state and flips it in `onClick`. |
| `startIcon`                 | `ReactNode`            | none        | none                    | An icon before the label, in reading order, so it moves to the right in right-to-left text. Hidden from screen readers: the label names the button.                                                                                                                             |
| `endIcon`                   | `ReactNode`            | none        | none                    | An icon after the label, in reading order. Hidden from screen readers: the label names the button.                                                                                                                                                                              |
| `focusableWhenDisabled`     | `boolean`              | `false`     | `focusableWhenDisabled` | Inherited from Base UI with its JSDoc: whether the button stays focusable when disabled.                                                                                                                                                                                        |
| `nativeButton`              | `boolean`              | `true`      | `nativeButton`          | Inherited from Base UI with its JSDoc: set it to `false` when `render` gives an element that isn't a `<button>`.                                                                                                                                                                |
| `render`                    | Base UI's `render`     | none        | `render`                | Inherited from Base UI: swaps the root element and keeps the behaviour, the class and the data attributes.                                                                                                                                                                      |
| `children`                  | `ReactNode`            | none        | none                    | The label: the words that name the action, in sentence case. Required in practice: a button with no words is an IconButton.                                                                                                                                                     |
| `className`, `style`, `ref` | React's                | none        | `className`, `style`    | Reaches the root. `className` is merged after `pn-Button`.                                                                                                                                                                                                                      |

No `slotProps`: Button has one Base UI part, `Button`, which is the root, and the root takes the component's own props. The label and icon spans are not Base UI parts. No label-override props: Button owns no strings.

Button passes Base UI's `focusableWhenDisabled` and `nativeButton` through unchanged, keeping their Base UI JSDoc: `nativeButton={false}` lets `render` give a non-button element without a development warning, and `focusableWhenDisabled` lets a disabled button keep focus in a toolbar or explain itself through a tooltip.

Button offers `endIcon` beside `startIcon`, though the code map maps only `startIcon`: the contract names the two as a pair, MUI's Button takes both, and a "Next" or "Open in Rejseplanen" action reads with its icon after the words.

Button offers `selected`, for a toggle whose words are an action, such as the vehicle detail's "Follow", which keeps the map on a vehicle until the viewer pans away. It is a prop rather than a FollowButton, since any action that is on or off needs it, and a FollowButton would be a Button with one prop set. The name is FilterChip's and HighlightChip's, the library's two toggles, and MUI's ToggleButton's: `selected` is the contract's design state for a thing that is on, where pressed is its name for the momentary press, `:active`, which this spec's pressed rows already mean. It is controlled only, with no `defaultSelected` and no `onChange`: Base UI's `Button` keeps no state, the screen that owns the toggle already keeps what it turns on (the map's camera, for Follow), and `onClick` is the change. `undefined`, the default, is no toggle at all, so a plain button keeps no `aria-pressed="false"` that would announce it as a toggle.

Button offers `fullWidth`, which the read-back doesn't show: a bottom sheet's main action fills the sheet on a phone, the contract names `fullWidth` as its example boolean, and it is MUI's Button prop.

## Tokens

One row per part, state and property. States are the contract's design states; Penpot's `State` values map through the code map: `default` is rest, `hover` is `:hover` inside `@media (hover: hover)`, `focus` is `:focus-visible`, `disabled` is `[data-disabled]`; `pressed`, which the read-back doesn't draw, is `:active`. Every `color` row sets the root's `color`, which the label and both icons take, since icons draw in `currentColor`.

All variants and colours:

| Part                   | State    | Property                    | Token                                                                                                                                            |
| ---------------------- | -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `root`, medium         | rest     | `height`                    | `size.button`                                                                                                                                    |
| `root`, medium         | rest     | `padding-inline`            | `space.400`                                                                                                                                      |
| `root`, medium         | rest     | `gap`                       | `space.200`                                                                                                                                      |
| `root`, small          | rest     | `height`                    | `size.button-sm`                                                                                                                                 |
| `root`, small          | rest     | `padding-inline`            | `space.300`                                                                                                                                      |
| `root`, small          | rest     | `gap`                       | `space.150`                                                                                                                                      |
| `root`                 | rest     | `border-radius`             | `radius.md`                                                                                                                                      |
| `root`                 | rest     | `border-width`              | `border.width.025`                                                                                                                               |
| `root`                 | rest     | `cursor`                    | none: the keyword `pointer`                                                                                                                      |
| `root`                 | disabled | `cursor`                    | none: the keyword `default`                                                                                                                      |
| `label`                | rest     | `font`, `letter-spacing`    | `typography.label`, with its tracking twin                                                                                                       |
| `startIcon`, `endIcon` | rest     | `--perron-icon-size`        | `icon.size.400`                                                                                                                                  |
| `root`                 | focus    | `outline`, `outline-offset` | `focus.width` in `color.border.focus`, `focus.offset` (drawn by `perron.css`)                                                                    |
| `focusRing`            | focus    | ring corner radius          | `radius.lg`, as drawn: the outline follows the root's `radius.md` out by `focus.offset` plus `focus.width`, so the CSS sets no radius of its own |

`solid`, `neutral`:

| Part   | State    | Property           | Token                           |
| ------ | -------- | ------------------ | ------------------------------- |
| `root` | rest     | `background-color` | `color.surface.inverse`         |
| `root` | rest     | `border-color`     | `transparent`                   |
| `root` | rest     | `color`            | `color.text.inverse`            |
| `root` | hover    | `background-color` | `color.surface.inverse-hover`   |
| `root` | pressed  | `background-color` | `color.surface.inverse-pressed` |
| `root` | disabled | `background-color` | `color.surface.inset`           |
| `root` | disabled | `color`            | `color.text.tertiary`           |

`solid`, `brand`:

| Part   | State    | Property           | Token                         |
| ------ | -------- | ------------------ | ----------------------------- |
| `root` | rest     | `background-color` | `color.surface.brand`         |
| `root` | rest     | `border-color`     | `color.border.brand`          |
| `root` | rest     | `color`            | `color.text.on-color.dark`    |
| `root` | hover    | `background-color` | `color.surface.brand-hover`   |
| `root` | pressed  | `background-color` | `color.surface.brand-pressed` |
| `root` | disabled | `background-color` | `color.surface.inset`         |
| `root` | disabled | `border-color`     | `transparent`                 |
| `root` | disabled | `color`            | `color.text.tertiary`         |

`outline`, `neutral`:

| Part   | State    | Property           | Token                    |
| ------ | -------- | ------------------ | ------------------------ |
| `root` | rest     | `background-color` | `transparent`            |
| `root` | rest     | `border-color`     | `color.border.control`   |
| `root` | rest     | `color`            | `color.text.primary`     |
| `root` | hover    | `background-color` | `color.surface.hover`    |
| `root` | pressed  | `background-color` | `color.surface.selected` |
| `root` | disabled | `border-color`     | `color.border.subtle`    |
| `root` | disabled | `color`            | `color.text.tertiary`    |

`outline`, `brand`:

| Part   | State    | Property           | Token                    |
| ------ | -------- | ------------------ | ------------------------ |
| `root` | rest     | `background-color` | `transparent`            |
| `root` | rest     | `border-color`     | `color.border.brand`     |
| `root` | rest     | `color`            | `color.text.brand`       |
| `root` | hover    | `background-color` | `color.surface.hover`    |
| `root` | pressed  | `background-color` | `color.surface.selected` |
| `root` | disabled | `border-color`     | `color.border.subtle`    |
| `root` | disabled | `color`            | `color.text.tertiary`    |

A brand outline button takes `color.surface.hover` on hover and `color.surface.selected` while pressed, as the neutral outline does, not `color.surface.brand-subtle`: those are the hover and pressed layers every quiet control shares, and `brand-subtle` is a tinted background, not a state.

A disabled brand button looks exactly like a disabled neutral one (solid: `color.surface.inset` with no edge; outline: a `color.border.subtle` edge), with `color.text.tertiary` text: disabled is a colour, and a yellow that can't be pressed shouldn't still mark the main action.

A toggle (`selected` given) is drawn by its state, not its variant: off takes its colour's `outline` rows above, and on its colour's `solid` rows, in both variants; disabled takes the disabled rows of the look it is drawn as. Inverse ink is the library's mark of a toggle that is on ([Elevation](../foundations/elevation.md#surfaces) gives `color.surface.inverse` to pressed toggles, and FilterChip turns from Button's neutral outline to its neutral solid), and the two looks are the only pair the tokens give that differ at rest and each have a hover and a pressed step: a solid toggle drawn solid when off would have nothing past solid to turn to when on, and a `color.surface.selected` layer for on would match the outline's press and leave on no hover step of its own. So `variant` gives a plain button its emphasis, and a toggle reads the same in either.

Toggle, off (`aria-pressed="false"`), both variants:

| Part   | State         | Property           | Token                                                              |
| ------ | ------------- | ------------------ | ------------------------------------------------------------------ |
| `root` | off           | `background-color` | `transparent`                                                      |
| `root` | off           | `border-color`     | `color.border.control` (`neutral`), `color.border.brand` (`brand`) |
| `root` | off           | `color`            | `color.text.primary` (`neutral`), `color.text.brand` (`brand`)     |
| `root` | off, hover    | `background-color` | `color.surface.hover`                                              |
| `root` | off, pressed  | `background-color` | `color.surface.selected`                                           |
| `root` | off, disabled | `background-color` | `transparent`                                                      |
| `root` | off, disabled | `border-color`     | `color.border.subtle`                                              |
| `root` | off, disabled | `color`            | `color.text.tertiary`                                              |

Toggle, on (`aria-pressed="true"`, `data-selected`), both variants:

| Part                   | State        | Property                    | Token                                                                                                                   |
| ---------------------- | ------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `root`, `neutral`      | on           | `background-color`          | `color.surface.inverse`                                                                                                 |
| `root`, `neutral`      | on           | `border-color`              | `transparent`                                                                                                           |
| `root`, `neutral`      | on           | `color`                     | `color.text.inverse`                                                                                                    |
| `root`, `neutral`      | on, hover    | `background-color`          | `color.surface.inverse-hover`                                                                                           |
| `root`, `neutral`      | on, pressed  | `background-color`          | `color.surface.inverse-pressed`                                                                                         |
| `root`, `brand`        | on           | `background-color`          | `color.surface.brand`                                                                                                   |
| `root`, `brand`        | on           | `border-color`              | `color.border.brand`, on hover and pressed too (CR-10)                                                                  |
| `root`, `brand`        | on           | `color`                     | `color.text.on-color.dark`                                                                                              |
| `root`, `brand`        | on, hover    | `background-color`          | `color.surface.brand-hover`                                                                                             |
| `root`, `brand`        | on, pressed  | `background-color`          | `color.surface.brand-pressed`                                                                                           |
| `root`                 | on, disabled | `background-color`          | `color.surface.inset`                                                                                                   |
| `root`                 | on, disabled | `border-color`              | `transparent`                                                                                                           |
| `root`                 | on, disabled | `color`                     | `color.text.tertiary`                                                                                                   |
| `root`, forced colours | on           | `background-color`, `color` | the system colours `Highlight` and `HighlightText`, on hover and press too, with `forced-color-adjust: none` (CR-16)    |
| `root`, forced colours | on, focus    | `outline-color`             | the system colour `CanvasText`, which `forced-color-adjust: none` would otherwise leave in the theme's ink (CR-16)      |
| `root`, forced colours | on, disabled | `background-color`, `color` | the system colours `GrayText` and `Canvas`, with `forced-color-adjust: none`, so a disabled toggle still shows it is on |

The read-back shows no pressed state, which a native button has (`:active`). Pressed is a step past hover, as [Semantic colours](../foundations/semantic-colours.md#surfaces) sets for every control: a solid button takes `color.surface.inverse-pressed` or `color.surface.brand-pressed`, and an outline one lays `color.surface.selected` where its hover lays `color.surface.hover`. With a mouse, the button is already hovered when it is pressed, so a pressed fill equal to the hover fill shows no press at all. The rule sits outside `@media (hover: hover)`, so a press on a touch screen shows too.

## Keyboard and ARIA

From the Base UI reference for `Button` and the installed `useButton`. "From" says who does it.

| Key                | Does                                                                                            | From                                           |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `Tab`, `Shift+Tab` | Moves focus to the button and away; a disabled button is skipped unless `focusableWhenDisabled` | The browser, and Base UI                       |
| `Enter`            | Activates the button: fires `onClick`, or submits the form with `type="submit"`                 | The browser; Base UI for a non-button `render` |
| `Space`            | Activates the button on release                                                                 | The browser; Base UI for a non-button `render` |

| Element                | Role                                                                                    | Accessible name from                                                                            | States announced                                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`                 | `button`, native; `role="button"` from Base UI when `render` gives a non-button element | Its text content: the label's `children`; `aria-label` or `aria-labelledby` from the caller win | Disabled: the native `disabled`, or `aria-disabled` with `focusableWhenDisabled`. Pressed or not pressed, from `aria-pressed`, when `selected` is given |
| `startIcon`, `endIcon` | none: `aria-hidden="true"`                                                              | none                                                                                            | none                                                                                                                                                    |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the label is text the button is named by; the icons are `aria-hidden`, since an icon beside a word adds nothing the word doesn't say ([Icons](../foundations/icons.md#style)); `color` and `variant` carry emphasis, not meaning, and disabled is announced by the native attribute; a toggle's on and off are `aria-pressed`, the attribute the look is read from (CR-15), which says the state in words to the ear, so the label stays "Follow" on and off and the state is heard once, "Follow, toggle button, pressed" ([Accessibility](../foundations/accessibility.md#rules), "State in words").
- [ ] Every landmark and named region has an accessible name: none here; a button is neither.
- [ ] Every default label can be overridden: none here; Button owns no strings.
- [ ] Every shape the type accepts renders, in every variant: `children`, `startIcon` and `endIcon` render a string, an element and a list alike, in every `variant`, `color` and `size`.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; Button keeps no hidden copy and collapses nothing.
- [ ] Native semantics first: a native `<button>` from Base UI's `Button`; with `render` and `nativeButton={false}`, Base UI's `role="button"`.
- [ ] Focus moves in reading order and returns on close: the button is one tab stop in document order, and opens nothing of its own to return from.
- [ ] Every target is at least `size.target-min` square: the smallest target is a small button, `size.button-sm` (30 px) tall, and at least that wide with its `space.300` padding on each side and a word between.
- [ ] Loops stop when the system asks for less motion: none here; Button has no loop and no transition.

## Owned strings

No owned strings: every word comes from the caller, as `children`.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** Base UI's `Button` already renders the native `<button type="button">`, activates on Enter and Space, sets `disabled` and `data-disabled`, and blocks the click of a disabled button, so the component rebuilds none of it and passes `disabled` straight to it.
- **CR-2.** The root always carries `data-variant`, `data-color` and `data-size`, defaults included, and `data-full-width` when `fullWidth`; the CSS selects on them, one class then attributes: `.pn-Button[data-variant='outline'][data-color='brand']`.
- **CR-3.** The states keep the button's geometry: hover, pressed, focus and disabled change colours only, never the height, padding, gap, border width or radius, so nothing moves when the state changes.
- **CR-4.** Hover is read inside `@media (hover: hover)` and never applies to a disabled button: the hover rule excludes `[data-disabled]`, since a native disabled button still matches `:hover`.
- **CR-5.** Focus uses the ring `perron.css` draws on `:focus-visible`; the component draws no ring of its own and never removes the outline. The focus state otherwise looks like rest.
- **CR-6.** The colour is set on the root's `color`; the label and the icons take it, the icons through `currentColor`. No rule sets a colour on an icon.
- **CR-7.** The icon spans are `aria-hidden="true"`, rendered only when their prop is given, and set `--perron-icon-size` to `icon.size.400` in both sizes, so an icon from `packages/perron/icons/` (drawn on the 16 px grid for controls) renders at its own step.
- **CR-8.** Changes of state are immediate: no `duration.*` token fits a button's state change, so the CSS has no transition.
- **CR-9.** `{...rest}` reaches the root before the component's own attributes, and `variant`, `color`, `size`, `fullWidth`, `selected`, `startIcon` and `endIcon` are taken out of `rest` first, so none reaches the DOM.
- **CR-10.** A `brand` button keeps its `color.border.brand` edge at rest, on hover and pressed, in both variants: the light-theme yellow fill reaches only 2.1:1 on the surfaces, and the edge carries the 3:1 ([Semantic colours](../foundations/semantic-colours.md#brand)).

- **CR-11.** Every variant draws a `border.width.025` border, `transparent` on a neutral solid button and a disabled solid one, so all four looks share one width and height, the label sits in the same place, and Windows' forced colours draw an edge round every button: a border only some buttons carry makes a brand button 2 px wider than the same neutral one.
- **CR-12.** The label stays on one line (`white-space: nowrap`), the button growing with it, rather than wrapping inside the fixed `size.button` height: a wrapped label would overflow it, and button labels are short by content design.
- **CR-13.** Pressed (`:active`) takes the pressed row's tokens, a step past hover so a press under the pointer still shows, in a rule outside `@media (hover: hover)` so a press on a touch screen shows, and, like hover, never applies to a disabled button: the rule excludes `[data-disabled]`, since a button with `focusableWhenDisabled` has no native `disabled` and still matches `:active`.
- **CR-14.** The cursor is `pointer` on the root, as on Tabs, SegmentedControl, Switch and Checkbox, and `default` while `[data-disabled]`, so the pointer promises a click only where one runs.
- **CR-15.** `selected` given makes the button a toggle: the root carries `aria-pressed` with its value, and `data-selected` while it is `true`; `selected` left out sets neither, and a caller's own `aria-pressed` then reaches the root unchanged. The CSS draws a toggle from `[aria-pressed='false']` and `[aria-pressed='true']`, so the look and what the ear hears can't disagree: off is its colour's outline look and on its solid look, in either variant, each with that look's hover and pressed steps, and disabled takes the disabled look of the one it is drawn as. Each toggle rule is as specific as the variant rule it overrides and comes after it; the disabled toggle rules come after the variants' disabled ones. Button keeps no state: a click fires `onClick` and leaves `aria-pressed` as the caller set it.
- **CR-16.** In forced colours the system drops the solid fill, which would leave a toggle that is on looking like one that is off, so on keeps a system fill with `forced-color-adjust: none`: `Highlight` with `HighlightText`, on hover and press too, its focus ring in `CanvasText`, and `GrayText` with `Canvas` when it is disabled too, as FilterChip's CR-11 does.

## Stories

Each story renders the label "Show departures", as the read-back does, but the toggles, labelled "Follow" both off and on, as the vehicle detail's Follow is, since `aria-pressed` says the state. The read-back's variant properties are `variant` (`solid`, `outline`), `size` (`medium`, `small`) and `State` (`default`, `hover`, `focus`, `disabled`), to which this spec adds `color` (`neutral`, `brand`), which the contract gives every action component, and `pressed`, which the design run that ends the deferral draws. The visual stage renders each variant on `Default`, with `disabled` set for a disabled one, and drives hover, pressed and focus itself.

| Story          | Shows                                                                  | `play` test                                                                                                                                                                                                                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default`      | The subject story: solid, neutral, medium, every prop a control        | The button has no `aria-pressed` and no `data-selected`; Tab focuses it with `:focus-visible` and the ring, Enter and Space each fire `onClick` once, Shift+Tab returns focus                                                                                                                                                                                    |
| `Variants`     | Each `variant` in each `color`, by `size`                              | Every button takes its look's hover fill (`color.surface.inverse-hover`, `color.surface.brand-hover` or `color.surface.hover`) and its press fill a step past it, written after the hover rule, changing the fill alone, with the cursor `pointer`; a brand button keeps its `color.border.brand` edge through both                                              |
| `Disabled`     | Each `variant` in each `color`, disabled                               | Each button has `disabled` and `data-disabled`, Tab skips it, a click fires no `onClick`, and the cursor is `default`                                                                                                                                                                                                                                            |
| `WithIcons`    | A start icon and an end icon                                           | Both icon spans are `aria-hidden`, and the label alone names the button                                                                                                                                                                                                                                                                                          |
| `FullWidth`    | `fullWidth` in a 320 px container                                      | The button has `data-full-width` and is as wide as its container                                                                                                                                                                                                                                                                                                 |
| `Toggle`       | Each `variant` in each `color` as a toggle, off, on, and each disabled | Off draws its colour's outline look and on its solid look, whatever the variant, each with its hover and press fills, its edge kept on both, `aria-pressed` and `data-selected`; a click fires `onClick` once and leaves the state alone; disabled toggles keep `aria-pressed` and take the disabled look; on keeps a `Highlight` fill in forced colours (CR-16) |
| `FollowToggle` | A Follow toggle the story keeps the state of                           | A click, Space and Enter each turn it on or off, `aria-pressed` changes with it, and the accessible name stays "Follow"                                                                                                                                                                                                                                          |

## Do and don't

For a caller using the component, with the reason. Each row is a rule: a `must` row's Don't is never right, a `should` row's needs a reason, and Checked by says what catches the Don't in a caller's code.

| Rule  | Level  | Do                                                                                                                                                             | Don't                                                                                                                                                                                         | Checked by |
| ----- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| DD-1  | must   | Give one button per screen `color="brand"`, for its main action; the default `neutral` ink is for everything else, so the yellow keeps meaning the main action | Put two brand buttons on one screen, or use `brand` for emphasis: a second yellow action leaves neither the main one                                                                          | review     |
| DD-2  | must   | Name the action in sentence case, as a verb and what it acts on: "Show departures", "Show whole line"                                                          | Write "OK", "Click here", Title Case or an exclamation mark ([Content design](../content-design.md))                                                                                          | review     |
| DD-3  | must   | Use IconButton for a button with an icon and no words, so it gets its required label                                                                           | Pass only a `startIcon` and no `children`: the icon is `aria-hidden`, so the button has no name                                                                                               | review     |
| DD-4  | should | Use `solid` for the action a panel is for and `outline` for the actions beside it                                                                              | Mark the main action with `outline`, or set every action in a row `solid`                                                                                                                     | review     |
| DD-5  | must   | Take `variant` from `solid` and `outline`, `color` from `neutral` and `brand`, and `size` from `medium` and `small`                                            | Write MUI's `variant="contained"`, `color="primary"` or `size="large"`: Button has none of them, and `brand` is its main action's colour                                                      | types      |
| DD-6  | must   | Set `type="submit"` on a form's submit button; Base UI's default is `type="button"`                                                                            | Rely on a button submitting its form: without `type="submit"` it doesn't                                                                                                                      | review     |
| DD-7  | must   | Pass `nativeButton={false}` with `render` when it gives an element that isn't a `<button>`                                                                     | Render a link with `render={<a href="/map" />}` for navigation: LinkButton is that component, and a button that navigates misleads screen readers                                             | review     |
| DD-8  | should | Keep a brand button out of rows of line and mode badges                                                                                                        | Set a brand button among bus badges, whose fill and ink label it shares, where it reads as one                                                                                                | review     |
| DD-9  | must   | Give a toggle `selected`, `true` or `false`, and flip it in `onClick`; leave it out on every button that isn't one                                             | Set `selected={false}` on a plain button: it makes the button a toggle that is off, and a screen reader says "not pressed"                                                                    | review     |
| DD-10 | must   | Keep a toggle's label the same off and on, "Follow", and let `aria-pressed` say the state ([Accessibility](../foundations/accessibility.md#rules))             | Change the label of a toggle that uses `selected`, to "Following" or "Unfollow": with `aria-pressed` the state is heard twice, "Following, pressed", or the opposite way, "Unfollow, pressed" | review     |
| DD-11 | should | Use FilterChip for a filter that turns on and off, and Switch for a setting                                                                                    | Use a Button toggle in a row of filters, where FilterChip's pill shows they belong together                                                                                                   | review     |
| DD-12 | must   | Set `disabled` when the action can't run, with a reason in words nearby, or `focusableWhenDisabled` so the button can carry it                                 | Restyle a disabled button with `opacity`: disabled is `color.text.tertiary`, a colour                                                                                                         | review     |

## For agents

None known yet.
